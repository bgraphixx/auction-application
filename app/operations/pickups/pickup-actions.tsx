"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { uploadFile } from "@/lib/upload-client";

export default function PickupActions({ auctionId, status, deadline }: { auctionId: string; status: string; deadline: string }) {
  const router = useRouter();
  const [slot, setSlot] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(payload: Record<string, unknown>) {
    setBusy(true); setError("");
    try { const response = await fetch("/api/workflow", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); const data = await response.json(); if (!response.ok) throw new Error(data.error ?? "Action failed."); router.refresh(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Action failed."); } finally { setBusy(false); }
  }
  async function complete() {
    if (!file) { setError("Upload handover photo or document."); return; }
    try { const evidenceUrl = await uploadFile(file); await submit({ action: "completePickup", auctionId, evidenceUrl, notes }); } catch (cause) { setError(cause instanceof Error ? cause.message : "Upload failed."); }
  }
  return <div className="review-form"><small>Pickup deadline: {new Date(deadline).toLocaleString()}</small>{status === "PENDING" ? <div className="action-row"><input type="datetime-local" value={slot} onChange={(event) => setSlot(event.target.value)} /><button className="primary-button" disabled={busy || !slot} onClick={() => void submit({ action: "schedulePickup", auctionId, scheduledAt: new Date(slot).toISOString() })}>Confirm pickup slot</button></div> : status === "SCHEDULED" ? <div className="action-row"><input type="file" accept="image/jpeg,image/png,application/pdf" onChange={(event) => setFile(event.target.files?.[0] ?? null)} /><input placeholder="Staff handover notes" value={notes} onChange={(event) => setNotes(event.target.value)} /><button className="primary-button" disabled={busy || !file || notes.trim().length < 3} onClick={() => void complete()}>Record handover</button></div> : <button className="primary-button" disabled={busy} onClick={() => void submit({ action: "closeAuction", auctionId })}>Close auction</button>}{error && <p className="form-error">{error}</p>}</div>;
}
