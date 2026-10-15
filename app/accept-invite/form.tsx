"use client";
import Image from "next/image";
import { FormEvent, useState } from "react";
import { authClient } from "@/lib/auth-client";

export default function AcceptInviteForm({ email, contactEmail, employeeId, token }: { email: string, contactEmail: string | null, employeeId: string, token: string }) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setBusy(true); const form = new FormData(event.currentTarget); const result = await authClient.signUp.email({ name: String(form.get("name")), email: String(form.get("email")), password: String(form.get("password")), inviteToken: token } as any); setBusy(false); setMessage(result.error?.message ?? (contactEmail ? "Account created. Check your email to verify it before signing in." : "Account created. You can now sign in with your staff ID or phone number.")); }
  const [showPassword, setShowPassword] = useState(false);
  return <main className="access-page">
    <aside className="access-panel">
      <div>
        <Image src="/assets/ffcl_logo_full.png" width={180} height={51} alt="Fewchore" priority style={{ filter: "brightness(0) invert(1)" }} />
        <h1>Asset Disposal</h1>
        <p>You have been invited to join the Fewchore Asset Disposal platform. Create your secure account to participate in anonymous asset auctions.</p>
      </div>
    </aside>
    <div className="access-card-wrapper">
      <section className="access-card">
        <div className="access-brand">
          <Image src="/assets/ffcl_logo_full.png" width={225} height={64} alt="Fewchore Finance Company" priority />
          <h1>Asset Disposal</h1>
        </div>
        <form className="login-form" onSubmit={(event) => void submit(event)}>
          <label>Name<input name="name" required /></label>
          {contactEmail ? <label>Invited email<input name="email" type="email" defaultValue={email} required readOnly /></label> : <><p className="muted">Create an account for staff ID {employeeId}. You will sign in with your staff ID or phone number.</p><input name="email" type="hidden" value={email} /></>}
          <label>
            <div style={{ display: "flex", justifyContent: "space-between" }}>Password <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ background: "none", border: 0, color: "var(--bright)", cursor: "pointer", fontWeight: 700 }}>{showPassword ? "Hide" : "Show"}</button></div>
            <input name="password" type={showPassword ? "text" : "password"} minLength={12} required />
          </label>
          <button className="primary-button" disabled={busy}>{busy ? "Creating…" : "Create account"}</button>
          {message && <p role="status">{message}</p>}
        </form>
      </section>
    </div>
  </main>;
}
