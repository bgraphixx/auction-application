"use client";
import { useEffect, useRef, useState } from "react";
import { uploadFile } from "@/lib/upload-client";

type Props = { label: string; initialKey?: string | null; onChange: (key: string | null) => void; onBlockedChange: (blocked: boolean) => void };
export function EvidenceUpload({ label, initialKey, onChange, onBlockedChange }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [key, setKey] = useState(initialKey ?? null);
  const [preview, setPreview] = useState("");
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => { onBlockedChange(false); }, [onBlockedChange]);
  useEffect(() => {
    if (!file || !file.type.startsWith("image/")) { setPreview(""); return; }
    const url = URL.createObjectURL(file); setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  async function upload(next: File) {
    setBusy(true); setError(""); setProgress(0); onBlockedChange(true);
    try {
      const uploaded = await uploadFile(next, setProgress);
      setKey(uploaded); onChange(uploaded); onBlockedChange(false);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not upload. Retry this file."); }
    finally { setBusy(false); }
  }
  function remove() {
    setFile(null); setKey(null); setError(""); setProgress(0); onChange(null); onBlockedChange(false);
    if (input.current) input.current.value = "";
  }
  return <div className="evidence-upload"><label className="upload-target">{label}<input ref={input} type="file" accept="image/jpeg,image/png,application/pdf" disabled={busy} onChange={event => { const next = event.target.files?.[0]; if (next) { setFile(next); void upload(next); } }} /><small>JPG, PNG, or PDF · Up to 10 MB</small></label>{(file || key) && <div className="receipt-selection">{preview && <img src={preview} alt={`${label} preview`} />}<span>{file?.name ?? key?.split("/").pop()}</span>{busy ? <><progress max={100} value={progress} aria-label={`${label} upload progress`} /><small role="status">{progress < 100 ? `Uploading ${progress}%` : "Finishing upload…"}</small></> : error ? <p className="form-error" role="alert">{error}</p> : <a className="text-link" href={`/api/uploads/download?key=${encodeURIComponent(key ?? "")}`} target="_blank" rel="noreferrer">View uploaded file</a>}<div className="action-row">{error && file && <button type="button" className="outline-button" onClick={() => void upload(file)}>Retry upload</button>}<button type="button" className="outline-button" disabled={busy} onClick={remove}>Remove attachment</button></div></div>}</div>;
}
