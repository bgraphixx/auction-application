import { db } from "@/lib/db";
import { sendEmail } from "@/lib/mail";
import { sendSms } from "@/lib/sms";

export async function notifyUser(userId: string, auctionId: string | null, kind: string, title: string, body: string) {
  const notice = await db.notification.create({ data: { userId, auctionId, kind, title, body } });
  await deliverNotification(notice.id);
}

export async function deliverNotification(id: string) {
  const notice = await db.notification.findUnique({ where: { id }, include: { user: { select: { email: true, contactEmail: true, phone: true } } } });
  const email = notice?.user.contactEmail ?? (notice?.user.email.endsWith("@accounts.fewchore.invalid") ? null : notice?.user.email);
  if (notice && email && !notice.emailedAt) {
    try {
      await sendEmail({ to: email, subject: notice.title, html: `<p>${escapeHtml(notice.body)}</p>` });
      await db.notification.update({ where: { id: notice.id }, data: { emailedAt: new Date() } });
    } catch (error) {
      console.error("Auction notification email failed", notice.id, error);
    }
  }
  if (notice && notice.user.phone && !notice.smsSentAt) {
    try {
      await sendSms({ to: notice.user.phone, text: `${notice.title}: ${notice.body}` });
      await db.notification.update({ where: { id: notice.id }, data: { smsSentAt: new Date() } });
    } catch (error) {
      console.error("Auction notification SMS failed", notice.id, error);
    }
  }
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] ?? char);
}
