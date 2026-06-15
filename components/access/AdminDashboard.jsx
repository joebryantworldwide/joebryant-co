"use client";

// Joe's command center — KPIs, an action queue with a full booking-review
// flow (review → confirm → confirm → choose how to notify), then projects
// and clients with prominent create actions.

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Render modals on <body> so a transformed ancestor (the section rise
// animation) can't trap their fixed positioning.
function Modal({ children, onClose }) {
  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="acc-modal-backdrop" onClick={onClose}>
      <div className="acc-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        {children}
      </div>
    </div>,
    document.body
  );
}
import DateField from "./DateField";
import { fmtDate, fmtMoney, fmtTime, STATUS_TONE } from "../../lib/access/format";
import { estimateBreakdown, fmtEstimate } from "../../lib/access/pricing";
import { STATUSES, ROLES } from "../../lib/access/constants";

async function adminAction(payload) {
  const res = await fetch("/api/access/admin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return { ok: res.ok, data: await res.json().catch(() => ({})) };
}

const DEFAULT_TILE_ORDER = ["attention", "calendar", "projects", "clients"];
const TILE_LABEL = {
  attention: "Needs your attention",
  calendar: "On the calendar",
  projects: "Projects",
  clients: "Clients",
};

export default function AdminDashboard({ queue, projects, clients, bookings, schedule = [], today }) {
  const router = useRouter();
  const refresh = () => router.refresh();
  const [openForm, setOpenForm] = useState(null); // "client" | "project" | null

  // Drag-to-rearrange tiles, remembered per browser.
  const [order, setOrder] = useState(DEFAULT_TILE_ORDER);
  const [armed, setArmed] = useState(null); // tile grabbed by its handle
  const [dragKey, setDragKey] = useState(null);
  const [overKey, setOverKey] = useState(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("jb-admin-tiles") || "null");
      if (Array.isArray(saved)) {
        const known = saved.filter((k) => DEFAULT_TILE_ORDER.includes(k));
        const missing = DEFAULT_TILE_ORDER.filter((k) => !known.includes(k));
        setOrder([...known, ...missing]);
      }
    } catch {}
  }, []);

  function reorder(from, to) {
    if (!from || from === to) return;
    setOrder((cur) => {
      const next = [...cur];
      next.splice(next.indexOf(to), 0, next.splice(next.indexOf(from), 1)[0]);
      try { localStorage.setItem("jb-admin-tiles", JSON.stringify(next)); } catch {}
      return next;
    });
  }

  const active = projects.filter((p) => p.status !== "Completed").length;
  const openBalance = projects.reduce((s, p) => s + (p.openAmount || 0), 0);
  const newRequests = bookings.filter((b) => b.status === "New").length;
  const pendingEdits = projects.reduce((s, p) => s + (p.pending || 0), 0);

  const stats = [
    { label: "Active projects", value: active },
    { label: "Open balance", value: fmtMoney(openBalance) },
    { label: "Unread messages", value: queue.messages.length },
    { label: pendingEdits ? "Edit requests" : "New requests", value: pendingEdits || newRequests },
  ];

  const tileNode = {
    attention: <Queue queue={queue} bookings={bookings} onChanged={refresh} />,
    calendar: <Schedule schedule={schedule} today={today} />,
    projects: (
      <ProjectsPanel
        projects={projects}
        clients={clients}
        onChanged={refresh}
        open={openForm === "project"}
        setOpen={(v) => setOpenForm(v ? "project" : null)}
      />
    ),
    clients: (
      <ClientsPanel
        clients={clients}
        onChanged={refresh}
        open={openForm === "client"}
        setOpen={(v) => setOpenForm(v ? "client" : null)}
      />
    ),
  };

  return (
    <div className="acc-admin">
      <div className="acc-stats">
        {stats.map((s) => (
          <div className="acc-stat" key={s.label}>
            <span className="acc-stat-num serif">{s.value}</span>
            <span className="label">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="acc-quick">
        <button className="acc-btn primary" onClick={() => setOpenForm((f) => (f === "client" ? null : "client"))}>
          + New client
        </button>
        <button className="acc-btn" onClick={() => setOpenForm((f) => (f === "project" ? null : "project"))}>
          + New project
        </button>
        <span className="acc-quick-hint label">Drag any ⠿ to rearrange your dashboard</span>
      </div>

      <div className="acc-tiles">
        {order.map((key) => (
          <div
            key={key}
            className={`acc-tile${dragKey === key ? " dragging" : ""}${overKey === key && dragKey !== key ? " over" : ""}`}
            draggable={armed === key}
            onDragStart={() => setDragKey(key)}
            onDragOver={(e) => { e.preventDefault(); setOverKey(key); }}
            onDrop={() => { reorder(dragKey, key); setOverKey(null); }}
            onDragEnd={() => { setArmed(null); setDragKey(null); setOverKey(null); }}
          >
            <button
              className="acc-grip"
              title={`Drag to move “${TILE_LABEL[key]}”`}
              aria-label="Drag to rearrange"
              onMouseDown={() => setArmed(key)}
              onMouseUp={() => setArmed(null)}
            >
              ⠿
            </button>
            {tileNode[key]}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ——————————————————————————————————————————————
   Action queue
—————————————————————————————————————————————— */

function Queue({ queue, bookings, onChanged }) {
  const [busyId, setBusyId] = useState(null);
  const activeBookings = bookings.filter((b) => !["Approved", "Declined"].includes(b.status));

  async function confirm(projectId) {
    setBusyId(projectId);
    await adminAction({ action: "confirmPayment", projectId });
    setBusyId(null);
    onChanged();
  }

  const count = queue.payments.length + queue.messages.length + activeBookings.length;
  const empty = count === 0;

  return (
    <section className="acc-section">
      <div className="acc-section-head">
        <h2 className="serif">Needs your attention</h2>
        <span className="label">{empty ? "All clear" : `${count} item${count === 1 ? "" : "s"}`}</span>
      </div>

      {queue.payments.map((p) => (
        <div className="acc-queue-item" key={p.id}>
          <div>
            <span className="acc-status alert">Payment verification</span>
            <p>
              <strong>{p.clientName}</strong> says they sent payment via{" "}
              <strong>{p.payment?.manualMethod}</strong> for {p.propertyName}.
            </p>
          </div>
          <button className="acc-btn primary" disabled={busyId === p.id} onClick={() => confirm(p.id)}>
            {busyId === p.id ? "Confirming…" : "Confirm receipt"}
          </button>
        </div>
      ))}

      {activeBookings.map((b) => {
        const needsYou = ["New", "Client Replied", "Client Approved"].includes(b.status);
        const cta =
          b.status === "New" ? "Review & respond →"
          : b.status === "Client Approved" ? "Finalize →"
          : b.status === "Client Replied" ? "They replied →"
          : "Open →";
        return (
          <Link className="acc-queue-item link" href={`/access/admin/bookings/${b.id}`} key={b.id}>
            <div>
              <span className={`acc-status ${needsYou ? "gold" : "neutral"}`}>
                {b.status === "New" ? b.kind || "New request" : b.status}
              </span>
              <p>
                <strong>{b.name}</strong> {b.company && `(${b.company})`} — {b.address}
              </p>
              <span className="label">
                {b.status === "New"
                  ? `${b.sqft ? b.sqft.toLocaleString() + " sq ft · " : ""}${b.desiredDate ? "wants " + fmtDate(b.desiredDate) + " · " : ""}est. ${fmtEstimate(b.estimate || { low: 0, high: 0 })}`
                  : `${b.proposal ? "Quote " + fmtMoney(b.proposal.total) + " · " : ""}${b.views?.length ? "viewed " + fmtTime(b.views[b.views.length - 1].at) : "not opened yet"}`}
              </span>
            </div>
            <span className="acc-btn">{cta}</span>
          </Link>
        );
      })}

      {queue.messages.map((m) => (
        <Link className="acc-queue-item link" href={`/access/admin/projects/${m.projectId}`} key={m.id}>
          <div>
            <span className="acc-status neutral">New message</span>
            <p>
              <strong>{m.fromName}</strong> on {m.propertyName}: “{m.body.slice(0, 140)}
              {m.body.length > 140 ? "…" : ""}”
            </p>
            <span className="label">{fmtTime(m.createdAt)}</span>
          </div>
          <span className="acc-btn">Reply →</span>
        </Link>
      ))}

      {empty && <p className="acc-sub">Nothing pending — every project is moving.</p>}
    </section>
  );
}

/* ——————————————————————————————————————————————
   Booking review — modal with a deliberate, multi-step approval
—————————————————————————————————————————————— */

function BookingReview({ booking, onClose, onChanged }) {
  const [step, setStep] = useState("review"); // review · confirm · notify · done · declined
  const [channels, setChannels] = useState(["email", "sms"]);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  const bd = estimateBreakdown({ sqft: booking.sqft, ...booking.services });
  const firstName = (booking.name || "").split(" ")[0];

  function toggle(ch) {
    setChannels((c) => (c.includes(ch) ? c.filter((x) => x !== ch) : [...c, ch]));
  }

  async function decline() {
    setBusy(true);
    await adminAction({ action: "updateBooking", bookingId: booking.id, status: "Declined" });
    setBusy(false);
    setStep("declined");
    onChanged();
  }

  async function finalApprove() {
    setBusy(true);
    const { ok, data } = await adminAction({
      action: "approveBooking",
      bookingId: booking.id,
      channels,
    });
    setBusy(false);
    if (ok) {
      setResult(data);
      setStep("done");
      onChanged();
    }
  }

  const services = [
    booking.services?.drone && "Drone",
    booking.services?.twilight && "Twilight",
    booking.services?.styling && "Styling",
  ].filter(Boolean);

  return (
    <div className="acc-modal-backdrop" onClick={busy ? undefined : onClose}>
      <div className="acc-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <header className="acc-modal-head">
          <div>
            <span className="label acc-gold">
              {step === "review"
                ? "Booking request"
                : step === "confirm"
                  ? "Confirm · step 1 of 2"
                  : step === "notify"
                    ? "Confirm · step 2 of 2"
                    : step === "done"
                      ? "Approved"
                      : "Declined"}
            </span>
            <h2 className="serif">{booking.name}</h2>
          </div>
          <button className="acc-modal-close label" onClick={onClose} aria-label="Close">
            Close ✕
          </button>
        </header>

        {/* — Step: full review — */}
        {step === "review" && (
          <div className="acc-modal-body">
            <section className="acc-review-grid">
              <Fact label="Company">{booking.company || "—"}</Fact>
              <Fact label="Email">{booking.email}</Fact>
              <Fact label="Phone">{booking.phone || "—"}</Fact>
              <Fact label="Requested date">
                {booking.desiredDate ? fmtDate(booking.desiredDate) : "Flexible"}
              </Fact>
              <Fact label="Property" wide>
                {booking.address}
              </Fact>
              <Fact label="Square footage">
                {booking.sqft ? `${booking.sqft.toLocaleString()} sq ft` : "Not given"}
              </Fact>
              <Fact label="Add-ons">{services.length ? services.join(", ") : "None"}</Fact>
            </section>

            {booking.notes && (
              <section className="acc-card">
                <span className="label acc-gold">Their notes</span>
                <p>“{booking.notes}”</p>
              </section>
            )}

            <section className="acc-breakdown">
              <span className="label acc-gold">Estimate breakdown</span>
              <table>
                <tbody>
                  {bd.items.map((it) => (
                    <tr key={it.label}>
                      <td>{it.label}</td>
                      <td className="num">
                        {it.low === it.high ? fmtMoney(it.low) : `${fmtMoney(it.low)}–${fmtMoney(it.high)}`}
                      </td>
                    </tr>
                  ))}
                  <tr className="total">
                    <td>Estimated total</td>
                    <td className="num">{fmtEstimate(bd.total)}</td>
                  </tr>
                  <tr className="retainer">
                    <td>50% retainer to confirm</td>
                    <td className="num">{fmtEstimate(bd.retainer)}</td>
                  </tr>
                </tbody>
              </table>
              <span className="label">Estimate only — confirmed personally before anything is due.</span>
            </section>
          </div>
        )}

        {/* — Step: first confirmation — */}
        {step === "confirm" && (
          <div className="acc-modal-body acc-modal-confirm">
            <p className="serif acc-confirm-q">
              Approve {firstName}&rsquo;s shoot and create their project?
            </p>
            <p className="acc-sub">
              This creates the project <strong>{booking.address.split(",")[0]}</strong>, adds{" "}
              <strong>{booking.name}</strong> to your client roster, and generates their private
              login. You&rsquo;ll choose how to notify them next.
            </p>
          </div>
        )}

        {/* — Step: second confirmation + notify choice — */}
        {step === "notify" && (
          <div className="acc-modal-body acc-modal-confirm">
            <p className="serif acc-confirm-q">Final step — how should we let them know?</p>
            <p className="acc-sub">
              Choose the channels to send {firstName} their confirmation and sign-in details.
            </p>
            <div className="acc-notify-choices">
              <label className={`acc-choice ${channels.includes("email") ? "active" : ""}`}>
                <input type="checkbox" checked={channels.includes("email")} onChange={() => toggle("email")} />
                <span>
                  <strong>Email</strong>
                  <span className="label">{booking.email}</span>
                </span>
              </label>
              <label
                className={`acc-choice ${channels.includes("sms") ? "active" : ""} ${booking.phone ? "" : "disabled"}`}
              >
                <input
                  type="checkbox"
                  checked={channels.includes("sms")}
                  disabled={!booking.phone}
                  onChange={() => toggle("sms")}
                />
                <span>
                  <strong>Text message</strong>
                  <span className="label">{booking.phone || "No phone on file"}</span>
                </span>
              </label>
            </div>
            <p className="acc-help">
              This is final. Approving creates the project and client now
              {channels.length ? ` and notifies by ${channels.map((c) => (c === "sms" ? "text" : "email")).join(" & ")}` : " without notifying them"}.
            </p>
          </div>
        )}

        {/* — Step: done — */}
        {step === "done" && result && (
          <div className="acc-modal-body">
            <p className="acc-notice">
              Project created ✓ — {result.user?.name}&rsquo;s login:{" "}
              <strong>{result.user?.email}</strong> / code <strong>{result.accessCode}</strong>
            </p>
            {result.notified?.length > 0 ? (
              <ul className="acc-rules">
                {result.notified.map((n, i) => (
                  <li key={i}>
                    {n.channel === "sms" ? "Text" : "Email"} to {n.to} —{" "}
                    {n.delivered === "sent"
                      ? "delivered ✓"
                      : n.delivered === "console"
                        ? "logged (add provider keys to send for real)"
                        : n.delivered}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="acc-sub">No notification sent — share their login when you&rsquo;re ready.</p>
            )}
            <Link href={`/access/admin/projects/${result.project?.id}`} className="acc-btn primary">
              Open the project →
            </Link>
          </div>
        )}

        {step === "declined" && (
          <div className="acc-modal-body">
            <p className="acc-sub">Request declined and cleared from your queue.</p>
          </div>
        )}

        {/* — Footer actions per step — */}
        <footer className="acc-modal-foot">
          {step === "review" && (
            <>
              <button className="acc-btn" onClick={decline} disabled={busy}>
                Decline
              </button>
              <button className="acc-btn primary" onClick={() => setStep("confirm")}>
                Approve this project →
              </button>
            </>
          )}
          {step === "confirm" && (
            <>
              <button className="acc-btn" onClick={() => setStep("review")}>
                ← Back
              </button>
              <button className="acc-btn primary" onClick={() => setStep("notify")}>
                Yes, continue →
              </button>
            </>
          )}
          {step === "notify" && (
            <>
              <button className="acc-btn" onClick={() => setStep("confirm")} disabled={busy}>
                ← Back
              </button>
              <button className="acc-btn primary" onClick={finalApprove} disabled={busy}>
                {busy
                  ? "Creating…"
                  : channels.length
                    ? "Approve & notify"
                    : "Approve without notifying"}
              </button>
            </>
          )}
          {(step === "done" || step === "declined") && (
            <button className="acc-btn primary" onClick={onClose}>
              Done
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}

function Fact({ label, children, wide }) {
  return (
    <div className={wide ? "wide" : ""}>
      <span className="label">{label}</span>
      <span>{children}</span>
    </div>
  );
}

/* ——————————————————————————————————————————————
   Schedule — month calendar + dated agenda
—————————————————————————————————————————————— */

const SCH_MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const SCH_DOW = ["S", "M", "T", "W", "T", "F", "S"];
const pad2 = (n) => String(n).padStart(2, "0");

function Schedule({ schedule, today }) {
  const todayDate = today || new Date().toISOString().slice(0, 10);
  const [view, setView] = useState(() => {
    const [y, m] = todayDate.split("-").map(Number);
    return { y, m };
  });
  const [sel, setSel] = useState(null);

  const byDate = {};
  for (const e of schedule) (byDate[e.date] ||= []).push(e);

  const firstDow = new Date(view.y, view.m - 1, 1).getDay();
  const daysIn = new Date(view.y, view.m, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysIn; d++) cells.push(d);

  function shift(delta) {
    setSel(null);
    setView((v) => {
      let m = v.m + delta, y = v.y;
      if (m < 1) { m = 12; y--; }
      if (m > 12) { m = 1; y++; }
      return { y, m };
    });
  }

  const weekEnd = (() => {
    const d = new Date(todayDate + "T12:00:00Z");
    d.setUTCDate(d.getUTCDate() + 7);
    return d.toISOString().slice(0, 10);
  })();

  const groups = sel
    ? [{ title: fmtDate(sel), items: byDate[sel] || [] }]
    : [
        { title: "Overdue", alert: true, items: schedule.filter((e) => e.date < todayDate) },
        { title: "This week", items: schedule.filter((e) => e.date >= todayDate && e.date <= weekEnd) },
        { title: "Later", items: schedule.filter((e) => e.date > weekEnd) },
      ].filter((g) => g.items.length);

  return (
    <section className="acc-section">
      <div className="acc-section-head">
        <h2 className="serif">On the calendar</h2>
        <span className="label">
          {schedule.length} upcoming · {schedule.filter((e) => e.date < todayDate).length} overdue
        </span>
      </div>

      {schedule.length === 0 ? (
        <p className="acc-sub">Nothing scheduled — no upcoming shoots or invoices due.</p>
      ) : (
        <div className="acc-schedule">
          <div className="acc-cal acc-cal-static">
            <div className="acc-cal-head">
              <button type="button" onClick={() => shift(-1)} aria-label="Previous month">
                ‹
              </button>
              <span className="serif">
                {SCH_MONTHS[view.m - 1]} {view.y}
              </span>
              <button type="button" onClick={() => shift(1)} aria-label="Next month">
                ›
              </button>
            </div>
            <div className="acc-cal-dow">
              {SCH_DOW.map((d, i) => (
                <span key={i}>{d}</span>
              ))}
            </div>
            <div className="acc-cal-grid">
              {cells.map((d, i) => {
                if (!d) return <span key={i} />;
                const iso = `${view.y}-${pad2(view.m)}-${pad2(d)}`;
                const evs = byDate[iso] || [];
                const overdue = evs.some((e) => e.type === "invoice" && iso < todayDate);
                return (
                  <button
                    type="button"
                    key={i}
                    className={`acc-cal-day${iso === sel ? " sel" : ""}${iso === todayDate ? " today" : ""}`}
                    onClick={() => setSel((s) => (s === iso ? null : iso))}
                  >
                    {d}
                    {evs.length > 0 && <span className={`acc-cal-dot${overdue ? " alert" : ""}`} />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="acc-agenda">
            {groups.map((g) => (
              <div className="acc-agenda-group" key={g.title}>
                <span className="label" style={g.alert ? { color: "var(--alert)" } : { color: "var(--gold)" }}>
                  {g.title}
                </span>
                {g.items.map((e, idx) => (
                  <Link key={idx} href={`/access/admin/projects/${e.projectId}`} className="acc-agenda-item">
                    <span className="acc-agenda-date">
                      <span className="acc-agenda-mon">
                        {SCH_MONTHS[Number(e.date.slice(5, 7)) - 1].slice(0, 3)}
                      </span>
                      <span className="acc-agenda-day serif">{Number(e.date.slice(8, 10))}</span>
                    </span>
                    <span className="acc-agenda-main">
                      <span className={`acc-status ${e.type === "shoot" ? "gold" : "neutral"}`}>
                        {e.type === "shoot" ? "Shoot" : "Invoice due"}
                      </span>
                      <span className="serif">{e.title}</span>
                      <span className="label">{e.sub}</span>
                    </span>
                  </Link>
                ))}
              </div>
            ))}
            {sel && (byDate[sel] || []).length === 0 && (
              <p className="acc-sub">Nothing on {fmtDate(sel)}. Pick another day, or tap it again to clear.</p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

/* ——————————————————————————————————————————————
   Clients
—————————————————————————————————————————————— */

function ClientsPanel({ clients, onChanged, open, setOpen }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState(null);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");

  const categories = ["All", ...Array.from(new Set(clients.map((c) => c.category).filter(Boolean))).sort()];
  const needle = q.trim().toLowerCase();
  const filtered = clients
    .filter((c) => cat === "All" || c.category === cat)
    .filter((c) => {
      if (!needle) return true;
      const hay = [c.name, c.company, c.email, c.location, c.role, c.phone, ...(c.altEmails || [])]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(needle);
    })
    .sort((a, b) => (b.lifetimePaid || 0) - (a.lifetimePaid || 0));

  async function create(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const { ok, data } = await adminAction({
      action: "createClient",
      name: fd.get("name"),
      email: fd.get("email"),
      phone: fd.get("phone"),
      company: fd.get("company"),
      role: fd.get("role"),
    });
    if (ok && fd.get("invite") === "on" && data.user) {
      await adminAction({ action: "inviteClient", userId: data.user.id });
    }
    setBusy(false);
    if (ok) {
      setCreated(data.user);
      setOpen(false);
      onChanged();
    } else setError(data.error || "Couldn't create the client.");
  }

  return (
    <section className="acc-section" id="clients">
      <div className="acc-section-head">
        <h2 className="serif">Clients</h2>
        <button className="acc-btn" onClick={() => setOpen(!open)}>
          {open ? "Cancel" : "New client"}
        </button>
      </div>

      {created && (
        <p className="acc-notice">
          {created.name} created ✓ — send them their login: <strong>{created.email}</strong> / code{" "}
          <strong>{created.accessCode}</strong> at joebryant.co/access
        </p>
      )}

      {open && (
        <Modal onClose={busy ? () => {} : () => setOpen(false)}>
            <header className="acc-modal-head">
              <div>
                <span className="label acc-gold">New client</span>
                <h2 className="serif">Add a client</h2>
              </div>
              <button className="acc-modal-close label" onClick={() => setOpen(false)}>Close ✕</button>
            </header>
            <form className="acc-form acc-modal-body" onSubmit={create}>
              <p className="acc-sub">Only name, email and phone are required — everything else is optional and they can complete it themselves.</p>
              <div className="acc-form-grid">
                <label><span className="label">Name</span><input name="name" required /></label>
                <label><span className="label">Email</span><input name="email" type="email" required /></label>
                <label><span className="label">Phone</span><input name="phone" /></label>
                <label><span className="label">Company</span><input name="company" /></label>
                <label>
                  <span className="label">Role</span>
                  <select name="role" defaultValue="Client / Owner">
                    {ROLES.map((r) => (<option key={r}>{r}</option>))}
                  </select>
                </label>
                <label className="acc-pill" style={{ alignSelf: "end" }}>
                  <input type="checkbox" name="invite" /> Invite them to complete their profile
                </label>
              </div>
              {error && <p className="acc-error">{error}</p>}
              <div className="acc-form-actions">
                <button type="button" className="acc-btn" onClick={() => setOpen(false)}>Cancel</button>
                <button className="acc-btn primary" disabled={busy}>{busy ? "Creating…" : "Create client"}</button>
              </div>
            </form>
        </Modal>
      )}

      <div className="acc-form-grid" style={{ marginBottom: "0.75rem" }}>
        <label style={{ gridColumn: "1 / -1" }}>
          <span className="label">Search clients</span>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Name, company, email, phone, location…"
          />
        </label>
        <label>
          <span className="label">Category</span>
          <select value={cat} onChange={(e) => setCat(e.target.value)}>
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
      </div>

      <p className="acc-sub">
        {filtered.length} of {clients.length} client{clients.length === 1 ? "" : "s"}
        {needle || cat !== "All" ? " match" : ""}
      </p>

      <div className="acc-table">
        {filtered.length === 0 && <p className="acc-sub">No clients match that search.</p>}
        {filtered.map((c) => (
          <Link href={`/access/admin/clients/${c.id}`} className="acc-row" key={c.id}>
            <div className="acc-row-main">
              <span className="serif">
                {c.name}
                {c.vip ? <span className="acc-gold" style={{ marginLeft: 6 }}>★</span> : null}
              </span>
              <span className="label">
                {c.company || c.role}
                {c.category ? ` · ${c.category}` : ""} · {c.email || "no email"}
              </span>
            </div>
            <div className="acc-row-side">
              {c.lifetimePaid > 0 ? <span className="label">{fmtMoney(c.lifetimePaid)}</span> : null}
              <span className="label">
                {c.projectCount} project{c.projectCount === 1 ? "" : "s"}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ——————————————————————————————————————————————
   Projects
—————————————————————————————————————————————— */

function ProjectsPanel({ projects, clients, onChanged, open, setOpen }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [newClient, setNewClient] = useState(false);
  const [result, setResult] = useState(null);

  async function create(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const fd = new FormData(e.currentTarget);

    let clientId = fd.get("clientId");
    let invited = null;

    // Create the client inline if Joe didn't pick an existing one.
    if (newClient) {
      if (!fd.get("ncName") || !fd.get("ncEmail")) {
        setBusy(false); setError("New client needs a name and email."); return;
      }
      const cl = await adminAction({
        action: "createClient",
        name: fd.get("ncName"), email: fd.get("ncEmail"), phone: fd.get("ncPhone"),
      });
      if (!cl.ok) { setBusy(false); setError(cl.data.error || "Couldn't create the client."); return; }
      clientId = cl.data.user.id;
      if (fd.get("ncInvite") === "on") {
        const inv = await adminAction({ action: "inviteClient", userId: clientId });
        invited = inv.ok ? cl.data.user : null;
      }
    }
    if (!clientId) { setBusy(false); setError("Pick a client or add a new one."); return; }

    const { ok, data } = await adminAction({
      action: "createProject",
      propertyName: fd.get("propertyName"),
      address: fd.get("address"),
      shootDate: fd.get("shootDate"),
      clientId,
      smugmugUrl: fd.get("smugmugUrl"),
      services: {
        sqft: fd.get("sqft"),
        drone: fd.get("drone") === "on",
        twilight: fd.get("twilight") === "on",
        styling: fd.get("styling") === "on",
      },
    });
    setBusy(false);
    if (ok) {
      setOpen(false); setNewClient(false);
      if (invited) setResult(invited);
      onChanged();
    } else setError(data.error || "Couldn't create the project.");
  }

  return (
    <section className="acc-section" id="projects">
      <div className="acc-section-head">
        <h2 className="serif">Projects</h2>
        <button className="acc-btn" onClick={() => setOpen(!open)}>New project</button>
      </div>

      {result && (
        <p className="acc-notice">
          Invited ✓ — {result.name} can sign in with <strong>{result.email}</strong> / code{" "}
          <strong>{result.accessCode}</strong> to complete their profile.
        </p>
      )}

      {open && (
        <Modal onClose={busy ? () => {} : () => setOpen(false)}>
            <header className="acc-modal-head">
              <div>
                <span className="label acc-gold">New project</span>
                <h2 className="serif">Create a project</h2>
              </div>
              <button className="acc-modal-close label" onClick={() => setOpen(false)}>Close ✕</button>
            </header>
            <form className="acc-form acc-modal-body" onSubmit={create}>
              <div className="acc-form-grid">
                <label>
                  <span className="label">Property name</span>
                  <input name="propertyName" required />
                </label>
                {!newClient ? (
                  <label>
                    <span className="label">Client</span>
                    <select name="clientId" defaultValue="">
                      <option value="" disabled>Choose…</option>
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}{c.company ? ` — ${c.company}` : ""}</option>
                      ))}
                    </select>
                    <button type="button" className="acc-linkbtn label" onClick={() => setNewClient(true)} style={{ marginTop: "0.5rem" }}>
                      + New client instead
                    </button>
                  </label>
                ) : (
                  <div className="wide acc-newclient">
                    <div className="acc-section-head" style={{ marginBottom: "0.6rem" }}>
                      <span className="label acc-gold">New client</span>
                      <button type="button" className="acc-linkbtn label" onClick={() => setNewClient(false)}>Pick existing instead</button>
                    </div>
                    <div className="acc-form-grid">
                      <label><span className="label">Name</span><input name="ncName" required /></label>
                      <label><span className="label">Email</span><input name="ncEmail" type="email" required /></label>
                      <label><span className="label">Phone</span><input name="ncPhone" /></label>
                      <label className="acc-pill" style={{ alignSelf: "end" }}>
                        <input type="checkbox" name="ncInvite" /> Invite them to complete their profile
                      </label>
                    </div>
                  </div>
                )}
                <label className="wide">
                  <span className="label">Address</span>
                  <input name="address" />
                </label>
                <label>
                  <span className="label">Shoot date</span>
                  <DateField name="shootDate" />
                </label>
                <label>
                  <span className="label">Square footage</span>
                  <input name="sqft" type="number" min="0" />
                </label>
                <label className="wide">
                  <span className="label">SmugMug gallery link (can add later)</span>
                  <input name="smugmugUrl" type="url" placeholder="https://…smugmug.com/…" />
                </label>
              </div>
              <div className="acc-paymethods">
                {["drone", "twilight", "styling"].map((s) => (
                  <label key={s} className="acc-pill">
                    <input type="checkbox" name={s} /> {s[0].toUpperCase() + s.slice(1)}
                  </label>
                ))}
              </div>
              {error && <p className="acc-error">{error}</p>}
              <div className="acc-form-actions">
                <button type="button" className="acc-btn" onClick={() => setOpen(false)}>Cancel</button>
                <button className="acc-btn primary" disabled={busy}>{busy ? "Creating…" : "Create project"}</button>
              </div>
            </form>
        </Modal>
      )}

      <div className="acc-table">
        {projects.map((p) => (
          <Link href={`/access/admin/projects/${p.id}`} className={`acc-row${p.pending > 0 ? " acc-row-attention" : ""}`} key={p.id}>
            <div className="acc-row-main">
              <span className="serif">
                {p.pending > 0 && <span className="acc-dot red" title={`${p.pending} edit request${p.pending === 1 ? "" : "s"}`} />}
                {p.pending === 0 && p.smugmugUrl && <span className="acc-dot green" title="Delivered · no open requests" />}
                {p.propertyName}
              </span>
              <span className="label">
                {p.clientName} {p.shootDate && `· ${fmtDate(p.shootDate)}`}
              </span>
            </div>
            <div className="acc-row-side">
              {p.pending > 0 && <span className="acc-status alert">{p.pending} to edit</span>}
              {p.unread > 0 && <span className="acc-badge">{p.unread}</span>}
              {p.openAmount > 0 && <span className="label">{fmtMoney(p.openAmount)} open</span>}
              <span className="label">{p.smugmugUrl ? "Gallery ✓" : "No gallery"}</span>
              <span className={`acc-status ${STATUS_TONE[p.status] || "neutral"}`}>{p.status}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
