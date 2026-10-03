"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { runWorkflow } from "@/lib/workflow-client";

const outcomes = { DISMISS: "Dismiss dispute", CORRECT: "Correct listing description", EXTEND: "Extend auction deadline", CANCEL: "Cancel auction", ESCALATE: "Escalate to management", REFUND: "Request Finance refund", REVERSE: "Reverse winner approval" };
export default function DisputeActions({ disputeId }: { disputeId: string }) {
  const router = useRouter();
  const [outcome, setOutcome] = useState<keyof typeof outcomes>("DISMISS");
  const [resolution, setResolution] = useState("");
  const [extensionAt, setExtensionAt] = useState("");
  const [correction, setCorrection] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setSuccess("");
    try {
      const extension = outcome === "EXTEND" ? new Date(extensionAt) : null;
      if (extension && !Number.isFinite(extension.getTime())) throw new Error("Choose a valid new deadline.");
      await runWorkflow({ action: "resolveDispute", disputeId, outcome, resolution: resolution.trim(), extensionAt: extension?.toISOString(), correction: outcome === "CORRECT" ? correction.trim() : undefined });
      setSuccess("Outcome recorded."); router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not record outcome. Please retry."); }
    finally { setBusy(false); }
  }
  return <form onSubmit={(event) => void submit(event)}><fieldset className="decision-form" disabled={busy}><legend>Record a decision</legend><label>Outcome<select value={outcome} onChange={(event) => setOutcome(event.target.value as keyof typeof outcomes)}>{Object.entries(outcomes).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>{outcome === "EXTEND" && <label>New deadline (your local time)<input type="datetime-local" required value={extensionAt} onChange={(event) => setExtensionAt(event.target.value)} /></label>}{outcome === "CORRECT" && <label>Corrected listing description<textarea required minLength={10} maxLength={4000} value={correction} onChange={(event) => setCorrection(event.target.value)} /></label>}<label>Decision and reason<textarea required minLength={3} value={resolution} onChange={(event) => setResolution(event.target.value)} /></label><p className="muted">The decision is added to the audit trail and sent to the employee.</p><button className="primary-button" disabled={busy}>{busy ? "Recording…" : outcomes[outcome]}</button></fieldset>{error && <p className="form-error" role="alert">{error}</p>}{success && <p role="status">{success}</p>}</form>;
}
