import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description:
    "Tattva is the intellectual notebook of Manish Maheshwari, covering Indian textual traditions, philosophy, history, and colonial discourse.",
};

export default function AboutPage() {
  return (
    <div className="max-w-[640px] mx-auto px-6 pt-16 pb-24">
      <h1
        style={{
          fontFamily: "var(--font-display), serif",
          fontSize: "40px",
          fontWeight: 600,
          color: "var(--color-ink)",
          textAlign: "center",
          marginBottom: "36px",
        }}
      >
        About
      </h1>

      <div
        style={{
          fontFamily: "var(--font-reading), serif",
          fontSize: "19px",
          lineHeight: 1.9,
          color: "var(--color-body-muted)",
        }}
      >
        <p style={{ marginBottom: "28px" }}>
          <strong
            style={{
              fontFamily: "var(--font-display), serif",
              fontWeight: 600,
              fontSize: "21px",
              color: "var(--color-ink)",
            }}
          >
            Tattva
          </strong>{" "}
          is the intellectual notebook of Manish Maheshwari. It covers Indian textual traditions,
          philosophy, history, colonial discourse, and the question of how inherited sources of
          meaning survive under modernity.
        </p>
        <p style={{ marginBottom: "28px" }}>
          Manish runs the <em>Tattva Heritage Foundation</em> (
          <a
            href="https://www.tattvaheritage.org"
            target="_blank"
            rel="noreferrer noopener"
            style={{ color: "var(--color-accent)" }}
            className="underline underline-offset-2"
          >
            tattvaheritage.org
          </a>
          ) and the <em>Centre for Shaiva Studies</em> (
          <a
            href="https://www.shaivastudies.in"
            target="_blank"
            rel="noreferrer noopener"
            style={{ color: "var(--color-accent)" }}
            className="underline underline-offset-2"
          >
            shaivastudies.in
          </a>
          ). Contact:{" "}
          <a
            href="mailto:contact@tattvamag.org"
            style={{ color: "var(--color-accent)" }}
            className="underline underline-offset-2"
          >
            contact@tattvamag.org
          </a>
          .
        </p>
      </div>

      <p
        style={{
          fontFamily: "var(--font-reading), serif",
          fontSize: "15px",
          color: "var(--color-meta-faded)",
          marginTop: "56px",
          fontStyle: "italic",
          borderTop: "1px solid var(--color-divider-soft)",
          paddingTop: "24px",
          textAlign: "center",
        }}
      >
        This site is updated periodically.
      </p>
    </div>
  );
}
