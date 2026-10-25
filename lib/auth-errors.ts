import type { AuthError } from "@supabase/supabase-js";

type Lang = "tr" | "en";
type Msg = { tr: string; en: string };

/** Supabase Auth error codes → user-facing messages (TR + EN). */
const BY_CODE: Record<string, Msg> = {
  invalid_credentials: {
    tr: "E-posta veya şifre hatalı. Bilgilerini kontrol edip tekrar dene.",
    en: "Incorrect email or password. Check your details and try again.",
  },
  email_not_confirmed: {
    tr: "E-posta adresin henüz doğrulanmamış. Gelen kutundaki doğrulama bağlantısına tıkla.",
    en: "Your email isn't verified yet. Click the verification link in your inbox.",
  },
  user_already_exists: {
    tr: "Bu e-posta adresiyle zaten bir hesap var. Giriş yapmayı dene.",
    en: "An account with this email already exists. Try signing in instead.",
  },
  email_exists: {
    tr: "Bu e-posta adresiyle zaten bir hesap var. Giriş yapmayı dene.",
    en: "An account with this email already exists. Try signing in instead.",
  },
  weak_password: {
    tr: "Şifren yeterince güçlü değil. En az 6 karakter kullan; harf, rakam ve sembol karıştırmak işe yarar.",
    en: "Your password isn't strong enough. Use at least 6 characters and mix letters, numbers and symbols.",
  },
  email_address_invalid: {
    tr: "Bu e-posta adresi geçerli görünmüyor. Lütfen kontrol et.",
    en: "This email address doesn't look valid. Please check it.",
  },
  validation_failed: {
    tr: "Girdiğin bilgiler geçersiz. E-posta ve şifreyi kontrol et.",
    en: "The details you entered are invalid. Check your email and password.",
  },
  signup_disabled: {
    tr: "Yeni kayıtlar şu an kapalı.",
    en: "New sign-ups are currently disabled.",
  },
  user_banned: {
    tr: "Bu hesap askıya alınmış. Destek ile iletişime geç.",
    en: "This account has been suspended. Please contact support.",
  },
  over_request_rate_limit: {
    tr: "Çok fazla deneme yaptın. Birkaç dakika bekleyip tekrar dene.",
    en: "Too many attempts. Wait a few minutes and try again.",
  },
  over_email_send_rate_limit: {
    tr: "Kısa sürede çok fazla e-posta istendi. Birkaç dakika bekleyip tekrar dene.",
    en: "Too many emails requested in a short time. Wait a few minutes and try again.",
  },
  provider_disabled: {
    tr: "Bu giriş yöntemi henüz etkinleştirilmemiş.",
    en: "This sign-in method isn't enabled yet.",
  },
};

const NETWORK: Msg = {
  tr: "Sunucuya ulaşılamadı. İnternet bağlantını kontrol edip tekrar dene.",
  en: "Couldn't reach the server. Check your connection and try again.",
};

/** Fallback for messages Supabase sends without a stable code. */
function byMessage(message: string): Msg | undefined {
  const m = message.toLowerCase();
  if (m.includes("already registered") || m.includes("already been registered")) return BY_CODE.user_already_exists;
  if (m.includes("invalid login credentials")) return BY_CODE.invalid_credentials;
  if (m.includes("email not confirmed")) return BY_CODE.email_not_confirmed;
  if (m.includes("password should be at least") || m.includes("weak password")) return BY_CODE.weak_password;
  if (m.includes("rate limit")) return BY_CODE.over_request_rate_limit;
  if (m.includes("invalid email") || (m.includes("email address") && m.includes("invalid"))) return BY_CODE.email_address_invalid;
  return undefined;
}

/** Turns a Supabase AuthError into a specific, readable message. */
export function authErrorMessage(error: AuthError, lang: Lang, generic: string): string {
  const code = (error as { code?: string }).code;
  const isNetwork = error.name === "AuthRetryableFetchError" || error.status === 0;

  const hit = (code && BY_CODE[code]) || (isNetwork ? NETWORK : byMessage(error.message));
  if (hit) return hit[lang];

  // Unknown error: keep the generic text but expose the reason so it can be reported.
  const detail = code ?? error.message;
  return detail ? `${generic} (${detail})` : generic;
}
