"use client";

// On-demand, brand-aligned client report — full relationship breakdown,
// project history, and a commission estimator. Admin only. Print-ready.

import { useMemo, useState } from "react";
import { fmtDate, fmtMoney } from "../../lib/access/format";

// Editable per-listing-type presets. "side" = the listing agent's share of
// the total commission (what your client typically earns on a deal).
const LISTING_TYPES = {
  "Residential — Standard": { side: 2.5 },
  "Luxury / Estate": { side: 2.0 },
  "Commercial": { side: 3.0 },
  "Land / Lot": { side: 3.0 },
  "Lease": { side: 5.0 },
};

function metrics(client, projects) {
  const inv = projects.flatMap((p) => p.invoices || []);
  const sum = (a) => a.reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const paid = inv.filter((i) => i.status === "Paid");
  const lifetime = sum(paid);
  const billed = sum(inv);
  const open = Math.max(0, billed - lifetime);
  const dates = projects.map((p) => p.shootDate).filter(Boolean).sort();
  const first = client.firstContact || dates[0] || "";
  const last = client.lastContact || dates[dates.length - 1] || "";
  const days = first && last ? (new Date(last) - new Date(first)) / 86400000 : 0;
  const span = Math.max(days, 30);
  return {
    lifetime,
    billed,
    open,
    perYear: lifetime / (span / 365.25),
    perMonth: lifetime / (span / 30.44),
    perWeek: lifetime / (span / 7),
    first,
    last,
    count: projects.length,
  };
}

