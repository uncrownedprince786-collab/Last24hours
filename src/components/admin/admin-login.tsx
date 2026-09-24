"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setBusy(false);
    if (res.ok) {
      router.refresh();
    } else {
      setError(true);
    }
  };

  return (
    <div className="mx-auto mt-24 w-full max-w-sm">
      <h1 className="mb-6 font-display text-2xl font-bold">Last24hours · Admin</h1>
      <form onSubmit={submit} className="space-y-4 rounded-xl border border-line bg-card p-6">
        <div>
          <label htmlFor="password" className="text-sm font-semibold">Password</label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(false); }}
            className="mt-1 w-full rounded border border-line bg-transparent px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </div>
        {error && <p className="text-sm text-accent">Invalid password.</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded bg-ink px-4 py-2 text-sm font-semibold text-paper disabled:opacity-50"
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}