"use client";

import { useState } from "react";

type Row = {
  id: number;
  slug: string;
  headline: string;
  category: string | null;
  status: string;
  sourceCount: number;
  lastUpdated: string;
};

export function EventRow({ row, summary }: { row: Row; summary?: string | null }) {
  const [status, setStatus] = useState(row.status);
  const [editing, setEditing] = useState(false);
  const [headline, setHeadline] = useState(row.headline);
  const [body, setBody] = useState(summary ?? "");
  const [busy, setBusy] = useState(false);

  const act = async (action: string, extra?: Record<string, unknown>) => {
    setBusy(true);
    const res = await fetch("/api/admin/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: row.id, action, ...extra }),
    });
    setBusy(false);
    if (res.ok) {
      if (action === "publish") setStatus("published");
      if (action === "hide") setStatus("hidden");
      if (action === "reject") setStatus("rejected");
      if (action === "pending") setStatus("pending");
    } else {
      alert("Action failed");
    }
  };

  const save = async () => {
    await act("edit", { headline, summary: body });
    setEditing(false);
  };

  return (
    <div className="rounded-xl border border-line bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display font-semibold">{headline}</p>
          <p className="mt-0.5 text-xs text-muted">
            {row.category ?? "—"} · {row.sourceCount} sources · /{row.slug}
          </p>
        </div>
        <span className={`shrink-0 rounded px-2 py-0.5 text-xs font-semibold ${
          status === "published" ? "bg-green-600/10 text-green-700" :
          status === "hidden" ? "bg-red-600/10 text-red-700" :
          "bg-paper-deep text-muted"
        }`}>{status}</span>
      </div>

      {editing && (
        <div className="mt-3 space-y-2">
          <input
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            className="w-full rounded border border-line bg-transparent px-2 py-1.5 text-sm outline-none focus:border-accent"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            className="w-full rounded border border-line bg-transparent px-2 py-1.5 text-sm outline-none focus:border-accent"
          />
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2 text-sm">
        {status !== "published" && (
          <button disabled={busy} onClick={() => act("publish")} className="rounded bg-ink px-3 py-1 font-semibold text-paper disabled:opacity-40">
            Publish
          </button>
        )}
        <button disabled={busy} onClick={() => act("hide")} className="rounded border border-line px-3 py-1 disabled:opacity-40">
          Hide
        </button>
        <button disabled={busy} onClick={() => act("reject")} className="rounded border border-line px-3 py-1 disabled:opacity-40">
          Reject
        </button>
        <button disabled={busy} onClick={() => setEditing((v) => !v)} className="rounded border border-line px-3 py-1 disabled:opacity-40">
          {editing ? "Cancel" : "Edit"}
        </button>
        {editing && (
          <button disabled={busy} onClick={save} className="rounded border border-accent px-3 py-1 text-accent disabled:opacity-40">
            Save
          </button>
        )}
      </div>
    </div>
  );
}