"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { uploadFile } from "@/lib/upload-client";
import { runWorkflow } from "@/lib/workflow-client";
import { dateTime, money, stateLabel } from "@/lib/presentation";

export type ApprovedWin = { auctionId: string; approvedAt: string; paidAt: string | null; collectedAt: string | null; closedAt: string | null; title: string; reference: string; amount: number; location: string; state: string; paymentStatus: string; paymentReason: string | null; proofUrl: string | null; pickupStatus: string; pickupAt: string | null; acknowledged: boolean; paymentDeadline: string; pickupDeadline: string; paymentRules: string; pickupRules: string };
type RecentBid = { auctionId: string; title: string; amount: number; state: string };
function WinActions({ item }: { item: ApprovedWin }) {
  const router = useRouter();
  const [file, setFile] = useState<File>();
  const [preview, setPreview] = useState("");
  const [uploadedKey, setUploadedKey] = useState("");
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (!file || !file.type.startsWith("image/")) { setPreview(""); return; }
    const url = URL.createObjectURL(file); setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  async function submit(proof: boolean) {
    setBusy(true); setError(""); setMessage("");
    try {
      if (proof) {
        if (!file) throw new Error("Select a JPG, PNG, or PDF receipt first.");
        const key = uploadedKey || await uploadFile(file, setProgress);
        setUploadedKey(key);
        await runWorkflow({ action: "submitPayment", auctionId: item.auctionId, proofUrl: key });
        setMessage("Receipt submitted. Finance will verify the payment.");
      } else {
        await runWorkflow({ action: "acknowledgePickup", auctionId: item.auctionId });
        setMessage("Collection acknowledged.");
      }
      router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not save. Please retry."); }
    finally { setBusy(false); }
  }
  const needsProof = ["PENDING", "REJECTED"].includes(item.paymentStatus) && item.state === "PAYMENT_PENDING";
  return <section className="workspace-panel"><h2>{needsProof ? "Submit payment receipt" : "Next step"}</h2>
    {item.paymentStatus === "REJECTED" && <p className="form-error">Receipt rejected: {item.paymentReason || "Upload a corrected receipt."}</p>}
    {needsProof ? <fieldset className="decision-form" disabled={busy}><label className="upload-target">Payment receipt<input type="file" accept="image/jpeg,image/png,application/pdf" onChange={(event) => { setFile(event.target.files?.[0]); setUploadedKey(""); setProgress(0); setError(""); setMessage(""); }} /><small>JPG, PNG, or PDF · Up to 10 MB</small></label>{file && <div className="receipt-selection">{preview && <img src={preview} alt="Selected payment receipt" />}<span>{file.name}</span>{busy && <><progress value={progress} max="100" aria-label="Receipt upload progress" /><small>{progress < 100 ? `Uploading ${progress}%` : "Submitting receipt…"}</small></>}</div>}<button className="primary-button" disabled={busy || !file || Boolean(message)} onClick={() => void submit(true)}>{busy ? "Submitting…" : uploadedKey && error ? "Retry submission" : "Submit receipt"}</button></fieldset> : <p className="muted">{item.paymentStatus === "SUBMITTED" ? "Your receipt is with Finance for verification." : item.state === "PAID" ? "Payment verified. Facilities will schedule your pickup." : item.state === "PICKUP_SCHEDULED" ? "Your pickup is scheduled. Bring your employee identification." : item.state === "PICKED_UP" ? item.acknowledged ? "You have acknowledged collection." : "Confirm that you have collected the asset." : item.state === "CLOSED" ? "This auction is complete." : stateLabel(item.state)}</p>}
    {item.state === "PICKED_UP" && !item.acknowledged && <button className="primary-button" disabled={busy || Boolean(message)} onClick={() => void submit(false)}>{busy ? "Saving…" : "Acknowledge collection"}</button>}
    {item.proofUrl && <p><a className="text-link" href={`/api/uploads/download?key=${encodeURIComponent(item.proofUrl)}`} target="_blank" rel="noreferrer">View submitted receipt</a></p>}
    {error && <p className="form-error" role="alert">{error}</p>}{message && <p className="save-notice" role="status">{message}</p>}
  </section>;
}
function WinProgress({ item }: { item: ApprovedWin }) {
  const stages = [
    { label: "Winner approved", complete: true, at: item.approvedAt },
    { label: "Payment verified", complete: item.paymentStatus === "ACCEPTED", at: item.paidAt },
    { label: "Pickup scheduled", complete: Boolean(item.pickupAt) && item.pickupStatus !== "MISSED", at: item.pickupAt },
    { label: "Picked up", complete: Boolean(item.collectedAt), at: item.collectedAt },
    { label: "Auction closed", complete: item.state === "CLOSED", at: item.closedAt },
  ];
  return <section className="workspace-panel"><h2>Progress</h2><ol className="win-progress">{stages.map(stage => <li key={stage.label} className={stage.complete ? "is-complete" : ""}><span className="progress-dot" aria-hidden="true">{stage.complete ? "✓" : ""}</span><div><strong>{stage.label}</strong><span>{stage.complete ? stage.at ? <time dateTime={stage.at}>{dateTime(stage.at)} WAT</time> : "Complete" : item.pickupStatus === "MISSED" && stage.label === "Pickup scheduled" ? "Missed · awaiting a new slot" : "Pending"}</span></div></li>)}</ol></section>;
}
function BidFeedback({ bid }: { bid: RecentBid }) {
  const [score, setScore] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  async function save() {
    setBusy(true); setError(""); setSaved(false);
    try {
      const response = await fetch("/api/ratings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ auctionId: bid.auctionId, score: Number(score) }) });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error ?? "Could not save feedback.");
      setSaved(true);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not save feedback. Please retry."); }
    finally { setBusy(false); }
  }
  return <div className="bid-feedback"><label>Rate auction fairness<select disabled={busy} value={score} onChange={(event) => { setScore(event.target.value); setSaved(false); }}><option value="">Select rating</option>{[1, 2, 3, 4, 5].map((value) => <option value={value} key={value}>{value} / 5</option>)}</select></label><button className="outline-button" disabled={busy || !score || saved} onClick={() => void save()}>{busy ? "Saving…" : saved ? "Feedback saved" : "Save feedback"}</button>{error && <p className="form-error" role="alert">{error}</p>}</div>;
}
export default function EmployeeTasks({ approvals: allApprovals, bids, view = "all" }: { view?: "all" | "bids" | "payments" | "pickups"; approvals: ApprovedWin[]; bids: RecentBid[] }) {
  const approvals = view === "pickups" ? allApprovals.filter(item => item.paymentStatus === "ACCEPTED") : allApprovals;
  const [selectedId, setSelectedId] = useState(approvals[0]?.auctionId);
  const selected = approvals.find((item) => item.auctionId === selectedId) ?? approvals[0];
  const uniqueBids = bids.filter((bid, index) => bids.findIndex((item) => item.auctionId === bid.auctionId) === index);
  return <><div className="heading-row"><div><h1>{view === "bids" ? "My bids" : view === "payments" ? "Payments" : view === "pickups" ? "Pickups" : "Your bids, payments, and pickups"}</h1><p className="muted">{view === "bids" ? "Your latest bid and auction outcome." : view === "payments" ? "Submit receipts and track payment verification." : view === "pickups" ? "View collection arrangements and acknowledge handover." : "Track approved wins and complete your next step."}</p></div><Link className="outline-button" href="/employee/auctions">Browse auctions</Link></div>
    {view !== "bids" && <><h2 className="section-heading">{view === "pickups" ? "Collection records" : "Approved wins"}</h2>{!selected ? <p className="empty-copy">{view === "pickups" ? "No collections yet. Assets appear after Finance confirms payment." : "No approved wins yet. Winner decisions will appear here after review."}</p> : <><nav className="record-tabs" aria-label="Approved wins">{approvals.map((item) => <button key={item.auctionId} aria-pressed={item.auctionId === selected.auctionId} onClick={() => setSelectedId(item.auctionId)}>{item.title}<small>{stateLabel(item.state)}</small></button>)}</nav><div className="workspace-columns"><div className="support-column review-evidence"><section className="workspace-panel"><div className="panel-heading"><h2>{selected.title}</h2><span className="listing-state">{stateLabel(selected.state)}</span></div><dl className="facts"><div><dt>Auction</dt><dd>{selected.reference}</dd></div><div><dt>Approved amount</dt><dd className="review-amount">{money(selected.amount)}</dd></div><div><dt>Payment deadline (WAT)</dt><dd>{dateTime(selected.paymentDeadline)}</dd></div><div><dt>Payment status</dt><dd>{stateLabel(selected.paymentStatus)}</dd></div></dl><div className="dispute-detail"><h3>Payment instructions</h3><p>{selected.paymentRules}</p></div><Link className="text-link" href={`/employee/disputes/new?auctionId=${selected.auctionId}`}>Raise a dispute</Link></section><WinActions key={selected.auctionId} item={selected} /></div><aside className="support-column review-evidence"><WinProgress item={selected} /><section className="workspace-panel"><h2>Pickup arrangements</h2><dl className="facts"><div><dt>Location</dt><dd>{selected.location}</dd></div><div><dt>Scheduled pickup (WAT)</dt><dd>{selected.pickupAt ? dateTime(selected.pickupAt) : "Not scheduled"}</dd></div><div><dt>Pickup deadline (WAT)</dt><dd>{dateTime(selected.pickupDeadline)}</dd></div></dl><p className="muted">{selected.pickupRules}</p></section></aside></div></>}
    </>}{(view === "all" || view === "bids") && <section className="workspace-panel recent-bids"><h2>Your latest bid per auction</h2>{uniqueBids.length ? uniqueBids.map((bid) => <article className="audit-entry" key={bid.auctionId}><div className="panel-heading"><strong>{bid.title}</strong><strong>{money(bid.amount)}</strong></div><span className="listing-state">{stateLabel(bid.state)}</span>{["CLOSED", "CANCELLED"].includes(bid.state) && <BidFeedback bid={bid} />}</article>) : <p className="muted">You have not placed a bid yet.</p>}</section>}
  </>;
}
