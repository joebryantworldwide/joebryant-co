"use client";

// The platform control room. Connections (Square, SmugMug, Dropbox, email,
// SMS), studio profile, pricing defaults, tax & fees, notifications, default
// download size, and the standard terms — each saved independently.

import { useState } from "react";
import ConnectionPill from "./ConnectionPill";

async function save(group, fields) {
  const res = await fetch("/api/access/admin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "updateSettings", group, fields }),
  });
  return res.ok;
}

function StaticConn({ name, on, hint }) {
  const state = on ? "green" : "red";
  return (
    <div className="acc-conn-row">
      <span className={`acc-conn acc-conn-${state}`}><span className="acc-conn-dot" />{on ? `Linked by ${name}` : `${name} not connected`}</span>
      <span className="label acc-conn-hint">{hint}</span>
    </div>
  );
}

// A self-contained editable settings group with its own Save button.
function Group({ title, hint, fields, initial, onSave, children }) {
  const [vals, setVals] = useState(initial);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setVals((s) => ({ ...s, [k]: v }));

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    const ok = await onSave(vals);
    setBusy(false);
    if (ok) { setSaved(true); setTimeout(() => setSaved(false), 1800); }
  }

  return (
    <form className="acc-set-card" onSubmit={submit}>
      <div className="acc-section-head">
        <span className="label acc-gold">{title}</span>
        <button className="acc-btn" disabled={busy}>{busy ? "Saving…" : saved ? "Saved ✓" : "Save"}</button>
      </div>
      {hint && <p className="acc-sub">{hint}</p>}
      {children(vals, set)}
    </form>
  );
}

