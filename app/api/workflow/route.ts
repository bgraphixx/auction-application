import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { canPerform } from "@/lib/permissions";
import { checkEligibility, isOwnedUpload } from "@/lib/auction-rules";
import { notifyUser } from "@/lib/notifications";
import { uploadExists } from "@/lib/storage";

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("submitListing"), auctionId: z.string() }),
  z.object({ action: z.literal("publish"), auctionId: z.string() }),
  z.object({ action: z.literal("reviewWinner"), auctionId: z.string(), approved: z.boolean(), reason: z.string().optional() }),
  z.object({ action: z.literal("defaultWinner"), auctionId: z.string(), reason: z.string().min(10) }),
  z.object({ action: z.literal("submitPayment"), auctionId: z.string(), proofUrl: z.string() }),
  z.object({ action: z.literal("reviewPayment"), auctionId: z.string(), accepted: z.boolean(), bankVerified: z.boolean().optional(), reason: z.string().optional() }),
  z.object({ action: z.literal("schedulePickup"), auctionId: z.string(), scheduledAt: z.string().datetime() }),
  z.object({ action: z.literal("completePickup"), auctionId: z.string(), evidenceUrl: z.string(), notes: z.string().min(3) }),
  z.object({ action: z.literal("acknowledgePickup"), auctionId: z.string() }),
  z.object({ action: z.literal("closeAuction"), auctionId: z.string() }),
  z.object({ action: z.literal("cancelAuction"), auctionId: z.string(), reason: z.string().min(10) }),
  z.object({ action: z.literal("createDispute"), auctionId: z.string(), reason: z.string().min(3).max(120), detail: z.string().min(10).max(2000) }),
  z.object({ action: z.literal("resolveDispute"), disputeId: z.string(), resolution: z.string().min(3), outcome: z.enum(["DISMISS", "CORRECT", "EXTEND", "CANCEL", "ESCALATE", "REFUND", "REVERSE"]), extensionAt: z.string().datetime().optional() }),
]);

