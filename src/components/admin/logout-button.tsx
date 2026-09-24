"use client";

export function LogoutButton() {
  return (
    <button
      type="button"
      onClick={async () => {
        await fetch("/api/admin/logout", { method: "POST" });
        location.href = "/admin";
      }}
      className="text-sm text-muted hover:text-accent"
    >
      Sign out
    </button>
  );
}