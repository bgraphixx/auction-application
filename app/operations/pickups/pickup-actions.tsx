"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { uploadFile } from "@/lib/upload-client";
import { runWorkflow } from "@/lib/workflow-client";
import { dateTime } from "@/lib/presentation";

export default function PickupActions({ auctionId, status, deadline }: { auctionId: string; status: string; deadline: string }) {
  const router = useRouter();
  const [slot, setSlot] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [evidence, setEvidence] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [idChecked, setIdChecked] = useState(false);
  const [conditionChecked, setConditionChecked] = useState(false);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(action: "schedulePickup" | "completePickup" | "closeAuction") {
    setBusy(true); setError("");
    try {
      let payload: Record<string, unknown> = { action, auctionId };
      if (action === "schedulePickup") {
        const at = new Date(slot);
        if (!Number.isFinite(at.getTime()) || at <= new Date()) throw new Error("Choose a future pickup time.");
        if (status !== "MISSED" && at > new Date(deadline)) throw new Error("Choose a pickup time before the deadline.");
        payload = { ...payload, scheduledAt: at.toISOString() };
      }
      if (action === "completePickup") {
        if (!file || !idChecked || !conditionChecked) throw new Error("Confirm the employee ID and asset condition, then attach handover evidence.");
        const key = evidence ?? await uploadFile(file, setProgress);
        setEvidence(key);
        payload = { ...payload, evidenceUrl: key, notes: `Employee ID checked. Asset condition confirmed. ${notes.trim()}` };
      }
      await runWorkflow(payload); router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not save pickup. Retry your action."); }
    finally { setBusy(false); }
  }
  return <fieldset className="decision-form" disabled={busy}><legend>{status === "SCHEDULED" ? "Record handover" : status === "COMPLETED" ? "Close auction" : "Schedule pickup"}</legend><p className="muted">Pickup deadline: {dateTime(deadline)} WAT</p>{status === "MISSED" && <p className="muted">A replacement slot after this deadline extends the deadline to 24 hours after the new slot.</p>}
    {["PENDING", "MISSED"].includes(status) ? <><label>Pickup date and time<input type="datetime-local" value={slot} onChange={event => setSlot(event.target.value)} /></label><button className="primary-button" disabled={busy || !slot} onClick={() => void submit("schedulePickup")}>{busy ? "Saving slot…" : status === "MISSED" ? "Reschedule pickup" : "Confirm pickup slot"}</button></> : status === "SCHEDULED" ? <><label className="check-label"><input type="checkbox" checked={idChecked} onChange={event => setIdChecked(event.target.checked)} /> Employee ID checked</label><label className="check-label"><input type="checkbox" checked={conditionChecked} onChange={event => setConditionChecked(event.target.checked)} /> Asset condition confirmed</label><label>Handover evidence<input type="file" accept="image/jpeg,image/png,application/pdf" onChange={event => { setFile(event.target.files?.[0] ?? null); setEvidence(null); setProgress(0); }} /></label>{busy && file && <progress aria-label="Handover evidence upload" max="100" value={progress} />}{evidence && <p className="muted">Evidence uploaded. Ready to save handover.</p>}<label>Handover notes<textarea value={notes} onChange={event => setNotes(event.target.value)} placeholder="Record any collection details" /></label><button className="primary-button" disabled={busy || !file || !idChecked || !conditionChecked} onClick={() => void submit("completePickup")}>{busy ? "Saving handover…" : "Complete pickup"}</button></> : <><p className="muted">Handover is recorded. Close the auction to finish this disposal.</p><button className="primary-button" disabled={busy} onClick={() => void submit("closeAuction")}>{busy ? "Closing…" : "Close auction"}</button></>}
    {error && <p className="form-error" role="alert">{error}</p>}
  </fieldset>;
}
