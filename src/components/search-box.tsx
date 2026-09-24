"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SearchIcon } from "./icons";

type Suggestion = { slug: string; headline: string; url: string };

export function SearchBox({ locale, placeholder }: { locale: string; placeholder: string }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const router = useRouter();
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const down = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", down);
    return () => document.removeEventListener("mousedown", down);
  }, []);

  useEffect(() => {
    if (q.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const ac = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&limit=6`, { signal: ac.signal });
        if (res.ok) {
          const data = (await res.json()) as { suggestions: Suggestion[] };
          setSuggestions(data.suggestions);
          setOpen(true);
        }
      } catch {
        /* abort / network */
      }
    }, 250);
    return () => {
      clearTimeout(t);
      ac.abort();
    };
  }, [q]);

  const submit = () => {
    if (q.trim()) {
      router.push(`/${locale}/search?q=${encodeURIComponent(q.trim())}`);
      setOpen(false);
    }
  };

  return (
    <div ref={boxRef} className="relative">
      <div className="flex items-center gap-2 rounded-full border border-line bg-card px-3 py-1.5 focus-within:border-accent">
        <SearchIcon className="h-4 w-4 shrink-0 text-muted" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          onFocus={() => q.trim().length >= 2 && setOpen(true)}
          placeholder={placeholder}
          aria-label={placeholder}
          className="w-full min-w-0 bg-transparent text-sm text-ink outline-none placeholder:text-muted"
        />
      </div>
      {open && suggestions.length > 0 && (
        <ul className="absolute z-40 mt-1 w-full overflow-hidden rounded-lg border border-line bg-card shadow-lg" role="listbox">
          {suggestions.map((s) => (
            <li key={s.url}>
              <button
                type="button"
                onClick={() => router.push(`/${locale}${s.url}`)}
                className="block w-full px-3 py-2 text-left text-sm text-ink hover:bg-paper-deep"
              >
                {s.headline}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}