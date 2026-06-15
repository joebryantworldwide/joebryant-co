"use client";

// Admin project editor — status, gallery, invoices, payment confirmation,
// prep share link and the client message thread, all on one page.

import { useState } from "react";
import { useRouter } from "next/navigation";
import DateField from "./DateField";
import MessagePanel from "./MessagePanel";
import InvoiceThread from "./InvoiceCard";
import { fmtDate, fmtTime, fmtMoney, STATUS_TONE } from "../../lib/access/format";
import { STATUSES } from "../../lib/access/constants";
import { STATUS_TRIGGERS } from "../../lib/access/status";

async function adminAction(payload) {
  const res = await fetch("/api/access/admin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return { ok: res.ok, data: await res.json().catch(() => ({})) };
}

export default function AdminProject({ project, client, messages, me, shareUrl, smugmugReady }) {
  const router = useRouter();
  const refresh = () => router.refresh();
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [addingInvoice, setAddingInvoice] = useState(false);
  const [galleryCopied, setGalleryCopied] = useState(false);
  const galleryUrl = (shareUrl || "").replace("/prep/", "/gallery/");
  const [albums, setAlbums] = useState(project.galleries || []);
  const pendingRequests = (project.editRequests || []).filter((r) => r.status === "Pending");

  async function resolveRequest(requestId) {
    await adminAction({ action: "resolveRequest", projectId: project.id, requestId });
    refresh();
  }

  const addAlbum = () => setAlbums((a) => [...a, { name: "", url: "" }]);
  const setAlbum = (i, f, v) => setAlbums((a) => a.map((x, idx) => (idx === i ? { ...x, [f]: v } : x)));
  const removeAlbum = (i) => setAlbums((a) => a.filter((_, idx) => idx !== i));

  async function saveDetails(e) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    await adminAction({
      action: "updateProject",
      projectId: project.id,
      propertyName: fd.get("propertyName"),
      address: fd.get("address"),
      shootDate: fd.get("shootDate"),
      smugmugUrl: fd.get("smugmugUrl"),
      coverImage: fd.get("coverImage"),
      notes: fd.get("notes"),
      galleries: albums,
    });
    setSaving(false);
    setSavedAt(Date.now());
    setTimeout(() => setSavedAt(null), 2500);
    refresh();
  }

  async function confirmPayment() {
    await adminAction({ action: "confirmPayment", projectId: project.id });
    refresh();
  }

  async function addInvoice(e) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await adminAction({
      action: "addInvoice",
      projectId: project.id,
      title: fd.get("title"),
      amount: fd.get("amount"),
      squareUrl: fd.get("squareUrl"),
      dueDate: fd.get("dueDate"),
    });
    setAddingInvoice(false);
    refresh();
  }

  const invoices = project.invoices || [];
  const invoiceThreads = invoices
    .filter((i) => !i.parentId)
    .map((root) => ({ root, children: invoices.filter((i) => i.parentId === root.id) }));

  return (
    <div className="acc-admin">
      <section className="acc-section">
        <div className="acc-section-head">
          <h2 className="serif">{project.propertyName}</h2>
          <span className={`acc-status ${STATUS_TONE[project.status] || "neutral"}`}>
            {project.status}
          </span>
        </div>
        <p className="acc-sub">
          {client ? `${client.name}${client.company ? ` — ${client.company}` : ""} · ${client.email} · ${client.phone || ""}` : "No client attached"}
        </p>

        <a
          className="acc-btn primary acc-clientview"
          href={`/access/projects/${project.id}`}
          target="_blank"
          rel="noreferrer"
        >
          View as client ↗
        </a>
        <p className="acc-sub">
          Opens exactly what {client ? client.name.split(" ")[0] : "the client"} sees —
          gallery, prep guide, invoices and messages.
        </p>

        {pendingRequests.length > 0 && (
          <div className="acc-card acc-reqcard">
            <div className="acc-section-head">
              <span className="label acc-gold">Pending edit requests · {pendingRequests.length}</span>
              <span className="acc-status alert">Needs attention</span>
            </div>
            {pendingRequests.map((r) => (
              <div className="acc-editreq" key={r.id}>
                <div className="acc-editreq-main">
                  <span className="serif">{r.imageName || "Photo"}{r.setName ? ` · ${r.setName}` : ""}</span>
                  <span className="label">{(r.categories || []).join(" · ") || "Edit"}{r.note ? ` — “${r.note}”` : ""}</span>
                  <span className="label">{fmtTime(r.createdAt)}</span>
                </div>
                <button className="acc-btn primary" onClick={() => resolveRequest(r.id)}>Mark done</button>
              </div>
            ))}
            {project.smugmugUrl && (
              <a className="acc-linkbtn label" href={project.smugmugUrl} target="_blank" rel="noreferrer">
                Open album to replace the image ↗
              </a>
            )}
          </div>
        )}

        {project.payment?.awaitingVerification && (
          <div className="acc-queue-item">
            <div>
              <span className="acc-status alert">Payment verification</span>
              <p>
                Client selected <strong>{project.payment.manualMethod}</strong> — confirm once it
                lands and they&rsquo;re notified automatically.
              </p>
            </div>
            <button className="acc-btn primary" onClick={confirmPayment}>
              Confirm receipt
            </button>
          </div>
        )}

        <div className="acc-card">
          <div className="acc-section-head" style={{ marginBottom: "1.2rem" }}>
            <span className="label acc-gold">Status — automatic</span>
            <span className="label">{STATUS_TRIGGERS[project.status] || ""}</span>
          </div>
          <ol className="acc-timeline">
            {STATUSES.map((s, i) => {
              const idx = STATUSES.indexOf(project.status);
              return (
                <li key={s} className={i < idx ? "past" : i === idx ? "now" : ""}>
                  <span className="acc-timeline-dot" aria-hidden="true" />
                  {s}
                </li>
              );
            })}
          </ol>
          <p className="acc-sub">
            Status advances itself as payments, the shoot date and gallery delivery
            happen — there&rsquo;s nothing to set by hand.
          </p>
        </div>

        <form className="acc-form acc-card" onSubmit={saveDetails}>
          <span className="label acc-gold">Details &amp; gallery</span>
          <div className="acc-form-grid">
            <label>
              <span className="label">Property name</span>
              <input name="propertyName" defaultValue={project.propertyName} required />
            </label>
            <label>
              <span className="label">Shoot date</span>
              <DateField name="shootDate" defaultValue={project.shootDate || ""} />
            </label>
            <label className="wide">
              <span className="label">Address</span>
              <input name="address" defaultValue={project.address || ""} />
            </label>
            <label className="wide">
              <span className="label">
                SmugMug gallery link
                {smugmugReady ? (
                  <span className="acc-chip gold" style={{ marginLeft: "0.6rem" }}>
                    Connected ✓
                  </span>
                ) : (
                  <span className="acc-chip" style={{ marginLeft: "0.6rem" }}>
                    Preview mode
                  </span>
                )}
              </span>
              <input
                name="smugmugUrl"
                type="url"
                defaultValue={project.smugmugUrl || ""}
                placeholder="https://…smugmug.com/…"
              />
              <span className="acc-sub" style={{ marginTop: "0.4rem" }}>
                Paste the gallery&rsquo;s share link. Their photos render natively in
                the client&rsquo;s Gallery tab.
                {!smugmugReady && " Add SmugMug keys (README) to go live."}
              </span>
            </label>
            <div className="wide">
              <span className="label">Albums (Interiors, Exteriors, Special Edits, Social Crops…)</span>
              <span className="acc-sub" style={{ display: "block", margin: "0.3rem 0 0.7rem" }}>
                Add a SmugMug link per album — each becomes a selectable set in the client&rsquo;s gallery. Leave empty to use just the single link above.
              </span>
              {albums.map((a, i) => (
                <div className="acc-album-row" key={i}>
                  <input placeholder="Album name" value={a.name} onChange={(e) => setAlbum(i, "name", e.target.value)} />
                  <input placeholder="https://…smugmug.com/…" value={a.url} onChange={(e) => setAlbum(i, "url", e.target.value)} />
                  <button type="button" className="acc-invoice-rowdel" onClick={() => removeAlbum(i)} aria-label="Remove album">✕</button>
                </div>
              ))}
              <button type="button" className="acc-linkbtn label" onClick={addAlbum}>+ Add album</button>
            </div>
            <label className="wide">
              <span className="label">Cover image URL (shows on their dashboard)</span>
              <input name="coverImage" type="url" defaultValue={project.coverImage || ""} />
            </label>
            <label className="wide">
              <span className="label">Notes (visible to the client)</span>
              <textarea name="notes" rows={3} defaultValue={project.notes || ""} />
            </label>
          </div>
          <button className="acc-btn primary" disabled={saving}>
            {saving ? "Saving…" : savedAt ? "Saved ✓" : "Save details"}
          </button>
        </form>

        <div className="acc-card">
          <span className="label acc-gold">Prep guide</span>
          <p className="acc-sub">
            Share link:{" "}
            <a href={shareUrl} target="_blank" rel="noreferrer">
              {shareUrl}
            </a>
          </p>
        </div>

        {project.smugmugUrl && (
          <div className="acc-card">
            <span className="label acc-gold">Client gallery</span>
            <p className="acc-sub">
              Their cinematic gallery — share this when the photos are ready:
            </p>
            <div className="acc-invoice-square-row">
              <a className="acc-btn primary" href={galleryUrl} target="_blank" rel="noreferrer">
                Open gallery ↗
              </a>
              <button className="acc-btn" onClick={() => { navigator.clipboard?.writeText(galleryUrl); setGalleryCopied(true); setTimeout(() => setGalleryCopied(false), 1800); }}>
                {galleryCopied ? "Copied ✓" : "Copy gallery link"}
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="acc-section">
        <div className="acc-section-head">
          <h2 className="serif">Invoices</h2>
          <button className="acc-btn" onClick={() => setAddingInvoice((v) => !v)}>
            {addingInvoice ? "Cancel" : "Add invoice"}
          </button>
        </div>

        {addingInvoice && (
          <form className="acc-form acc-card" onSubmit={addInvoice}>
            <div className="acc-form-grid">
              <label>
                <span className="label">For</span>
                <input name="title" required placeholder="Retainer — 50% to confirm" />
              </label>
              <label>
                <span className="label">Amount (USD)</span>
                <input name="amount" type="number" min="0" step="1" required />
              </label>
              <label className="wide">
                <span className="label">Square payment / invoice link</span>
                <input name="squareUrl" type="url" placeholder="https://square.link/…" />
              </label>
              <label>
                <span className="label">Due</span>
                <DateField name="dueDate" />
              </label>
            </div>
            <button className="acc-btn primary">Add invoice</button>
          </form>
        )}

        {invoiceThreads.map((t) => (
          <InvoiceThread
            key={t.root.id}
            root={t.root}
            children={t.children}
            project={project}
            client={client}
            onAction={adminAction}
            refresh={refresh}
          />
        ))}
        {invoices.length === 0 && !addingInvoice && (
          <p className="acc-sub">No invoices yet — add one to bill this project.</p>
        )}
      </section>

      <section className="acc-section">
        <div className="acc-section-head">
          <h2 className="serif">Messages</h2>
        </div>
        <MessagePanel project={project} messages={messages} me={me} isAdmin />
      </section>
    </div>
  );
}
