"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { label: "Current", href: "/" },
  { label: "Archive", href: "/archive" },
  { label: "About", href: "/about" },
];

export default function SiteHeader() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname?.startsWith(href);
  };

  return (
    <>
      {/* Top accent bar */}
      <div
        className="w-full text-center"
        style={{
          background: "var(--color-topbar)",
          color: "var(--color-topbar-text)",
          padding: "10px 0",
          fontFamily: "var(--font-sans), sans-serif",
          fontSize: "11px",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
        }}
      >
        Tradition · Text · Meaning
      </div>

      {/* Logo + nav */}
      <header className="max-w-[1140px] mx-auto px-10 pt-10">
        <div className="text-center pb-7">
          <Link href="/" className="inline-block">
            <h1
              style={{
                fontFamily: "var(--font-display), serif",
                fontSize: "52px",
                fontWeight: 700,
                color: "var(--color-ink)",
                margin: 0,
                letterSpacing: "0.02em",
                lineHeight: 1,
              }}
            >
              TATTVA
            </h1>
            <div
              style={{
                fontFamily: "var(--font-display), serif",
                fontSize: "13px",
                color: "var(--color-meta)",
                marginTop: "6px",
                fontStyle: "italic",
                letterSpacing: "0.02em",
              }}
            >
              Celebrating Dharma
            </div>
          </Link>
        </div>

        <nav
          style={{
            borderTop: "2px solid var(--color-ink)",
            borderBottom: "1px solid var(--color-divider)",
          }}
          className="flex justify-center gap-14 py-4"
        >
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  fontFamily: "var(--font-sans), sans-serif",
                  fontSize: "12px",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: active ? "var(--color-ink)" : "var(--color-meta-faded)",
                  fontWeight: active ? 600 : 400,
                  position: "relative",
                }}
                className="transition-colors hover:text-[color:var(--color-accent)]"
              >
                {item.label}
                {active && (
                  <span
                    style={{
                      position: "absolute",
                      left: "50%",
                      bottom: "-17px",
                      transform: "translateX(-50%)",
                      width: "18px",
                      height: "2px",
                      background: "var(--color-accent)",
                    }}
                    aria-hidden
                  />
                )}
              </Link>
            );
          })}
        </nav>
      </header>
    </>
  );
}
