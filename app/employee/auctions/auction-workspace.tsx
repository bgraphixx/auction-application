import { requireUser } from "@/lib/require-user";
import { db } from "@/lib/db";
import { checkEligibility } from "@/lib/auction-rules";
import AuctionBrowser, { type Asset } from "./auction-browser";

export default async function AuctionWorkspace({ view = "auctions" }: { view?: "auctions" | "watchlist" | "past" }) {
  const session = await requireUser();
  const [employee, auctions, watched, bids] = await Promise.all([
    db.user.findUniqueOrThrow({ where: { id: session.user.id } }),
    db.auction.findMany({ where: { state: { in: ["LIVE", "HIGHEST_BID_PENDING_APPROVAL", "APPROVED_WINNER", "PAYMENT_PENDING", "PAID", "PICKUP_SCHEDULED", "PICKED_UP", "CLOSED", "CANCELLED"] } }, include: { bids: { orderBy: { createdAt: "desc" }, take: 8, select: { id: true, amount: true, createdAt: true } }, approval: { select: { approved: true } } }, orderBy: { endsAt: "desc" }, take: 100 }),
    db.watchlist.findMany({ where: { userId: session.user.id }, select: { auctionId: true } }),
    db.bid.findMany({ where: { bidderId: session.user.id }, select: { auctionId: true, amount: true }, orderBy: { createdAt: "desc" } }),
  ]);
  const watchedIds = new Set(watched.map((item) => item.auctionId));
  const ownBids = new Map<string, number>();
  for (const bid of bids) if (!ownBids.has(bid.auctionId)) ownBids.set(bid.auctionId, bid.amount);
  const assets: Asset[] = await Promise.all(auctions.map(async (auction) => ({
    id: auction.id, reference: auction.reference, title: auction.title, category: auction.category, description: auction.description, condition: auction.condition, conditionNotes: auction.conditionNotes, knownDefects: auction.knownDefects, location: auction.location,
    photoKeys: auction.photoKeys, price: auction.currentBid || auction.startingPrice, bidIncrement: auction.bidIncrement, bids: auction.bidCount, startsAt: auction.startsAt.toISOString(), endsAt: auction.endsAt.toISOString(), paymentDeadline: auction.paymentDeadline.toISOString(), pickupDeadline: auction.pickupDeadline.toISOString(), paymentRules: auction.paymentRules, pickupRules: auction.pickupRules, state: auction.state, sensitive: auction.sensitive, wipeVerified: auction.itWipeConfirmed && Boolean(auction.wipeProofUrl),
    watched: watchedIds.has(auction.id), myBid: ownBids.get(auction.id) ?? null, eligibility: ["LIVE", "HIGHEST_BID_PENDING_APPROVAL"].includes(auction.state) ? await checkEligibility(auction, employee) : { eligible: false, reason: "Auction closed." }, winnerApproved: auction.approval?.approved ?? false, reserveMet: !auction.reservePrice || auction.currentBid >= auction.reservePrice, timeline: auction.bids.map((bid) => ({ id: bid.id, amount: bid.amount, at: bid.createdAt.toISOString() })),
  })));
  return <AuctionBrowser key={view} section={view} initialAssets={assets} profile={{ name: employee.name, grade: employee.jobGrade, location: employee.location, status: employee.status }} />;
}
