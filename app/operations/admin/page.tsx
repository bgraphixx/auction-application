import Link from "next/link";
import { redirect } from "next/navigation";
import { requireOperationsUser } from "@/lib/require-user";
import { db } from "@/lib/db";
import AdminUsers from "./users-client";

export default async function AdminPage() {
  const session = await requireOperationsUser();
  if (session.user.role !== "SUPER_ADMIN") redirect("/operations");
  const [users, invitations] = await Promise.all([db.user.findMany({ orderBy: { name: "asc" }, take: 200 }), db.employeeInvitation.findMany({ orderBy: { createdAt: "desc" }, take: 50 })]);
  return <main className="simple-page"><div className="heading-row"><div><h1>Employee access</h1><p className="muted">Manage employee profiles, roles, and account status.</p></div><Link className="outline-button" href="/operations/admin/settings">Categories and system settings</Link></div><div className="metric-grid"><article><span>Loaded employees</span><strong>{users.length}</strong><small>Up to 200 profiles</small></article><article><span>Operations roles</span><strong>{users.filter(user => user.role !== "EMPLOYEE").length}</strong><small>In loaded profiles</small></article><article><span>Active accounts</span><strong>{users.filter(user => user.status === "ACTIVE").length}</strong><small>In loaded profiles</small></article><article><span>Suspended accounts</span><strong>{users.filter(user => user.status === "SUSPENDED").length}</strong><small>In loaded profiles</small></article></div><AdminUsers users={users.map((user) => ({ id: user.id, name: user.name, email: user.email, employeeId: user.employeeId ?? "", jobGrade: user.jobGrade ?? "", department: user.department ?? "", location: user.location ?? "", role: user.role, status: user.status, employmentStatus: user.employmentStatus }))} invitations={invitations.map((invite) => ({ email: invite.email, name: invite.name, usedAt: invite.usedAt?.toISOString() ?? null }))} /></main>;
}
