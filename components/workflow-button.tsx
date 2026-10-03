"use client";

import { useState } from "react";
import { runWorkflow } from "@/lib/workflow-client";
import { useRouter } from "next/navigation";

export function WorkflowButton({ payload, children, prompt }: { payload: Record<string, unknown>; children: React.ReactNode; prompt?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit() {
    const reason = prompt ? window.prompt(prompt) : undefined;
    if (prompt && reason === null) return;
    setBusy(true); setError("");
    try {
      await runWorkflow({ ...payload, ...(reason ? { reason, resolution: reason } : {}) });
      router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Action failed. Please retry."); }
    finally { setBusy(false); }

  }
  return <span className="workflow-action"><button className="outline-button" onClick={submit} disabled={busy}>{busy ? "Working…" : children}</button>{error && <small role="alert">{error}</small>}</span>;
}
