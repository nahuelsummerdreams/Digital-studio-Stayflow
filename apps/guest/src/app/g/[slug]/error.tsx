"use client";

import { useT } from "@stayflow/i18n";
import { buttonClass } from "@stayflow/ui";

/** Shown to a guest when the guide cannot be loaded (connection problem), not when it does not exist. */
export default function GuideError({ reset }: { error: Error; reset: () => void }) {
  const t = useT();
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-5 text-center">
      <h1 className="font-display text-3xl leading-tight">{t("guide.errorTitle")}</h1>
      <p className="mt-4 leading-relaxed text-muted">{t("guide.errorBody")}</p>
      <button type="button" onClick={reset} className={`${buttonClass} mt-8`}>
        {t("guide.retry")}
      </button>
    </main>
  );
}
