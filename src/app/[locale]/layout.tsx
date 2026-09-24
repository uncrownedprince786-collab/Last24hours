import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n";
import { SiteHeader } from "@/components/site-header";
import { Footer } from "@/components/footer";
import { localizedHomePath } from "@/lib/data";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const m = getMessages(locale);
  const base = process.env.SITE_URL ?? "https://last24hours.vercel.app";
  return {
    title: `${m.brand.name} — ${m.brand.tagline}`,
    description: m.meta.description,
    metadataBase: new URL(base),
    alternates: {
      canonical: `${base}/${locale === "en" ? "" : locale}/`.replace(/([^:])\/+/g, "$1/"),
      languages: {
        en: `${base}/en/`,
        ur: `${base}/ur/`,
        ar: `${base}/ar/`,
        es: `${base}/es/`,
        de: `${base}/de/`,
        fr: `${base}/fr/`,
        "x-default": `${base}/en/`,
      },
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const messages = getMessages(locale);
  void localizedHomePath;
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader locale={locale} messages={messages} />
      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 pt-8 pb-4">
        {children}
      </main>
      <Footer locale={locale} messages={messages} />
    </div>
  );
}