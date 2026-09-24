"use client";

import { useState } from "react";
import Link from "next/link";
import { MenuIcon, XIcon } from "./icons";
import { SearchBox } from "./search-box";
import { LocaleSwitcher } from "./locale-switcher";
import { ThemeToggle } from "./theme-toggle";

export function MobileNav({
  locale,
  nav,
  searchPlaceholder,
}: {
  locale: string;
  nav: { label: string; href: string }[];
  searchPlaceholder: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink"
      >
        {open ? <XIcon className="h-4 w-4" /> : <MenuIcon className="h-4 w-4" />}
      </button>
      {open && (
        <div className="absolute inset-x-0 top-full z-50 border-b border-line bg-paper px-4 py-4 shadow-lg">
          <SearchBox locale={locale} placeholder={searchPlaceholder} />
          <nav className="mt-4 grid grid-cols-2 gap-1">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded px-2 py-2 text-sm text-ink hover:bg-paper-deep"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-4 flex items-center gap-3 border-t border-line pt-4">
            <LocaleSwitcher current={locale} />
            <ThemeToggle />
          </div>
        </div>
      )}
    </div>
  );
}