"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DisputeActions({ disputeId }: { disputeId: string }) {
  const router = useRouter();
  const [outcome, setOutcome] = useState("DISMISS");
  const [resolution, setResolution] = useState("");
  const [extensionAt, setExtensionAt] = useState("");
  const [error, setError] = useState("");
  async function submit() { const response = await fetch("/api/workflow", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "resolveDispute", disputeId, outcome, resolution, extensionAt: extensionAt ? new Date(extensionAt).toISOString() : undefined }) }); const data = await response.json(); if (!response.ok) setError(data.error ?? "Could not resolve dispute."); else router.refresh(); }
  return <div className="review-form"><div className="action-row"><select value={outcome} onChange={(event) => setOutcome(event.target.value)}>{["DISMISS", "CORRECT", "EXTEND", "CANCEL", "ESCALATE", "REFUND", "REVERSE"].map((value) => <option key={value}>{value}</option>)}</select>{outcome === "EXTEND" && <input type="datetime-local" value={extensionAt} onChange={(event) => setExtensionAt(event.target.value)} />}<input value={resolution} onChange={(event) => setResolution(event.target.value)} placeholder="Resolution and reason" /><button className="outline-button" disabled={resolution.trim().length < 3} onClick={() => void submit()}>Record outcome</button></div>{error && <p className="form-error">{error}</p>}</div>;
}
