"use client";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();
  async function onClick() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        fontFamily: "var(--font-sans), sans-serif",
        fontSize: "11px",
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: "var(--color-meta)",
        background: "transparent",
        border: "none",
        cursor: "pointer",
      }}
      className="hover:text-[color:var(--color-accent)] transition-colors"
    >
      Sign out
    </button>
  );
}
