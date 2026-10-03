"use client";

import { runWorkflow } from "@/lib/workflow-client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const reasons = ["Bidder is not eligible", "Reserve/minimum price not met", "Bidder has unpaid previous wins", "Bidder violated auction rules", "Asset withdrawn or unavailable", "Payment/pickup risk"];
export default function ReviewActions({ auctionId, blocked }: { auctionId: string; blocked: string | null }) {
  const router = useRouter();
  const [checks, setChecks] = useState<string[]>([]);
  const [reason, setReason] = useState(reasons[0]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const items = ["Highest bidder confirmed", "Eligibility and unpaid wins checked", "Reserve and rules checked", "Asset available", "Payment and pickup ready"];
  async function submit(approved: boolean) {
    setBusy(true); setError("");
    try { await runWorkflow({ action: "reviewWinner", auctionId, approved, reason: approved ? undefined : reason }); router.refresh(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Review failed. Retry your decision."); }
    finally { setBusy(false); }
  }
  return <fieldset disabled={busy} className="decision-form"><legend>Winner checks</legend><div className="check-grid">{items.map((item) => <label className="check-label" key={item}><input type="checkbox" checked={checks.includes(item)} onChange={(event) => setChecks(event.target.checked ? [...checks, item] : checks.filter((value) => value !== item))} /> {item}</label>)}</div><div className="action-row"><button className="primary-button" disabled={busy || !!blocked || checks.length !== items.length} onClick={() => void submit(true)}>Approve winner</button><select aria-label="Rejection reason" value={reason} onChange={(event) => setReason(event.target.value)}>{reasons.map((item) => <option key={item}>{item}</option>)}</select><button className="outline-button" disabled={busy} onClick={() => void submit(false)}>Reject candidate</button></div>{blocked && <p className="form-error" role="alert">{blocked}</p>}{error && <p className="form-error" role="alert">{error}</p>}</fieldset>;
}
