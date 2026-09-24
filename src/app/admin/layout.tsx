import { cookies } from "next/headers";
import Link from "next/link";
import { verifyToken, getAdminSecret, findAdminCookie, adminCookieName } from "@/lib/auth";
import { AdminLogin } from "@/components/admin/admin-login";
import { LogoutButton } from "@/components/admin/logout-button";

async function isAuthed(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(adminCookieName())?.value;
  if (!token) return false;
  const payload = await verifyToken(token, getAdminSecret());
  return payload === "admin";
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const authed = await isAuthed();
  if (!authed) {
    return (
      <div className="min-h-screen bg-paper">
        <main className="mx-auto max-w-5xl px-4">
          <AdminLogin />
        </main>
      </div>
    );
  }
  void findAdminCookie;

  const links = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/events", label: "Events" },
    { href: "/admin/sources", label: "Sources" },
    { href: "/admin/translations", label: "Translations" },
  ];

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-line bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6">
            <span className="font-display text-lg font-bold">Last24hours Admin</span>
            <nav className="hidden gap-4 text-sm sm:flex">
              {links.map((l) => (
                <Link key={l.href} href={l.href} className="text-ink-soft hover:text-accent">
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
          <LogoutButton />
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}