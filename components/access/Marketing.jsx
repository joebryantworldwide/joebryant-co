"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import NewsletterDesigner from "./NewsletterDesigner";
import { fmtDate, fmtTime } from "../../lib/access/format";

async function mkt(payload) {
  const res = await fetch("/api/access/marketing", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return { ok: res.ok, data: await res.json().catch(() => ({})) };
}

const TABS = ["Campaigns", "Audience", "Birthdays"];

export default function Marketing({ contacts, campaigns, settings, birthdays }) {
  const router = useRouter();
  const [tab, setTab] = useState("Campaigns");
  const [designing, setDesigning] = useState(null); // campaign object or {} for new

  if (designing) {
    return (
      <NewsletterDesigner
        campaign={designing}
        audienceCount={contacts.length}
        onClose={() => setDesigning(null)}
        onSaved={() => { setDesigning(null); router.refresh(); }}
      />
    );
  }

  return (
    <section className="acc-section">
      <nav className="acc-tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} className={`acc-tab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </nav>

      {tab === "Campaigns" && (
        <Campaigns campaigns={campaigns} contacts={contacts} onDesign={setDesigning} onChanged={() => router.refresh()} />
      )}
      {tab === "Audience" && <Audience contacts={contacts} />}
      {tab === "Birthdays" && <Birthdays birthdays={birthdays} settings={settings} onChanged={() => router.refresh()} />}
    </section>
  );
}

/* ——— Campaigns ——— */
function Campaigns({ campaigns, contacts, onDesign, onChanged }) {
  const [composing, setComposing] = useState(null); // "announcement" | "text" | null

  async function send(id) {
    await mkt({ action: "send", id });
    onChanged();
  }
  async function remove(id) {
    await mkt({ action: "delete", id });
    onChanged();
  }

  return (
    <div className="acc-mkt">
      <div className="acc-mkt-actions">
        <button className="acc-btn primary" onClick={() => onDesign({})}>Design newsletter</button>
        <button className="acc-btn" onClick={() => setComposing("announcement")}>New announcement</button>
        <button className="acc-btn" onClick={() => setComposing("text")}>New text blast</button>
      </div>

      {composing && (
        <Composer type={composing} onClose={() => setComposing(null)} onSaved={() => { setComposing(null); onChanged(); }} />
      )}

      {campaigns.length === 0 && !composing && (
        <p className="acc-sub">No campaigns yet — design a newsletter or send an announcement.</p>
      )}

      <div className="acc-table">
        {campaigns.map((c) => (
          <div className="acc-row acc-mkt-row" key={c.id}>
            <div className="acc-row-main">
              <span className="serif">{c.title}</span>
              <span className="label">
                {c.type} · {c.audience} · {c.status}
                {c.sentAt ? ` · sent ${fmtTime(c.sentAt)}` : c.scheduledAt ? ` · scheduled ${fmtDate(c.scheduledAt)}` : ""}
              </span>
            </div>
            <div className="acc-row-side acc-mkt-rowside">
              {c.type === "newsletter" && <button className="acc-btn" onClick={() => onDesign(c)}>Edit</button>}
              {c.status !== "Sent" && <button className="acc-btn primary" onClick={() => send(c.id)}>Send now</button>}
              <button className="acc-linkbtn label" onClick={() => remove(c.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Composer({ type, onClose, onSaved }) {
  const [busy, setBusy] = useState(false);
  const isText = type === "text";

  async function save(e, send) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget.closest("form"));
    setBusy(true);
    const { ok, data } = await mkt({
      action: "save",
      type,
      title: fd.get("title"),
      bodyText: fd.get("body"),
      audience: fd.get("audience"),
      scheduledAt: fd.get("scheduledAt") || null,
    });
    if (ok && send && data.campaign) await mkt({ action: "send", id: data.campaign.id });
    setBusy(false);
    onSaved();
  }

  return (
    <form className="acc-card acc-form acc-composer">
      <span className="label acc-gold">{isText ? "Text blast" : "Announcement"}</span>
      <div className="acc-form-grid">
        <label><span className="label">Title (internal)</span><input name="title" required placeholder={isText ? "Spring availability text" : "Studio announcement"} /></label>
        <label>
          <span className="label">Audience</span>
          <select name="audience" defaultValue="All">
            <option>All</option><option>Clients</option><option>Leads</option>
          </select>
        </label>
        <label className="wide">
          <span className="label">{isText ? "Message (SMS)" : "Message"}</span>
          <textarea name="body" rows={isText ? 3 : 5} required placeholder={isText ? "Keep it short — texts are billed per segment." : "Write your announcement…"} />
        </label>
        <label><span className="label">Schedule (optional)</span><input name="scheduledAt" type="date" /></label>
      </div>
      <div className="acc-form-actions">
        <button type="button" className="acc-btn" onClick={onClose}>Cancel</button>
        <button type="button" className="acc-btn" disabled={busy} onClick={(e) => save(e, false)}>Save draft</button>
        <button type="button" className="acc-btn primary" disabled={busy} onClick={(e) => save(e, true)}>{busy ? "Sending…" : "Send now"}</button>
      </div>
    </form>
  );
}

/* ——— Audience ——— */
function Audience({ contacts }) {
  const [q, setQ] = useState("");
  const [type, setType] = useState("All");
  const needle = q.trim().toLowerCase();
  const rows = useMemo(() => contacts.filter((c) => {
    if (type !== "All" && c.type !== type) return false;
    if (!needle) return true;
    return [c.name, c.email, c.company].filter(Boolean).join(" ").toLowerCase().includes(needle);
  }), [contacts, type, needle]);

  return (
    <div className="acc-mkt">
      <div className="acc-filterbar">
        <input className="acc-search" type="search" placeholder="Search contacts…" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="acc-chip-row">
          {["All", "Client", "Lead"].map((t) => (
            <button key={t} className={`acc-filter-chip${type === t ? " active" : ""}`} onClick={() => setType(t)}>{t === "All" ? "All" : `${t}s`}</button>
          ))}
        </div>
      </div>
      <p className="acc-sub">{rows.length} contact{rows.length === 1 ? "" : "s"}</p>
      <div className="acc-table">
        {rows.map((c) => (
          <div className="acc-row" key={c.id}>
            <div className="acc-row-main">
              <span className="serif">{c.name}</span>
              <span className="label">{c.email}{c.phone ? ` · ${c.phone}` : ""}{c.company ? ` · ${c.company}` : ""}</span>
            </div>
            <div className="acc-row-side">
              <span className={`acc-status ${c.type === "Client" ? "gold" : "neutral"}`}>{c.type}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ——— Birthdays ——— */
function Birthdays({ birthdays, settings, onChanged }) {
  const [auto, setAuto] = useState(!!settings.birthdayAuto);
  const [msg, setMsg] = useState(settings.birthdayMessage || "");
  const [saved, setSaved] = useState(false);

  async function save() {
    await mkt({ action: "settings", birthdayAuto: auto, birthdayMessage: msg });
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
    onChanged();
  }

  return (
    <div className="acc-mkt">
      <div className="acc-card">
        <div className="acc-bday-toggle">
          <div>
            <span className="serif" style={{ fontSize: "1.15rem" }}>Automatic birthday wishes</span>
            <p className="acc-sub">A warm note goes out on each client&rsquo;s special day — never asking their age.</p>
          </div>
          <button className={`acc-switch${auto ? " on" : ""}`} onClick={() => setAuto((v) => !v)} aria-pressed={auto}>
            <span className="acc-switch-knob" />
          </button>
        </div>
        <label>
          <span className="label">Message</span>
          <textarea rows={3} value={msg} onChange={(e) => setMsg(e.target.value)} />
        </label>
        <button className="acc-btn primary" onClick={save}>{saved ? "Saved ✓" : "Save"}</button>
      </div>

      <span className="label acc-gold" style={{ marginTop: "0.5rem" }}>Upcoming birthdays</span>
      {birthdays.length === 0 && <p className="acc-sub">No birthdays on file yet — they&rsquo;re collected when clients onboard.</p>}
      <div className="acc-table">
        {birthdays.map((b) => (
          <div className="acc-row acc-bday-row" key={b.id}>
            <div className="acc-row-main">
              <span className="serif">{b.name}</span>
              <span className="label">{b.label} · {b.days === 0 ? "Today 🎉" : b.days === 1 ? "Tomorrow" : `in ${b.days} days`}</span>
            </div>
            <div className="acc-row-side acc-zodiac">
              {b.western && <span className="acc-sign" title={b.western.sign}>{b.western.glyph} {b.western.sign}</span>}
              {b.chinese ? (
                <span className="acc-sign" title={`Year of the ${b.chinese.sign}`}>{b.chinese.glyph} {b.chinese.sign}</span>
              ) : (
                <span className="label acc-sign-dim">Chinese sign · add year</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
