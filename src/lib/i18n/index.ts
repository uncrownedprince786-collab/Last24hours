import { en, type Messages } from "./messages/en";
import { ur } from "./messages/ur";
import { ar } from "./messages/ar";
import { es } from "./messages/es";
import { de } from "./messages/de";
import { fr } from "./messages/fr";
import { getLocale, DEFAULT_LOCALE } from "./config";

const dictionaries: Record<string, Messages> = { en, ur, ar, es, de, fr };

export function getMessages(locale: string): Messages {
  return dictionaries[locale] ?? en;
}

export type { Messages };

export function getMessagePath(locale: string): string[] {
  const keys = Object.keys(getMessages(locale)) as (keyof Messages)[];
  return keys;
}

export function localeFontClass(localeCode: string): string {
  const dir = getLocale(localeCode).dir;
  if (localeCode === "ur") return "font-urdu";
  if (localeCode === "ar") return "font-arabic";
  void dir;
  return "";
}

export function timeAgoLabel(locale: string, date: Date | string | number): string {
  const ms = Date.now() - new Date(date).getTime();
  const m = Math.max(0, Math.floor(ms / 60_000));
  if (m < 1) return getMessages(locale).common.now;
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

export function isRtlLocale(locale: string): boolean {
  return getLocale(locale).dir === "rtl";
}

export function localizePath(locale: string, path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return locale === DEFAULT_LOCALE ? p : `/${locale}${p}`;
}