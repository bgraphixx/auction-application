"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function VerifyActions({ auctionId }: { auctionId: string }) {
  const router = useRouter();
  const [verified, setVerified] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(accepted: boolean) {
    setBusy(true); setError("");
    const response = await fetch("/api/workflow", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "reviewPayment", auctionId, accepted, bankVerified: verified, reason: accepted ? undefined : reason }) });
    const data = await response.json(); setBusy(false);
    if (!response.ok) setError(data.error ?? "Verification failed."); else router.refresh();
  }
  return <div className="review-form"><label><input type="checkbox" checked={verified} onChange={(event) => setVerified(event.target.checked)} /> Matched amount and reference against bank records</label><div className="action-row"><button className="primary-button" disabled={!verified || busy} onClick={() => void submit(true)}>Accept payment</button><input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Rejection reason" /><button className="outline-button" disabled={busy || reason.trim().length < 3} onClick={() => void submit(false)}>Reject proof</button></div>{error && <p className="form-error">{error}</p>}</div>;
}
