import Link from "next/link";
import { redirect } from "next/navigation";
import { requireOperationsUser } from "@/lib/require-user";
import { db } from "@/lib/db";
import AdminUsers from "./users-client";

export default async function AdminPage() {
  const session = await requireOperationsUser();
  if (session.user.role !== "SUPER_ADMIN") redirect("/operations");
  const [users, invitations] = await Promise.all([db.user.findMany({ orderBy: { name: "asc" }, take: 200 }), db.employeeInvitation.findMany({ orderBy: { createdAt: "desc" }, take: 50 })]);
  return <main className="simple-page"><header className="simple-header"><img src="/assets/ffcl_logo_full.png" alt="Fewchore" /><Link href="/operations">← Operations workspace</Link></header><section className="form-page"><p className="eyebrow">SUPER ADMIN</p><h1>Employees and roles</h1><Link className="outline-button" href="/operations/admin/settings">Categories and system settings</Link><AdminUsers users={users.map((user) => ({ id: user.id, name: user.name, email: user.email, employeeId: user.employeeId ?? "", jobGrade: user.jobGrade ?? "", department: user.department ?? "", location: user.location ?? "", role: user.role, status: user.status }))} invitations={invitations.map((invite) => ({ email: invite.email, name: invite.name, usedAt: invite.usedAt?.toISOString() ?? null }))} /></section></main>;
}
