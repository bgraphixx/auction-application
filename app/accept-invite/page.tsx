import AcceptInviteForm from "./form";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";

export default async function AcceptInvitePage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const params = await searchParams;
  if (!params.token) return notFound();
  const invite = await db.employeeInvitation.findUnique({ where: { token: params.token } });
  if (!invite || invite.usedAt) return notFound();
  return <AcceptInviteForm email={invite.email} token={invite.token} />;
}
