"use client";

import { useState } from "react";
import Link from "next/link";

const CDN = "https://images.squarespace-cdn.com/content/v1/644a110ae9f62a105d8f1892";
const HERO = `${CDN}/a574431b-f275-41bd-b513-f316a6e34595/DJI_0648.jpg?format=1500w`;

export default function AccessLogin() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/access/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: fd.get("email"), code: fd.get("code") }),
    });
    if (res.ok) {
      window.location.reload();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Something went wrong — try again.");
      setBusy(false);
    }
  }

  return (
    <main className="acc-auth">
      <aside className="acc-auth-visual" style={{ backgroundImage: `url(${HERO})` }} aria-hidden="true">
        <div className="acc-auth-visual-veil" />
        <div className="acc-auth-quote">
          <span className="label acc-gold">Joe Bryant · Access</span>
          <p className="serif">“The spaces we remember are never accidental.”</p>
        </div>
      </aside>

      <section className="acc-auth-panel">
        <div className="acc-auth-card">
          <span className="label acc-gold">Client &amp; Studio Portal</span>
          <h1 className="serif">
            Welcome <em>back.</em>
          </h1>
          <p className="acc-auth-sub">
            Sign in to view your galleries, proposals, invoices and shoot details.
          </p>

          <form onSubmit={onSubmit}>
            <label>
              <span className="label">Email</span>
              <input type="email" name="email" required autoComplete="email" placeholder="you@company.com" />
            </label>
            <label>
              <span className="label">Access code</span>
              <input type="password" name="code" required placeholder="From your invite" />
            </label>
            {error && <p className="acc-error">{error}</p>}
            <button type="submit" className="acc-btn primary acc-auth-submit" disabled={busy}>
              {busy ? "Opening…" : "Enter"}
            </button>
          </form>

          <p className="acc-help">
            New here? <Link href="/access/book">Request availability</Link> to start a project.
            <br />
            Lost your code? Email <a href="mailto:joe@joebryant.co?subject=Access%20code">joe@joebryant.co</a>.
          </p>
        </div>
      </section>
    </main>
  );
}
