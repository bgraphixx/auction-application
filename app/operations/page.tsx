import Link from "next/link";
import { requireOperationsUser } from "@/lib/require-user";

const queues = [
  ["Winner approvals", "4", "Highest bidders awaiting review"], ["Payment verification", "7", "Receipts awaiting finance verification"], ["Pickup scheduling", "5", "Paid winners need a collection slot"], ["Disputes & audit", "2", "Open cases requiring a decision"],
];

export default async function OperationsPage() {
  const session = await requireOperationsUser();
  return <main className="simple-page"><header className="simple-header"><img src="/assets/ffcl_logo_full.png" alt="Fewchore" /><div><Link href="/employee/dashboard">Employee workspace</Link><b>{session.user.role.replaceAll("_", " ")}</b></div></header><section className="dashboard-hero operations-hero"><p className="eyebrow">OPERATIONS WORKSPACE</p><h1>Asset disposal operations</h1><p>Manage auction state transitions, approvals, payments, handovers, and audit exceptions.</p><div className="dashboard-actions"><Link className="primary-button" href="/operations/listings/new">Create listing</Link><Link className="outline-button" href="/employee/dashboard">Employee workspace</Link></div></section><section className="queue-grid">{queues.map(([title, count, copy]) => <Link href={`/operations/${title.toLowerCase().replaceAll(" ", "-").replace("&-", "")}`} className="queue-card" key={title}><span>{title}</span><strong>{count}</strong><p>{copy}</p><em>Open queue →</em></Link>)}</section><section className="pipeline"><div><h2>Auction lifecycle</h2><p>Each stage keeps the next owner and action clear.</p></div><ol>{["Draft", "Live", "Winner approval", "Payment", "Pickup", "Closed"].map((stage, index) => <li className={index < 2 ? "done" : ""} key={stage}><i>{index + 1}</i>{stage}</li>)}</ol></section></main>;
}
