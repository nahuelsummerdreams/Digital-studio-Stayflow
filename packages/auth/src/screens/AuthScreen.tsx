"use client";

import { useState, type FormEvent } from "react";
import { buttonClass, cardClass, errorClass, infoClass, inputClass, labelClass } from "@stayflow/ui";
import { useAccount } from "../account";
import { errorMessage } from "../api";

/** Sign in / create account. One Stayflow account works in every app. */
export function AuthScreen({ productName, tagline }: { productName: string; tagline: string }) {
  const { client } = useAccount();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      if (mode === "signup") {
        const { data, error: err } = await client.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { full_name: fullName.trim() } },
        });
        if (err) throw err;
        if (!data.session) setInfo("Almost there. Check your email and confirm your account, then sign in.");
      } else {
        const { error: err } = await client.auth.signInWithPassword({ email: email.trim(), password });
        if (err) throw err;
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const signup = mode === "signup";
  return (
    <main className="mx-auto max-w-md px-5 pb-16 pt-14">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">{productName}</p>
      <h1 className="mt-3 font-display text-4xl leading-tight">{tagline}</h1>

      <form onSubmit={submit} className={`${cardClass} mt-8 space-y-4`}>
        <h2 className="text-sm font-medium">{signup ? "Create your account" : "Sign in"}</h2>
        {signup && (
          <label className={labelClass}>
            Your name
            <input className={inputClass} value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" required />
          </label>
        )}
        <label className={labelClass}>
          Email
          <input className={inputClass} type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
        </label>
        <label className={labelClass}>
          Password
          <input
            className={inputClass}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={signup ? "new-password" : "current-password"}
            minLength={8}
            required
          />
        </label>
        {error && <p role="alert" className={errorClass}>{error}</p>}
        {info && <p role="status" className={infoClass}>{info}</p>}
        <button className={`${buttonClass} w-full`} disabled={busy}>
          {busy ? "One moment…" : signup ? "Create account" : "Sign in"}
        </button>
      </form>

      <button
        type="button"
        className="mt-4 text-sm text-muted underline-offset-4 hover:underline"
        onClick={() => {
          setMode(signup ? "signin" : "signup");
          setError(null);
          setInfo(null);
        }}
      >
        {signup ? "I already have an account" : "New here? Create an account"}
      </button>
    </main>
  );
}
