import Link from "next/link";
import type { Messages } from "@/lib/i18n";
import { localizedCategoryPath, localizedHomePath } from "@/lib/data";
import { ClockIcon } from "./icons";
import { LocaleSwitcher } from "./locale-switcher";
import { ThemeToggle } from "./theme-toggle";
import { SearchBox } from "./search-box";
import { MobileNav } from "./mobile-nav";

export function SiteHeader({ locale, messages }: { locale: string; messages: Messages }) {
  const m = messages;
  const nav = [
    { label: m.nav.home, href: localizedHomePath(locale) },
    { label: m.nav.world, href: localizedCategoryPath(locale, "world") },
    { label: m.nav.pakistan, href: localizedCategoryPath(locale, "pakistan") },
    { label: m.nav.business, href: localizedCategoryPath(locale, "business") },
    { label: m.nav.technology, href: localizedCategoryPath(locale, "technology") },
    { label: m.nav.science, href: localizedCategoryPath(locale, "science") },
    { label: m.nav.politics, href: localizedCategoryPath(locale, "politics") },
    { label: m.nav.economy, href: localizedCategoryPath(locale, "economy") },
    { label: m.nav.sports, href: localizedCategoryPath(locale, "sports") },
    { label: m.nav.culture, href: localizedCategoryPath(locale, "culture") },
    { label: m.nav.explainers, href: localizedCategoryPath(locale, "explainers") },
    { label: m.nav.trending, href: `${locale === "en" ? "" : `/${locale}`}/trending` },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex items-center justify-between gap-4 py-4">
          <Link href={localizedHomePath(locale)} className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-current text-accent">
              <ClockIcon className="h-6 w-6" />
            </span>
            <span>
              <span className="block font-display text-2xl font-bold leading-none tracking-tight">
                {m.brand.name}
              </span>
              <span className="mt-1 hidden text-xs tracking-wide text-muted sm:block">
                {m.brand.tagline}
              </span>
            </span>
          </Link>

          <div className="hidden items-center gap-3 md:flex">
            <div className="w-56">
              <SearchBox locale={locale} placeholder={m.search.placeholder} />
            </div>
            <LocaleSwitcher current={locale} />
            <ThemeToggle />
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <MobileNav locale={locale} nav={nav} searchPlaceholder={m.search.placeholder} />
          </div>
        </div>

        <nav className="masthead-links relative border-t border-line">
          <ul className="flex items-center gap-5 overflow-x-auto py-2 text-[13px] font-medium text-ink-soft whitespace-nowrap [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {nav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="transition-colors hover:text-accent">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}