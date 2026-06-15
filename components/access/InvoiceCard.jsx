"use client";

// A full, beautiful, editable invoice document. Collapsed it's a summary
// row; click to open the invoice itself — line items you can edit, a live
// total, mark paid/unpaid, and (once paid) "Add a charge", which spins up
// a linked Part-2 invoice in the same thread.

import { useState } from "react";
import RequestInfo from "./RequestInfo";
import ConnectionPill from "./ConnectionPill";
import { fmtDate, fmtMoney } from "../../lib/access/format";
import { invoiceTotal } from "../../lib/access/status";

function normalizeItems(inv) {
  if (Array.isArray(inv.lineItems) && inv.lineItems.length) {
    return inv.lineItems.map((li) => ({ ...li }));
  }
  return [{ description: inv.title || "Photography services", amount: inv.amount || 0 }];
}

export default function InvoiceThread({ root, children, project, client, onAction, refresh }) {
  // A thread = the root invoice plus any additional-charge invoices.
  const parts = [root, ...children];
  return (
    <div className="acc-invoice-thread">
      {parts.map((inv, i) => (
        <InvoiceCard
          key={inv.id}
          invoice={inv}
          part={parts.length > 1 ? i + 1 : 0}
          partCount={parts.length}
          project={project}
          client={client}
          onAction={onAction}
          refresh={refresh}
        />
      ))}
    </div>
  );
}

