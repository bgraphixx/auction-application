import Link from "next/link";
import { requireOperationsUser } from "@/lib/require-user";
import { db } from "@/lib/db";
import { canPerform } from "@/lib/permissions";
import { dateTime, money, stateLabel } from "@/lib/presentation";

export default async function OperationsPage() {
  const { user } = await requireOperationsUser();
  const [counts, review, payments, pickups, disputes, events] = await Promise.all([
    db.auction.groupBy({ by: ["state"], _count: { _all: true } }),
    db.auction.findMany({ where: { state: { in: ["PENDING_APPROVAL", "HIGHEST_BID_PENDING_APPROVAL"] } }, orderBy: { endsAt: "asc" }, take: 5 }),
    db.paymentProof.count({ where: { status: "SUBMITTED" } }),
    db.auction.count({ where: { state: { in: ["PAID", "PICKUP_SCHEDULED"] } } }),
    db.dispute.count({ where: { status: { in: ["OPEN", "UNDER_REVIEW"] } } }),
    db.auditEvent.findMany({ include: { auction: { select: { title: true } } }, orderBy: { createdAt: "desc" }, take: 5 }),
  ]);
  const count = (state: string) => counts.find(item => item.state === state)?._count._all ?? 0;
  const metrics = [
    { label: "Winner reviews", value: count("HIGHEST_BID_PENDING_APPROVAL"), href: "/operations/approvals", role: "AUCTION_ADMIN" },
    { label: "Payment proofs", value: payments, href: "/operations/payments", role: "FINANCE" },
    { label: "Upcoming pickups", value: pickups, href: "/operations/pickups", role: "FACILITIES" },
    { label: "Open disputes", value: disputes, href: "/operations/audit", role: "COMPLIANCE" },
  ] as const;
  return <main><div className="heading-row"><div><p className="eyebrow">Operations</p><h1>Disposal overview</h1></div>{canPerform(user.role, "AUCTION_ADMIN") && <Link className="primary-button" href="/operations/listings/new">Create listing</Link>}</div>
    <section className="metric-grid" aria-label="Operational queues">{metrics.filter(metric => canPerform(user.role, metric.role)).map(metric => <Link key={metric.label} href={metric.href}><span>{metric.label}</span><strong>{metric.value}</strong><small>Open queue</small></Link>)}</section>
    <div className="workspace-columns"><section className="workspace-panel"><div className="panel-heading"><h2>Approval queue</h2><Link href="/operations/listings">All listings</Link></div>{review.length ? <div className="activity-list">{review.map(auction => <article className="activity-row" key={auction.id}><div><strong>{auction.title}</strong><span>{stateLabel(auction.state)}</span><small>{auction.category} / {auction.location}</small></div><div className="activity-value"><strong>{money(auction.currentBid || auction.startingPrice)}</strong><small>{dateTime(auction.endsAt)}</small>{canPerform(user.role, "AUCTION_ADMIN") && <Link className="outline-button" href={auction.state === "PENDING_APPROVAL" ? "/operations/listings" : "/operations/approvals"}>Review</Link>}</div></article>)}</div> : <div className="panel-empty"><h3>Review queue is clear</h3><p>Listings and highest bids awaiting approval will appear here.</p></div>}</section>
      <aside className="support-column"><section className="workspace-panel"><h2>Auction lifecycle</h2><dl className="facts">{["DRAFT", "PENDING_APPROVAL", "LIVE", "HIGHEST_BID_PENDING_APPROVAL", "PAYMENT_PENDING", "PICKUP_SCHEDULED", "CLOSED"].map(state => <div key={state}><dt>{stateLabel(state)}</dt><dd>{count(state)}</dd></div>)}</dl></section>
      <section className="workspace-panel"><h2>Recent activity</h2>{events.length ? <ol className="event-feed">{events.map(event => <li key={event.id}><strong>{event.action.toLowerCase().replaceAll("_", " ")}</strong><span>{event.auction?.title ?? "System"}</span><time>{dateTime(event.createdAt)}</time></li>)}</ol> : <p className="muted">No activity recorded yet.</p>}</section></aside>
    </div>
  </main>;
}
