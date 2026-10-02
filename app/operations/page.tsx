import Link from "next/link";
import { requireOperationsUser } from "@/lib/require-user";
import { db } from "@/lib/db";
import { canPerform } from "@/lib/permissions";

const queues = [
  ["Winner approvals", "Approvals", "Highest bidders awaiting review", "/operations/approvals"],
  ["Payment verification", "Finance", "Receipts awaiting finance verification", "/operations/payments"],
  ["Pickup scheduling", "Facilities", "Paid winners need a collection slot", "/operations/pickups"],
  ["Disputes & audit", "Compliance", "Open cases requiring a decision", "/operations/audit"],
];

export default async function OperationsPage() {
  const session = await requireOperationsUser();
  const [approvals, payments, pickups, disputes] = await Promise.all([db.auction.count({ where: { state: "HIGHEST_BID_PENDING_APPROVAL" } }), db.paymentProof.count({ where: { status: "SUBMITTED" } }), db.auction.count({ where: { state: { in: ["PAID", "PICKUP_SCHEDULED", "PICKED_UP"] } } }), db.dispute.count({ where: { status: { in: ["OPEN", "UNDER_REVIEW"] } } })]);
  const counts = [approvals, payments, pickups, disputes];
  const allowed = ["AUCTION_ADMIN", "FINANCE", "FACILITIES", "COMPLIANCE"] as const;
  return <main className="simple-page"><header className="simple-header"><img src="/assets/ffcl_logo_full.png" alt="Fewchore" /><div><Link href="/employee/dashboard">Employee workspace</Link><b>{session.user.role.replaceAll("_", " ")}</b></div></header><section className="dashboard-hero operations-hero"><p className="eyebrow">OPERATIONS WORKSPACE</p><h1>Asset disposal operations</h1><p>Manage auction state transitions, approvals, payments, handovers, and audit exceptions.</p><div className="dashboard-actions">{canPerform(session.user.role, "AUCTION_ADMIN") && <Link className="primary-button" href="/operations/listings/new">Create listing</Link>}<Link className="outline-button" href="/operations/listings">Manage listings</Link><Link className="outline-button" href="/operations/reports">Reports</Link>{canPerform(session.user.role, "SUPER_ADMIN") && <Link className="outline-button" href="/operations/admin">System administration</Link>}<Link className="outline-button" href="/employee/dashboard">Employee workspace</Link></div></section><section className="queue-grid">{queues.map(([title, owner, copy, href], index) => canPerform(session.user.role, allowed[index]) ? <Link href={href} className="queue-card" key={title}><span>{title}</span><strong>{counts[index]}</strong><p>{copy}</p><em>Open queue →</em></Link> : null)}</section><section className="pipeline"><div><h2>Auction lifecycle</h2><p>Every stage requires an accountable next action.</p></div><ol>{["Draft", "Pending approval", "Live", "Winner review", "Payment", "Pickup", "Closed"].map((stage, index) => <li key={stage}><i>{index + 1}</i>{stage}</li>)}</ol></section></main>;
}
