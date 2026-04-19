import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer
      className="mt-24"
      style={{ background: "var(--color-topbar)", padding: "40px 40px" }}
    >
      <div
        className="max-w-[1140px] mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
      >
        <div>
          <Link href="/" className="inline-block">
            <div
              style={{
                fontFamily: "var(--font-display), serif",
                fontSize: "22px",
                fontWeight: 700,
                color: "var(--color-topbar-title)",
                letterSpacing: "0.02em",
              }}
            >
              TATTVA
            </div>
          </Link>
          <div
            style={{
              fontFamily: "var(--font-sans), sans-serif",
              fontSize: "11px",
              color: "var(--color-meta)",
              marginTop: "6px",
              letterSpacing: "0.05em",
            }}
          >
            © {new Date().getFullYear()} Manish Maheshwari · Tattva Heritage Foundation
          </div>
        </div>

        <div
          className="flex gap-6"
          style={{
            fontFamily: "var(--font-sans), sans-serif",
            fontSize: "11px",
            color: "var(--color-topbar-text)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          <Link href="/archive" className="hover:text-[color:var(--color-accent)] transition-colors">Archive</Link>
          <Link href="/about" className="hover:text-[color:var(--color-accent)] transition-colors">About</Link>
          <a
            href="mailto:contact@tattvamag.org"
            className="hover:text-[color:var(--color-accent)] transition-colors"
          >
            Contact
          </a>
        </div>
      </div>
    </footer>
  );
}
