"use client";

// A beautiful, print-ready report overlay usable on any data. Letterhead,
// title, generated date, the report body, and a modern share menu. The
// browser's print dialog provides Save-as-PDF / Print; Email/Text/Copy
// round out sharing.

import { useEffect } from "react";
import ShareMenu from "./ShareMenu";

export default function ReportView({ title, subtitle, summary, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const date = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="acc-report-overlay" role="dialog" aria-modal="true">
      <div className="acc-report-actions">
        <button className="acc-back" onClick={onClose}>← Close</button>
        <ShareMenu title={title} summary={summary || `${title} — ${date}`} />
      </div>

      <article id="acc-report" className="acc-report">
        <header className="acc-report-head">
          <div>
            <span className="acc-report-brand serif">Joe Bryant</span>
            <span className="acc-report-brandsub">Architectural Photography · Los Angeles</span>
          </div>
          <div className="acc-report-meta">
            <span className="acc-report-word">Report</span>
            <span>{date}</span>
          </div>
        </header>

        <div className="acc-report-title">
          <h1 className="serif">{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>

        <div className="acc-report-body">{children}</div>

        <footer className="acc-report-foot">
          Joe Bryant · joe@joebryant.co · 310 890 3687 · joebryant.co
        </footer>
      </article>
    </div>
  );
}
