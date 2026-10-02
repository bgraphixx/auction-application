import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const bidSchema = z.object({ amount: z.number().int().positive() });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const payload = bidSchema.safeParse(await request.json());
  if (!payload.success) return Response.json({ error: "Bid amount must be a positive whole number" }, { status: 400 });
  const { id } = await params;

  try {
    const result = await db.$transaction(async (tx) => {
      const [auction, employee] = await Promise.all([
        tx.auction.findUnique({ where: { id } }),
        tx.user.findUnique({ where: { id: session.user.id } }),
      ]);
      if (!auction || auction.state !== "LIVE" || auction.endsAt <= new Date()) throw new Error("This auction is no longer open for bids.");
      if (!employee || employee.status !== "ACTIVE") throw new Error("Your employee account is not eligible to bid.");
      const minimum = (auction.currentBid || auction.startingPrice) + auction.bidIncrement;
      if (payload.data.amount < minimum) throw new Error(`Your bid must be at least ₦${minimum.toLocaleString("en-NG")}.`);

      const bid = await tx.bid.create({ data: { auctionId: auction.id, bidderId: employee.id, amount: payload.data.amount } });
      await tx.auction.update({ where: { id: auction.id }, data: { currentBid: bid.amount, bidCount: { increment: 1 } } });
      await tx.auditEvent.create({ data: { auctionId: auction.id, actorId: employee.id, action: "BID_PLACED", after: { amount: bid.amount } } });
      return { id: bid.id, amount: bid.amount, bidCount: auction.bidCount + 1 };
    });
    return Response.json(result, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Could not place bid" }, { status: 400 });
  }
}
