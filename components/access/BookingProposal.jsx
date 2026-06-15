"use client";

// One booking request, from Joe's side. Instead of just approve/decline,
// Joe revises it — date, line items, a message — and sends it to the
// client for approval, then watches a live tracker (views with
// timestamps, replies) until they approve and it's finalized into a
// project.

import { useState } from "react";
import { useRouter } from "next/navigation";
import DateField from "./DateField";
import RequestInfo from "./RequestInfo";
import { fmtDate, fmtTime, fmtMoney } from "../../lib/access/format";

async function adminAction(payload) {
  const res = await fetch("/api/access/admin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return { ok: res.ok, data: await res.json().catch(() => ({})) };
}

const TONE = {
  New: "neutral",
  "Proposal Sent": "gold",
  "Info Requested": "gold",
  "Client Replied": "alert",
  "Client Approved": "gold",
  Approved: "gold",
  Declined: "muted",
};

export default function BookingProposal({ booking, defaultLineItems, proposalBase }) {
  const router = useRouter();
  const refresh = () => router.refresh();
  const sent = !!booking.proposal;

  const [editing, setEditing] = useState(!sent);
  const [date, setDate] = useState(booking.proposal?.shootDate || booking.desiredDate || "");
  const [items, setItems] = useState(
    booking.proposal?.lineItems?.length ? booking.proposal.lineItems.map((i) => ({ ...i })) : defaultLineItems
  );
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState("");
  const [copied, setCopied] = useState(false);
  const [finalized, setFinalized] = useState(null);
  const [askingInfo, setAskingInfo] = useState(false);

  const total = items.reduce((s, li) => s + (Number(li.amount) || 0), 0);
  const link = booking.proposalToken ? `${proposalBase}${booking.proposalToken}` : "";

  function setItem(i, f, v) {
    setItems((rows) => rows.map((r, idx) => (idx === i ? { ...r, [f]: v } : r)));
  }
  const addRow = () => setItems((r) => [...r, { description: "", amount: 0 }]);
  const removeRow = (i) => setItems((r) => (r.length > 1 ? r.filter((_, idx) => idx !== i) : r));

  async function send(mode, overrideMessage) {
    setBusy(mode);
    await adminAction({
      action: "sendProposal",
      bookingId: booking.id,
      shootDate: date,
      lineItems: items,
      message: overrideMessage ?? message,
      mode,
      channels: ["email"],
    });
    setBusy("");
    setMessage("");
    setEditing(false);
    setAskingInfo(false);
    refresh();
  }

  async function decline() {
    await adminAction({ action: "updateBooking", bookingId: booking.id, status: "Declined" });
    refresh();
  }

  async function finalize() {
    setBusy("finalize");
    const { ok, data } = await adminAction({
      action: "approveBooking",
      bookingId: booking.id,
      channels: ["email"],
    });
    setBusy("");
    if (ok) setFinalized(data);
    refresh();
  }

  function copyLink() {
    navigator.clipboard?.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="acc-admin">
      <section className="acc-section">
        <div className="acc-section-head">
          <h2 className="serif">{booking.name}</h2>
          <span className={`acc-status ${TONE[booking.status] || "neutral"}`}>{booking.status}</span>
        </div>
        <p className="acc-sub">
          {[booking.company, booking.email, booking.phone].filter(Boolean).join(" · ")}
        </p>

        <div className="acc-card">
          <span className="label acc-gold">Their request</span>
          <div className="acc-req-grid">
            <div><span className="label">Property</span><p>{booking.address}</p></div>
            <div><span className="label">Size</span><p>{booking.sqft ? `${booking.sqft.toLocaleString()} sq ft` : "—"}</p></div>
            <div><span className="label">Requested date</span><p>{booking.desiredDate ? fmtDate(booking.desiredDate) : "Flexible"}</p></div>
            <div><span className="label">Services</span><p>{Object.entries(booking.services || {}).filter(([, v]) => v).map(([k]) => k).join(", ") || "Photography"}</p></div>
          </div>
          {booking.notes && <p className="acc-sub acc-req-notes">“{booking.notes}”</p>}
        </div>
      </section>

      {/* — Live tracker (after a proposal is sent) — */}
      {sent && (
        <section className="acc-section">
          <div className="acc-section-head">
            <h2 className="serif">Tracking</h2>
            <span className="label">
              Sent {fmtTime(booking.proposal.sentAt)} · v{booking.proposal.revision}
            </span>
          </div>

          <div className="acc-card acc-tracker">
            <div className="acc-tracker-row">
              <span className="label acc-gold">Proposal link</span>
              <div className="acc-tracker-link">
                <code>{link}</code>
                <button className="acc-btn" onClick={copyLink}>{copied ? "Copied ✓" : "Copy"}</button>
                <a className="label acc-linkbtn" href={link} target="_blank" rel="noreferrer">Open ↗</a>
              </div>
            </div>

            <div className="acc-tracker-row">
              <span className="label acc-gold">Views</span>
              {booking.views?.length ? (
                <ul className="acc-tracker-views">
                  <li className="now">
                    <span className="acc-timeline-dot" /> Viewed {booking.views.length}× · last {fmtTime(booking.views[booking.views.length - 1].at)}
                  </li>
                  {booking.views.slice(0, -1).reverse().map((v, i) => (
                    <li key={i}><span className="acc-timeline-dot" /> {fmtTime(v.at)}</li>
                  ))}
                </ul>
              ) : (
                <p className="acc-sub">Not opened yet — you&rsquo;ll see a timestamp here the moment they do.</p>
              )}
            </div>

            {booking.thread?.length > 0 && (
              <div className="acc-tracker-row">
                <span className="label acc-gold">Conversation</span>
                <div className="acc-tracker-thread">
                  {booking.thread.map((m, i) => (
                    <div className={`acc-thread-msg ${m.from}`} key={i}>
                      <p>{m.body}</p>
                      <span className="label">{m.from === "joe" ? "You" : booking.name.split(" ")[0]} · {fmtTime(m.at)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {booking.status === "Client Approved" && !finalized && (
            <div className="acc-queue-item">
              <div>
                <span className="acc-status gold">Client approved ✓</span>
                <p>Approved {fmtTime(booking.approvedAt)}. Finalize to create their project, first invoice and login.</p>
              </div>
              <button className="acc-btn primary" onClick={finalize} disabled={busy === "finalize"}>
                {busy === "finalize" ? "Creating…" : "Finalize → project"}
              </button>
            </div>
          )}

          {finalized && (
            <p className="acc-notice">
              Project created ✓ — their login: <strong>{finalized.user?.email}</strong> / code{" "}
              <strong>{finalized.accessCode}</strong>. <a href={`/access/admin/projects/${finalized.project?.id}`}>Open the project →</a>
            </p>
          )}
        </section>
      )}

      {/* — Proposal editor — */}
      <section className="acc-section">
        <div className="acc-section-head">
          <h2 className="serif">{sent ? "Revise & resend" : "Build the proposal"}</h2>
          {sent && (
            <button className="acc-btn" onClick={() => setEditing((v) => !v)}>
              {editing ? "Close" : "Edit"}
            </button>
          )}
        </div>

        {(editing || !sent) && (
          <div className="acc-card acc-form">
            <label className="wide">
              <span className="label">Shoot date</span>
              <DateField name="shootDate" defaultValue={date} onChange={setDate} />
            </label>

            <span className="label acc-gold" style={{ marginTop: ".4rem" }}>Line items</span>
            <div className="acc-invoice-items">
              <div className="acc-invoice-items-head">
                <span className="label">Description</span>
                <span className="label">Amount</span>
              </div>
              {items.map((li, i) => (
                <div className="acc-invoice-item" key={i}>
                  <input
                    className="acc-invoice-item-desc"
                    value={li.description}
                    placeholder="Service or item"
                    onChange={(e) => setItem(i, "description", e.target.value)}
                  />
                  <div className="acc-invoice-item-amt">
                    <span>$</span>
                    <input
                      type="number" min="0" step="1"
                      value={li.amount}
                      onChange={(e) => setItem(i, "amount", e.target.value)}
                    />
                    <button className="acc-invoice-rowdel" onClick={() => removeRow(i)} aria-label="Remove">✕</button>
                  </div>
                </div>
              ))}
              <button className="acc-linkbtn label" onClick={addRow}>+ Add line item</button>
            </div>
            <div className="acc-invoice-total">
              <span className="label">Total</span>
              <span className="serif">{fmtMoney(total)}</span>
            </div>

            <label className="wide">
              <span className="label">Message to the client (optional)</span>
              <textarea
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="A note — what changed, or a question before you confirm…"
              />
            </label>

            <div className="acc-form-actions">
              <button className="acc-btn" onClick={() => setAskingInfo((v) => !v)} disabled={!!busy}>
                {askingInfo ? "Close" : "Request more info"}
              </button>
              <button className="acc-btn primary" onClick={() => send("proposal")} disabled={!!busy}>
                {busy === "proposal" ? "Sending…" : sent ? "Send revision for approval" : "Send proposal for approval"}
              </button>
            </div>

            {askingInfo && (
              <RequestInfo
                kind="booking"
                clientName={booking.name}
                busy={busy === "info"}
                onCancel={() => setAskingInfo(false)}
                onSubmit={(msg) => send("info", msg)}
              />
            )}
          </div>
        )}

        {booking.status !== "Declined" && booking.status !== "Approved" && (
          <button className="acc-btn acc-decline" onClick={decline}>Decline this request</button>
        )}
      </section>
    </div>
  );
}
