"use client";

// One client, from Joe's side — profile, login credentials, projects.

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fmtDate, fmtMoney, STATUS_TONE } from "../../lib/access/format";
import { ROLES } from "../../lib/access/constants";
import ClientReport from "./ClientReport";

// Roll a client's whole history into the headline relationship numbers.
function relationship(client, projects) {
  const invoices = projects.flatMap((p) => p.invoices || []);
  const sum = (arr) => arr.reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const paid = invoices.filter((i) => i.status === "Paid");
  const lifetime = sum(paid);
  const billed = sum(invoices);
  const open = Math.max(0, billed - lifetime);
  const thisYear = sum(
    paid.filter((i) => (i.paidDate || "").slice(0, 4) === String(new Date().getFullYear()))
  );
  const dates = projects.map((p) => p.shootDate).filter(Boolean).sort();
  const first = client.firstContact || dates[0] || "";
  const last = client.lastContact || dates[dates.length - 1] || "";
  let days = 0;
  if (first && last) days = (new Date(last) - new Date(first)) / 86400000;
  const span = Math.max(days, 30); // avoid divide-by-zero / runaway rates
  const perYear = lifetime / (span / 365.25);
  const perMonth = lifetime / (span / 30.44);
  const perWeek = lifetime / (span / 7);
  // Upcoming = open balances + any future-dated shoots.
  const upcoming =
    open +
    sum(
      projects
        .filter((p) => p.shootDate && new Date(p.shootDate) > new Date())
        .flatMap((p) => (p.invoices || []).filter((i) => i.status !== "Paid"))
    );
  return { lifetime, billed, open, thisYear, perYear, perMonth, perWeek, upcoming, first, last, count: projects.length };
}

