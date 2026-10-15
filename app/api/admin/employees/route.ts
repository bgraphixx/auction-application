import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/mail";
import { sendSms } from "@/lib/sms";
import { internalAccountEmail, normalizeNigerianPhone } from "@/lib/phone";

const roles = ["EMPLOYEE", "AUCTION_ADMIN", "FINANCE", "FACILITIES", "COMPLIANCE", "SUPER_ADMIN"] as const;
const bodySchema = z.object({ email: z.union([z.email(), z.literal("")]).optional(), phone: z.string().min(7), staffType: z.enum(["CORE", "NON_CORE"]), name: z.string().min(3), employeeId: z.string().min(2), jobGrade: z.string().min(1), department: z.string().min(2), location: z.string().min(2), role: z.enum(roles), employmentStatus: z.enum(["ACTIVE", "ON_LEAVE", "TERMINATED"]) });
async function requireAdmin() { const session = await auth.api.getSession({ headers: await headers() }); return session?.user.role === "SUPER_ADMIN" ? session : null; }

function invitationValues(input: z.infer<typeof bodySchema>) {
  const phone = normalizeNigerianPhone(input.phone);
  if (!phone) throw new Error("Enter a valid Nigerian mobile number.");
  const contactEmail = input.email?.trim().toLowerCase() || null;
  return { ...input, email: contactEmail ?? internalAccountEmail(input.employeeId), contactEmail, phone };
}

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "Super Admin access required." }, { status: 403 });
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Complete all employee profile fields." }, { status: 400 });
  let values;
  try { values = invitationValues(parsed.data); } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Invalid phone number." }, { status: 400 }); }
  if (await db.user.findUnique({ where: { email: values.email } })) return Response.json({ error: "This user already exists. Edit their profile instead." }, { status: 409 });
  try {
    const invite = await db.employeeInvitation.upsert({ where: { email: values.email }, update: { ...values, usedAt: null }, create: values });
    await db.auditEvent.create({ data: { actorId: session.user.id, actorRole: session.user.role, action: "EMPLOYEE_INVITED", after: { email: invite.email, role: invite.role, employeeId: invite.employeeId } } });
    const url = `${process.env.BETTER_AUTH_URL ?? "http://localhost:3000"}/accept-invite?token=${encodeURIComponent(invite.token)}`;
    const deliveries = await Promise.allSettled([
      ...(invite.contactEmail ? [sendEmail({ to: invite.contactEmail, subject: "Your Fewchore auction account", html: `<p>You have been invited to the internal asset auction system. <a href="${url}">Set up your account</a>.</p>` })] : []),
      sendSms({ to: invite.phone!, text: `Fewchore Asset Disposal: set up your account at ${url}` }),
    ]);
    for (const delivery of deliveries) if (delivery.status === "rejected") console.error("Employee invitation delivery failed", delivery.reason);
    return Response.json({ ok: true });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Invitation failed" }, { status: 500 }); }
}

export async function PATCH(request: Request) {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "Super Admin access required." }, { status: 403 });
  const parsed = bodySchema.extend({ id: z.string(), status: z.enum(["ACTIVE", "SUSPENDED"]) }).safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Invalid employee profile." }, { status: 400 });
  const { id, status, ...input } = parsed.data;
  let values;
  try { values = { ...invitationValues(input), status }; } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Invalid phone number." }, { status: 400 }); }
  const before = await db.user.findUnique({ where: { id } });
  if (!before) return Response.json({ error: "Employee not found." }, { status: 404 });
  if (id === session.user.id && (values.status !== "ACTIVE" || values.role !== "SUPER_ADMIN" || values.employmentStatus !== "ACTIVE")) return Response.json({ error: "You cannot remove your own administrator access." }, { status: 400 });
  await db.$transaction([db.user.update({ where: { id }, data: values }), ...(values.status === "SUSPENDED" || values.employmentStatus === "TERMINATED" ? [db.session.deleteMany({ where: { userId: id } })] : []), db.auditEvent.create({ data: { actorId: session.user.id, actorRole: session.user.role, action: "EMPLOYEE_PROFILE_UPDATED", before: { userId: id, role: before.role, status: before.status, employmentStatus: before.employmentStatus, employeeId: before.employeeId, jobGrade: before.jobGrade }, after: { role: values.role, status: values.status, employmentStatus: values.employmentStatus, employeeId: values.employeeId, jobGrade: values.jobGrade, staffType: values.staffType } } })]);
  return Response.json({ ok: true });
}
