"use client";
import Image from "next/image";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { authClient } from "@/lib/auth-client";

export default function ResetPasswordForm({ token, invalid }: { token: string; invalid: boolean }) {
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const password = String(data.get("password"));
    if (password !== data.get("confirm")) return setError("Passwords do not match.");
    setBusy(true); setError("");
    const result = await authClient.resetPassword({ newPassword: password, token });
    setBusy(false);
    if (result.error) setError(result.error.message ?? "Could not reset password."); else setSaved(true);
  }
  const [showPassword, setShowPassword] = useState(false);
  return <main className="access-page">
    <aside className="access-panel">
      <div>
        <Image src="/assets/ffcl_logo_full.png" width={180} height={51} alt="Fewchore" priority style={{ filter: "brightness(0) invert(1)" }} />
        <h1>Asset Disposal</h1>
        <p>A secure internal platform for the transparent and fair distribution of retired corporate assets to Fewchore employees.</p>
      </div>
    </aside>
    <div className="access-card-wrapper">
      <section className="access-card">
        <div className="access-brand">
          <Image src="/assets/ffcl_logo_full.png" width={225} height={64} alt="Fewchore" />
          <h1>Asset Disposal</h1>
        </div>
        {saved ? <div className="login-form"><p className="form-success">Password changed.</p><Link href="/login">Sign in</Link></div> : !token || invalid ? <div className="login-form"><p className="form-error">This reset link is invalid or expired.</p><Link href="/forgot-password">Request a new link</Link></div> : <form className="login-form" onSubmit={(event) => void submit(event)}>
          <label>
            <div style={{ display: "flex", justifyContent: "space-between" }}>New password <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ background: "none", border: 0, color: "var(--bright)", cursor: "pointer", fontWeight: 700 }}>{showPassword ? "Hide" : "Show"}</button></div>
            <input name="password" type={showPassword ? "text" : "password"} minLength={12} autoComplete="new-password" required />
          </label>
          <label>Confirm password<input name="confirm" type={showPassword ? "text" : "password"} minLength={12} autoComplete="new-password" required /></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="primary-button" disabled={busy}>{busy ? "Saving…" : "Set new password"}</button>
        </form>}
      </section>
    </div>
  </main>;
}
