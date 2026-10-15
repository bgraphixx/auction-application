import { z } from "zod";
import { db } from "@/lib/db";
import { normalizeNigerianPhone } from "@/lib/phone";

const requestSchema = z.object({ identifier: z.string().trim().min(2).max(160) });

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Enter your staff ID, phone number, or email address." }, { status: 400 });
  const identifier = parsed.data.identifier;
  const phone = normalizeNigerianPhone(identifier);
  const user = await db.user.findFirst({
    where: {
      OR: [
        { email: { equals: identifier, mode: "insensitive" } },
        { contactEmail: { equals: identifier, mode: "insensitive" } },
        { employeeId: { equals: identifier, mode: "insensitive" } },
        ...(phone ? [{ phone }] : []),
      ],
      status: "ACTIVE",
      employmentStatus: { not: "TERMINATED" },
    },
    select: { email: true },
  });
  if (!user) return Response.json({ error: "Invalid sign-in details." }, { status: 401 });
  return Response.json({ email: user.email });
}
