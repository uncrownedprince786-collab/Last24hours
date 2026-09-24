import Link from "next/link";
import type { Messages } from "@/lib/i18n";
import { localizedHomePath, localizedCategoryPath } from "@/lib/data";

export function Footer({ locale, messages }: { locale: string; messages: Messages }) {
  const m = messages;
  const loc = (p: string) => (locale === "en" ? p : `/${locale}${p}`);
  return (
    <footer className="mt-16 border-t border-line bg-paper-deep">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <p className="font-display text-xl font-bold">{m.brand.name}</p>
            <p className="mt-1 text-sm text-muted">{m.brand.tagline}</p>
            <p className="mt-4 text-sm leading-relaxed text-muted">{m.about.body}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted">{m.brand.name}</p>
            <ul className="mt-3 space-y-2 text-sm text-ink-soft">
              <li><Link href={localizedHomePath(locale)}>{m.nav.home}</Link></li>
              <li><Link href={localizedCategoryPath(locale, "world")}>{m.nav.world}</Link></li>
              <li><Link href={localizedCategoryPath(locale, "pakistan")}>{m.nav.pakistan}</Link></li>
              <li><Link href={loc("/trending")}>{m.footer.trending}</Link></li>
              <li><Link href={localizedCategoryPath(locale, "explainers")}>{m.footer.explainers}</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted">{m.footer.sources}</p>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              {m.story.attribution}
            </p>
            <p className="mt-4 text-xs text-muted">
              {m.common.allRightsReserved}
            </p>
          </div>
        </div>
        <p className="mt-10 border-t border-line pt-5 text-xs text-muted">
          © {new Date().getFullYear()} {m.brand.name} · {loc("/about") && (
            <Link href={loc("/about")} className="underline">{m.footer.about}</Link>
          )}
        </p>
      </div>
    </footer>
  );
}