import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const m = getMessages(locale);
  return buildMetadata({ locale, path: `/about`, title: m.about.title });
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const m = getMessages(locale);
  return (
    <div className="max-w-2xl">
      <div className="mb-6 border-b-2 border-ink pb-2">
        <h1 className="font-display text-3xl font-bold tracking-tight">{m.about.title}</h1>
      </div>
      <div className="prose-story space-y-4">
        <p>{m.about.body}</p>
        <p>{m.meta.description}</p>
        <p>{m.story.attribution}</p>
        <p>{m.brand.tagline}.</p>
      </div>
    </div>
  );
}