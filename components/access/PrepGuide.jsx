"use client";

// The prep guide — rendered inside a project (interactive) and on the
// public share page (read-only). Checkbox state saves per project.

import { useState } from "react";
import { fmtDate } from "../../lib/access/format";

export default function PrepGuide({ project, clientName, canCheck = false, shareUrl = null }) {
  const [guide, setGuide] = useState(project.prepGuide || []);
  const [copied, setCopied] = useState(false);

  const total = guide.flatMap((s) => s.items).length;
  const done = guide.flatMap((s) => s.items).filter((i) => i.done).length;

  async function toggle(si, ii) {
    if (!canCheck) return;
    const next = guide.map((s, a) => ({
      ...s,
      items: s.items.map((it, b) => (a === si && b === ii ? { ...it, done: !it.done } : it)),
    }));
    setGuide(next);
    await fetch("/api/access/prep-check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId: project.id, section: si, item: ii, done: next[si].items[ii].done }),
    });
  }

  function share() {
    if (!shareUrl) return;
    if (navigator.share) {
      navigator.share({ title: `Prep Guide — ${project.propertyName}`, url: shareUrl }).catch(() => {});
      return;
    }
    navigator.clipboard?.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    });
  }

  const services = [
    "Architectural Photography",
    project.services?.drone && "Drone / Aerial",
    project.services?.twilight && "Twilight",
    project.services?.styling && "Styling",
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="acc-prep">
      <header className="acc-prep-head">
        <span className="label acc-gold">Shoot Preparation Guide</span>
        <h2 className="serif">{project.propertyName}</h2>
        <p className="acc-address">{project.address}</p>
        <div className="acc-prep-facts">
          {clientName && (
            <div>
              <span className="label">Prepared for</span>
              <span>{clientName}</span>
            </div>
          )}
          {project.shootDate && (
            <div>
              <span className="label">Shoot date</span>
              <span>{fmtDate(project.shootDate)}</span>
            </div>
          )}
          <div>
            <span className="label">Project type</span>
            <span>{services}</span>
          </div>
          {total > 0 && (
            <div>
              <span className="label">Progress</span>
              <span>
                {done} of {total} complete
              </span>
            </div>
          )}
        </div>
        {total > 0 && (
          <div className="acc-progress">
            <div className="acc-progress-bar" style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
          </div>
        )}
        {shareUrl && (
          <button className="acc-btn" onClick={share}>
            {copied ? "Link copied ✓" : "Share this guide"}
          </button>
        )}
      </header>

      {guide.map((section, si) => (
        <section className="acc-prep-section" key={si}>
          <h3 className="serif">{section.title}</h3>
          <ul>
            {section.items.map((item, ii) => (
              <li key={ii}>
                <label className={`acc-check ${item.done ? "done" : ""} ${canCheck ? "" : "static"}`}>
                  <input
                    type="checkbox"
                    checked={!!item.done}
                    disabled={!canCheck}
                    onChange={() => toggle(si, ii)}
                  />
                  <span className="acc-check-box" aria-hidden="true" />
                  <span className="acc-check-text">{item.text}</span>
                </label>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <footer className="acc-prep-foot">
        <p className="acc-sub">
          A prepared property photographs beautifully. Questions before the shoot?{" "}
          <a href="mailto:joe@joebryant.co">joe@joebryant.co</a> · 310 890 3687
        </p>
        <span className="label">Joe Bryant — Know the light before you arrive.</span>
      </footer>
    </div>
  );
}
