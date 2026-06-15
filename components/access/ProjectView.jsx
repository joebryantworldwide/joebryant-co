"use client";

// One project, from the client's side. Tabs appear based on the access
// level the viewer was invited with (full / prep / gallery / billing / view).

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import PrepGuide from "./PrepGuide";
import MessagePanel from "./MessagePanel";
import SquarePayForm from "./SquarePayForm";
import { fmtDate, fmtMoney, STATUS_TONE } from "../../lib/access/format";
import {
  STATUSES,
  ROLES,
  ACCESS_LEVELS,
  MANUAL_PAYMENT_METHODS,
  PAYMENT_RULES,
} from "../../lib/access/constants";

const TABS_BY_ACCESS = {
  full: ["Overview", "Prep Guide", "Gallery", "Billing", "Team", "Messages"],
  prep: ["Prep Guide"],
  gallery: ["Gallery"],
  billing: ["Billing"],
  view: ["Overview"],
};

export default function ProjectView({ project, messages, viewer, access, shareUrl }) {
  const tabs = TABS_BY_ACCESS[access] || ["Overview"];
  const [tab, setTab] = useState(tabs[0]);
  const router = useRouter();
  const unread = messages.filter((m) => !m.readByClient && m.fromId !== viewer.id).length;

  return (
    <div className="acc-project">
      <header className="acc-project-hero">
        {project.coverImage && (
          <div className="photo acc-project-hero-img">
            <img src={project.coverImage} alt={project.propertyName} className="drift" />
          </div>
        )}
        <div className="acc-project-hero-copy">
          <span className={`acc-status ${STATUS_TONE[project.status] || "neutral"}`}>{project.status}</span>
          <h1 className="serif">{project.propertyName}</h1>
          <p className="acc-address">{project.address}</p>
          {project.shootDate && <span className="label">Shoot date · {fmtDate(project.shootDate)}</span>}
        </div>
      </header>

      <nav className="acc-tabs" role="tablist">
        {tabs.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            className={`acc-tab ${tab === t ? "active" : ""}`}
            onClick={() => setTab(t)}
          >
            {t}
            {t === "Messages" && unread > 0 && <span className="acc-badge">{unread}</span>}
          </button>
        ))}
      </nav>

      {tab === "Overview" && <Overview project={project} />}
      {tab === "Prep Guide" && (
        <PrepGuide
          project={project}
          clientName={viewer.name}
          canCheck={["full", "prep"].includes(access)}
          shareUrl={shareUrl}
        />
      )}
      {tab === "Gallery" && <Gallery project={project} />}
      {tab === "Billing" && (
        <Billing project={project} canPay={["full", "billing"].includes(access)} onChanged={() => router.refresh()} />
      )}
      {tab === "Team" && <Team project={project} onChanged={() => router.refresh()} />}
      {tab === "Messages" && (
        <MessagePanel project={project} messages={messages} me={viewer.id} />
      )}
    </div>
  );
}

function Overview({ project }) {
  const idx = STATUSES.indexOf(project.status);
  return (
    <div className="acc-overview">
      <section className="acc-card">
        <span className="label acc-gold">Where things stand</span>
        <ol className="acc-timeline">
          {STATUSES.map((s, i) => (
            <li key={s} className={i < idx ? "past" : i === idx ? "now" : ""}>
              <span className="acc-timeline-dot" aria-hidden="true" />
              {s}
            </li>
          ))}
        </ol>
      </section>
      {project.notes && (
        <section className="acc-card">
          <span className="label acc-gold">Notes</span>
          <p>{project.notes}</p>
        </section>
      )}
      <section className="acc-card">
        <span className="label acc-gold">Contact Joe</span>
        <p>
          <a href="mailto:joe@joebryant.co">joe@joebryant.co</a> · <a href="tel:+13108903687">310 890 3687</a>
        </p>
      </section>
    </div>
  );
}

