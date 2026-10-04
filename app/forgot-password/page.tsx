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
  return <main className="access-page">
    <aside className="access-panel">
      <div>
        <img src="/assets/ffcl_logo_full.png" width={180} height={51} alt="Fewchore" style={{ filter: "brightness(0) invert(1)" }} />
        <h1>Asset Disposal</h1>
        <p>A secure internal platform for the transparent and fair distribution of retired corporate assets to Fewchore employees.</p>
      </div>
    </aside>
    <div className="access-card-wrapper">
      <section className="access-card">
        <div className="access-brand">
          <img src="/assets/ffcl_logo_full.png" alt="Fewchore" />
          <h1>Asset Disposal</h1>
        </div>
        <form className="login-form" onSubmit={requestReset}>
          <label>Company email<input name="email" type="email" required placeholder="you@fewchorefinance.com" /></label>
          {sent && <p className="form-success">Check your email for the reset link.</p>}
          <button className="primary-button full" disabled={busy}>{busy ? "Sending…" : "Send reset link"}</button>
          <Link href="/login">Back to sign in</Link>
        </form>
      </section>
    </div>
  </main>;
}
