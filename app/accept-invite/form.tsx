"use client";
import Image from "next/image";
import { FormEvent, useState } from "react";
import { authClient } from "@/lib/auth-client";

export default function AcceptInviteForm({ email }: { email: string }) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setBusy(true); const form = new FormData(event.currentTarget); const result = await authClient.signUp.email({ name: String(form.get("name")), email: String(form.get("email")), password: String(form.get("password")) }); setBusy(false); setMessage(result.error?.message ?? "Account created. Check your email to verify it before signing in."); }
  return <main className="access-page"><section className="access-card"><div className="access-brand"><Image src="/assets/ffcl_logo_full.png" width={225} height={64} alt="Fewchore" /><h1>Asset Disposal</h1></div><form className="login-form" onSubmit={(event) => void submit(event)}><label>Name<input name="name" required /></label><label>Invited email<input name="email" type="email" defaultValue={email} required /></label><label>Password<input name="password" type="password" minLength={12} required /></label><button className="primary-button" disabled={busy}>{busy ? "Creating…" : "Create account"}</button>{message && <p role="status">{message}</p>}</form></section></main>;
}