async function adminAction(payload) {
  const res = await fetch("/api/access/admin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return { ok: res.ok, data: await res.json().catch(() => ({})) };
}

export default function AdminClient({ client, projects }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [code, setCode] = useState(client.accessCode);
  const rel = relationship(client, projects);

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    await adminAction({
      action: "updateClient",
      userId: client.id,
      name: fd.get("name"),
      email: fd.get("email"),
      phone: fd.get("phone"),
      company: fd.get("company"),
      role: fd.get("role"),
      birthdate: fd.get("birthdate"),
      location: fd.get("location"),
      crmNotes: fd.get("crmNotes"),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    router.refresh();
  }

  async function resetCode() {
    const { ok, data } = await adminAction({ action: "resetCode", userId: client.id });
    if (ok) {
      setCode(data.accessCode);
      setShowCode(true);
    }
  }

  return (
    <div className="acc-admin">
      <section className="acc-section">
        <div className="acc-section-head">
          <h2 className="serif">
            {client.name}
            {client.vip ? <span className="acc-gold" style={{ marginLeft: 8 }}>★ VIP</span> : null}
          </h2>
          <span className="label">
            {client.role}
            {client.category ? ` · ${client.category}` : ""}
          </span>
        </div>

        {/* Relationship snapshot — lifetime value and run-rate, computed from history */}
        <div className="acc-form-grid" style={{ marginBottom: "1rem" }}>
          {[
            ["Lifetime", fmtMoney(rel.lifetime), "collected to date"],
            ["Avg / Year", fmtMoney(rel.perYear), "run-rate"],
            ["Avg / Month", fmtMoney(rel.perMonth), "run-rate"],
            ["Avg / Week", fmtMoney(rel.perWeek), "run-rate"],
            ["This Year", fmtMoney(rel.thisYear), String(new Date().getFullYear())],
            ["Upcoming / Open", fmtMoney(rel.upcoming), "future + unpaid"],
          ].map(([k, v, sub]) => (
            <div className="acc-card" key={k} style={{ textAlign: "center" }}>
              <span className="label acc-gold">{k}</span>
              <p className="serif" style={{ fontSize: "1.35rem", margin: "0.2rem 0" }}>{v}</p>
              <span className="label">{sub}</span>
            </div>
          ))}
        </div>
        <p className="acc-sub" style={{ marginBottom: "1rem" }}>
          {rel.count} project{rel.count === 1 ? "" : "s"} on record
          {rel.first ? ` · first ${fmtDate(rel.first)}` : ""}
          {rel.last ? ` · latest ${fmtDate(rel.last)}` : ""}
          {rel.open > 0 ? ` · ${fmtMoney(rel.open)} unconfirmed (verify in Square)` : ""}
        </p>

        <form className="acc-form acc-card" onSubmit={save}>
          <div className="acc-form-grid">
            <label>
              <span className="label">Name</span>
              <input name="name" defaultValue={client.name} required />
            </label>
            <label>
              <span className="label">Email (their login)</span>
              <input name="email" type="email" defaultValue={client.email} required />
            </label>
            <label>
              <span className="label">Phone</span>
              <input name="phone" defaultValue={client.phone || ""} />
            </label>
            <label>
              <span className="label">Company</span>
              <input name="company" defaultValue={client.company || ""} />
            </label>
            <label>
              <span className="label">Role</span>
              <select name="role" defaultValue={client.role}>
                {ROLES.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </label>
            <label>
              <span className="label">Birthdate</span>
              <input name="birthdate" type="date" defaultValue={client.birthdate || ""} />
            </label>
            <label>
              <span className="label">Location</span>
              <input name="location" defaultValue={client.location || ""} placeholder="e.g. Los Angeles, CA" />
            </label>
            <label style={{ gridColumn: "1 / -1" }}>
              <span className="label">Relationship notes</span>
              <input name="crmNotes" defaultValue={client.crmNotes || ""} placeholder="History, preferences, referral source…" />
            </label>
          </div>
          {client.altEmails?.length ? (
            <p className="acc-sub">Other emails on file: {client.altEmails.join(", ")}</p>
          ) : null}
          <button className="acc-btn primary" disabled={saving}>
            {saving ? "Saving…" : saved ? "Saved ✓" : "Save profile"}
          </button>
        </form>

        <div className="acc-card">
          <span className="label acc-gold">Login</span>
          <p className="acc-sub">
            {client.email} · access code {showCode ? <strong>{code}</strong> : "••••••"}
          </p>
          <div className="acc-form-actions">
            <button className="acc-btn" onClick={() => setShowCode((s) => !s)}>
              {showCode ? "Hide code" : "Show code"}
            </button>
            <button className="acc-btn" onClick={resetCode}>
              Reset code
            </button>
          </div>
        </div>
      </section>

      <section className="acc-section">
        <div className="acc-section-head">
          <h2 className="serif">Project history</h2>
          <span className="label">
            {rel.count} project{rel.count === 1 ? "" : "s"} · {fmtMoney(rel.lifetime)} collected
            {rel.open > 0 ? ` · ${fmtMoney(rel.open)} open` : ""}
          </span>
        </div>
        {projects.length === 0 && <p className="acc-sub">No projects on record yet.</p>}

        {[...projects]
          .sort((a, b) => (b.shootDate || "").localeCompare(a.shootDate || ""))
          .map((p) => {
            const invoices = p.invoices || [];
            const total = invoices.reduce((s, i) => s + (Number(i.amount) || 0), 0);
            const collected = invoices
              .filter((i) => i.status === "Paid")
              .reduce((s, i) => s + (Number(i.amount) || 0), 0);
            const open = Math.max(0, total - collected);
            return (
              <div className="acc-card" key={p.id} style={{ marginBottom: "0.85rem" }}>
                <div className="acc-section-head" style={{ marginBottom: "0.4rem" }}>
                  <div>
                    <span className="serif" style={{ fontSize: "1.1rem" }}>{p.propertyName}</span>
                    {p.address ? (
                      <p className="label" style={{ margin: "0.15rem 0 0" }}>{p.address}</p>
                    ) : (
                      <p className="label" style={{ margin: "0.15rem 0 0", opacity: 0.6 }}>
                        Address not on file — add manually
                      </p>
                    )}
                  </div>
                  <span className={`acc-status ${STATUS_TONE[p.status] || "neutral"}`}>{p.status}</span>
                </div>

                <p className="acc-sub" style={{ marginBottom: "0.5rem" }}>
                  {p.shootDate ? fmtDate(p.shootDate) : "Unscheduled"} ·{" "}
                  <strong>{fmtMoney(total)}</strong> billed · {fmtMoney(collected)} collected
                  {open > 0 ? ` · ${fmtMoney(open)} open (verify in Square)` : ""}
                </p>

                {invoices.length > 0 && (
                  <div className="acc-table">
                    {invoices.map((inv) => (
                      <div className="acc-row" key={inv.id} style={{ cursor: "default" }}>
                        <div className="acc-row-main">
                          <span>{inv.title || `Invoice #${inv.number}`}</span>
                          <span className="label">
                            {inv.paidDate
                              ? `Paid ${fmtDate(inv.paidDate)}`
                              : inv.dueDate
                              ? `Due ${fmtDate(inv.dueDate)}`
                              : ""}
                          </span>
                        </div>
                        <div className="acc-row-side">
                          <span className="label">{fmtMoney(inv.amount)}</span>
                          <span className={`acc-status ${inv.status === "Paid" ? "gold" : "alert"}`}>
                            {inv.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {p.notes ? (
                  <p className="acc-sub" style={{ marginTop: "0.5rem", opacity: 0.75 }}>{p.notes}</p>
                ) : null}

                <div className="acc-form-actions" style={{ marginTop: "0.5rem" }}>
                  <Link href={`/access/admin/projects/${p.id}`} className="acc-btn">
                    Open / edit project →
                  </Link>
                </div>
              </div>
            );
          })}
      </section>

      <ClientReport client={client} projects={projects} />
    </div>
  );
}
