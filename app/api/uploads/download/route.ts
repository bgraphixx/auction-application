import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { canPerform } from "@/lib/permissions";
import { createDownloadUrl } from "@/lib/storage";
import { db } from "@/lib/db";
import { isOwnedUpload } from "@/lib/auction-rules";

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const key = new URL(request.url).searchParams.get("key");
  if (!key?.startsWith("uploads/") || key.includes("..")) return Response.json({ error: "Invalid file key" }, { status: 400 });
  const owns = isOwnedUpload(key, session.user.id);
  const photo = await db.auction.findFirst({ where: { photoKeys: { has: key } }, select: { id: true, state: true } });
  const payment = await db.paymentProof.findFirst({ where: { proofUrl: key }, include: { auction: { include: { approval: true } } } });
  const handover = await db.pickup.findFirst({ where: { evidenceUrl: key }, include: { auction: { include: { approval: true } } } });
  const refund = await db.refundRecord.findFirst({ where: { evidenceUrl: key }, include: { auction: { include: { approval: true } } } });
  const wipe = await db.auction.findFirst({ where: { wipeProofUrl: key } });
  const dispute = await db.dispute.findFirst({ where: { evidenceKey: key }, select: { reporterId: true } });
  const allowed = Boolean(dispute && (dispute.reporterId === session.user.id || canPerform(session.user.role, "COMPLIANCE"))) || owns || Boolean(photo && (!["DRAFT", "PENDING_APPROVAL"].includes(photo.state) || canPerform(session.user.role, "AUCTION_ADMIN"))) || Boolean(payment && (canPerform(session.user.role, "FINANCE") || payment.auction.approval?.bidderId === session.user.id)) || Boolean(handover && (canPerform(session.user.role, "FACILITIES") || handover.auction.approval?.bidderId === session.user.id)) || Boolean(refund && (canPerform(session.user.role, "FINANCE") || canPerform(session.user.role, "COMPLIANCE") || refund.auction.approval?.bidderId === session.user.id)) || Boolean(wipe && (canPerform(session.user.role, "COMPLIANCE") || canPerform(session.user.role, "AUCTION_ADMIN")));
  if (!allowed) return Response.json({ error: "File access denied" }, { status: 403 });
  return Response.redirect(await createDownloadUrl(key));
}
