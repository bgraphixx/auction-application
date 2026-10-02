import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = z.object({ auctionId: z.string(), score: z.number().int().min(1).max(5), comment: z.string().max(500).optional() }).safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Choose a score from 1 to 5." }, { status: 400 });
  const auction = await db.auction.findUnique({ where: { id: parsed.data.auctionId }, include: { bids: { where: { bidderId: session.user.id }, take: 1 } } });
  if (!auction || !["CLOSED", "CANCELLED"].includes(auction.state) || !auction.bids.length) return Response.json({ error: "You may rate a completed auction you bid in." }, { status: 403 });
  await db.$transaction([db.auctionRating.upsert({ where: { auctionId_userId: { auctionId: auction.id, userId: session.user.id } }, update: { score: parsed.data.score, comment: parsed.data.comment }, create: { auctionId: auction.id, userId: session.user.id, score: parsed.data.score, comment: parsed.data.comment } }), db.auditEvent.create({ data: { auctionId: auction.id, actorId: session.user.id, actorRole: session.user.role, action: "AUCTION_RATED", after: { score: parsed.data.score } } })]);
  return Response.json({ ok: true });
}
