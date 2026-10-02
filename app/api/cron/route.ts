import { db } from "@/lib/db";

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  return Boolean(secret && request.headers.get("x-cron-secret") === secret);
}

export async function POST(request: Request) {
  if (!authorized(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const now = new Date();
  const auctions = await db.auction.findMany({ where: { state: "LIVE", endsAt: { lte: now } }, select: { id: true } });
  await db.$transaction(auctions.flatMap((auction) => [
    db.auction.update({ where: { id: auction.id }, data: { state: "HIGHEST_BID_PENDING_APPROVAL" } }),
    db.auditEvent.create({ data: { auctionId: auction.id, action: "AUCTION_CLOSED_FOR_REVIEW", reason: "Scheduled close" } }),
  ]));
  return Response.json({ closedForReview: auctions.length, timestamp: now.toISOString() });
}
