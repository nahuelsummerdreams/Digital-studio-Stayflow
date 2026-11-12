"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { errorKey, useT } from "@stayflow/i18n";
import { buttonClass, cardClass, errorClass, ghostButtonClass, inputClass, labelClass } from "@stayflow/ui";
import { useAccount } from "../account";
import { auditOverview, inviteTeamMember, removeTeamMember, revokeTeamInvite, setMemberRole, teamOverview, type AuditRow, type InviteRole, type OrgRole, type TeamInvite, type TeamMember } from "../api";

const ROLES: InviteRole[] = ["admin", "member", "viewer"];

/** People who work in the business: invite them, set what they can do, and see what happened. */
export function TeamScreen() {
  const t = useT();
  const { client, org, role, session } = useAccount();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invites, setInvites] = useState<TeamInvite[]>([]);
  const [audit, setAudit] = useState<AuditRow[]>([]);
  const [email, setEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<InviteRole>("member");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const manages = role === "owner" || role === "admin";
  const isOwner = role === "owner";
  const me = session?.user.id;

  const load = useCallback(async () => {
    if (!org || !manages) return;
    try {
      const [o, a] = await Promise.all([teamOverview(client, org.id), auditOverview(client, org.id)]);
      setMembers(o.members);
      setInvites(o.invites);
      setAudit(a);
    } catch (err) {
      setError(t(errorKey(err)));
    }
  }, [client, org, manages, t]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!org) return null;

  const link = (token: string) => `${window.location.origin}/?invite=${token}`;

  async function invite(e: FormEvent) {
    e.preventDefault();
    if (!org) return;
    setBusy(true);
    setError(null);
    try {
      await inviteTeamMember(client, org.id, email, inviteRole);
      setEmail("");
      await load();
    } catch (err) {
      const code = (err as { code?: string } | null)?.code;
      setError(code === "23505" ? t("team.already") : code === "42501" ? t("team.notAllowed") : t(errorKey(err)));
    } finally {
      setBusy(false);
    }
  }

  async function act(fn: () => Promise<void>, confirm?: string) {
    if (confirm && !window.confirm(confirm)) return;
    setError(null);
    try {
      await fn();
      await load();
    } catch (err) {
      setError(t(errorKey(err)));
    }
  }

  async function copy(token: string) {
    try {
      await navigator.clipboard.writeText(link(token));
      setCopied(token);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      window.prompt(t("team.copyManual"), link(token));
    }
  }

  const roleLabel = (r: OrgRole) => t(`team.role_${r}`);
  const ACTIONS = {
    "team.invite": "team.act_team_invite",
    "team.invite_revoked": "team.act_team_invite_revoked",
    "team.joined": "team.act_team_joined",
    "team.role": "team.act_team_role",
    "team.removed": "team.act_team_removed",
    "team.left": "team.act_team_left",
    "booking.deleted": "team.act_booking_deleted",
    "payment.refund": "team.act_payment_refund",
  } as const;
  const ROLE_KEYS = ["owner", "admin", "member", "viewer"] as const;
  const detailLabel = (d: string) => d.split(" → ").map((p) => ((ROLE_KEYS as readonly string[]).includes(p) ? roleLabel(p as OrgRole) : p)).join(" → ");
  const actionLabel = (a: string) => (a in ACTIONS ? t(ACTIONS[a as keyof typeof ACTIONS]) : a);

  return (
    <div className="space-y-6">
      <header>
        {role && <p className="text-xs text-muted">{t("team.yourRole", { role: roleLabel(role) })}</p>}
      </header>

      {!manages ? (
        <p className={`${cardClass} text-sm text-muted`}>{t("team.onlyAdmins")}</p>
      ) : (
        <>
          {error && <p role="alert" className={errorClass}>{error}</p>}
          <div className="grid gap-6 lg:grid-cols-[22rem_1fr] lg:items-start">
            <form onSubmit={invite} className={`${cardClass} space-y-4`}>
              <h2 className="text-sm font-medium">{t("team.inviteTitle")}</h2>
              <label className={labelClass}>
                {t("team.email")}
                <input className={inputClass} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={200} />
              </label>
              <label className={labelClass}>
                {t("team.role")}
                <select className={inputClass} value={inviteRole} onChange={(e) => setInviteRole(e.target.value as InviteRole)}>
                  {ROLES.filter((r) => isOwner || r !== "admin").map((r) => <option key={r} value={r}>{roleLabel(r)}</option>)}
                </select>
              </label>
              <p className="text-xs text-muted">{t(`team.roleHint_${inviteRole}`)}</p>
              <button className={`${buttonClass} w-full`} disabled={busy}>{t("team.invite")}</button>
              <p className="text-xs text-muted">{t("team.noEmailNote")}</p>
            </form>

            <div className="space-y-6">
              <section className={`${cardClass} !p-5`}>
                <h2 className="text-sm font-medium">{t("team.members")}</h2>
                <ul className="mt-3 divide-y divide-line">
                  {members.map((m) => (
                    <li key={m.userId} className="flex flex-wrap items-center gap-3 py-3">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{m.name}{m.userId === me ? ` (${t("team.you")})` : ""}</span>
                        <span className="block truncate text-xs text-muted">{m.email}</span>
                      </span>
                      {m.role === "owner" || !isOwner ? (
                        <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent">{roleLabel(m.role)}</span>
                      ) : (
                        <select aria-label={t("team.role")} className={`${inputClass} !w-auto !py-1.5 text-sm`} value={m.role} onChange={(e) => act(() => setMemberRole(client, org.id, m.userId, e.target.value as InviteRole))}>
                          {ROLES.map((r) => <option key={r} value={r}>{roleLabel(r)}</option>)}
                        </select>
                      )}
                      {m.role !== "owner" && (isOwner || (m.role !== "admin" && manages)) && m.userId !== me && (
                        <button type="button" className={ghostButtonClass} onClick={() => act(() => removeTeamMember(client, org.id, m.userId), t("team.removeConfirm", { name: m.name }))}>{t("team.remove")}</button>
                      )}
                    </li>
                  ))}
                </ul>
              </section>

              {invites.length > 0 && (
                <section className={`${cardClass} !p-5`}>
                  <h2 className="text-sm font-medium">{t("team.pending")}</h2>
                  <ul className="mt-3 divide-y divide-line">
                    {invites.map((i) => (
                      <li key={i.id} className="flex flex-wrap items-center gap-3 py-3">
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">{i.email}</span>
                          <span className="block text-xs text-muted">{roleLabel(i.role)} · {t("team.expires", { date: new Date(i.expiresAt).toLocaleDateString() })}</span>
                        </span>
                        <button type="button" className={buttonClass + " !px-3 !py-2"} onClick={() => copy(i.token)}>{copied === i.token ? t("team.copied") : t("team.copyLink")}</button>
                        <a className={ghostButtonClass} href={`mailto:${i.email}?subject=${encodeURIComponent(t("team.mailSubject", { org: org.name }))}&body=${encodeURIComponent(t("team.mailBody", { org: org.name, link: link(i.token) }))}`}>{t("team.draftMail")}</a>
                        <button type="button" className={ghostButtonClass} onClick={() => act(() => revokeTeamInvite(client, i.id))}>{t("team.revoke")}</button>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <section className={`${cardClass} !p-5`}>
                <h2 className="text-sm font-medium">{t("team.audit")}</h2>
                <p className="mt-1 text-xs text-muted">{t("team.auditHint")}</p>
                {audit.length === 0 ? (
                  <p className="mt-3 text-sm text-muted">{t("team.auditNone")}</p>
                ) : (
                  <ul className="mt-3 space-y-2 text-sm">
                    {audit.map((a) => (
                      <li key={a.id} className="flex flex-wrap gap-x-2">
                        <span className="font-medium">{actionLabel(a.action)}</span>
                        <span className="text-muted">{a.target}{a.detail ? ` · ${detailLabel(a.detail)}` : ""}</span>
                        <span className="ml-auto text-xs text-muted">{a.actor} · {new Date(a.at).toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
