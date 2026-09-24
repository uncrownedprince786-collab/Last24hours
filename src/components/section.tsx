import Link from "next/link";

export function Section({
  title,
  viewAllHref,
  children,
}: {
  title: string;
  viewAllHref?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-12">
      <div className="mb-4 flex items-end justify-between gap-4 border-b border-line pb-2">
        <h2 className="font-display text-xl font-bold tracking-tight sm:text-2xl">{title}</h2>
        {viewAllHref && (
          <Link href={viewAllHref} className="text-xs font-semibold uppercase tracking-wider text-accent hover:opacity-80">
            {viewAllHref.split("/").pop() === "trending" ? "↗" : ""}
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}