"use client";

import dynamic from "next/dynamic";
import config from "../../../sanity.config";

const NextStudio = dynamic(
  () => import("next-sanity/studio").then((m) => m.NextStudio),
  { ssr: false, loading: () => <StudioShell>Loading your studio…</StudioShell> }
);

function StudioShell({ children }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "2rem",
        fontFamily: "var(--sans)",
        color: "var(--bone)",
        lineHeight: 1.8,
      }}
    >
      <div style={{ maxWidth: 520 }}>{children}</div>
    </div>
  );
}

export default function StudioPage() {
  if (!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID) {
    return (
      <StudioShell>
        <h1 style={{ fontFamily: "var(--serif)", fontWeight: 400, fontSize: "2rem", marginBottom: "1rem" }}>
          Your studio isn&rsquo;t connected yet.
        </h1>
        <p style={{ color: "var(--muted)" }}>
          Three steps, five minutes — see &ldquo;Your backend&rdquo; in the
          README. Until then the site runs on its built-in photography, so
          nothing is broken.
        </p>
      </StudioShell>
    );
  }
  return <NextStudio config={config} />;
}