function InvoiceCard({ invoice, part, partCount, project, client, onAction, refresh }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(() => normalizeItems(invoice));
  const [title, setTitle] = useState(invoice.title || "");
  const [due, setDue] = useState(invoice.dueDate || "");
  const [square, setSquare] = useState(invoice.squareUrl || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [adding, setAdding] = useState(false);
  const [sqBusy, setSqBusy] = useState(false);
  const [sqMsg, setSqMsg] = useState("");
  const [copied, setCopied] = useState(false);
  const [askingInfo, setAskingInfo] = useState(false);
  const [infoBusy, setInfoBusy] = useState(false);

  function copyLink() {
    navigator.clipboard?.writeText(invoice.squareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const paid = invoice.status === "Paid";
  const total = items.reduce((s, li) => s + (Number(li.amount) || 0), 0);

  function setItem(idx, field, value) {
    setItems((rows) => rows.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
  }
  function addRow() {
    setItems((rows) => [...rows, { description: "", amount: 0 }]);
  }
  function removeRow(idx) {
    setItems((rows) => (rows.length > 1 ? rows.filter((_, i) => i !== idx) : rows));
  }

  async function save() {
    setSaving(true);
    await onAction({
      action: "updateInvoice",
      projectId: project.id,
      invoiceId: invoice.id,
      title,
      dueDate: due,
      squareUrl: square,
      lineItems: items,
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    refresh();
  }

  async function togglePaid() {
    await onAction({
      action: "updateInvoice",
      projectId: project.id,
      invoiceId: invoice.id,
      status: paid ? "Open" : "Paid",
    });
    refresh();
  }

  async function generateSquareLink() {
    setSqBusy(true);
    setSqMsg("");
    // Persist the current invoice so the link bills the on-screen total.
    await onAction({
      action: "updateInvoice",
      projectId: project.id,
      invoiceId: invoice.id,
      title,
      dueDate: due,
      squareUrl: square,
      lineItems: items,
    });
    const { ok, data } = await onAction({
      action: "createSquareLink",
      projectId: project.id,
      invoiceId: invoice.id,
    });
    setSqBusy(false);
    setSqMsg(ok ? "Square payment link ready ✓" : data?.error || "Couldn't create link.");
    if (ok) refresh();
  }

  async function checkPayment() {
    setSqBusy(true);
    setSqMsg("");
    const { ok, data } = await onAction({ action: "syncPayments", projectId: project.id });
    setSqBusy(false);
    if (ok) {
      setSqMsg(data.changed ? "Payment received — marked paid ✓" : "No payment received yet.");
      if (data.changed) refresh();
    }
  }

  const num = invoice.number ? `#${invoice.number}` : invoice.id.slice(-4).toUpperCase();

  return (
    <div className={`acc-invoice-card ${paid ? "paid" : ""} ${open ? "open" : ""}`}>
      <button className="acc-invoice-summary" onClick={() => setOpen((v) => !v)}>
        <span className="acc-invoice-summary-main">
          {part > 0 && <span className="acc-part">Part {part}</span>}
          <span className="serif">{invoice.title}</span>
          <span className="label">
            {paid ? `Paid ${fmtDate(invoice.paidDate)}` : invoice.dueDate ? `Due ${fmtDate(invoice.dueDate)}` : "Open"}
            {" · "}Invoice {num}
          </span>
        </span>
        <span className="acc-invoice-summary-side">
          <span className="serif acc-amount">{fmtMoney(invoiceTotal(invoice))}</span>
          {paid ? <span className="acc-chip gold">Paid ✓</span> : <span className="acc-chip">Open</span>}
          <span className="acc-invoice-caret">{open ? "▴" : "▾"}</span>
        </span>
      </button>

      {open && (
        <div className="acc-invoice-doc">
          <div className="acc-invoice-doc-head">
            <div>
              <span className="acc-doc-brand serif">Joe Bryant</span>
              <span className="label">Architectural Photography · Los Angeles</span>
            </div>
            <div className="acc-invoice-doc-meta">
              <span className="acc-doc-word">Invoice</span>
              <span className="label">{num}</span>
              {paid && <span className="acc-paid-stamp">PAID</span>}
            </div>
          </div>

          <div className="acc-invoice-doc-parties">
            <div>
              <span className="label acc-gold">Billed to</span>
              <p className="serif">{client?.name || "—"}</p>
              {client?.company && <p className="acc-sub">{client.company}</p>}
              {client?.email && <p className="acc-sub">{client.email}</p>}
            </div>
            <div>
              <span className="label acc-gold">Project</span>
              <p className="serif">{project.propertyName}</p>
              {project.address && <p className="acc-sub">{project.address}</p>}
            </div>
          </div>

          <label className="acc-invoice-titlefield">
            <span className="label">Invoice title</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>

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
                    type="number"
                    min="0"
                    step="1"
                    value={li.amount}
                    onChange={(e) => setItem(i, "amount", e.target.value)}
                  />
                  <button
                    className="acc-invoice-rowdel"
                    onClick={() => removeRow(i)}
                    aria-label="Remove line"
                    title="Remove line"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
            <button className="acc-linkbtn label" onClick={addRow}>
              + Add line item
            </button>
          </div>

          <div className="acc-invoice-total">
            <span className="label">Total</span>
            <span className="serif">{fmtMoney(total)}</span>
          </div>

          <div className="acc-invoice-doc-fields">
            <label>
              <span className="label">Due date</span>
              <input type="date" value={due || ""} onChange={(e) => setDue(e.target.value)} />
            </label>
            <label>
              <span className="label">Square payment link</span>
              <input
                type="url"
                value={square}
                placeholder="https://square.link/…"
                onChange={(e) => setSquare(e.target.value)}
              />
            </label>
          </div>

          <div className="acc-invoice-doc-actions">
            <button className="acc-btn primary" onClick={save} disabled={saving}>
              {saving ? "Saving…" : saved ? "Saved ✓" : "Save invoice"}
            </button>
            <button className="acc-btn" onClick={togglePaid}>
              {paid ? "Mark unpaid" : "Mark paid"}
            </button>
            {paid && (
              <button className="acc-btn gold" onClick={() => setAdding((v) => !v)}>
                {adding ? "Cancel charge" : "Add a charge →"}
              </button>
            )}
            <button className="acc-btn" onClick={() => setAskingInfo((v) => !v)}>
              {askingInfo ? "Close" : "Request info"}
            </button>
          </div>

          {askingInfo && (
            <RequestInfo
              kind="invoice"
              clientName={client?.name}
              contextLabel={invoice.title}
              busy={infoBusy}
              onCancel={() => setAskingInfo(false)}
              onSubmit={async (msg) => {
                setInfoBusy(true);
                await onAction({ action: "requestInfo", projectId: project.id, message: msg });
                setInfoBusy(false);
                setAskingInfo(false);
                setSqMsg("Request sent — they'll see it in their portal.");
              }}
            />
          )}

          <div className="acc-invoice-square">
            <ConnectionPill service="Square" />
            {invoice.squareUrl ? (
              <div className="acc-invoice-square-row">
                <button className="acc-btn" onClick={copyLink}>
                  {copied ? "Copied ✓" : "Copy payment link"}
                </button>
                <a className="acc-linkbtn label" href={invoice.squareUrl} target="_blank" rel="noreferrer">
                  Open ↗
                </a>
                {!paid && (
                  <button className="acc-btn" onClick={checkPayment} disabled={sqBusy}>
                    {sqBusy ? "Checking…" : "Check for payment"}
                  </button>
                )}
              </div>
            ) : (
              <button className="acc-btn" onClick={generateSquareLink} disabled={sqBusy}>
                {sqBusy ? "Creating…" : "Generate Square payment link"}
              </button>
            )}
            {sqMsg && <p className="acc-sub">{sqMsg}</p>}
          </div>

          {adding && (
            <AddCharge
              invoice={invoice}
              project={project}
              onAction={onAction}
              refresh={refresh}
              done={() => setAdding(false)}
            />
          )}
        </div>
      )}
    </div>
  );
}

function AddCharge({ invoice, project, onAction, refresh, done }) {
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!desc || !amount) return;
    setBusy(true);
    await onAction({
      action: "addCharge",
      projectId: project.id,
      invoiceId: invoice.id,
      title: `${invoice.title} — Additional charges`,
      lineItems: [{ description: desc, amount: Number(amount) || 0 }],
    });
    setBusy(false);
    done();
    refresh();
  }

  return (
    <form className="acc-addcharge" onSubmit={submit}>
      <p className="acc-sub">
        This creates a new <strong>linked invoice</strong> (Part&nbsp;2) in this thread — the
        original stays paid and untouched.
      </p>
      <div className="acc-addcharge-row">
        <input
          placeholder="What's the additional charge?"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          required
        />
        <div className="acc-invoice-item-amt">
          <span>$</span>
          <input
            type="number"
            min="0"
            step="1"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>
        <button className="acc-btn primary" disabled={busy}>
          {busy ? "Adding…" : "Create charge"}
        </button>
      </div>
    </form>
  );
}
