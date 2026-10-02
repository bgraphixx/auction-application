import Link from "next/link";
import { requireUser } from "@/lib/require-user";
import { db } from "@/lib/db";
import NotificationList from "./notification-list";

export default async function NotificationsPage() {
  const session = await requireUser();
  const notices = await db.notification.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: "desc" }, take: 100 });
  return <main className="simple-page"><header className="simple-header"><img src="/assets/ffcl_logo_full.png" alt="Fewchore" /><Link href="/employee/dashboard">← Employee workspace</Link></header><section className="form-page"><p className="eyebrow">NOTIFICATIONS</p><h1>Updates</h1><NotificationList notices={notices.map((item) => ({ ...item, createdAt: item.createdAt.toISOString(), readAt: item.readAt?.toISOString() ?? null, emailedAt: item.emailedAt?.toISOString() ?? null }))} /></section></main>;
}
