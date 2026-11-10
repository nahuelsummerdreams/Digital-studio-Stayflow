import type { MessageKey } from "./core";

interface ErrorLike {
  code?: unknown;
  message?: unknown;
  name?: unknown;
}

const BY_CODE: Record<string, MessageKey> = {
  invalid_credentials: "errors.invalidCredentials",
  user_already_exists: "errors.userExists",
  email_exists: "errors.userExists",
  weak_password: "errors.weakPassword",
  email_not_confirmed: "errors.emailNotConfirmed",
  over_email_send_rate_limit: "errors.rateLimit",
  over_request_rate_limit: "errors.rateLimit",
  "42501": "errors.noPermission", // Postgres insufficient_privilege (RLS, license gate)
  "23P01": "errors.bookingOverlap", // Postgres exclusion_violation: two stays on the same dates
};

/** Maps any thrown value (Supabase auth/PostgREST/network) to a translatable message key. */
export function errorKey(e: unknown): MessageKey {
  const err = (e && typeof e === "object" ? e : {}) as ErrorLike;
  const code = typeof err.code === "string" ? err.code : "";
  const message = typeof err.message === "string" ? err.message : "";
  if (code && BY_CODE[code]) return BY_CODE[code];
  if (message === "photo-type") return "errors.photoType";
  if (message === "photo-size") return "errors.photoSize";
  if (/invalid login credentials/i.test(message)) return "errors.invalidCredentials";
  if (/already registered/i.test(message)) return "errors.userExists";
  if (/row-level security|permission denied|only owners and admins/i.test(message)) return "errors.noPermission";
  if (/failed to fetch|network|load failed/i.test(message) || /fetch/i.test(String(err.name ?? ""))) {
    return "errors.network";
  }
  return "errors.generic";
}
