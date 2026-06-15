"use client";

// A block-based newsletter studio. Pick a template, then edit on a live,
// centered email canvas: click any block to style it, drag to reorder,
// swap images, and drop in a personalized "Monthly Reading" block that
// fills in each recipient's horoscope at send time.

import { useState } from "react";
import { TEMPLATES, NEW_BLOCKS, FONTS, renderEmail, blockId } from "../../lib/access/newsletterTemplates";

const clone = (o) => JSON.parse(JSON.stringify(o));

async function mkt(payload) {
  const res = await fetch("/api/access/marketing", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return { ok: res.ok, data: await res.json().catch(() => ({})) };
}

export default function NewsletterDesigner({ campaign, audienceCount, onClose, onSaved }) {
  const existing = campaign && campaign.design;
  const [design, setDesign] = useState(existing ? clone(campaign.design) : null);
  const [title, setTitle] = useState(campaign?.title || "");
  const [audience, setAudience] = useState(campaign?.audience || "All");
  const [sel, setSel] = useState(null);
  const [dragId, setDragId] = useState(null);
  const [busy, setBusy] = useState("");
  const [flash, setFlash] = useState("");

  function pick(tpl) {
    setDesign({ theme: clone(tpl.theme), blocks: clone(tpl.blocks).map((b) => ({ ...b, id: blockId() })) });
    setTitle((t) => t || `${tpl.name} — ${new Date().toLocaleDateString("en-US", { month: "long" })}`);
  }

  function patch(id, fields) {
    setDesign((d) => ({ ...d, blocks: d.blocks.map((b) => (b.id === id ? { ...b, ...fields } : b)) }));
  }
  function addBlock(type) {
    const nb = NEW_BLOCKS[type]();
    setDesign((d) => ({ ...d, blocks: [...d.blocks, nb] }));
    setSel(nb.id);
  }
  function remove(id) {
    setDesign((d) => ({ ...d, blocks: d.blocks.filter((b) => b.id !== id) }));
    setSel(null);
  }
  function move(id, dir) {
    setDesign((d) => {
      const i = d.blocks.findIndex((b) => b.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= d.blocks.length) return d;
      const blocks = [...d.blocks];
      [blocks[i], blocks[j]] = [blocks[j], blocks[i]];
      return { ...d, blocks };
    });
  }
  function reorder(fromId, toId) {
    if (fromId === toId) return;
    setDesign((d) => {
      const blocks = [...d.blocks];
      const from = blocks.findIndex((b) => b.id === fromId);
      const to = blocks.findIndex((b) => b.id === toId);
      if (from < 0 || to < 0) return d;
      const [moved] = blocks.splice(from, 1);
      blocks.splice(to, 0, moved);
      return { ...d, blocks };
    });
  }

  async function save(send) {
    if (!title.trim()) { setFlash("Give it a title first."); return; }
    setBusy(send ? "send" : "save");
    const { ok, data } = await mkt({
      action: "save", id: campaign?.id, type: "newsletter",
      title, audience, design, html: renderEmail(design),
    });
    if (ok && send && data.campaign) await mkt({ action: "send", id: data.campaign.id });
    setBusy("");
    if (ok) onSaved();
    else setFlash(data.error || "Couldn't save.");
  }

  // — template picker —
  if (!design) {
    return (
      <div className="acc-designer">
        <div className="acc-designer-bar">
          <button className="acc-back" onClick={onClose}>← Marketing</button>
          <span className="label acc-gold">Choose a template</span>
          <span />
        </div>
        <div className="acc-tpl-grid">
          {TEMPLATES.map((tpl) => (
            <button className="acc-tpl-card" key={tpl.key} onClick={() => pick(tpl)} style={{ background: tpl.theme.bg }}>
              <div className="acc-tpl-preview" dangerouslySetInnerHTML={{ __html: renderEmail({ ...tpl, blocks: tpl.blocks.slice(0, 4) }).replace("{{reading}}", "A bright, expansive month awaits…") }} />
              <span className="acc-tpl-name serif" style={{ color: tpl.theme.fg }}>{tpl.name}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const block = design.blocks.find((b) => b.id === sel);

  return (
    <div className="acc-designer">
      <div className="acc-designer-bar">
        <button className="acc-back" onClick={onClose}>← Marketing</button>
        <input className="acc-designer-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Newsletter title" />
        <div className="acc-designer-bar-actions">
          <select value={audience} onChange={(e) => setAudience(e.target.value)} aria-label="Audience">
            <option value="All">All · {audienceCount}</option>
            <option value="Clients">Clients</option>
            <option value="Leads">Leads</option>
          </select>
          <button className="acc-btn" disabled={!!busy} onClick={() => save(false)}>{busy === "save" ? "Saving…" : "Save"}</button>
          <button className="acc-btn primary" disabled={!!busy} onClick={() => save(true)}>{busy === "send" ? "Sending…" : "Save & send"}</button>
        </div>
      </div>
      {flash && <p className="acc-error acc-designer-flash">{flash}</p>}

      <div className="acc-designer-body">
        {/* canvas */}
        <div className="acc-canvas-wrap">
          <div className="acc-canvas" style={{ background: design.theme.bg }}>
            {design.blocks.map((bl) => (
              <div
                key={bl.id}
                className={`acc-cblock${sel === bl.id ? " sel" : ""}`}
                draggable
                onDragStart={() => setDragId(bl.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => { reorder(dragId, bl.id); setDragId(null); }}
                onClick={() => setSel(bl.id)}
              >
                <BlockView block={bl} theme={design.theme} />
                {sel === bl.id && (
                  <div className="acc-cblock-tools" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => move(bl.id, -1)} aria-label="Up">↑</button>
                    <button onClick={() => move(bl.id, 1)} aria-label="Down">↓</button>
                    <button onClick={() => remove(bl.id)} aria-label="Delete">✕</button>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="acc-add-row">
            {Object.keys(NEW_BLOCKS).map((t) => (
              <button key={t} className="acc-add-chip" onClick={() => addBlock(t)}>+ {t}</button>
            ))}
          </div>
        </div>

        {/* inspector */}
        <aside className="acc-inspector">
          {!block ? (
            <p className="acc-sub">Select a block to style it — or drag blocks to reorder. The reading block fills in each reader&rsquo;s horoscope automatically.</p>
          ) : (
            <Inspector block={block} patch={(f) => patch(block.id, f)} />
          )}
        </aside>
      </div>
    </div>
  );
}

function BlockView({ block, theme }) {
  const a = block.align || "center";
  if (block.type === "cover")
    return (
      <div style={{ position: "relative", textAlign: "center" }}>
        <img src={block.src} alt="" style={{ width: "100%", display: "block" }} />
        <div style={{ padding: "20px 18px" }}>
          <div style={{ fontFamily: theme.heading, fontSize: 26, color: theme.fg }}>{block.heading}</div>
          <div style={{ fontFamily: theme.body, fontSize: 12, letterSpacing: 2, textTransform: "uppercase", color: theme.accent, marginTop: 6 }}>{block.sub}</div>
        </div>
      </div>
    );
  if (block.type === "heading") return <h2 style={{ margin: 0, padding: "16px 22px 4px", fontFamily: block.font, fontSize: block.size, fontWeight: block.weight, color: block.color, textAlign: a }}>{block.text}</h2>;
  if (block.type === "text") return <p style={{ margin: 0, padding: "6px 22px", fontFamily: block.font, fontSize: block.size, lineHeight: 1.7, color: block.color, textAlign: a, whiteSpace: "pre-line" }}>{block.text}</p>;
  if (block.type === "image") return <div style={{ padding: "10px 22px", textAlign: a }}><img src={block.src} alt={block.alt || ""} style={{ width: "100%", maxWidth: 540, borderRadius: 8 }} /></div>;
  if (block.type === "button") return <div style={{ padding: "16px 22px", textAlign: a }}><span style={{ display: "inline-block", padding: "12px 24px", borderRadius: 999, fontFamily: theme.body, fontSize: 12, letterSpacing: 2, textTransform: "uppercase", background: block.bg, color: block.color }}>{block.btnLabel}</span></div>;
  if (block.type === "divider") return <div style={{ padding: "14px 22px" }}><div style={{ borderTop: `1px solid ${theme.accent}`, opacity: 0.4 }} /></div>;
  if (block.type === "reading")
    return (
      <div style={{ margin: "10px 22px", padding: "18px 20px", border: `1px solid ${theme.accent}`, borderRadius: 10, textAlign: a }}>
        <div style={{ fontFamily: theme.body, fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: theme.accent, marginBottom: 8 }}>{block.label}</div>
        <div style={{ fontFamily: block.font, fontSize: block.size || 16, lineHeight: 1.7, color: block.color, fontStyle: "italic" }}>
          ✦ Each reader sees their own monthly reading here ✦
        </div>
      </div>
    );
  return null;
}

function Field({ label, children }) {
  return <label className="acc-insp-field"><span className="label">{label}</span>{children}</label>;
}

function Inspector({ block, patch }) {
  const hasText = ["heading", "text", "button", "reading", "cover"].includes(block.type);
  return (
    <div className="acc-insp">
      <span className="label acc-gold">{block.type} block</span>

      {block.type === "cover" && (
        <>
          <Field label="Heading"><input value={block.heading || ""} onChange={(e) => patch({ heading: e.target.value })} /></Field>
          <Field label="Subhead"><input value={block.sub || ""} onChange={(e) => patch({ sub: e.target.value })} /></Field>
        </>
      )}
      {(block.type === "heading" || block.type === "text") && (
        <Field label="Text"><textarea rows={block.type === "text" ? 4 : 2} value={block.text || ""} onChange={(e) => patch({ text: e.target.value })} /></Field>
      )}
      {block.type === "reading" && (
        <Field label="Label"><input value={block.label || ""} onChange={(e) => patch({ label: e.target.value })} /></Field>
      )}
      {block.type === "button" && (
        <>
          <Field label="Button label"><input value={block.btnLabel || ""} onChange={(e) => patch({ btnLabel: e.target.value })} /></Field>
          <Field label="Link"><input value={block.href || ""} onChange={(e) => patch({ href: e.target.value })} /></Field>
        </>
      )}

      {(block.type === "image" || block.type === "cover") && (
        <>
          <Field label="Image URL"><input value={block.src || ""} onChange={(e) => patch({ src: e.target.value })} /></Field>
          <label className="acc-btn acc-insp-upload">
            Swap image
            <input type="file" accept="image/*" hidden onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              const r = new FileReader();
              r.onload = () => patch({ src: r.result });
              r.readAsDataURL(f);
            }} />
          </label>
        </>
      )}

      {hasText && block.type !== "cover" && (
        <>
          <Field label="Font">
            <select value={block.font} onChange={(e) => patch({ font: e.target.value })}>
              {FONTS.map((f) => <option key={f.label} value={f.value}>{f.label}</option>)}
            </select>
          </Field>
          <div className="acc-insp-2col">
            <Field label="Size"><input type="number" min="10" max="64" value={block.size || 16} onChange={(e) => patch({ size: Number(e.target.value) })} /></Field>
            {(block.type === "heading") && (
              <Field label="Weight">
                <select value={block.weight || 400} onChange={(e) => patch({ weight: Number(e.target.value) })}>
                  <option value={300}>Light</option><option value={400}>Regular</option><option value={500}>Medium</option><option value={700}>Bold</option>
                </select>
              </Field>
            )}
          </div>
          <Field label="Text color"><input type="color" value={(block.color || "#000000").slice(0, 7)} onChange={(e) => patch({ color: e.target.value })} /></Field>
        </>
      )}
      {block.type === "button" && (
        <Field label="Button color"><input type="color" value={(block.bg || "#c8a878").slice(0, 7)} onChange={(e) => patch({ bg: e.target.value })} /></Field>
      )}

      {block.type !== "divider" && (
        <Field label="Alignment">
          <div className="acc-align-row">
            {["left", "center", "right"].map((al) => (
              <button key={al} className={`acc-align-btn${(block.align || "center") === al ? " active" : ""}`} onClick={() => patch({ align: al })}>{al[0].toUpperCase()}</button>
            ))}
          </div>
        </Field>
      )}
    </div>
  );
}
