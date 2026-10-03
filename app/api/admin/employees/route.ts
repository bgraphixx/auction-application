import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/mail";

const roles = ["EMPLOYEE", "AUCTION_ADMIN", "FINANCE", "FACILITIES", "COMPLIANCE", "SUPER_ADMIN"] as const;
const bodySchema = z.object({ email: z.email(), name: z.string().min(3), employeeId: z.string().min(2), jobGrade: z.string().min(1), department: z.string().min(2), location: z.string().min(2), role: z.enum(roles), employmentStatus: z.enum(["ACTIVE", "ON_LEAVE", "TERMINATED"]) });
async function requireAdmin() { const session = await auth.api.getSession({ headers: await headers() }); return session?.user.role === "SUPER_ADMIN" ? session : null; }

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "Super Admin access required." }, { status: 403 });
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Complete all employee profile fields." }, { status: 400 });
  const values = { ...parsed.data, email: parsed.data.email.toLowerCase() };
  if (await db.user.findUnique({ where: { email: values.email } })) return Response.json({ error: "This user already exists. Edit their profile instead." }, { status: 409 });
  try {
    const invite = await db.employeeInvitation.upsert({ where: { email: values.email }, update: { ...values, usedAt: null }, create: values });
    await db.auditEvent.create({ data: { actorId: session.user.id, actorRole: session.user.role, action: "EMPLOYEE_INVITED", after: { email: invite.email, role: invite.role, employeeId: invite.employeeId } } });
    const url = `${process.env.BETTER_AUTH_URL ?? "http://localhost:3000"}/accept-invite?email=${encodeURIComponent(invite.email)}`;
    await sendEmail({ to: invite.email, subject: "Your Fewchore auction account", html: `<p>You have been invited to the internal asset auction system. <a href="${url}">Set up your account</a>.</p>` });
    return Response.json({ ok: true });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Invitation failed" }, { status: 500 }); }
}

export async function PATCH(request: Request) {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "Super Admin access required." }, { status: 403 });
  const parsed = bodySchema.extend({ id: z.string(), status: z.enum(["ACTIVE", "SUSPENDED"]) }).safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Invalid employee profile." }, { status: 400 });
  const { id, ...values } = parsed.data;
  const before = await db.user.findUnique({ where: { id } });
  if (!before) return Response.json({ error: "Employee not found." }, { status: 404 });
  if (id === session.user.id && (values.status !== "ACTIVE" || values.role !== "SUPER_ADMIN" || values.employmentStatus !== "ACTIVE")) return Response.json({ error: "You cannot remove your own administrator access." }, { status: 400 });
  await db.$transaction([db.user.update({ where: { id }, data: { ...values, email: values.email.toLowerCase() } }), ...(values.status === "SUSPENDED" || values.employmentStatus === "TERMINATED" ? [db.session.deleteMany({ where: { userId: id } })] : []), db.auditEvent.create({ data: { actorId: session.user.id, actorRole: session.user.role, action: "EMPLOYEE_PROFILE_UPDATED", before: { userId: id, role: before.role, status: before.status, employmentStatus: before.employmentStatus, employeeId: before.employeeId, jobGrade: before.jobGrade }, after: { role: values.role, status: values.status, employmentStatus: values.employmentStatus, employeeId: values.employeeId, jobGrade: values.jobGrade } } })]);
  return Response.json({ ok: true });
}
