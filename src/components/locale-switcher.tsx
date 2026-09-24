"use client";

import { usePathname, useRouter } from "next/navigation";
import { LOCALES } from "@/lib/i18n/config";
import { GlobeIcon } from "./icons";

export function LocaleSwitcher({ current }: { current: string }) {
  const pathname = usePathname();
  const router = useRouter();

  const segments = pathname.split("/").filter(Boolean);
  const rest = (segments[0] === current ? segments.slice(1) : segments).join("/");

  const change = (code: string) => {
    if (code === current) return;
    const href = `/${code}${rest ? `/${rest}` : "/"}`;
    router.push(href);
  };

  return (
    <div className="flex items-center gap-1.5">
      <GlobeIcon className="h-4 w-4 text-muted" />
      <label className="sr-only" htmlFor="locale-select">
        Language
      </label>
      <select
        id="locale-select"
        value={current}
        onChange={(e) => change(e.target.value)}
        className="cursor-pointer rounded border border-line bg-transparent px-2 py-1 text-sm text-ink outline-none hover:border-accent"
      >
        {LOCALES.filter((l) => l.enabled).map((l) => (
          <option key={l.code} value={l.code}>
            {l.name}
          </option>
        ))}
      </select>
    </div>
  );
}