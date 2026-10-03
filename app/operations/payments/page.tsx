import Link from "next/link";
import { db } from "@/lib/db";
import { requireOperationsUser } from "@/lib/require-user";
import VerifyActions from "./verify-actions";
import RefundActions from "./refund-actions";
import { canPerform } from "@/lib/permissions";
import { redirect } from "next/navigation";
import { dateTime, money } from "@/lib/presentation";

export default async function PaymentsPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const session = await requireOperationsUser();
  if (!canPerform(session.user.role, "FINANCE")) redirect("/operations");
  const { id } = await searchParams;
  const [payments, refunds] = await Promise.all([
    db.paymentProof.findMany({ where: { status: "SUBMITTED" }, include: { auction: true }, orderBy: { submittedAt: "asc" } }),
    db.refundRecord.findMany({ where: { status: "REQUESTED" }, include: { auction: true }, orderBy: { requestedAt: "asc" } }),
  ]);
  const selected = payments.find(payment => payment.id === id) ?? payments[0];
  const receipt = selected?.proofUrl ? `/api/uploads/download?key=${encodeURIComponent(selected.proofUrl)}` : null;
  return <main><div className="heading-row"><div><p className="eyebrow">Finance</p><h1>Payment verification</h1></div><span className="listing-state">{payments.length} awaiting review</span></div>
    {!!payments.length && <nav className="record-tabs" aria-label="Payment queue">{payments.map(payment => <Link key={payment.id} href={`?id=${payment.id}`} aria-current={payment.id === selected?.id ? "page" : undefined}>{payment.auction.title}<small>{money(payment.amount)}</small></Link>)}</nav>}
    {selected ? <div className="workspace-columns"><section className="workspace-panel"><div className="panel-heading"><div><h2>{selected.auction.title}</h2><p className="muted">{selected.auction.reference}</p></div><strong className="review-amount">{money(selected.amount)}</strong></div>{receipt ? <><div className="receipt-preview">{selected.proofUrl?.toLowerCase().endsWith(".pdf") ? <object data={receipt} type="application/pdf" aria-label="Payment receipt"><p>Open the receipt to review this PDF.</p></object> : <img src={receipt} alt="Submitted bank transfer receipt" />}</div><a className="outline-button" href={receipt} target="_blank" rel="noreferrer">Open original receipt</a></> : <p className="form-error">No receipt is attached. Request a new proof from the employee.</p>}</section><aside className="support-column"><section className="workspace-panel"><h2>Payment details</h2><dl className="facts"><div><dt>Expected amount</dt><dd>{money(selected.auction.currentBid)}</dd></div><div><dt>Submitted amount</dt><dd>{money(selected.amount)}</dd></div><div><dt>Amount check</dt><dd>{selected.amount === selected.auction.currentBid ? "Matches" : "Does not match"}</dd></div><div><dt>Submitted</dt><dd>{selected.submittedAt ? dateTime(selected.submittedAt) : "Not recorded"}</dd></div><div><dt>Payment deadline</dt><dd>{dateTime(selected.auction.paymentDeadline)}</dd></div></dl></section><section className="workspace-panel"><VerifyActions key={selected.id} auctionId={selected.auctionId} /></section></aside></div> : <section className="workspace-panel panel-empty"><h2>Payment queue is clear</h2><p>New payment proofs will appear here for bank verification.</p></section>}
    <h2 className="section-heading">Refund requests</h2><div className="queue-list">{refunds.length ? refunds.map(refund => <article className="stacked-card" key={refund.id}><div><b>{refund.auction.title}</b><span>{money(refund.amount)} requested {dateTime(refund.requestedAt)}</span></div><RefundActions auctionId={refund.auctionId} /></article>) : <p className="empty-copy">No refunds await confirmation.</p>}</div>
  </main>;
}
