"use client";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { runWorkflow } from "@/lib/workflow-client";
import { EvidenceUpload } from "@/components/evidence-upload";
import { dateTime, money, stateLabel } from "@/lib/presentation";

type Auction = { id: string; title: string; reference: string; state: string; endsAt: string; currentBid: number; lastBid: number | null; disputes: { id: string; reason: string; status: string; resolution: string | null; evidenceKey: string | null }[] };
export default function DisputeForm({ auctions, selectedId }: { auctions: Auction[]; selectedId: string }) {
  const router = useRouter();
  const [auctionId, setAuctionId] = useState(selectedId);
  const [evidenceKey, setEvidenceKey] = useState<string | null>(null);
  const [attachmentBlocked, setAttachmentBlocked] = useState(false);
  const [uploadVersion, setUploadVersion] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const selected = auctions.find((item) => item.id === auctionId);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy(true); setError(""); setSuccess(false);
    try {
      if (attachmentBlocked) throw new Error("Wait for the attachment to finish, or retry or remove it.");
      await runWorkflow({ action: "createDispute", evidenceKey, auctionId, reason: String(data.get("reason")).trim(), detail: String(data.get("detail")).trim() });
      form.reset(); setEvidenceKey(null); setUploadVersion(version => version + 1); setSuccess(true); router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not submit dispute. Please retry."); }
    finally { setBusy(false); }
  }
  return <div className="workspace-columns"><section className="workspace-panel"><form onSubmit={(event) => void submit(event)}><fieldset className="decision-form" disabled={busy}><legend>Dispute details</legend><label>Auction<select name="auctionId" value={auctionId} onChange={(event) => { setAuctionId(event.target.value); setSuccess(false); }} required><option value="">Select an auction</option>{auctions.map((item) => <option value={item.id} key={item.id}>{item.reference} · {item.title}</option>)}</select></label><label>Issue type<select name="reason" required defaultValue=""><option value="" disabled>Select the issue</option>{["Bid timing", "Eligibility decision", "Winner approval", "Listing information", "Payment", "Pickup", "Other"].map((reason) => <option key={reason}>{reason}</option>)}</select></label><label>What happened?<textarea name="detail" required minLength={10} maxLength={2000} rows={8} placeholder="Describe what happened and the outcome you are requesting." /></label><p className="muted">Include relevant dates, bid amounts, and transaction references. Maximum 2,000 characters.</p><EvidenceUpload key={uploadVersion} label="Evidence (optional)" onChange={setEvidenceKey} onBlockedChange={setAttachmentBlocked} /><div className="action-row"><Link className="outline-button" href="/employee/auctions">Back to auctions</Link><button className="primary-button" disabled={!selected || busy || attachmentBlocked}>{busy ? "Submitting…" : "Submit dispute"}</button></div></fieldset>{error && <p className="form-error" role="alert">{error}</p>}{success && <p className="save-notice" role="status">Dispute submitted to Compliance. Updates will appear in your notifications.</p>}</form></section><aside className="support-column review-evidence"><section className="workspace-panel"><h2>Auction record</h2>{selected ? <dl className="facts"><div><dt>Reference</dt><dd>{selected.reference}</dd></div><div><dt>Status</dt><dd>{stateLabel(selected.state)}</dd></div><div><dt>Auction end (WAT)</dt><dd>{dateTime(selected.endsAt)}</dd></div><div><dt>Your latest bid</dt><dd>{selected.lastBid === null ? "No bid placed" : money(selected.lastBid)}</dd></div><div><dt>Current price</dt><dd>{money(selected.currentBid)}</dd></div></dl> : <p className="muted">Select an auction to view its record.</p>}</section><section className="workspace-panel"><h2>Your existing disputes</h2>{selected?.disputes.length ? selected.disputes.map((dispute) => <article className="dispute-summary" key={dispute.id}><strong>{dispute.reason}</strong><span className="listing-state">{stateLabel(dispute.status)}</span>{dispute.resolution && <p>{dispute.resolution}</p>}{dispute.evidenceKey && <a className="text-link" href={`/api/uploads/download?key=${encodeURIComponent(dispute.evidenceKey)}`} target="_blank" rel="noreferrer">View evidence</a>}</article>) : <p className="muted">{selected ? "You have no disputes for this auction." : "Select an auction to see your disputes."}</p>}</section></aside></div>;
}
