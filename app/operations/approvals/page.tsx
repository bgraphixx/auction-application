import { dateTime, money, stateLabel } from "@/lib/presentation";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireOperationsUser } from "@/lib/require-user";
import { canPerform } from "@/lib/permissions";
import { checkEligibility } from "@/lib/auction-rules";
import { redirect } from "next/navigation";
import ReviewActions from "./review-actions";
import { WorkflowButton } from "@/components/workflow-button";

export default async function ApprovalsPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  const session = await requireOperationsUser();
  if (!canPerform(session.user.role, "AUCTION_ADMIN")) redirect("/operations");
  const auctions = await db.auction.findMany({ where: { state: { in: ["HIGHEST_BID_PENDING_APPROVAL", "PAYMENT_PENDING"] } }, include: { bids: { orderBy: { amount: "desc" }, include: { bidder: true } }, approval: true }, orderBy: { endsAt: "asc" } });
  const ready = await Promise.all(auctions.filter((auction) => auction.state === "HIGHEST_BID_PENDING_APPROVAL").map(async (auction) => {
    const bid = auction.bids.find((item) => !auction.rejectedBidIds.includes(item.id));
    const eligibility = bid ? await checkEligibility(auction, bid.bidder) : null;
    return { auction, bid, blocked: bid ? (auction.reservePrice && bid.amount < auction.reservePrice ? "Reserve price not met." : eligibility?.eligible ? null : eligibility?.reason ?? "Not eligible") : "No candidate remains." };
  }));
  const overdue = auctions.filter((auction) => auction.state === "PAYMENT_PENDING" && auction.paymentDeadline < new Date() && auction.approval?.approved);
  const selected = ready.find(item => item.auction.id === id) ?? ready[0];
  return <main><div className="heading-row"><div><p className="eyebrow">Auction administration</p><h1>Winner review</h1></div><span className="listing-state">{ready.length} awaiting review</span></div>
    {!!ready.length && <nav className="record-tabs" aria-label="Winner review queue">{ready.map(({ auction }) => <Link key={auction.id} href={`?id=${auction.id}`} aria-current={auction.id === selected?.auction.id ? "page" : undefined}>{auction.title}<small>{money(auction.currentBid)}</small></Link>)}</nav>}
    {selected ? <div className="workspace-columns"><div className="support-column review-evidence"><section className="workspace-panel"><div className="panel-heading"><div><h2>{selected.auction.title}</h2><p className="muted">{selected.auction.reference}</p></div><strong className="review-amount">{selected.bid ? money(selected.bid.amount) : "No candidate"}</strong></div><dl className="facts"><div><dt>Status</dt><dd>{stateLabel(selected.auction.state)}</dd></div><div><dt>Reserve price</dt><dd>{selected.auction.reservePrice ? money(selected.auction.reservePrice) : "Not set"}</dd></div><div><dt>Closed</dt><dd>{dateTime(selected.auction.endsAt)}</dd></div><div><dt>Payment deadline</dt><dd>{dateTime(selected.auction.paymentDeadline)}</dd></div></dl></section><section className="workspace-panel"><h2>Bid history</h2><div className="table-scroll" tabIndex={0} role="region" aria-label="Bid history"><table className="data-table"><thead><tr><th>Time</th><th>Bidder</th><th>Amount</th><th>Review</th></tr></thead><tbody>{selected.auction.bids.map(bid => <tr key={bid.id}><td>{dateTime(bid.createdAt)}</td><td>{bid.bidder.employeeId ?? "Not set"}</td><td>{money(bid.amount)}</td><td>{selected.auction.rejectedBidIds.includes(bid.id) ? "Rejected" : bid.id === selected.bid?.id ? "Current candidate" : "Other bid"}</td></tr>)}</tbody></table></div>{!selected.auction.bids.length && <p className="muted">No bids were received.</p>}</section></div><aside className="support-column"><section className="workspace-panel"><h2>Candidate profile</h2><dl className="facts"><div><dt>Employee</dt><dd>{selected.bid?.bidder.employeeId ?? "No candidate"}</dd></div><div><dt>Grade</dt><dd>{selected.bid?.bidder.jobGrade ?? "Not set"}</dd></div><div><dt>Department</dt><dd>{selected.bid?.bidder.department ?? "Not set"}</dd></div><div><dt>Location</dt><dd>{selected.bid?.bidder.location ?? "Not set"}</dd></div><div><dt>Employment</dt><dd>{selected.bid?.bidder.employmentStatus.toLowerCase() ?? "Not set"}</dd></div></dl></section><section className="workspace-panel">{selected.bid ? <ReviewActions key={selected.auction.id} auctionId={selected.auction.id} blocked={selected.blocked} /> : <p className="form-error">No eligible candidate remains. Review the listing before cancelling or relisting.</p>}</section></aside></div> : <section className="workspace-panel panel-empty"><h2>No winners awaiting review</h2><p>When an auction closes, its highest bid will appear here.</p></section>}
    <h2 className="section-heading">Overdue payments</h2><div className="queue-list">{overdue.length ? overdue.map(auction => <article key={auction.id}><div><b>{auction.title}</b><span>Payment was due {dateTime(auction.paymentDeadline)}</span></div><WorkflowButton payload={{ action: "defaultWinner", auctionId: auction.id }} prompt="Reason for default (minimum 10 characters)">Default and review next bidder</WorkflowButton></article>) : <p className="empty-copy">No overdue winners.</p>}</div>
  </main>;
}
