"use client";

// A contextual "request information" composer. Whatever it's attached to —
// a booking, an invoice, a project — Joe can ask anything: tap smart
// prompts to add questions, write his own, add a note, and it composes a
// clean message sent to the client to answer.

import { useState } from "react";

const PROMPTS = {
  invoice: [
    "What's the billing address?",
    "PO / reference number?",
    "Company name to bill?",
    "Preferred payment method?",
    "Split this into two payments?",
    "Are you tax-exempt?",
    "When can we expect payment?",
  ],
  booking: [
    "Can you confirm the shoot date?",
    "Gate or access code?",
    "Exact square footage?",
    "On-site parking?",
    "Who's the contact on the day?",
    "Any areas to feature or avoid?",
    "Will the space be staged?",
  ],
  project: [
    "Best contact for shoot day?",
    "Any scheduling constraints?",
    "Anything specific you'd like captured?",
  ],
};

const HEAD = {
  invoice: "Ask about this invoice",
  booking: "Request more information",
  project: "Ask the client",
};

export default function RequestInfo({ kind = "project", clientName, contextLabel, onCancel, onSubmit, busy }) {
  const first = (clientName || "the client").split(" ")[0];
  const [questions, setQuestions] = useState([]);
  const [draft, setDraft] = useState("");
  const [note, setNote] = useState("");

  const prompts = (PROMPTS[kind] || PROMPTS.project).filter((p) => !questions.includes(p));

  function add(q) {
    const v = (q || "").trim();
    if (v && !questions.includes(v)) setQuestions((qs) => [...qs, v]);
    setDraft("");
  }
  function removeQ(i) {
    setQuestions((qs) => qs.filter((_, idx) => idx !== i));
  }

  function compose() {
    const lines = [];
    lines.push(`Hi ${first},`);
    lines.push("");
    if (questions.length) {
      lines.push(
        kind === "invoice"
          ? `Before we finalize${contextLabel ? ` ${contextLabel}` : " this invoice"}, could you help with the following:`
          : "Before we confirm, could you help with the following:"
      );
      questions.forEach((q) => lines.push(`• ${q}`));
    }
    if (note.trim()) {
      if (questions.length) lines.push("");
      lines.push(note.trim());
    }
    lines.push("");
    lines.push("— Joe");
    return lines.join("\n");
  }

  const canSend = questions.length > 0 || note.trim().length > 0;

  return (
    <div className="acc-reqinfo acc-card">
      <div className="acc-reqinfo-head">
        <span className="label acc-gold">{HEAD[kind] || HEAD.project}</span>
        <span className="acc-reqinfo-q serif">What would you like to ask {first}?</span>
      </div>

      <div className="acc-reqinfo-prompts">
        {prompts.map((p) => (
          <button key={p} className="acc-prompt-chip" onClick={() => add(p)}>+ {p}</button>
        ))}
      </div>

      <div className="acc-reqinfo-add">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add(draft))}
          placeholder="Type a custom question, press Enter…"
        />
        <button className="acc-btn" onClick={() => add(draft)} disabled={!draft.trim()}>Add</button>
      </div>

      {questions.length > 0 && (
        <ul className="acc-reqinfo-list">
          {questions.map((q, i) => (
            <li key={i}>
              <span>{q}</span>
              <button className="acc-reqinfo-del" onClick={() => removeQ(i)} aria-label="Remove">✕</button>
            </li>
          ))}
        </ul>
      )}

      <label className="acc-reqinfo-note">
        <span className="label">Add a note (optional)</span>
        <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Anything else you'd like to add…" />
      </label>

      <div className="acc-reqinfo-preview">
        <span className="label">They&rsquo;ll receive</span>
        <pre>{compose()}</pre>
      </div>

      <div className="acc-form-actions">
        <button className="acc-btn" onClick={onCancel} disabled={busy}>Cancel</button>
        <button className="acc-btn primary" disabled={!canSend || busy} onClick={() => onSubmit(compose())}>
          {busy ? "Sending…" : "Send request"}
        </button>
      </div>
    </div>
  );
}
