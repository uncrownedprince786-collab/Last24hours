export type LocaleDef = {
  code: string;
  name: string;
  dir: "ltr" | "rtl";
  enabled: boolean;
};

export const LOCALES: LocaleDef[] = [
  { code: "en", name: "English", dir: "ltr", enabled: true },
  { code: "ur", name: "اردو", dir: "rtl", enabled: true },
  { code: "ar", name: "العربية", dir: "rtl", enabled: true },
  { code: "es", name: "Español", dir: "ltr", enabled: true },
  { code: "de", name: "Deutsch", dir: "ltr", enabled: true },
  { code: "fr", name: "Français", dir: "ltr", enabled: true },
];

export const DEFAULT_LOCALE = "en";

export const localeCodes = LOCALES.map((l) => l.code);
export const enabledLocales = LOCALES.filter((l) => l.enabled);

export function isLocale(code: string | undefined): code is string {
  return !!code && LOCALES.some((l) => l.code === code);
}

export function getLocale(code: string): LocaleDef {
  return LOCALES.find((l) => l.code === code) ?? LOCALES[0];
}