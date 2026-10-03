"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { runWorkflow } from "@/lib/workflow-client";

export default function VerifyActions({ auctionId }: { auctionId: string }) {
  const router = useRouter();
  const [verified, setVerified] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(accepted: boolean) {
    setBusy(true); setError("");
    try { await runWorkflow({ action: "reviewPayment", auctionId, accepted, bankVerified: verified, reason: accepted ? undefined : reason }); router.refresh(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Verification failed. Retry your review."); }
    finally { setBusy(false); }
  }
  return <fieldset disabled={busy} className="decision-form"><legend>Review payment</legend><label className="check-label"><input type="checkbox" checked={verified} onChange={event => setVerified(event.target.checked)} /> Bank credit, amount, and reference confirmed</label><p className="muted">Confirm the transfer in bank records before marking this asset as paid.</p><button className="primary-button" disabled={!verified || busy} onClick={() => void submit(true)}>{busy ? "Saving review…" : "Confirm paid"}</button><details><summary>Reject payment proof</summary><label>Reason<textarea value={reason} onChange={event => setReason(event.target.value)} placeholder="Explain what the employee needs to correct" /></label><button className="outline-button" disabled={busy || reason.trim().length < 3} onClick={() => void submit(false)}>Reject proof</button></details>{error && <p className="form-error" role="alert">{error}</p>}</fieldset>;
}
