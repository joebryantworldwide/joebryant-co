"use client";

import { useState } from "react";

export default function ProposalActions({ token, approved, isInfo }) {
  const [state, setState] = useState(approved ? "approved" : "idle");
  const [replying, setReplying] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function approve() {
    setBusy(true);
    setError("");
    const res = await fetch("/api/access/proposal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, action: "approve" }),
    });
    setBusy(false);
    if (res.ok) setState("approved");
    else setError("Something went wrong — email joe@joebryant.co.");
  }

  async function reply(e) {
    e.preventDefault();
    const body = new FormData(e.currentTarget).get("body");
    if (!body) return;
    setBusy(true);
    setError("");
    const res = await fetch("/api/access/proposal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, action: "reply", body }),
    });
    setBusy(false);
    if (res.ok) {
      setSent(true);
      setReplying(false);
    } else setError("Couldn't send — email joe@joebryant.co.");
  }

  if (state === "approved") {
    return (
      <section className="acc-card acc-proposal-actions">
        <span className="acc-paid-stamp">CONFIRMED</span>
        <p className="serif">You&rsquo;re all set — thank you.</p>
        <p className="acc-sub">Joe will be in touch with next steps and your private client access.</p>
      </section>
    );
  }

  return (
    <section className="acc-card acc-proposal-actions">
      {sent && <p className="acc-notice">Sent ✓ — Joe will get right back to you.</p>}
      {!isInfo && (
        <button className="acc-btn primary acc-proposal-approve" onClick={approve} disabled={busy}>
          {busy ? "Confirming…" : "Approve & confirm"}
        </button>
      )}
      {!replying ? (
        <button className="acc-btn" onClick={() => setReplying(true)}>
          {isInfo ? "Reply to Joe" : "Reply / request a change"}
        </button>
      ) : (
        <form className="acc-proposal-reply" onSubmit={reply}>
          <textarea
            name="body"
            rows={3}
            placeholder={isInfo ? "Your answer…" : "Anything you'd like changed — date, scope, budget…"}
            required
          />
          <div className="acc-form-actions">
            <button type="button" className="acc-btn" onClick={() => setReplying(false)}>
              Cancel
            </button>
            <button className="acc-btn primary" disabled={busy}>
              {busy ? "Sending…" : "Send to Joe"}
            </button>
          </div>
        </form>
      )}
      {error && <p className="acc-error">{error}</p>}
    </section>
  );
}
