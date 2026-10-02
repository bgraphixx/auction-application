import Link from "next/link";
import { db } from "@/lib/db";
import { requireOperationsUser } from "@/lib/require-user";
import VerifyActions from "./verify-actions";
import { canPerform } from "@/lib/permissions";
import { redirect } from "next/navigation";

export default async function PaymentsPage() {
  const session = await requireOperationsUser();
  if (!canPerform(session.user.role, "FINANCE")) redirect("/operations");
  const payments = await db.paymentProof.findMany({ where: { status: "SUBMITTED" }, include: { auction: true }, orderBy: { submittedAt: "asc" } });
  return <main className="simple-page"><header className="simple-header"><img src="/assets/ffcl_logo_full.png" alt="Fewchore" /><Link href="/operations">← Operations workspace</Link></header><section className="form-page"><p className="eyebrow">FINANCE</p><h1>Payment verification</h1><div className="queue-list">{payments.length === 0 ? <p className="empty-copy">No payment proofs await verification.</p> : payments.map((payment) => <article className="stacked-card" key={payment.id}><div><b>{payment.auction.title}</b><span>₦{payment.amount.toLocaleString()} · Submitted {payment.submittedAt?.toLocaleString()}</span><a className="outline-button" href={payment.proofUrl ? `/api/uploads/download?key=${encodeURIComponent(payment.proofUrl)}` : "#"} target="_blank" rel="noreferrer">View receipt</a></div><VerifyActions auctionId={payment.auctionId} /></article>)}</div></section></main>;
}
