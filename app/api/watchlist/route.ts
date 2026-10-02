import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = z.object({ auctionId: z.string(), watched: z.boolean() }).safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Invalid watchlist change" }, { status: 400 });
  const auction = await db.auction.findUnique({ where: { id: parsed.data.auctionId }, select: { state: true } });
  if (!auction || !["LIVE", "HIGHEST_BID_PENDING_APPROVAL"].includes(auction.state)) return Response.json({ error: "Auction unavailable" }, { status: 404 });
  if (parsed.data.watched) await db.watchlist.upsert({ where: { userId_auctionId: { userId: session.user.id, auctionId: parsed.data.auctionId } }, update: {}, create: { userId: session.user.id, auctionId: parsed.data.auctionId } });
  else await db.watchlist.deleteMany({ where: { userId: session.user.id, auctionId: parsed.data.auctionId } });
  return Response.json({ watched: parsed.data.watched });
}
