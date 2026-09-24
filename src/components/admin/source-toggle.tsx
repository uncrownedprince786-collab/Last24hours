"use client";

import { useState } from "react";

export function SourceToggle({ id, enabled }: { id: number; enabled: boolean }) {
  const [value, setValue] = useState(enabled);
  const [busy, setBusy] = useState(false);

  const toggle = async () => {
    setBusy(true);
    const res = await fetch("/api/admin/sources", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, enabled: !value }),
    });
    setBusy(false);
    if (res.ok) setValue((v) => !v);
  };

  return (
    <button
      type="button"
      disabled={busy}
      onClick={toggle}
      className={`shrink-0 rounded px-3 py-1 text-sm font-semibold disabled:opacity-40 ${
        value ? "bg-green-600/10 text-green-700" : "bg-red-600/10 text-red-700"
      }`}
    >
      {value ? "Enabled" : "Disabled"}
    </button>
  );
}