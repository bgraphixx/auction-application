"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function WorkflowButton({ payload, children, prompt }: { payload: Record<string, unknown>; children: React.ReactNode; prompt?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit() {
    const reason = prompt ? window.prompt(prompt) : undefined;
    if (prompt && reason === null) return;
    setBusy(true); setError("");
    const response = await fetch("/api/workflow", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payload, ...(reason ? { reason, resolution: reason } : {}) }) });
    const result = await response.json(); setBusy(false);
    if (!response.ok) { setError(result.error ?? "Action failed"); return; }
    router.refresh();
  }
  return <span className="workflow-action"><button className="outline-button" onClick={submit} disabled={busy}>{busy ? "Working…" : children}</button>{error && <small>{error}</small>}</span>;
}
