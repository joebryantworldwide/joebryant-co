"use client";

// A date field that matches Access, not the browser chrome.
// • Click (or focus) opens a month calendar — pick a day, done.
// • Or just type loosely: "6/25/26", "6-25-2026", "jun 25 26" all parse.
//   Two-digit years fill in to 20xx, so /26 → 2026.
// A hidden input[name] carries the canonical YYYY-MM-DD value, so every
// existing form that reads FormData keeps working unchanged.

import { useEffect, useRef, useState } from "react";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DOW = ["S", "M", "T", "W", "T", "F", "S"];

const pad = (n) => String(n).padStart(2, "0");
const toISO = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;

function isValid(y, m, d) {
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
}

// Loose text → ISO string, or "" if unparseable.
function parseLoose(str) {
  const s = (str || "").trim();
  if (!s) return "";

  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) {
    const [, y, mo, d] = m.map(Number);
    return isValid(y, mo, d) ? toISO(y, mo, d) : "";
  }

  m = s.match(/^(\d{1,2})[/\-.](\d{1,2})(?:[/\-.](\d{1,4}))?$/);
  if (m) {
    let mo = +m[1], d = +m[2];
    let y = m[3] != null ? +m[3] : new Date().getFullYear();
    if (m[3] != null && m[3].length <= 2) y += 2000;
    return isValid(y, mo, d) ? toISO(y, mo, d) : "";
  }

  // Month name: "Jun 25 26", "June 25, 2026"
  m = s.match(/^([A-Za-z]{3,})\.?\s+(\d{1,2})(?:,?\s+(\d{1,4}))?$/);
  if (m) {
    const mi = MONTHS.findIndex((mo) => mo.toLowerCase().startsWith(m[1].toLowerCase()));
    if (mi >= 0) {
      const d = +m[2];
      let y = m[3] != null ? +m[3] : new Date().getFullYear();
      if (m[3] != null && m[3].length <= 2) y += 2000;
      return isValid(y, mi + 1, d) ? toISO(y, mi + 1, d) : "";
    }
  }
  return "";
}

function displayOf(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  return `${MONTHS[m - 1].slice(0, 3)} ${d}, ${y}`;
}

export default function DateField({ name, defaultValue = "", min = "", onChange, placeholder = "mm/dd/yyyy" }) {
  const [iso, setIso] = useState(defaultValue || "");
  const [text, setText] = useState(displayOf(defaultValue));
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() => {
    const base = (defaultValue || new Date().toISOString().slice(0, 10)).split("-").map(Number);
    return { y: base[0], m: base[1] }; // m is 1-12
  });
  const wrapRef = useRef(null);

  function commit(next) {
    setIso(next);
    setText(displayOf(next));
    onChange?.(next);
    if (next) {
      const [y, m] = next.split("-").map(Number);
      setView({ y, m });
    }
  }

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function onType(e) {
    setText(e.target.value);
  }
  function onBlurText() {
    const parsed = parseLoose(text);
    if (parsed) commit(parsed);
    else if (!text.trim()) commit("");
    else setText(displayOf(iso)); // unparseable → revert to last good
  }

  function shift(delta) {
    setView((v) => {
      let m = v.m + delta, y = v.y;
      if (m < 1) { m = 12; y--; }
      if (m > 12) { m = 1; y++; }
      return { y, m };
    });
  }

  const firstDow = new Date(view.y, view.m - 1, 1).getDay();
  const daysIn = new Date(view.y, view.m, 0).getDate();
  const today = new Date().toISOString().slice(0, 10);
  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysIn; d++) cells.push(d);

  return (
    <div className="acc-date" ref={wrapRef}>
      <input type="hidden" name={name} value={iso} />
      <div className="acc-date-input">
        <input
          type="text"
          inputMode="numeric"
          value={text}
          placeholder={placeholder}
          onChange={onType}
          onFocus={() => setOpen(true)}
          onBlur={onBlurText}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), onBlurText())}
          autoComplete="off"
        />
        <button
          type="button"
          className="acc-date-toggle"
          aria-label="Open calendar"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setOpen((o) => !o)}
        >
          ▤
        </button>
      </div>

      {open && (
        <div className="acc-cal" role="dialog">
          <div className="acc-cal-head">
            <button type="button" onClick={() => shift(-1)} aria-label="Previous month">
              ‹
            </button>
            <span className="serif">
              {MONTHS[view.m - 1]} {view.y}
            </span>
            <button type="button" onClick={() => shift(1)} aria-label="Next month">
              ›
            </button>
          </div>
          <div className="acc-cal-dow">
            {DOW.map((d, i) => (
              <span key={i}>{d}</span>
            ))}
          </div>
          <div className="acc-cal-grid">
            {cells.map((d, i) => {
              if (!d) return <span key={i} />;
              const cellIso = toISO(view.y, view.m, d);
              const disabled = min && cellIso < min;
              return (
                <button
                  type="button"
                  key={i}
                  disabled={disabled}
                  className={`acc-cal-day${cellIso === iso ? " sel" : ""}${cellIso === today ? " today" : ""}`}
                  onClick={() => {
                    commit(cellIso);
                    setOpen(false);
                  }}
                >
                  {d}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
