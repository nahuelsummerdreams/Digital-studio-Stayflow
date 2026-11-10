"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { useT } from "@stayflow/i18n";
import { ghostButtonClass } from "@stayflow/ui";

function download(href: string, filename: string) {
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/** QR for a guide link. Always black on white with a quiet zone: that is what scanners read best. */
export function QrCode({ value, filename }: { value: string; filename: string }) {
  const t = useT();
  const [svg, setSvg] = useState("");

  useEffect(() => {
    let alive = true;
    QRCode.toString(value, { type: "svg", margin: 2, errorCorrectionLevel: "M", color: { dark: "#000000", light: "#ffffff" } })
      .then((s) => alive && setSvg(s))
      .catch(() => alive && setSvg(""));
    return () => {
      alive = false;
    };
  }, [value]);

  async function downloadPng() {
    const url = await QRCode.toDataURL(value, { width: 1024, margin: 2, errorCorrectionLevel: "M" });
    download(url, `${filename}.png`);
  }

  function downloadSvg() {
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    download(url, `${filename}.svg`);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
      <div
        role="img"
        aria-label="QR"
        data-testid="qr"
        className="h-40 w-40 shrink-0 overflow-hidden rounded-xl bg-white [&>svg]:h-full [&>svg]:w-full"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <div className="space-y-2">
        <p className="text-sm text-muted">{t("guest.qrHint")}</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={ghostButtonClass} onClick={downloadPng} disabled={!svg}>
            {t("guest.downloadPng")}
          </button>
          <button type="button" className={ghostButtonClass} onClick={downloadSvg} disabled={!svg}>
            {t("guest.downloadSvg")}
          </button>
        </div>
      </div>
    </div>
  );
}
