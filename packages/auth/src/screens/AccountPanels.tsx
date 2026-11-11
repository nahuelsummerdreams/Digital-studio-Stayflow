"use client";

import { useEffect, useState, type FormEvent } from "react";
import { errorKey, useT } from "@stayflow/i18n";
import { BrandMark, buttonClass, cardClass, errorClass, ghostButtonClass, infoClass, inputClass, labelClass } from "@stayflow/ui";
import { useAccount } from "../account";

function PasswordForm({ onDone }: { onDone: () => void }) {
  const t = useT();
  const { client } = useAccount();
  const [pw, setPw] = useState("");
  const [again, setAgain] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (pw.length < 8) return setError(t("account.pwShort"));
    if (pw !== again) return setError(t("account.pwMismatch"));
    setBusy(true);
    try {
      const { error: err } = await client.auth.updateUser({ password: pw });
      if (err) throw err;
      setDone(true);
      setPw("");
      setAgain("");
      onDone();
    } catch (err) {
      setError(t(errorKey(err)));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <label className={labelClass}>
        {t("account.newPassword")}
        <input className={inputClass} type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} required />
      </label>
      <label className={labelClass}>
        {t("account.repeatPassword")}
        <input className={inputClass} type="password" autoComplete="new-password" value={again} onChange={(e) => setAgain(e.target.value)} required />
      </label>
      {error && <p role="alert" className={errorClass}>{error}</p>}
      {done && <p role="status" className={infoClass}>{t("account.pwDone")}</p>}
      <button className={buttonClass} disabled={busy}>{busy ? t("auth.busy") : t("account.changePassword")}</button>
    </form>
  );
}

/** Shown when the person comes back from the "forgot my password" email: choose a new one, then continue. */
export function ResetPasswordScreen() {
  const t = useT();
  const { endRecovery } = useAccount();
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-14">
      <BrandMark className="h-11 w-11" />
      <h1 className="mt-6 font-display text-3xl leading-tight">{t("account.resetTitle")}</h1>
      <div className={`${cardClass} fx-hero mt-8`}>
        <PasswordForm onDone={() => setTimeout(endRecovery, 900)} />
      </div>
      <button type="button" className="mt-4 text-sm text-muted underline-offset-4 hover:underline" onClick={endRecovery}>{t("account.skip")}</button>
    </main>
  );
}

/** "My account": change password, and delete the account for good. Opened from the user menu. */
export function AccountDialog({ onClose }: { onClose: () => void }) {
  const t = useT();
  const { client, session, signOut } = useAccount();
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const word = t("account.deleteWord");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function remove() {
    setError(null);
    setBusy(true);
    try {
      const { error: err } = await client.rpc("delete_my_account");
      if (err) {
        setError(err.message.includes("shared_business") ? t("account.deleteShared") : t(errorKey(err)));
        return;
      }
      await signOut();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-bg/80 p-5 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={t("account.title")} onClick={onClose}>
      <div className="fx-card mt-10 w-full max-w-lg space-y-8 rounded-3xl p-6 sm:p-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl">{t("account.title")}</h2>
            <p className="mt-1 text-sm text-muted">{session?.user.email}</p>
          </div>
          <button type="button" className={ghostButtonClass} onClick={onClose}>{t("account.close")}</button>
        </div>

        <section>
          <h3 className="mb-3 text-sm font-semibold">{t("account.passwordTitle")}</h3>
          <PasswordForm onDone={() => undefined} />
        </section>

        <section className="rounded-2xl border border-danger/30 bg-danger/5 p-4">
          <h3 className="text-sm font-semibold text-danger">{t("account.deleteTitle")}</h3>
          <p className="mt-1.5 text-sm text-muted">{t("account.deleteBody")}</p>
          <label className={`${labelClass} mt-3`}>
            {t("account.deleteType", { word })}
            <input className={inputClass} value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="off" />
          </label>
          {error && <p role="alert" className={`${errorClass} mt-3`}>{error}</p>}
          <button type="button" className="mt-3 rounded-xl border border-danger/50 px-4 py-2.5 text-sm font-semibold text-danger transition hover:bg-danger/10 disabled:opacity-40" disabled={busy || confirm.trim().toUpperCase() !== word} onClick={remove}>
            {busy ? t("auth.busy") : t("account.deleteButton")}
          </button>
        </section>
      </div>
    </div>
  );
}
