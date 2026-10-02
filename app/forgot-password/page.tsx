"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { authClient } from "@/lib/auth-client";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  async function requestReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true);
    const email = String(new FormData(event.currentTarget).get("email"));
    await authClient.requestPasswordReset({ email, redirectTo: `${window.location.origin}/reset-password` });
    setBusy(false); setSent(true);
  }
  return <main className="access-page"><section className="access-card"><div className="access-brand"><img src="/assets/ffcl_logo_full.png" alt="Fewchore" /><h1>Asset Disposal</h1></div><form className="login-form" onSubmit={requestReset}><label>Company email<input name="email" type="email" required placeholder="you@fewchore.com" /></label>{sent && <p className="form-success">Check your email for the reset link.</p>}<button className="primary-button full" disabled={busy}>{busy ? "Sending…" : "Send reset link"}</button><Link href="/login">Back to sign in</Link></form></section></main>;
}
