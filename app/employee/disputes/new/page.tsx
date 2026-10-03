import { requireUser } from "@/lib/require-user";
import { db } from "@/lib/db";
import DisputeForm from "./dispute-form";

export default async function NewDisputePage({ searchParams }: { searchParams: Promise<{ auctionId?: string }> }) {
  const session = await requireUser();
  const { auctionId } = await searchParams;
  const select = { id: true, title: true, reference: true, state: true, endsAt: true, currentBid: true, startingPrice: true, bids: { where: { bidderId: session.user.id }, orderBy: { createdAt: "desc" as const }, take: 1, select: { amount: true } }, disputes: { where: { reporterId: session.user.id }, orderBy: { createdAt: "desc" as const }, select: { id: true, reason: true, status: true, resolution: true, evidenceKey: true } } } as const;
  const auctions = await db.auction.findMany({ where: { state: { not: "DRAFT" } }, select, orderBy: { createdAt: "desc" }, take: 100 });
  if (auctionId && !auctions.some((item) => item.id === auctionId)) {
    const selected = await db.auction.findFirst({ where: { id: auctionId, state: { not: "DRAFT" } }, select });
    if (selected) auctions.unshift(selected);
  }
  return <main className="simple-page"><div className="heading-row"><div><h1>Submit a dispute</h1><p className="muted">Ask Compliance to review an auction decision or issue.</p></div></div><DisputeForm auctions={auctions.map(({ bids, endsAt, startingPrice, ...item }) => ({ ...item, currentBid: item.currentBid || startingPrice, endsAt: endsAt.toISOString(), lastBid: bids[0]?.amount ?? null }))} selectedId={auctionId ?? ""} /></main>;
}
