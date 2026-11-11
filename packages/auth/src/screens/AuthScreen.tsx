"use client";

import { useState, type FormEvent } from "react";
import { errorKey, useT } from "@stayflow/i18n";
import { BrandMark, StudioSeal, buttonClass, cardClass, errorClass, infoClass, inputClass, labelClass } from "@stayflow/ui";
import { useAccount } from "../account";

/** Sign in / create account. One Stayflow account works in every app. */
export function AuthScreen({ productName, tagline }: { productName: string; tagline: string }) {
  const t = useT();
  const { client } = useAccount();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
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
      if (mode === "forgot") {
        const { error: err } = await client.auth.resetPasswordForEmail(email.trim(), { redirectTo: window.location.origin });
        if (err) throw err;
        setInfo(t("auth.resetSent"));
      } else if (mode === "signup") {
        const { data, error: err } = await client.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { full_name: fullName.trim() } },
        });
        if (err) throw err;
        if (!data.session) setInfo(t("auth.confirmEmail"));
      } else {
        const { error: err } = await client.auth.signInWithPassword({ email: email.trim(), password });
        if (err) throw err;
      }
    } catch (err) {
      setError(t(errorKey(err)));
    } finally {
      setBusy(false);
    }
  }

  const signup = mode === "signup";
  const forgot = mode === "forgot";
  return (
    <main className="anim-stagger mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-14">
      <div className="flex items-center gap-3">
        <BrandMark className="h-11 w-11" />
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">{productName}</p>
      </div>
      <h1 className="mt-6 font-display text-[2.5rem] leading-[1.08]">{tagline}</h1>

      <form onSubmit={submit} className={`${cardClass} fx-hero mt-8 space-y-4`}>
        <h2 className="text-sm font-medium">{forgot ? t("auth.forgotTitle") : signup ? t("auth.signUpTitle") : t("auth.signInTitle")}</h2>
        {signup && (
          <label className={labelClass}>
            {t("auth.name")}
            <input className={inputClass} value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" required />
          </label>
        )}
        <label className={labelClass}>
          {t("auth.email")}
          <input className={inputClass} type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
        </label>
        {!forgot && <label className={labelClass}>
          {t("auth.password")}
          <input
            className={inputClass}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={signup ? "new-password" : "current-password"}
            minLength={8}
            required
          />
        </label>}
        {error && <p role="alert" className={errorClass}>{error}</p>}
        {info && <p role="status" className={infoClass}>{info}</p>}
        <button className={`${buttonClass} w-full`} disabled={busy}>
          {busy ? t("auth.busy") : forgot ? t("auth.sendReset") : signup ? t("auth.signUp") : t("auth.signIn")}
        </button>
      </form>

      {mode === "signin" && (
        <button type="button" className="mt-4 block text-sm text-muted underline-offset-4 hover:underline" onClick={() => { setMode("forgot"); setError(null); setInfo(null); }}>
          {t("auth.forgot")}
        </button>
      )}
      <button
        type="button"
        className="mt-3 text-sm text-muted underline-offset-4 hover:underline"
        onClick={() => {
          setMode(signup || forgot ? "signin" : "signup");
          setError(null);
          setInfo(null);
        }}
      >
        {signup || forgot ? t("auth.haveAccount") : t("auth.newHere")}
      </button>

      <StudioSeal className="mt-14" logoClassName="h-10 w-auto text-fg" />
    </main>
  );
}