function Gallery({ project }) {
  const [state, setState] = useState({ status: "loading", images: [] });
  const [active, setActive] = useState(null); // lightbox index
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchPage = useCallback(
    async (start) => {
      const res = await fetch(
        `/api/access/gallery?projectId=${project.id}&start=${start}`
      );
      return res.json().catch(() => ({ status: "error" }));
    },
    [project.id]
  );

  useEffect(() => {
    let live = true;
    fetchPage(1).then((data) => {
      if (live) setState({ ...data, images: data.images || [] });
    });
    return () => {
      live = false;
    };
  }, [fetchPage]);

  async function loadMore() {
    if (!state.nextStart || loadingMore) return;
    setLoadingMore(true);
    const data = await fetchPage(state.nextStart);
    setLoadingMore(false);
    setState((prev) => ({
      ...prev,
      images: [...prev.images, ...(data.images || [])],
      nextStart: data.nextStart,
    }));
  }

  const { status, images } = state;

  if (status === "loading") {
    return <div className="acc-empty"><p className="acc-sub">Opening your gallery…</p></div>;
  }
  if (status === "pending") {
    return (
      <div className="acc-empty">
        <p className="acc-sub">
          Your gallery isn&rsquo;t ready yet — it appears here the moment Joe delivers it.
        </p>
      </div>
    );
  }
  if (status === "error" || (!images.length && status !== "demo")) {
    return (
      <div className="acc-empty">
        <p className="acc-sub">Your gallery is delivered and ready.</p>
        {state.webUri && (
          <a className="acc-btn primary" href={state.webUri} target="_blank" rel="noreferrer">
            Open gallery ↗
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="acc-gallery">
      {status === "demo" && state.admin && (
        <p className="acc-notice">
          Preview gallery — connect SmugMug (see README) and your clients&rsquo; real
          photographs render right here, in this same view.
        </p>
      )}
      <div className="acc-gallery-meta">
        <span className="label">
          {state.total || images.length} photograph{(state.total || images.length) === 1 ? "" : "s"}
        </span>
        {state.webUri && (
          <a className="label acc-linkbtn" href={state.webUri} target="_blank" rel="noreferrer">
            Open in SmugMug ↗
          </a>
        )}
      </div>

      <div className="acc-grid">
        {images.map((img, i) => (
          <button
            key={img.id}
            className="acc-grid-item"
            onClick={() => setActive(i)}
            aria-label={`View ${img.title || "photograph"}`}
          >
            <img src={img.thumb} alt={img.title || ""} loading="lazy" />
            {img.isVideo && <span className="acc-grid-video">▶</span>}
          </button>
        ))}
      </div>

      {state.nextStart && (
        <button className="acc-btn" onClick={loadMore} disabled={loadingMore}>
          {loadingMore ? "Loading…" : "Load more"}
        </button>
      )}

      {active !== null && images[active] && (
        <GalleryLightbox
          images={images}
          index={active}
          onClose={() => setActive(null)}
          onNav={(d) =>
            setActive((cur) => (cur + d + images.length) % images.length)
          }
        />
      )}
    </div>
  );
}

function GalleryLightbox({ images, index, onClose, onNav }) {
  const img = images[index];

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onNav(1);
      if (e.key === "ArrowLeft") onNav(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, onNav]);

  return (
    <div className="acc-lightbox" onClick={onClose} role="dialog" aria-modal="true">
      <button className="acc-lightbox-close label" onClick={onClose} aria-label="Close">
        Close ✕
      </button>
      <button
        className="acc-lightbox-nav prev"
        onClick={(e) => { e.stopPropagation(); onNav(-1); }}
        aria-label="Previous"
      >
        ‹
      </button>
      <figure onClick={(e) => e.stopPropagation()}>
        <img src={img.large} alt={img.title || ""} />
        <figcaption>
          <span className="label">{img.title || `${index + 1} / ${images.length}`}</span>
          <a
            className="acc-btn primary"
            href={img.download}
            target="_blank"
            rel="noreferrer"
            download
          >
            Download ↓
          </a>
        </figcaption>
      </figure>
      <button
        className="acc-lightbox-nav next"
        onClick={(e) => { e.stopPropagation(); onNav(1); }}
        aria-label="Next"
      >
        ›
      </button>
    </div>
  );
}

function Billing({ project, canPay, onChanged }) {
  const [method, setMethod] = useState(project.payment?.manualMethod || "");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [payingId, setPayingId] = useState(null);
  const [copied, setCopied] = useState(null);
  const open = (project.invoices || []).filter((i) => i.status !== "Paid");

  function copyLink(inv) {
    navigator.clipboard?.writeText(inv.squareUrl).then(() => {
      setCopied(inv.id);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  async function selectMethod(e) {
    e.preventDefault();
    if (!method || busy) return;
    setBusy(true);
    const res = await fetch("/api/access/payment-method", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId: project.id, method }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) {
      setNotice(data.notice);
      onChanged();
    }
  }

  return (
    <div className="acc-billing">
      {(project.invoices || []).map((inv) => (
        <div className={`acc-invoice-block ${inv.status === "Paid" ? "paid" : ""}`} key={inv.id}>
          <div className="acc-invoice">
            <div className="acc-invoice-main">
              <span className="serif">{inv.title}</span>
              <span className="label">
                {inv.status === "Paid"
                  ? `Paid ${fmtDate(inv.paidDate)}`
                  : inv.status === "Awaiting Verification"
                    ? "Awaiting Joe's confirmation"
                    : inv.dueDate
                      ? `Due ${fmtDate(inv.dueDate)}`
                      : "Open"}
              </span>
            </div>
            <div className="acc-invoice-side">
              <span className="serif acc-amount">{fmtMoney(inv.amount)}</span>
              {inv.status === "Paid" ? (
                <span className="acc-chip gold">Paid ✓</span>
              ) : inv.status === "Awaiting Verification" ? (
                <span className="acc-chip">Verifying</span>
              ) : canPay ? (
                <button
                  className="acc-btn primary"
                  onClick={() => setPayingId(payingId === inv.id ? null : inv.id)}
                >
                  {payingId === inv.id ? "Close" : "Pay now"}
                </button>
              ) : (
                <span className="acc-chip">{inv.status}</span>
              )}
            </div>
          </div>

          {canPay && payingId === inv.id && inv.status !== "Paid" && (
            <div className="acc-invoice-pay">
              <SquarePayForm
                projectId={project.id}
                invoice={inv}
                onPaid={() => {
                  setPayingId(null);
                  onChanged();
                }}
              />
              {inv.squareUrl && (
                <button className="acc-linkbtn label" onClick={() => copyLink(inv)}>
                  {copied === inv.id ? "Link copied ✓" : "Or copy a payment link to pay elsewhere"}
                </button>
              )}
            </div>
          )}
        </div>
      ))}

      <section className="acc-card">
        <span className="label acc-gold">Payment terms</span>
        <ul className="acc-rules">
          {PAYMENT_RULES.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </section>

      {canPay && open.length > 0 && (
        <section className="acc-card">
          <span className="label acc-gold">Paying another way?</span>
          <p className="acc-sub">Select how you&rsquo;re sending payment and Joe is notified immediately.</p>
          {project.payment?.awaitingVerification && !notice ? (
            <p className="acc-notice">
              {project.payment.manualMethod} selected — Joe is confirming receipt. Your project is
              confirmed and currently awaiting payment verification.
            </p>
          ) : notice ? (
            <p className="acc-notice">{notice}</p>
          ) : (
            <form className="acc-payform" onSubmit={selectMethod}>
              <div className="acc-paymethods">
                {MANUAL_PAYMENT_METHODS.map((m) => (
                  <label key={m} className={`acc-pill ${method === m ? "active" : ""}`}>
                    <input
                      type="radio"
                      name="method"
                      value={m}
                      checked={method === m}
                      onChange={() => setMethod(m)}
                    />
                    {m}
                  </label>
                ))}
              </div>
              <button className="acc-btn primary" disabled={!method || busy}>
                {busy ? "Notifying Joe…" : "I'm paying this way"}
              </button>
            </form>
          )}
        </section>
      )}
    </div>
  );
}

function Team({ project, onChanged }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  async function invite(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/access/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: project.id,
        name: fd.get("name"),
        email: fd.get("email"),
        phone: fd.get("phone"),
        role: fd.get("role"),
        access: fd.get("access"),
      }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) {
      setResult({ email: fd.get("email"), code: data.accessCode });
      setOpen(false);
      onChanged();
    } else {
      setError(data.error || "Something went wrong.");
    }
  }

  async function remove(email) {
    await fetch("/api/access/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId: project.id, remove: email }),
    });
    onChanged();
  }

  return (
    <div className="acc-team">
      {(project.team || []).length === 0 && !result && (
        <p className="acc-sub">It&rsquo;s just you so far — invite your team to this project.</p>
      )}
      {(project.team || []).map((m) => (
        <div className="acc-member" key={m.email}>
          <div>
            <span className="serif">{m.name}</span>
            <span className="label">
              {m.role} · {(ACCESS_LEVELS.find((a) => a.value === m.access) || {}).label || m.access}
            </span>
          </div>
          <button className="label acc-linkbtn" onClick={() => remove(m.email)}>
            Remove
          </button>
        </div>
      ))}

      {result && (
        <p className="acc-notice">
          Invited ✓ — share their sign-in with them: <strong>{result.email}</strong> with access
          code <strong>{result.code}</strong> at joebryant.co/access
        </p>
      )}

      {open ? (
        <form className="acc-form" onSubmit={invite}>
          <div className="acc-form-grid">
            <label>
              <span className="label">Name</span>
              <input name="name" required />
            </label>
            <label>
              <span className="label">Email</span>
              <input name="email" type="email" required />
            </label>
            <label>
              <span className="label">Phone</span>
              <input name="phone" />
            </label>
            <label>
              <span className="label">Role</span>
              <select name="role" defaultValue="Assistant">
                {ROLES.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </label>
            <label>
              <span className="label">Access level</span>
              <select name="access" defaultValue="view">
                {ACCESS_LEVELS.map((a) => (
                  <option key={a.value} value={a.value}>
                    {a.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {error && <p className="acc-error">{error}</p>}
          <div className="acc-form-actions">
            <button type="button" className="acc-btn" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button className="acc-btn primary" disabled={busy}>
              {busy ? "Inviting…" : "Send invite"}
            </button>
          </div>
        </form>
      ) : (
        <button className="acc-btn" onClick={() => setOpen(true)}>
          Invite someone
        </button>
      )}
    </div>
  );
}