export default function Settings({ settings, integrations }) {
  return (
    <div className="acc-settings">
      {/* — Connections — */}
      <section className="acc-set-card">
        <span className="label acc-gold">Connections</span>
        <p className="acc-sub">Where your payments, galleries and messages flow. Keys live in your environment — status updates live.</p>
        <div className="acc-conn-list">
          <div className="acc-conn-row">
            <ConnectionPill service="Square" />
            <span className="label acc-conn-hint">Payments · checkout · invoice sync</span>
          </div>
          <StaticConn name="SmugMug" on={integrations.smugmug} hint="Galleries — full-res delivery" />
          <StaticConn name="Dropbox" on={integrations.dropbox} hint="Folder → album ingestion (coming)" />
          <StaticConn name="Email" on={integrations.email} hint="Resend — newsletters & notifications" />
          <StaticConn name="SMS" on={integrations.sms} hint="Twilio — text blasts & alerts" />
        </div>
      </section>

      {/* — Studio profile — */}
      <Group
        title="Studio profile"
        hint="Shown on invoices, reports and client comms."
        initial={settings.profile}
        onSave={(v) => save("profile", v)}
      >
        {(v, set) => (
          <div className="acc-form-grid">
            <label><span className="label">Contact email</span><input value={v.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} /></label>
            <label><span className="label">Phone</span><input value={v.phone} onChange={(e) => set("phone", e.target.value)} /></label>
            <label><span className="label">Website</span><input value={v.website} onChange={(e) => set("website", e.target.value)} /></label>
            <label><span className="label">Location</span><input value={v.address} onChange={(e) => set("address", e.target.value)} /></label>
            <label><span className="label">License / Tax ID</span><input value={v.licenseId} onChange={(e) => set("licenseId", e.target.value)} /></label>
            <label><span className="label">Instagram</span><input value={v.instagram} onChange={(e) => set("instagram", e.target.value)} placeholder="@joebryantco" /></label>
            <label><span className="label">LinkedIn</span><input value={v.linkedin} onChange={(e) => set("linkedin", e.target.value)} /></label>
          </div>
        )}
      </Group>

      {/* — Pricing defaults — */}
      <Group
        title="Pricing defaults"
        hint="Drives auto-populated estimates and property invoices."
        initial={settings.pricing}
        onSave={(v) => save("pricing", {
          base: +v.base, perThousandSqFt: +v.perThousandSqFt, twilight: +v.twilight,
          drone: +v.drone, stylingMin: +v.stylingMin, stylingMax: +v.stylingMax,
        })}
      >
        {(v, set) => (
          <div className="acc-form-grid">
            <label><span className="label">Base shoot fee ($)</span><input type="number" value={v.base} onChange={(e) => set("base", e.target.value)} /></label>
            <label><span className="label">Per 1,000 sq ft ($)</span><input type="number" value={v.perThousandSqFt} onChange={(e) => set("perThousandSqFt", e.target.value)} /></label>
            <label><span className="label">Twilight ($)</span><input type="number" value={v.twilight} onChange={(e) => set("twilight", e.target.value)} /></label>
            <label><span className="label">Drone ($)</span><input type="number" value={v.drone} onChange={(e) => set("drone", e.target.value)} /></label>
            <label><span className="label">Styling — min ($)</span><input type="number" value={v.stylingMin} onChange={(e) => set("stylingMin", e.target.value)} /></label>
            <label><span className="label">Styling — max ($)</span><input type="number" value={v.stylingMax} onChange={(e) => set("stylingMax", e.target.value)} /></label>
          </div>
        )}
      </Group>

      {/* — Tax & fees — */}
      <Group
        title="Tax & fees"
        hint="Service businesses often charge no tax — leave at 0 if so."
        initial={settings.tax}
        onSave={(v) => save("tax", { defaultRate: +v.defaultRate, convenienceFee: +v.convenienceFee })}
      >
        {(v, set) => (
          <div className="acc-form-grid">
            <label><span className="label">Default tax rate (%)</span><input type="number" step="0.1" value={v.defaultRate} onChange={(e) => set("defaultRate", e.target.value)} /></label>
            <label><span className="label">Convenience fee (%)</span><input type="number" step="0.1" value={v.convenienceFee} onChange={(e) => set("convenienceFee", e.target.value)} /></label>
          </div>
        )}
      </Group>

      {/* — Notifications — */}
      <Group
        title="Notifications"
        hint="How you and your clients get alerted."
        initial={settings.notifications}
        onSave={(v) => save("notifications", v)}
      >
        {(v, set) => (
          <div className="acc-toggle-row">
            {[
              ["email", "Email notifications"],
              ["sms", "Text notifications"],
              ["push", "Push notifications"],
              ["birthdayAuto", "Automatic birthday wishes"],
            ].map(([k, label]) => (
              <button type="button" key={k} className={`acc-toggle${v[k] ? " on" : ""}`} onClick={() => set(k, !v[k])}>
                <span className="acc-switch-mini"><span /></span>{label}
              </button>
            ))}
          </div>
        )}
      </Group>

      {/* — Delivery — */}
      <Group
        title="Gallery delivery"
        hint="Default download size offered to clients."
        initial={{ defaultDownloadSize: settings.defaultDownloadSize }}
        onSave={(v) => save(null, { defaultDownloadSize: v.defaultDownloadSize })}
      >
        {(v, set) => (
          <label style={{ maxWidth: 280 }}>
            <span className="label">Default download size</span>
            <select value={v.defaultDownloadSize} onChange={(e) => set("defaultDownloadSize", e.target.value)}>
              <option value="orig">Original</option>
              <option value="3600">3600px</option>
              <option value="2048">2048px</option>
              <option value="1024">1024px (web)</option>
            </select>
          </label>
        )}
      </Group>

      {/* — Terms — */}
      <Group
        title="Terms & licensing"
        hint="Printed on invoices and shown for acceptance before payment."
        initial={{ terms: settings.terms }}
        onSave={(v) => save(null, { terms: v.terms })}
      >
        {(v, set) => (
          <textarea rows={8} value={v.terms} onChange={(e) => set("terms", e.target.value)} />
        )}
      </Group>
    </div>
  );
}