export default function ClientReport({ client, projects }) {
  const [open, setOpen] = useState(true); // auto-generate on load
  const m = useMemo(() => metrics(client, projects), [client, projects]);

  // Plain-text summary for email / SMS share (composer opens pre-filled; the
  // admin reviews and sends — nothing is sent automatically).
  const shareText = useMemo(() => {
    const lines = [
      `Client Report — ${client.name}`,
      [client.company, client.role].filter(Boolean).join(" · "),
      "",
      `Lifetime: ${fmtMoney(m.lifetime)}`,
      `Projects on record: ${m.count}`,
      m.last ? `Most recent: ${fmtDate(m.last)}` : "",
      m.open > 0 ? `Open / unconfirmed: ${fmtMoney(m.open)}` : "",
      "",
      "Prepared by Joe Bryant · joebryant.co",
    ];
    return lines.filter((l) => l !== "").join("\n");
  }, [client, m]);

  const subject = `Client Report — ${client.name}`;
  const mailto = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(shareText)}`;
  const sms = `sms:?&body=${encodeURIComponent(shareText)}`;

  // Commission estimator state
  const [price, setPrice] = useState("");
  const [type, setType] = useState("Residential — Standard");
  const [rate, setRate] = useState(LISTING_TYPES[type].side);
  const [agents, setAgents] = useState(1);
  const [showReferral, setShowReferral] = useState(false);
  const [referral, setReferral] = useState(25);

  function chooseType(t) {
    setType(t);
    setRate(LISTING_TYPES[t].side);
  }

  const p = Number(String(price).replace(/[^0-9.]/g, "")) || 0;
  const grossSide = p * (Number(rate) || 0) / 100;
  const perAgent = grossSide / Math.max(1, Number(agents) || 1);
  const referralCut = perAgent * (Number(referral) || 0) / 100;

  const ordered = [...projects].sort((a, b) =>
    (b.shootDate || "").localeCompare(a.shootDate || "")
  );

  const cards = [
    ["Lifetime", fmtMoney(m.lifetime)],
    ["Avg / Year", fmtMoney(m.perYear)],
    ["Avg / Month", fmtMoney(m.perMonth)],
    ["Avg / Week", fmtMoney(m.perWeek)],
    ["Open / Upcoming", fmtMoney(m.open)],
  ];

  return (
    <section className="acc-section">
      <div className="acc-section-head">
        <h2 className="serif">Client report</h2>
        <div className="acc-form-actions rep-actions" style={{ margin: 0 }}>
          <a className="acc-btn" href={mailto}>Email</a>
          <a className="acc-btn" href={sms}>Text</a>
          <button className="acc-btn primary" onClick={() => window.print()}>
            Save as PDF
          </button>
          <button className="acc-btn" onClick={() => setOpen((s) => !s)}>
            {open ? "Hide" : "Show"}
          </button>
        </div>
      </div>

      {open && (
        <article className="acc-report" id="client-report">
          {/* Letterhead */}
          <header className="rep-head">
            <div>
              <span className="label acc-gold">Joe Bryant — Client Report</span>
              <h1 className="serif rep-name">{client.name}</h1>
              <p className="rep-meta">
                {[client.company, client.role, client.category].filter(Boolean).join("  ·  ")}
                {client.vip ? "  ·  ★ VIP" : ""}
              </p>
            </div>
            <div className="rep-stamp">
              <span className="label">Generated</span>
              <p className="serif">{fmtDate(new Date().toISOString().slice(0, 10))}</p>
            </div>
          </header>

          <hr className="rep-rule" />

          {/* Contact + timeline */}
          <div className="rep-grid">
            <div>
              <span className="label acc-gold">Contact</span>
              <p className="rep-line">{client.email || "—"}</p>
              {(client.altEmails || []).map((e) => (
                <p className="rep-line rep-dim" key={e}>{e}</p>
              ))}
              {client.phone ? <p className="rep-line">{client.phone}</p> : null}
              {client.location ? <p className="rep-line">{client.location}</p> : null}
            </div>
            <div>
              <span className="label acc-gold">Relationship</span>
              <p className="rep-line">{m.count} project{m.count === 1 ? "" : "s"} on record</p>
              {m.first ? <p className="rep-line rep-dim">First contact · {fmtDate(m.first)}</p> : null}
              {m.last ? <p className="rep-line rep-dim">Most recent · {fmtDate(m.last)}</p> : null}
              {client.crmNotes ? <p className="rep-line">{client.crmNotes}</p> : null}
            </div>
          </div>

          {/* Value cards */}
          <div className="rep-cards">
            {cards.map(([k, v]) => (
              <div className="rep-card" key={k}>
                <span className="label">{k}</span>
                <p className="serif">{v}</p>
              </div>
            ))}
          </div>

          {/* Project history */}
          <span className="label acc-gold rep-section-label">Project history</span>
          <table className="rep-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Property</th>
                <th className="rep-num">Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {ordered.map((pr) => {
                const total = (pr.invoices || []).reduce((s, i) => s + (Number(i.amount) || 0), 0);
                return (
                  <tr key={pr.id}>
                    <td>{pr.shootDate ? fmtDate(pr.shootDate) : "—"}</td>
                    <td>{pr.address || pr.propertyName}</td>
                    <td className="rep-num">{fmtMoney(total)}</td>
                    <td>{pr.status}</td>
                  </tr>
                );
              })}
              {ordered.length === 0 && (
                <tr><td colSpan={4} className="rep-dim">No projects on record yet.</td></tr>
              )}
            </tbody>
            {ordered.length > 0 && (
              <tfoot>
                <tr>
                  <td colSpan={2}>Lifetime collected</td>
                  <td className="rep-num">{fmtMoney(m.lifetime)}</td>
                  <td>{m.open > 0 ? `${fmtMoney(m.open)} open` : "—"}</td>
                </tr>
              </tfoot>
            )}
          </table>

          {/* Commission estimator */}
          <span className="label acc-gold rep-section-label">Commission estimator</span>
          <p className="acc-sub rep-no-print-note">
            Estimate this client&rsquo;s likely commission on a listing — by listing type and how many
            agents split the listing side. Rates are editable.
          </p>
          <div className="rep-calc">
            <label>
              <span className="label">Sale price</span>
              <input
                inputMode="numeric"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="$2,500,000"
              />
            </label>
            <label>
              <span className="label">Listing type</span>
              <select value={type} onChange={(e) => chooseType(e.target.value)}>
                {Object.keys(LISTING_TYPES).map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
            <label>
              <span className="label">Listing-side rate %</span>
              <input
                inputMode="decimal"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
              />
            </label>
            <label>
              <span className="label"># Agents on listing</span>
              <input
                type="number"
                min="1"
                value={agents}
                onChange={(e) => setAgents(e.target.value)}
              />
            </label>
          </div>

          <div className="rep-result">
            <div className="rep-result-main">
              <span className="label acc-gold">Est. commission · per agent</span>
              <p className="serif rep-big">{fmtMoney(perAgent)}</p>
              <p className="rep-dim">
                {fmtMoney(grossSide)} listing side ({rate || 0}% of {fmtMoney(p)}) ÷ {Math.max(1, Number(agents) || 1)} agent
                {Number(agents) === 1 ? "" : "s"}
              </p>
            </div>
            <div className="rep-result-ref">
              <label className="rep-toggle">
                <input
                  type="checkbox"
                  checked={showReferral}
                  onChange={(e) => setShowReferral(e.target.checked)}
                />
                <span className="label">Estimate my referral cut</span>
              </label>
              {showReferral && (
                <>
                  <div className="rep-ref-row">
                    <input
                      inputMode="decimal"
                      value={referral}
                      onChange={(e) => setReferral(e.target.value)}
                      aria-label="Referral percent"
                    />
                    <span className="label">% of their commission</span>
                  </div>
                  <p className="serif rep-mid">{fmtMoney(referralCut)}</p>
                </>
              )}
            </div>
          </div>

          <p className="rep-foot">
            Estimates only — actual commission depends on the executed listing agreement and co-broke
            split. Reconstructed financials; verify in Square / WaveApps. · joebryant.co
          </p>
        </article>
      )}
    </section>
  );
}
