import { Icon } from "@stayflow/ui";
import { contactHref } from "@/lib/contact";
import { t } from "@/lib/t";

/** "Write to us" button/link. Renders nothing until a WhatsApp number or contact email is configured. */
export function ContactLink({ variant = "ghost", className = "" }: { variant?: "ghost" | "text"; className?: string }) {
  const href = contactHref(t("landing.contact.message"));
  if (!href) return null;
  const external = href.startsWith("http");
  const base = variant === "text" ? "text-sm text-muted transition hover:text-fg" : "inline-flex items-center gap-2 rounded-xl border border-line bg-surface/40 px-6 py-3.5 text-base font-semibold text-fg backdrop-blur transition hover:border-accent/60";
  return (
    <a href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})} className={`${base} ${className}`}>
      {variant === "ghost" && <Icon name="message" className="h-4 w-4 text-accent" />}
      {t("landing.contact.cta")}
    </a>
  );
}
