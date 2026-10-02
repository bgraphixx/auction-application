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

  return <main className="access-page"><section className="access-card"><div className="access-brand"><Image src="/assets/ffcl_logo_full.png" width={225} height={64} alt="Fewchore Finance Company" priority /><h1>Asset Disposal</h1></div><form className="login-form" onSubmit={signIn}><label>Company email<input name="email" type="email" placeholder="you@fewchore.com" autoComplete="email" required /></label><label>Password<input name="password" type="password" placeholder="Enter your password" autoComplete="current-password" minLength={12} required /></label>{error && <p className="form-error">{error}</p>}<button className="primary-button full" disabled={pending}>{pending ? "Signing in…" : "Sign in"}</button><Link href="/forgot-password">Forgot your password?</Link></form></section></main>;
}