const rejectionReasons = ["Bidder is not eligible", "Reserve/minimum price not met", "Bidder has unpaid previous wins", "Bidder violated auction rules", "Asset withdrawn or unavailable", "Payment/pickup risk"];

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Invalid workflow request", issues: parsed.error.flatten() }, { status: 400 });
  const command = parsed.data;
  const role = session.user.role;
  const requireRole = (area: "AUCTION_ADMIN" | "FINANCE" | "FACILITIES" | "COMPLIANCE") => { if (!canPerform(role, area)) throw new Error(`${area.replaceAll("_", " ")} access required.`); };
  const audit = (auctionId: string, action: string, before?: object, after?: object, reason?: string) => db.auditEvent.create({ data: { auctionId, actorId: session.user.id, actorRole: role, action, before, after, reason } });
  try {
    if (command.action === "submitListing") {
      requireRole("AUCTION_ADMIN");
      const auction = await db.auction.findUnique({ where: { id: command.auctionId } });
      if (!auction || auction.state !== "DRAFT") throw new Error("Only drafts can be submitted.");
      if (!auction.photoKeys.length) throw new Error("At least one asset photo is required.");
      if (!(await Promise.all(auction.photoKeys.map(uploadExists))).every(Boolean)) throw new Error("All asset photos must be uploaded to storage.");
      if (!auction.assetTag && !auction.tagMissingReason) throw new Error("Asset tag or missing-tag reason required.");
      const settings = await db.systemSetting.findUnique({ where: { id: "main" } });
      if (auction.startingPrice >= (settings?.highValueThreshold ?? 1000000) && !auction.sensitive) throw new Error("High-value assets must be flagged as sensitive.");
      if (auction.category === "IT assets" && auction.sensitive && (!auction.itWipeConfirmed || !auction.wipeProofUrl)) throw new Error("IT wipe confirmation and evidence required.");
      if (auction.wipeProofUrl && !(await uploadExists(auction.wipeProofUrl))) throw new Error("Wipe evidence file is missing.");
      await db.$transaction([db.auction.update({ where: { id: auction.id, state: "DRAFT" }, data: { state: "PENDING_APPROVAL" } }), audit(auction.id, "LISTING_SUBMITTED", { state: "DRAFT" }, { state: "PENDING_APPROVAL" })]);
    }
    if (command.action === "publish") {
      requireRole("AUCTION_ADMIN");
      const auction = await db.auction.findUnique({ where: { id: command.auctionId } });
      if (!auction || auction.state !== "PENDING_APPROVAL") throw new Error("Listing must be pending approval.");
      await db.$transaction([db.auction.update({ where: { id: auction.id, state: "PENDING_APPROVAL" }, data: { state: "LIVE" } }), audit(auction.id, "AUCTION_PUBLISHED", { state: auction.state }, { state: "LIVE" })]);
    }
    if (command.action === "reviewWinner") {
      requireRole("AUCTION_ADMIN");
      const auction = await db.auction.findUnique({ where: { id: command.auctionId }, include: { bids: { orderBy: { amount: "desc" }, include: { bidder: true } } } });
      if (!auction || auction.state !== "HIGHEST_BID_PENDING_APPROVAL") throw new Error("Auction is not ready for winner review.");
      const bid = auction.bids.find((item) => !auction.rejectedBidIds.includes(item.id));
      if (!bid) throw new Error("No candidate remains. Close this auction as unsold or cancel it.");
      if (command.approved) {
        if (auction.reservePrice && bid.amount < auction.reservePrice) throw new Error("Reserve price was not met.");
        const eligibility = await checkEligibility(auction, bid.bidder);
        if (!eligibility.eligible) throw new Error(eligibility.reason);
      } else if (!rejectionReasons.includes(command.reason ?? "")) throw new Error("Select a permitted rejection reason.");
      await db.$transaction([
        db.winnerApproval.upsert({ where: { auctionId: auction.id }, update: { bidderId: bid.bidderId, reviewerId: session.user.id, approved: command.approved, reason: command.reason }, create: { auctionId: auction.id, bidderId: bid.bidderId, reviewerId: session.user.id, approved: command.approved, reason: command.reason } }),
        db.auction.update({ where: { id: auction.id, state: "HIGHEST_BID_PENDING_APPROVAL" }, data: command.approved ? { state: "APPROVED_WINNER" } : { rejectedBidIds: { set: [...new Set([...auction.rejectedBidIds, ...auction.bids.filter((item) => item.bidderId === bid.bidderId).map((item) => item.id)])] } } }),
        audit(auction.id, command.approved ? "WINNER_APPROVED" : "WINNER_REJECTED", { state: auction.state, bidId: bid.id }, { state: command.approved ? "APPROVED_WINNER" : auction.state, bidderId: bid.bidderId }, command.reason),
      ]);
      if (command.approved) {
        const settings = await db.systemSetting.findUnique({ where: { id: "main" } });
        const paymentDeadline = new Date(Math.max(auction.paymentDeadline.getTime(), Date.now() + (settings?.defaultPaymentHours ?? 48) * 3600_000));
        const pickupDeadline = new Date(Math.max(auction.pickupDeadline.getTime(), paymentDeadline.getTime() + (settings?.defaultPickupDays ?? 7) * 86400_000));
        await db.$transaction([db.auction.update({ where: { id: auction.id, state: "APPROVED_WINNER" }, data: { state: "PAYMENT_PENDING", paymentDeadline, pickupDeadline } }), db.paymentProof.upsert({ where: { auctionId: auction.id }, update: { amount: bid.amount, status: "PENDING", proofUrl: null }, create: { auctionId: auction.id, amount: bid.amount } }), audit(auction.id, "PAYMENT_REQUESTED", { state: "APPROVED_WINNER" }, { state: "PAYMENT_PENDING", paymentDeadline, pickupDeadline })]);
        await notifyUser(bid.bidderId, auction.id, "WINNER_APPROVED", "Auction win approved", `${auction.title}: pay ₦${bid.amount.toLocaleString()} before ${paymentDeadline.toLocaleString()}. ${auction.paymentRules}`);
      }
    }
    if (command.action === "defaultWinner") {
      requireRole("AUCTION_ADMIN");
      const auction = await db.auction.findUnique({ where: { id: command.auctionId }, include: { approval: true, bids: { orderBy: { amount: "desc" } } } });
      if (!auction || auction.state !== "PAYMENT_PENDING" || !auction.approval?.approved || auction.paymentDeadline >= new Date()) throw new Error("Payment deadline has not passed.");
      const bid = auction.bids.find((item) => item.bidderId === auction.approval?.bidderId && !auction.rejectedBidIds.includes(item.id));
      await db.$transaction([db.auction.update({ where: { id: auction.id }, data: { state: "HIGHEST_BID_PENDING_APPROVAL", rejectedBidIds: { set: [...new Set([...auction.rejectedBidIds, ...auction.bids.filter((item) => item.bidderId === auction.approval?.bidderId).map((item) => item.id)])] } } }), db.winnerApproval.update({ where: { auctionId: auction.id }, data: { approved: false, reason: command.reason } }), audit(auction.id, "WINNER_DEFAULTED", { state: "PAYMENT_PENDING" }, { state: "HIGHEST_BID_PENDING_APPROVAL", rejectedBidId: bid?.id }, command.reason)]);
    }
    if (command.action === "submitPayment") {
      const auction = await db.auction.findUnique({ where: { id: command.auctionId }, include: { approval: true, payment: true } });
      if (!auction || auction.state !== "PAYMENT_PENDING" || auction.approval?.bidderId !== session.user.id || !auction.approval.approved || auction.paymentDeadline < new Date() || !["PENDING", "REJECTED"].includes(auction.payment?.status ?? "")) throw new Error("Payment proof is not accepted for this auction.");
      if (!isOwnedUpload(command.proofUrl, session.user.id)) throw new Error("Upload a receipt from your account.");
      if (!(await uploadExists(command.proofUrl))) throw new Error("Receipt file is missing from storage.");
      await db.$transaction([db.paymentProof.update({ where: { auctionId: auction.id }, data: { proofUrl: command.proofUrl, status: "SUBMITTED", submittedAt: new Date() } }), audit(auction.id, "PAYMENT_PROOF_SUBMITTED", { status: auction.payment?.status }, { status: "SUBMITTED", proofUrl: command.proofUrl })]);
    }
    if (command.action === "reviewPayment") {
      requireRole("FINANCE");
      const auction = await db.auction.findUnique({ where: { id: command.auctionId }, include: { payment: true, approval: true } });
      if (!auction || auction.state !== "PAYMENT_PENDING" || auction.payment?.status !== "SUBMITTED") throw new Error("No submitted proof is ready for verification.");
      if (command.accepted && !command.bankVerified) throw new Error("Confirm bank-record verification first.");
      if (!command.accepted && !command.reason?.trim()) throw new Error("Rejection reason required.");
      await db.$transaction([db.paymentProof.update({ where: { auctionId: auction.id }, data: { status: command.accepted ? "ACCEPTED" : "REJECTED", reviewedAt: new Date(), reviewerId: session.user.id, reason: command.reason } }), db.auction.update({ where: { id: auction.id }, data: { state: command.accepted ? "PAID" : "PAYMENT_PENDING" } }), ...(command.accepted ? [db.pickup.upsert({ where: { auctionId: auction.id }, update: {}, create: { auctionId: auction.id } })] : []), audit(auction.id, command.accepted ? "PAYMENT_ACCEPTED" : "PAYMENT_REJECTED", { state: auction.state, status: "SUBMITTED" }, { state: command.accepted ? "PAID" : "PAYMENT_PENDING", status: command.accepted ? "ACCEPTED" : "REJECTED", bankVerified: command.bankVerified ?? false }, command.reason)]);
      if (auction.approval) await notifyUser(auction.approval.bidderId, auction.id, command.accepted ? "PAYMENT_ACCEPTED" : "PAYMENT_REJECTED", command.accepted ? "Payment confirmed" : "Payment proof rejected", command.accepted ? `${auction.title}: payment confirmed. Pickup will be scheduled.` : `${auction.title}: ${command.reason}. Please resubmit proof before the deadline.`);
    }
    if (command.action === "schedulePickup") {
      requireRole("FACILITIES");
      const auction = await db.auction.findUnique({ where: { id: command.auctionId }, include: { payment: true, approval: true } });
      if (!auction || auction.state !== "PAID" || auction.payment?.status !== "ACCEPTED") throw new Error("Confirmed payment is required before pickup.");
      const slot = new Date(command.scheduledAt);
      if (slot <= new Date() || slot > auction.pickupDeadline) throw new Error("Slot must be in the future and before the pickup deadline.");
      await db.$transaction([db.pickup.upsert({ where: { auctionId: auction.id }, update: { status: "SCHEDULED", scheduledAt: slot }, create: { auctionId: auction.id, status: "SCHEDULED", scheduledAt: slot } }), db.auction.update({ where: { id: auction.id }, data: { state: "PICKUP_SCHEDULED" } }), audit(auction.id, "PICKUP_SCHEDULED", { state: "PAID" }, { state: "PICKUP_SCHEDULED", scheduledAt: slot })]);
      if (auction.approval) await notifyUser(auction.approval.bidderId, auction.id, "PICKUP_SCHEDULED", "Pickup scheduled", `${auction.title}: collect on ${slot.toLocaleString()} at ${auction.location}. ${auction.pickupRules}`);
    }
    if (command.action === "completePickup") {
      requireRole("FACILITIES");
      const auction = await db.auction.findUnique({ where: { id: command.auctionId }, include: { pickup: true } });
      if (!auction || auction.state !== "PICKUP_SCHEDULED" || auction.pickup?.status !== "SCHEDULED") throw new Error("Pickup must be scheduled first.");
      if (!isOwnedUpload(command.evidenceUrl, session.user.id)) throw new Error("Upload handover evidence from your account.");
      if (!(await uploadExists(command.evidenceUrl))) throw new Error("Handover evidence file is missing from storage.");
      await db.$transaction([db.pickup.update({ where: { auctionId: auction.id }, data: { status: "COMPLETED", completedAt: new Date(), evidenceUrl: command.evidenceUrl, notes: command.notes } }), db.auction.update({ where: { id: auction.id }, data: { state: "PICKED_UP" } }), audit(auction.id, "PICKUP_COMPLETED", { state: "PICKUP_SCHEDULED" }, { state: "PICKED_UP", evidenceUrl: command.evidenceUrl }, command.notes)]);
    }
    if (command.action === "acknowledgePickup") {
      const auction = await db.auction.findUnique({ where: { id: command.auctionId }, include: { approval: true, pickup: true } });
      if (!auction || auction.state !== "PICKED_UP" || auction.approval?.bidderId !== session.user.id || auction.pickup?.status !== "COMPLETED") throw new Error("Only the winning employee may acknowledge handover.");
      await db.$transaction([db.pickup.update({ where: { auctionId: auction.id }, data: { acknowledgedAt: new Date() } }), audit(auction.id, "PICKUP_ACKNOWLEDGED", undefined, { acknowledgedAt: new Date() })]);
    }
    if (command.action === "closeAuction") {
      requireRole("FACILITIES");
      const auction = await db.auction.findUnique({ where: { id: command.auctionId }, include: { pickup: true } });
      if (!auction || auction.state !== "PICKED_UP" || !auction.pickup?.evidenceUrl) throw new Error("Completed handover evidence required.");
      await db.$transaction([db.auction.update({ where: { id: auction.id }, data: { state: "CLOSED", closedAt: new Date() } }), audit(auction.id, "AUCTION_CLOSED", { state: "PICKED_UP" }, { state: "CLOSED" })]);
    }
    if (command.action === "cancelAuction") {
      requireRole("AUCTION_ADMIN");
      const auction = await db.auction.findUnique({ where: { id: command.auctionId }, include: { watchlist: true, bids: true } });
      if (!auction || ["PAID", "PICKUP_SCHEDULED", "PICKED_UP", "CLOSED", "CANCELLED"].includes(auction.state)) throw new Error("Paid or completed auctions require a compliance case before cancellation.");
      await db.$transaction([db.auction.update({ where: { id: auction.id }, data: { state: "CANCELLED" } }), audit(auction.id, "AUCTION_CANCELLED", { state: auction.state }, { state: "CANCELLED" }, command.reason)]);
      for (const userId of new Set([...auction.watchlist.map((row) => row.userId), ...auction.bids.map((row) => row.bidderId)])) await notifyUser(userId, auction.id, "AUCTION_CANCELLED", "Auction cancelled", `${auction.title}: ${command.reason}`);
    }
    if (command.action === "createDispute") {
      const auction = await db.auction.findUnique({ where: { id: command.auctionId } });
      if (!auction || auction.state === "DRAFT") throw new Error("This auction cannot receive disputes.");
      await db.$transaction([db.dispute.create({ data: { auctionId: auction.id, reporterId: session.user.id, reason: command.reason, detail: command.detail } }), audit(auction.id, "DISPUTE_SUBMITTED", undefined, { reason: command.reason })]);
    }
    if (command.action === "resolveDispute") {
      requireRole("COMPLIANCE");
      const dispute = await db.dispute.findUnique({ where: { id: command.disputeId }, include: { auction: true } });
      if (!dispute || !["OPEN", "UNDER_REVIEW"].includes(dispute.status)) throw new Error("Dispute is already resolved.");
      if (["REFUND", "REVERSE"].includes(command.outcome)) throw new Error("Refund or reversal requires manual finance escalation. Choose Escalate and document the case.");
      if (command.outcome === "EXTEND" && (!command.extensionAt || dispute.auction.state !== "LIVE" || new Date(command.extensionAt) <= dispute.auction.endsAt)) throw new Error("A live auction needs a later end time.");
      if (command.outcome === "CANCEL" && ["PAID", "PICKUP_SCHEDULED", "PICKED_UP", "CLOSED"].includes(dispute.auction.state)) throw new Error("Paid auctions need finance escalation before cancellation.");
      await db.$transaction([db.dispute.update({ where: { id: dispute.id }, data: { status: command.outcome === "DISMISS" ? "DISMISSED" : "RESOLVED", resolution: `${command.outcome}: ${command.resolution}` } }), ...(command.outcome === "EXTEND" ? [db.auction.update({ where: { id: dispute.auctionId }, data: { endsAt: new Date(command.extensionAt!) } })] : []), ...(command.outcome === "CANCEL" ? [db.auction.update({ where: { id: dispute.auctionId }, data: { state: "CANCELLED" } })] : []), audit(dispute.auctionId, `DISPUTE_${command.outcome}`, { status: dispute.status, state: dispute.auction.state }, { outcome: command.outcome }, command.resolution)]);
      await notifyUser(dispute.reporterId, dispute.auctionId, "DISPUTE_RESOLVED", "Dispute update", `${dispute.auction.title}: ${command.resolution}`);
    }
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Workflow action failed" }, { status: 400 });
  }
}
