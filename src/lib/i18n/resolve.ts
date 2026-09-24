import { LOCALES, DEFAULT_LOCALE } from "./config";

const langHints: Record<string, string[]> = {
  PK: ["ur"], SA: ["ar"], AE: ["ar"], EG: ["ar"], QA: ["ar"], KW: ["ar"],
  BH: ["ar"], OM: ["ar"], JO: ["ar"], IQ: ["ar"], YE: ["ar"], SY: ["ar"],
  LB: ["ar"], MA: ["ar"], DZ: ["ar"], TN: ["ar"], LY: ["ar"], SD: ["ar"],
  ES: ["es"], MX: ["es"], AR: ["es"], CO: ["es"], CL: ["es"], PE: ["es"],
  VE: ["es"], EC: ["es"], GT: ["es"], CU: ["es"], BO: ["es"], UY: ["es"],
  PY: ["es"], DO: ["es"], HN: ["es"], SV: ["es"], NI: ["es"], CR: ["es"],
  DE: ["de"], AT: ["de"], CH: ["de"], FR: ["fr"], BE: ["fr"], CA: ["fr"],
  IN: [], AF: ["ur"],
};

function parseAcceptLanguage(header: string): string[] {
  if (!header) return [];
  return header
    .split(",")
    .map((part) => {
      const [lang, ...params] = part.trim().split(";");
      let q = 1;
      for (const p of params) {
        const m = p.trim().match(/^q=([0-9.]+)$/);
        if (m) q = parseFloat(m[1]);
      }
      return { lang: lang.trim(), q };
    })
    .sort((a, b) => b.q - a.q)
    .map((x) => x.lang.toLowerCase());
}

export function resolveLocale(opts: {
  preferred?: string | null;
  acceptLanguage?: string | null;
  country?: string | null;
}): string {
  if (opts.preferred && LOCALES.some((l) => l.code === opts.preferred)) return opts.preferred;
  const langs = parseAcceptLanguage(opts.acceptLanguage ?? "");
  for (const lang of langs) {
    if (lang === "*") continue;
    const code = lang.slice(0, 2);
    if (LOCALES.some((l) => l.code === code)) return code;
  }
  const country = (opts.country ?? "").toUpperCase();
  const hints = langHints[country];
  if (hints && hints.length > 0) {
    for (const h of hints) {
      if (LOCALES.some((l) => l.code === h)) return h;
    }
  }
  return DEFAULT_LOCALE;
}