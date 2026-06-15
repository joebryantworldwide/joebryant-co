"use client";

// Request availability / start planning / book — one form, live estimate.

import { useState } from "react";
import Link from "next/link";
import DateField from "./DateField";
import { estimate, fmtEstimate } from "../../lib/access/pricing";

const KINDS = ["Request Availability", "Start Planning", "Book Project"];

export default function BookingForm({ prefill = {} }) {
  const [kind, setKind] = useState(KINDS[0]);
  const [sqft, setSqft] = useState("");
  const [services, setServices] = useState({ drone: false, twilight: false, styling: false });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const est = estimate({ sqft, ...services });

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/access/book", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind,
        name: fd.get("name"),
        email: fd.get("email"),
        phone: fd.get("phone"),
        company: fd.get("company"),
        address: fd.get("address"),
        sqft,
        desiredDate: fd.get("desiredDate"),
        birthMonth: fd.get("birthMonth"),
        birthDay: fd.get("birthDay"),
        birthYear: fd.get("birthYear"),
        services,
        notes: fd.get("notes"),
      }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) setDone(true);
    else setError(data.error || "Something went wrong — try again.");
  }

  if (done) {
    return (
      <div className="acc-login-card">
        <span className="label acc-gold">Request received</span>
        <h1 className="serif">
          Joe has been <em>notified.</em>
        </h1>
        <p className="acc-help">
          You&rsquo;ll hear back shortly to confirm availability and final pricing. Once Joe
          approves, a 50% retainer confirms your date.
        </p>
        <Link href="/access" className="acc-btn primary">
          Back to Access
        </Link>
      </div>
    );
  }

  return (
    <form className="acc-form acc-book" onSubmit={submit}>
      <div className="acc-kinds">
        {KINDS.map((k) => (
          <button
            type="button"
            key={k}
            className={`acc-pill ${kind === k ? "active" : ""}`}
            onClick={() => setKind(k)}
          >
            {k}
          </button>
        ))}
      </div>

      <div className="acc-form-grid">
        <label>
          <span className="label">Name</span>
          <input name="name" required defaultValue={prefill.name || ""} />
        </label>
        <label>
          <span className="label">Email</span>
          <input name="email" type="email" required defaultValue={prefill.email || ""} />
        </label>
        <label>
          <span className="label">Phone</span>
          <input name="phone" defaultValue={prefill.phone || ""} />
        </label>
        <label>
          <span className="label">Company</span>
          <input name="company" defaultValue={prefill.company || ""} />
        </label>
        <label className="wide">
          <span className="label">Property address</span>
          <input name="address" required placeholder="Street, City, State" />
        </label>
        <label>
          <span className="label">Square footage</span>
          <input
            name="sqft"
            type="number"
            min="0"
            inputMode="numeric"
            value={sqft}
            onChange={(e) => setSqft(e.target.value)}
            placeholder="e.g. 6500"
          />
        </label>
        <label>
          <span className="label">Desired shoot date</span>
          <DateField name="desiredDate" min={new Date().toISOString().slice(0, 10)} />
        </label>
      </div>

      <fieldset className="acc-birthday">
        <legend className="label">Your birthday <span className="acc-gold">— for a little magic</span></legend>
        <p className="acc-sub">We send a warm wish on your day and a monthly reading for your sign. Month &amp; day only — year is optional and never shown as your age (it just unlocks your Chinese zodiac).</p>
        <div className="acc-bday-fields">
          <label>
            <span className="label">Month</span>
            <select name="birthMonth" defaultValue="">
              <option value="">—</option>
              {["January","February","March","April","May","June","July","August","September","October","November","December"].map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="label">Day</span>
            <input name="birthDay" type="number" min="1" max="31" placeholder="—" />
          </label>
          <label>
            <span className="label">Year <span style={{ opacity: 0.6 }}>(optional)</span></span>
            <input name="birthYear" type="number" min="1920" max="2020" placeholder="—" />
          </label>
        </div>
      </fieldset>

      <fieldset className="acc-services">
        <legend className="label">Services</legend>
        {[
          ["drone", "Drone / Aerial — $150"],
          ["twilight", "Twilight — $250"],
          ["styling", "Styling / Cleanup Prep — $300–600"],
        ].map(([key, label]) => (
          <label key={key} className={`acc-pill ${services[key] ? "active" : ""}`}>
            <input
              type="checkbox"
              checked={services[key]}
              onChange={() => setServices((s) => ({ ...s, [key]: !s[key] }))}
            />
            {label}
          </label>
        ))}
      </fieldset>

      <label className="acc-notes">
        <span className="label">Notes</span>
        <textarea name="notes" rows={3} placeholder="Anything Joe should know — access, timing, priority spaces…" />
      </label>

      <div className="acc-estimate">
        <span className="label acc-gold">Estimated investment</span>
        <span className="serif acc-estimate-num">{fmtEstimate(est)}</span>
        <span className="label">Estimate only — confirmed personally by Joe before anything is due.</span>
      </div>

      {error && <p className="acc-error">{error}</p>}

      <button className="acc-btn primary big" disabled={busy}>
        {busy ? "Sending…" : kind}
      </button>
      <p className="acc-help">
        Once Joe approves: 50% non-refundable retainer confirms your date · balance due by end of
        shoot day.
      </p>
    </form>
  );
}
