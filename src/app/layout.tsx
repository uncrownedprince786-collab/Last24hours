import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { getLocale, DEFAULT_LOCALE } from "@/lib/i18n/config";
import "./globals.css";

export const metadata: Metadata = {
  title: "Last24hours",
  description: "What happened in the last 24 hours.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf7f2" },
    { media: "(prefers-color-scheme: dark)", color: "#101113" },
  ],
};

const themeScript = `(function(){try{var t=localStorage.getItem('l24-theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})();`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const h = await headers();
  const localeCode = h.get("x-locale") ?? DEFAULT_LOCALE;
  const locale = getLocale(localeCode);
  const skipLabels: Record<string, string> = {
    en: "Skip to content",
    ur: "مواد پر جائیں",
    ar: "تخطي إلى المحتوى",
    es: "Saltar al contenido",
    de: "Zum Inhalt springen",
    fr: "Aller au contenu",
  };

  return (
    <html lang={locale.code} dir={locale.dir} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <a className="skip-link" href="#main">
          {skipLabels[locale.code] ?? "Skip to content"}
        </a>
        {children}
      </body>
    </html>
  );
}