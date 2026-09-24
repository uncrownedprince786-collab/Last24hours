"use client";

import { useState } from "react";

export function TranslateButton({ eventId }: { eventId: number }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const run = async () => {
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/admin/translate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ eventId }),
    });
    setBusy(false);
    if (res.ok) {
      const data = (await res.json()) as { localesDone?: number };
      setMsg(`Translated ${data.localesDone ?? 0} locales`);
    } else {
      setMsg("Failed");
    }
  };

  return (
    <div className="flex shrink-0 items-center gap-2">
      {msg && <span className="text-xs text-muted">{msg}</span>}
      <button
        type="button"
        onClick={run}
        disabled={busy}
        className="rounded border border-line px-3 py-1 text-sm disabled:opacity-40 hover:border-accent"
      >
        {busy ? "Translating…" : "Translate"}
      </button>
    </div>
  );
}