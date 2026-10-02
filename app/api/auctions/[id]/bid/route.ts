import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkEligibility } from "@/lib/auction-rules";
import { notifyUser } from "@/lib/notifications";

const bidSchema = z.object({ amount: z.number().int().positive() });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const payload = bidSchema.safeParse(await request.json());
  if (!payload.success) return Response.json({ error: "Bid amount must be a positive whole number" }, { status: 400 });
  const { id } = await params;

  try {
    const result = await db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Auction" WHERE id = ${id} FOR UPDATE`;
      const [auction, employee] = await Promise.all([
        tx.auction.findUnique({ where: { id } }),
        tx.user.findUnique({ where: { id: session.user.id } }),
      ]);
      if (!auction || auction.state !== "LIVE" || auction.endsAt <= new Date() || auction.startsAt > new Date()) throw new Error("This auction is not open for bids.");
      if (!employee) throw new Error("Your employee account is unavailable.");
      const eligibility = await checkEligibility(auction, employee);
      if (!eligibility.eligible) throw new Error(eligibility.reason);
      const minimum = auction.bidCount ? auction.currentBid + auction.bidIncrement : auction.startingPrice;
      if (payload.data.amount < minimum) throw new Error(`Your bid must be at least ₦${minimum.toLocaleString("en-NG")}.`);
      const previous = await tx.bid.findFirst({ where: { auctionId: id }, orderBy: { amount: "desc" }, select: { bidderId: true } });
      const remaining = auction.endsAt.getTime() - Date.now();
      const extend = auction.antiSniping && remaining <= auction.antiSnipingMinutes * 60_000;
      const endsAt = extend ? new Date(Date.now() + auction.antiSnipingMinutes * 60_000) : auction.endsAt;
      const bid = await tx.bid.create({ data: { auctionId: auction.id, bidderId: employee.id, amount: payload.data.amount } });
      await tx.auction.update({ where: { id: auction.id }, data: { currentBid: bid.amount, bidCount: { increment: 1 }, endsAt } });
      await tx.auditEvent.create({ data: { auctionId: auction.id, actorId: employee.id, actorRole: session.user.role, action: "BID_PLACED", before: { currentBid: auction.currentBid, endsAt: auction.endsAt }, after: { amount: bid.amount, endsAt } } });
      return { id: bid.id, amount: bid.amount, bidCount: auction.bidCount + 1, previousBidderId: previous?.bidderId, title: auction.title, endsAt };
    });
    if (result.previousBidderId && result.previousBidderId !== session.user.id) await notifyUser(result.previousBidderId, id, "OUTBID", "You were outbid", `${result.title}: a higher anonymous bid was placed. The auction closes ${result.endsAt.toLocaleString()}.`);
    return Response.json({ id: result.id, amount: result.amount, bidCount: result.bidCount, endsAt: result.endsAt }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Could not place bid" }, { status: 400 });
  }
}
