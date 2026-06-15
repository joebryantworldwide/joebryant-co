"use client";

// The client gallery experience. A cinematic cover, optional album sets
// (Interiors, Exteriors, Special Edits…), a justified grid that fades in,
// an immersive lightbox, favorites, an Arrange mode to drag photos into a
// preferred order, and Download-all that saves them in that exact sequence
// — each file keeping its ORIGINAL capture filename (prefixed by order) so
// the client can reference an exact image back to Joe.

import { useEffect, useRef, useState, useCallback } from "react";

const SIZES = [
  { key: "orig", label: "Original" },
  { key: "3600", label: "3600px" },
  { key: "2048", label: "2048px" },
  { key: "1024", label: "1024px (web)" },
];


// Resolve an image URL at the requested size. Squarespace-CDN images accept
// ?format=Nw; for other hosts we use the original for "orig" else the web copy.
function sizedUrl(img, size) {
  const base = img.download || img.large || img.thumb;
  if (size === "orig") return base;
  if (base.includes("squarespace-cdn")) {
    return base.replace(/\?.*$/, "") + `?format=${size}w`;
  }
  return img.large || base;
}

export default function GalleryExperience({ title, address, cover, sets, token }) {
  const [setIdx, setSetIdx] = useState(0);
  const current = sets[setIdx] || sets[0];
  const images = current.images;
  const setKey = `${token}-${current.name}`;

  const [active, setActive] = useState(null);
  const [favs, setFavs] = useState({});
  const [order, setOrder] = useState(images.map((i) => i.id));
  const [showFavs, setShowFavs] = useState(false);
  const [arranging, setArranging] = useState(false);
  const [dragId, setDragId] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [shared, setShared] = useState(false);
  const [dl, setDl] = useState(null);
  const [dlSize, setDlSize] = useState("orig");
  const [req, setReq] = useState(null); // { cats:[], note, busy, done }
  const [fresh, setFresh] = useState(false); // new photos available
  const gridRef = useRef(null);

  const byId = Object.fromEntries(images.map((i) => [i.id, i]));

  // Load this album's saved favorites + arrangement whenever the set changes.
  useEffect(() => {
    let f = {}, ord = null;
    try {
      f = JSON.parse(localStorage.getItem(`jb-favs-${setKey}`) || "{}");
      ord = JSON.parse(localStorage.getItem(`jb-order-${setKey}`) || "null");
    } catch {}
    setFavs(f);
    if (Array.isArray(ord)) {
      const known = ord.filter((id) => byId[id]);
      const missing = images.map((i) => i.id).filter((id) => !known.includes(id));
      setOrder([...known, ...missing]);
    } else {
      setOrder(images.map((i) => i.id));
    }
    setShowFavs(false);
    setArranging(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setIdx]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > window.innerHeight * 0.7);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const els = gridRef.current?.querySelectorAll(".gx-item:not(.in)");
    if (!els?.length) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add("in")),
      { rootMargin: "0px 0px -8% 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [showFavs, order, arranging, setIdx]);

  function persistOrder(next) {
    setOrder(next);
    try { localStorage.setItem(`jb-order-${setKey}`, JSON.stringify(next)); } catch {}
  }
  function toggleFav(id, e) {
    e?.stopPropagation();
    setFavs((f) => {
      const next = { ...f, [id]: !f[id] };
      if (!next[id]) delete next[id];
      try { localStorage.setItem(`jb-favs-${setKey}`, JSON.stringify(next)); } catch {}
      return next;
    });
  }
  function reorder(fromId, toId) {
    if (!fromId || fromId === toId) return;
    const next = [...order];
    const from = next.indexOf(fromId), to = next.indexOf(toId);
    if (from < 0 || to < 0) return;
    next.splice(to, 0, next.splice(from, 1)[0]);
    persistOrder(next);
  }

  const ordered = order.map((id) => byId[id]).filter(Boolean);
  const favCount = Object.keys(favs).length;
  const shown = showFavs ? ordered.filter((i) => favs[i.id]) : ordered;

  const nav = useCallback((dir) => {
    setActive((cur) => {
      if (cur === null) return cur;
      const idx = shown.findIndex((i) => i.id === cur.id);
      return shown[(idx + dir + shown.length) % shown.length];
    });
  }, [shown]);

  useEffect(() => {
    if (!active) return;
    const onKey = (e) => {
      if (e.key === "Escape") setActive(null);
      if (e.key === "ArrowRight") nav(1);
      if (e.key === "ArrowLeft") nav(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, nav]);

  async function share() {
    const url = typeof window !== "undefined" ? window.location.href : current.webUri;
    if (navigator.share) { try { await navigator.share({ title, url }); } catch {} }
    else { navigator.clipboard?.writeText(url); setShared(true); setTimeout(() => setShared(false), 1800); }
  }

  // Download the client's arranged order as ONE zip — numbered, keeping each
  // photo's original filename so they can reference an exact image. Falls
  // back to opening files if a host blocks cross-origin fetches.
  async function downloadAll() {
    const list = showFavs ? shown : ordered;
    if (!list.length || dl) return;
    setDl({ done: 0, total: list.length });
    const { default: JSZip } = await import("jszip");
    const zip = new JSZip();
    let added = 0;
    for (let k = 0; k < list.length; k++) {
      const img = list[k];
      const n = String(k + 1).padStart(3, "0");
      const orig = (img.filename || `${img.title || img.id}.jpg`).replace(/[^\w.-]+/g, "_");
      try {
        const res = await fetch(sizedUrl(img, dlSize), { mode: "cors" });
        if (!res.ok) throw new Error();
        zip.file(`${n}_${orig}`, await res.blob());
        added++;
      } catch {
        /* counted as a miss; handled below */
      }
      setDl({ done: k + 1, total: list.length });
    }
    if (added) {
      setDl({ done: list.length, total: list.length, zipping: true });
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title.replace(/[^\w.-]+/g, "_")}_${current.name.replace(/[^\w.-]+/g, "_")}.zip`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    } else {
      // Cross-origin blocked the whole set — open each so nothing is lost.
      list.forEach((img) => window.open(sizedUrl(img, dlSize), "_blank"));
    }
    setTimeout(() => setDl(null), 1400);
  }

  // Reset the edit-request panel whenever a different photo opens.
  useEffect(() => { setReq(null); }, [active]);

  async function submitRequest() {
    if (!active || req?.busy) return;
    if (!req?.note?.trim()) { setReq((r) => ({ ...r, error: "Describe the edit you'd like." })); return; }
    setReq((r) => ({ ...r, busy: true, error: "" }));
    const res = await fetch("/api/access/gallery/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token, imageId: active.id, imageName: active.filename || active.title,
        setName: current.name, categories: [], note: req.note.trim(),
      }),
    });
    if (res.ok) setReq({ done: true });
    else setReq((r) => ({ ...r, busy: false, error: "Couldn't send — try again." }));
  }

  // Realtime checker — quietly polls for new/updated photos on the server.
  useEffect(() => {
    const initial = sets.reduce((s, x) => s + x.images.length, 0);
    const tick = async () => {
      if (document.hidden) return;
      try {
        const r = await fetch(`/api/access/gallery/check?token=${token}`);
        const d = await r.json();
        if (d?.count && d.count !== initial) setFresh(true);
      } catch {}
    };
    const id = setInterval(tick, 90000);
    return () => clearInterval(id);
  }, [sets, token]);

  const multi = sets.length > 1;

  return (
    <div className="gx">
      {fresh && (
        <div className="gx-fresh">
          New photos were added — <button onClick={() => window.location.reload()}>refresh the gallery</button>.
        </div>
      )}
      <header className={`gx-bar${scrolled ? " show" : ""}`}>
        <span className="gx-bar-title serif">{title}</span>
        <div className="gx-bar-actions">
          {favCount > 0 && (
            <button className={`gx-chip${showFavs ? " active" : ""}`} onClick={() => setShowFavs((v) => !v)}>♥ {favCount}</button>
          )}
          <button className={`gx-chip${arranging ? " active" : ""}`} onClick={() => setArranging((v) => !v)}>
            {arranging ? "Done arranging" : "Arrange"}
          </button>
          <button className="gx-chip" onClick={share}>{shared ? "Link copied" : "Share"}</button>
          <select className="gx-chip gx-size" value={dlSize} onChange={(e) => setDlSize(e.target.value)} aria-label="Download size" disabled={!!dl}>
            {SIZES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
          <button className="gx-chip gx-chip-solid" onClick={downloadAll} disabled={!!dl}>
            {dl ? (dl.zipping ? "Zipping…" : `Preparing ${dl.done}/${dl.total}`) : "Download all"}
          </button>
        </div>
      </header>

      <section className="gx-cover">
        <div className="gx-cover-img" style={{ backgroundImage: `url(${cover})` }} />
        <div className="gx-cover-veil" />
        <div className="gx-cover-copy">
          <span className="label gx-cover-label">Joe Bryant</span>
          <h1 className="serif">{title}</h1>
          {address && <p className="gx-cover-sub">{address}</p>}
        </div>
        <div className="gx-scrollcue" aria-hidden="true"><span /></div>
      </section>

      {multi && (
        <nav className={`gx-sets${scrolled ? " stuck" : ""}`}>
          {sets.map((s, i) => (
            <button key={s.name} className={`gx-set${i === setIdx ? " active" : ""}`} onClick={() => setSetIdx(i)}>
              {s.name}<span className="gx-set-count">{s.images.length}</span>
            </button>
          ))}
        </nav>
      )}

      <section className="gx-gridwrap">
        {arranging && (
          <p className="gx-note gx-arrange-note">Drag photos into the order you&rsquo;d like — then “Download all” saves them in exactly that sequence.</p>
        )}
        {showFavs && shown.length === 0 && <p className="gx-note">No favorites yet — tap the heart on any photo.</p>}
        <div className={`gx-grid${arranging ? " arranging" : ""}`} ref={gridRef}>
          {shown.map((img, i) => (
            <figure
              className="gx-item"
              key={img.id}
              draggable={arranging}
              onDragStart={() => setDragId(img.id)}
              onDragOver={(e) => arranging && e.preventDefault()}
              onDrop={() => { if (arranging) { reorder(dragId, img.id); setDragId(null); } }}
              onClick={() => !arranging && setActive(img)}
            >
              {arranging && <span className="gx-seq">{i + 1}</span>}
              <img src={img.thumb} alt={img.title || ""} loading="lazy" draggable={false} />
              {!arranging && (
                <button className={`gx-fav${favs[img.id] ? " on" : ""}`} onClick={(e) => toggleFav(img.id, e)} aria-label="Favorite">♥</button>
              )}
            </figure>
          ))}
        </div>
      </section>

      <footer className="gx-foot">
        <span className="serif">Joe Bryant</span>
        <span className="label">Architectural Photography · joe@joebryant.co</span>
      </footer>

      {active && (
        <div className="gx-lightbox" onClick={() => setActive(null)} role="dialog" aria-modal="true">
          <button className="gx-lb-close" onClick={() => setActive(null)} aria-label="Close">✕</button>
          <button className="gx-lb-nav prev" onClick={(e) => { e.stopPropagation(); nav(-1); }} aria-label="Previous">‹</button>
          <figure className="gx-lb-fig" onClick={(e) => e.stopPropagation()}>
            <img src={active.large} alt={active.title || ""} />
            <figcaption className="gx-lb-cap">
              <span className="gx-lb-name label">{active.filename || active.title}</span>
              <button className={`gx-fav inline${favs[active.id] ? " on" : ""}`} onClick={(e) => toggleFav(active.id, e)}>
                ♥ {favs[active.id] ? "Favorited" : "Favorite"}
              </button>
              <button className={`gx-chip${req && !req.done ? " active" : ""}`} onClick={() => setReq((r) => (r ? null : { cats: [], note: "" }))}>
                Request an edit
              </button>
              <a className="gx-chip" href={active.download} download={active.filename} target="_blank" rel="noreferrer">Download</a>
            </figcaption>

            {req && (
              <div className="gx-req">
                {req.done ? (
                  <p className="gx-req-done">Request sent — Joe will take care of it. ✓</p>
                ) : (
                  <>
                    <span className="label">What would you like changed on this image?</span>
                    <textarea
                      rows={3}
                      autoFocus
                      placeholder="Describe the edit you'd like…"
                      value={req.note || ""}
                      onChange={(e) => setReq((r) => ({ ...r, note: e.target.value }))}
                    />
                    {req.error && <p className="gx-req-err">{req.error}</p>}
                    <div className="gx-req-actions">
                      <button className="gx-chip" onClick={() => setReq(null)}>Cancel</button>
                      <button className="gx-chip gx-chip-solid" onClick={submitRequest} disabled={req.busy}>
                        {req.busy ? "Sending…" : "Send request"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </figure>
          <button className="gx-lb-nav next" onClick={(e) => { e.stopPropagation(); nav(1); }} aria-label="Next">›</button>
        </div>
      )}
    </div>
  );
}
