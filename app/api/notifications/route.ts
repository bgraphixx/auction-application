import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  if (typeof body.id !== "string") return Response.json({ error: "Invalid notification" }, { status: 400 });
  await db.notification.updateMany({ where: { id: body.id, userId: session.user.id }, data: { readAt: new Date() } });
  return Response.json({ ok: true });
}
