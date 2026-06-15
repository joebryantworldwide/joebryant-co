"use client";

// Financials hub — lifetime revenue, outstanding, a 6-month revenue bar,
// and a searchable/filterable ledger of every invoice across all projects.
// Each row links straight to its project. New invoices attach to any project.

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ConnectionPill from "./ConnectionPill";
import ReportView from "./ReportView";
import { fmtDate, fmtMoney } from "../../lib/access/format";

async function adminAction(payload) {
  const res = await fetch("/api/access/admin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return { ok: res.ok, data: await res.json().catch(() => ({})) };
}

const STATUSES = ["All", "Open", "Awaiting Verification", "Paid"];

export default function Financials({ invoices, summary, revenue, projects }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("All");
  const [creating, setCreating] = useState(false);
  const [reporting, setReporting] = useState(false);

  function focusStatus(s) {
    setStatus(s);
    if (typeof document !== "undefined") {
      document.querySelector(".acc-ledger")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  const peak = Math.max(1, ...revenue.map((r) => r.total));
  const needle = q.trim().toLowerCase();

  const rows = useMemo(() => {
    return invoices.filter((i) => {
      if (status !== "All" && i.status !== status) return false;
      if (!needle) return true;
      return [i.title, i.clientName, i.projectName, i.number]
        .filter(Boolean).join(" ").toLowerCase().includes(needle);
    });
  }, [invoices, status, needle]);

  const filteredTotal = rows.reduce((s, i) => s + (i.amount || 0), 0);

  return (
    <>
      <section className="acc-section">
        <div className="acc-toolbar">
          <ConnectionPill service="Square" />
          <button className="acc-btn" onClick={() => setReporting(true)}>Create report</button>
        </div>

        <div className="acc-stats">
          <button className="acc-stat acc-stat-link" onClick={() => focusStatus("Paid")}>
            <span className="acc-stat-num serif">{fmtMoney(summary.lifetime)}</span>
            <span className="label">Lifetime revenue ›</span>
          </button>
          <button className="acc-stat acc-stat-link" onClick={() => focusStatus("Open")}>
            <span className="acc-stat-num serif">{fmtMoney(summary.outstanding)}</span>
            <span className="label">Outstanding · {summary.openCount} open ›</span>
          </button>
          <button className="acc-stat acc-stat-link" onClick={() => focusStatus("Paid")}>
            <span className="acc-stat-num serif">{fmtMoney(summary.paidThisMonth)}</span>
            <span className="label">Paid this month ›</span>
          </button>
          <button className="acc-stat acc-stat-link" onClick={() => focusStatus("All")}>
            <span className="acc-stat-num serif">{summary.invoiceCount}</span>
            <span className="label">Total invoices ›</span>
          </button>
        </div>

        <div className="acc-card acc-revchart">
          <span className="label acc-gold">Revenue · last 6 months</span>
          <div className="acc-bars">
            {revenue.map((r) => (
              <div className="acc-bar-col" key={r.key}>
                <div className="acc-bar-track">
                  <div
                    className="acc-bar-fill"
                    style={{ height: `${Math.round((r.total / peak) * 100)}%` }}
                    title={fmtMoney(r.total)}
                  />
                </div>
                <span className="label">{r.label}</span>
                <span className="acc-bar-val label">{r.total ? fmtMoney(r.total) : "—"}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="acc-section">
        <div className="acc-section-head">
          <h2 className="serif">Invoices</h2>
          <button className="acc-btn primary" onClick={() => setCreating((v) => !v)}>
            {creating ? "Cancel" : "New invoice"}
          </button>
        </div>

        {creating && (
          <NewInvoice projects={projects} onDone={() => { setCreating(false); router.refresh(); }} />
        )}

        <div className="acc-filterbar">
          <input
            className="acc-search"
            type="search"
            placeholder="Search by client, project, title…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <div className="acc-chip-row">
            {STATUSES.map((s) => (
              <button
                key={s}
                className={`acc-filter-chip${status === s ? " active" : ""}`}
                onClick={() => setStatus(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <p className="acc-sub">
          {rows.length} invoice{rows.length === 1 ? "" : "s"} · {fmtMoney(filteredTotal)}
        </p>

        <div className="acc-ledger">
          {rows.map((i) => (
            <Link href={`/access/admin/projects/${i.projectId}`} className="acc-ledger-row" key={i.id}>
              <span className="acc-ledger-main">
                <span className="serif">{i.title}</span>
                <span className="label">{i.clientName} · {i.projectName}{i.number ? ` · #${i.number}` : ""}</span>
              </span>
              <span className="acc-ledger-side">
                <span className="acc-ledger-when label">
                  {i.status === "Paid" ? `Paid ${fmtDate(i.paidDate)}` : i.dueDate ? `Due ${fmtDate(i.dueDate)}` : "Open"}
                </span>
                <span className="serif acc-amount">{fmtMoney(i.amount)}</span>
                <span className={`acc-status ${i.status === "Paid" ? "gold" : i.status === "Awaiting Verification" ? "alert" : "neutral"}`}>
                  {i.status === "Paid" ? "Paid" : i.status === "Awaiting Verification" ? "Verifying" : "Open"}
                </span>
              </span>
            </Link>
          ))}
          {rows.length === 0 && <p className="acc-sub">No invoices match.</p>}
        </div>
      </section>

      {reporting && (
        <ReportView
          title="Financial Summary"
          subtitle="All projects · all invoices"
          summary={`Joe Bryant — Financial Summary. Lifetime ${fmtMoney(summary.lifetime)}, outstanding ${fmtMoney(summary.outstanding)} across ${summary.openCount} open invoices.`}
          onClose={() => setReporting(false)}
        >
          <div className="rep-kpis">
            <div className="rep-kpi"><span className="rep-kpi-num">{fmtMoney(summary.lifetime)}</span><span>Lifetime revenue</span></div>
            <div className="rep-kpi"><span className="rep-kpi-num">{fmtMoney(summary.outstanding)}</span><span>Outstanding</span></div>
            <div className="rep-kpi"><span className="rep-kpi-num">{fmtMoney(summary.paidThisMonth)}</span><span>Paid this month</span></div>
            <div className="rep-kpi"><span className="rep-kpi-num">{summary.invoiceCount}</span><span>Total invoices</span></div>
          </div>
          <table className="rep-table">
            <thead><tr><th>Invoice</th><th>Client</th><th>Project</th><th>Status</th><th className="num">Amount</th></tr></thead>
            <tbody>
              {invoices.map((i) => (
                <tr key={i.id}>
                  <td>{i.title}</td><td>{i.clientName}</td><td>{i.projectName}</td>
                  <td>{i.status}</td><td className="num">{fmtMoney(i.amount)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot><tr><td colSpan={4}>Total billed</td><td className="num">{fmtMoney(invoices.reduce((s, i) => s + (i.amount || 0), 0))}</td></tr></tfoot>
          </table>
        </ReportView>
      )}
    </>
  );
}

function NewInvoice({ projects, onDone }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (!fd.get("projectId")) { setError("Pick a project."); return; }
    setBusy(true);
    const { ok, data } = await adminAction({
      action: "addInvoice",
      projectId: fd.get("projectId"),
      title: fd.get("title"),
      amount: Number(fd.get("amount")) || 0,
      dueDate: fd.get("dueDate"),
    });
    setBusy(false);
    if (ok) onDone();
    else setError(data.error || "Couldn't create invoice.");
  }

  return (
    <form className="acc-card acc-form" onSubmit={submit}>
      <div className="acc-form-grid">
        <label>
          <span className="label">Project</span>
          <select name="projectId" required defaultValue="">
            <option value="" disabled>Choose…</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </label>
        <label>
          <span className="label">For</span>
          <input name="title" required placeholder="Retainer — 50% to confirm" />
        </label>
        <label>
          <span className="label">Amount (USD)</span>
          <input name="amount" type="number" min="0" step="1" required />
        </label>
        <label>
          <span className="label">Due (optional)</span>
          <input name="dueDate" type="date" />
        </label>
      </div>
      {error && <p className="acc-error">{error}</p>}
      <button className="acc-btn primary" disabled={busy}>{busy ? "Creating…" : "Create invoice"}</button>
    </form>
  );
}
