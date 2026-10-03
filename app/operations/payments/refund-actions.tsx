"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { uploadFile } from "@/lib/upload-client";

export default function RefundActions({ auctionId }: { auctionId: string }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [verified, setVerified] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function confirm() { if (!file) return; setBusy(true); setError(""); try { const evidenceUrl = await uploadFile(file); const response = await fetch("/api/workflow", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "confirmRefund", auctionId, evidenceUrl, bankVerified: verified }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error ?? "Refund confirmation failed."); router.refresh(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Refund confirmation failed."); } finally { setBusy(false); } }
  return <div className="review-form"><label>Bank refund evidence<input type="file" accept="image/jpeg,image/png,application/pdf" onChange={(event) => setFile(event.target.files?.[0] ?? null)} /></label><label><input type="checkbox" checked={verified} onChange={(event) => setVerified(event.target.checked)} /> I verified the refund against bank records</label><button className="primary-button" disabled={!file || !verified || busy} onClick={() => void confirm()}>Confirm refund</button>{error && <p className="form-error">{error}</p>}</div>;
}
