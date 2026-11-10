import { translate } from "@stayflow/i18n/core";

export const metadata = { title: "Stayflow Guest", robots: { index: false, follow: false } };

export default function GuideNotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 text-center">
      <h1 className="font-display text-3xl leading-tight">{translate("es", "guide.notFoundTitle")}</h1>
      <p className="mt-4 leading-relaxed text-muted">{translate("es", "guide.notFoundBody")}</p>
    </main>
  );
}
