"use client";

// Modern share for any report: Save PDF / Print (browser dialog →
// "Save as PDF" or print), Email, Text (native share sheet), Copy.

import { useState } from "react";

export default function ShareMenu({ title = "Report", summary = "", className = "" }) {
  const [copied, setCopied] = useState(false);

  const print = () => window.print();
  const email = () => {
    window.location.href = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(summary)}`;
  };
  const text = async () => {
    if (navigator.share) {
      try { await navigator.share({ title, text: summary }); } catch {}
    } else {
      copy();
    }
  };
  const copy = () => {
    navigator.clipboard?.writeText(summary).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  return (
    <div className={`acc-share ${className}`.trim()}>
      <button className="acc-btn primary" onClick={print}>Save PDF</button>
      <button className="acc-btn" onClick={print}>Print</button>
      <button className="acc-btn" onClick={email}>Email</button>
      <button className="acc-btn" onClick={text}>Text</button>
      <button className="acc-btn" onClick={copy}>{copied ? "Copied ✓" : "Copy"}</button>
    </div>
  );
}
