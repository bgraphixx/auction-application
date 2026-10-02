import Link from "next/link";
import { db } from "@/lib/db";
import { requireOperationsUser } from "@/lib/require-user";
import { canPerform } from "@/lib/permissions";
import { checkEligibility } from "@/lib/auction-rules";
import { redirect } from "next/navigation";
import ReviewActions from "./review-actions";
import { WorkflowButton } from "@/components/workflow-button";

export default async function ApprovalsPage() {
  const session = await requireOperationsUser();
  if (!canPerform(session.user.role, "AUCTION_ADMIN")) redirect("/operations");
  const auctions = await db.auction.findMany({ where: { state: { in: ["HIGHEST_BID_PENDING_APPROVAL", "PAYMENT_PENDING"] } }, include: { bids: { orderBy: { amount: "desc" }, include: { bidder: true } }, approval: true }, orderBy: { endsAt: "asc" } });
  const ready = await Promise.all(auctions.filter((auction) => auction.state === "HIGHEST_BID_PENDING_APPROVAL").map(async (auction) => {
    const bid = auction.bids.find((item) => !auction.rejectedBidIds.includes(item.id));
    const eligibility = bid ? await checkEligibility(auction, bid.bidder) : null;
    return { auction, bid, blocked: bid ? (auction.reservePrice && bid.amount < auction.reservePrice ? "Reserve price not met." : eligibility?.eligible ? null : eligibility?.reason ?? "Not eligible") : "No candidate remains." };
  }));
  const overdue = auctions.filter((auction) => auction.state === "PAYMENT_PENDING" && auction.paymentDeadline < new Date() && auction.approval?.approved);
  return <main className="simple-page"><header className="simple-header"><img src="/assets/ffcl_logo_full.png" alt="Fewchore" /><Link href="/operations">← Operations workspace</Link></header><section className="form-page"><p className="eyebrow">WINNER APPROVAL</p><h1>Highest bids pending review</h1><div className="queue-list">{ready.length === 0 ? <p className="empty-copy">No winners are awaiting approval.</p> : ready.map(({ auction, bid, blocked }) => <article className="stacked-card" key={auction.id}><div><b>{auction.title}</b><span>{auction.reference} · Candidate bid ₦{bid?.amount.toLocaleString() ?? "—"} · Reserve {auction.reservePrice ? `₦${auction.reservePrice.toLocaleString()}` : "None"}</span><span>Employee {bid?.bidder.employeeId ?? "Unknown"} · Grade {bid?.bidder.jobGrade ?? "Not set"} · {bid?.bidder.department ?? "No department"}</span><span>{auction.rejectedBidIds.length} earlier bid(s) rejected · Deadline {auction.paymentDeadline.toLocaleString()}</span></div>{bid && <ReviewActions auctionId={auction.id} blocked={blocked ?? null} />}</article>)}</div><h2 className="section-heading">Overdue payments</h2><div className="queue-list">{overdue.length ? overdue.map((auction) => <article key={auction.id}><div><b>{auction.title}</b><span>Payment deadline passed {auction.paymentDeadline.toLocaleString()}</span></div><WorkflowButton payload={{ action: "defaultWinner", auctionId: auction.id }} prompt="Reason for default (minimum 10 characters)">Default and review next bidder</WorkflowButton></article>) : <p className="empty-copy">No overdue winners.</p>}</div></section></main>;
}
