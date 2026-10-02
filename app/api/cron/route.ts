import { db } from "@/lib/db";
import { notifyUser, deliverNotification } from "@/lib/notifications";

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  return Boolean(secret && request.headers.get("x-cron-secret") === secret);
}

async function notifyOnce(userId: string, auctionId: string, kind: string, title: string, body: string) {
  const existing = await db.notification.findFirst({ where: { userId, auctionId, kind } });
  if (!existing) await notifyUser(userId, auctionId, kind, title, body);
}

export async function POST(request: Request) {
  if (!authorized(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const now = new Date();
  const soon = new Date(now.getTime() + 60 * 60_000);
  const closingSoon = await db.auction.findMany({ where: { state: "LIVE", endsAt: { gt: now, lte: soon } }, include: { bids: { select: { bidderId: true } }, watchlist: { select: { userId: true } } } });
  for (const auction of closingSoon) for (const userId of new Set([...auction.bids.map((item) => item.bidderId), ...auction.watchlist.map((item) => item.userId)])) await notifyOnce(userId, auction.id, "CLOSING_SOON", "Auction closing soon", `${auction.title} closes ${auction.endsAt.toLocaleString()}.`);
  const closing = await db.auction.findMany({ where: { state: "LIVE", endsAt: { lte: now } }, include: { bids: { orderBy: { amount: "desc" }, take: 1 } } });
  for (const auction of closing) {
    const state = auction.bids.length ? "HIGHEST_BID_PENDING_APPROVAL" : "CLOSED";
    await db.$transaction([db.auction.update({ where: { id: auction.id, state: "LIVE" }, data: { state, closedAt: state === "CLOSED" ? now : null } }), db.auditEvent.create({ data: { auctionId: auction.id, action: "AUCTION_BIDDING_ENDED", actorRole: "SYSTEM", before: { state: "LIVE" }, after: { state }, reason: "Scheduled close" } })]);
    if (auction.bids[0]) await notifyOnce(auction.bids[0].bidderId, auction.id, "HIGHEST_BID_PENDING_APPROVAL", "Highest bid pending approval", `${auction.title}: your bid is highest, pending admin review. This is not yet a confirmed win.`);
  }
  const overdue = await db.auction.findMany({ where: { state: "PAYMENT_PENDING", paymentDeadline: { lt: now } }, include: { approval: true } });
  const auctionAdmins = await db.user.findMany({ where: { role: { in: ["AUCTION_ADMIN", "SUPER_ADMIN"] }, status: "ACTIVE" }, select: { id: true } });
  for (const auction of overdue) {
    if (auction.approval) await notifyOnce(auction.approval.bidderId, auction.id, "PAYMENT_OVERDUE", "Payment overdue", `${auction.title}: your payment deadline has passed. An administrator will review the default and next bidder.`);
    for (const admin of auctionAdmins) await notifyOnce(admin.id, auction.id, "PAYMENT_DEFAULT_REVIEW", "Winner default review required", `${auction.title}: payment is overdue. Review the winner and next eligible bidder.`);
  }
  const pickupSoon = await db.auction.findMany({ where: { state: "PICKUP_SCHEDULED", pickup: { scheduledAt: { gt: now, lte: new Date(now.getTime() + 24 * 60 * 60_000) } } }, include: { approval: true, pickup: true } });
  for (const auction of pickupSoon) if (auction.approval) await notifyOnce(auction.approval.bidderId, auction.id, "PICKUP_REMINDER", "Pickup reminder", `${auction.title}: pickup is scheduled for ${auction.pickup?.scheduledAt?.toLocaleString()}.`);
  const missed = await db.auction.findMany({ where: { state: "PICKUP_SCHEDULED", pickupDeadline: { lt: now }, pickup: { is: { status: "SCHEDULED" } } }, include: { approval: true } });
  for (const auction of missed) {
    await db.$transaction([db.pickup.update({ where: { auctionId: auction.id }, data: { status: "MISSED" } }), db.auditEvent.create({ data: { auctionId: auction.id, actorRole: "SYSTEM", action: "PICKUP_OVERDUE", before: { status: "SCHEDULED" }, after: { status: "MISSED" } } })]);
    if (auction.approval) await notifyOnce(auction.approval.bidderId, auction.id, "PICKUP_OVERDUE", "Pickup overdue", `${auction.title}: pickup deadline passed. Contact Facilities.`);
    const facilities = await db.user.findMany({ where: { role: { in: ["FACILITIES", "SUPER_ADMIN"] }, status: "ACTIVE" }, select: { id: true } });
    for (const staff of facilities) await notifyOnce(staff.id, auction.id, "PICKUP_ESCALATED", "Missed pickup requires action", `${auction.title}: pickup deadline passed. Arrange a resolution.`);
  }
  const pendingEmail = await db.notification.findMany({ where: { emailedAt: null }, select: { id: true }, take: 50, orderBy: { createdAt: "asc" } });
  for (const item of pendingEmail) await deliverNotification(item.id);
  return Response.json({ closed: closing.length, closingSoon: closingSoon.length, paymentOverdue: overdue.length, pickupOverdue: missed.length, emailRetries: pendingEmail.length, timestamp: now.toISOString() });
}
