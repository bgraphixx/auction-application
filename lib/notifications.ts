import { db } from "@/lib/db";
import { sendEmail } from "@/lib/mail";

export async function notifyUser(userId: string, auctionId: string | null, kind: string, title: string, body: string) {
  const notice = await db.notification.create({ data: { userId, auctionId, kind, title, body } });
  await deliverNotification(notice.id);
}

export async function deliverNotification(id: string) {
  const notice = await db.notification.findUnique({ where: { id }, include: { user: { select: { email: true } } } });
  if (notice && !notice.emailedAt) {
    try {
      await sendEmail({ to: notice.user.email, subject: notice.title, html: `<p>${escapeHtml(notice.body)}</p>` });
      await db.notification.update({ where: { id: notice.id }, data: { emailedAt: new Date() } });
    } catch (error) {
      console.error("Auction notification email failed", notice.id, error);
    }
  }
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] ?? char);
}
