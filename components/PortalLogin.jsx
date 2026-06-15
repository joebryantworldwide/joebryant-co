"use client";

import { useState } from "react";

export default function PortalLogin() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/portal/login", {
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
    <main className="portal portal-login">
      <div className="portal-login-card">
        <span className="label">Client Access</span>
        <h1 className="serif">
          Your photographs <em>are waiting.</em>
        </h1>
        <form onSubmit={onSubmit}>
          <label>
            <span className="label">Email</span>
            <input type="email" name="email" required autoComplete="email" placeholder="you@company.com" />
          </label>
          <label>
            <span className="label">Access code</span>
            <input type="password" name="code" required placeholder="From your invite" />
          </label>
          {error && <p className="portal-error">{error}</p>}
          <button type="submit" disabled={busy}>
            {busy ? "Opening…" : "Enter"}
          </button>
        </form>
        <p className="portal-help">
          Lost your code? Email{" "}
          <a href="mailto:joe@joebryant.co?subject=Portal%20access">joe@joebryant.co</a> and
          you&rsquo;ll have it in minutes.
        </p>
      </div>
    </main>
  );
}
