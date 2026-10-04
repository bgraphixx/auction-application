"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);
    const form = new FormData(event.currentTarget);
    const { error: authError } = await authClient.signIn.email({
      email: String(form.get("email")), password: String(form.get("password")), callbackURL: `${window.location.origin}/employee/dashboard`,
    });
    setPending(false);
    if (authError) setError(authError.message ?? "We could not sign you in.");
    else router.replace("/employee/dashboard");
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
          <Image src="/assets/ffcl_logo_full.png" width={225} height={64} alt="Fewchore Finance Company" priority />
          <h1>Asset Disposal</h1>
        </div>
        <form className="login-form" onSubmit={signIn}>
          <label>Company email<input name="email" type="email" placeholder="you@fewchorefinance.com" autoComplete="email" required /></label>
          <label>
            <div style={{ display: "flex", justifyContent: "space-between" }}>Password <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ background: "none", border: 0, color: "var(--bright)", cursor: "pointer", fontWeight: 700 }}>{showPassword ? "Hide" : "Show"}</button></div>
            <input name="password" type={showPassword ? "text" : "password"} placeholder="Enter your password" autoComplete="current-password" minLength={12} required />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button className="primary-button full" disabled={pending}>{pending ? "Signing in…" : "Sign in"}</button>
          <Link href="/forgot-password">Forgot your password?</Link>
        </form>
      </section>
    </div>
  </main>;
}
