"use client";

import { useEffect, useRef } from "react";

export function ViewTracker({ eventId }: { eventId: number }) {
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    let ref: string | null = null;
    try {
      ref = typeof document !== "undefined" && document.referrer ? new URL(document.referrer).hostname : null;
    } catch {
      ref = null;
    }
    if (navigator.sendBeacon) {
      const blob = new Blob(
        [JSON.stringify({ eventId, ref })],
        { type: "application/json" }
      );
      navigator.sendBeacon("/api/ring", blob);
    } else {
      fetch("/api/ring", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ eventId, ref }),
        keepalive: true,
      }).catch(() => {});
    }
  }, [eventId]);
  return null;
}