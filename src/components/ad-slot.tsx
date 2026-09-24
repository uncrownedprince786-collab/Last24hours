/**
 * Reserved advertising placements.
 * Slots render nothing until an advertising provider is configured and
 * ADS_ENABLED=true. They are never filled with fake or decorative ads.
 */
export function AdSlot({ name }: { name: string }) {
  const enabled = process.env.ADS_ENABLED === "true";
  if (!enabled) return null;
  return (
    <aside
      aria-label="Advertisement"
      data-ad-slot={name}
      className="my-8 min-h-[90px] w-full border-y border-dashed border-line text-center text-xs uppercase tracking-widest text-muted/60"
      style={{ color: "var(--muted)" }}
    >
      Advertisement · {name}
    </aside>
  );
}