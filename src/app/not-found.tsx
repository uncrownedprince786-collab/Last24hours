import Link from "next/link";

export default function GlobalNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center bg-paper text-center">
      <p className="font-display text-7xl font-bold text-line">404</p>
      <h1 className="mt-4 font-display text-2xl font-bold">Page not found</h1>
      <p className="mt-2 max-w-sm text-muted">This page does not exist or has moved.</p>
      <Link href="/en/" className="mt-6 rounded border border-line px-4 py-2 text-sm hover:border-accent">
        Back to Last24hours
      </Link>
    </div>
  );
}