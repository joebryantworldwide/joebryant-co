"use client";

// "Message Joe" — the thread on every project. Posting notifies Joe
// instantly (admin dashboard always; email when configured).

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { fmtTime } from "../../lib/access/format";

export default function MessagePanel({ project, messages, me, isAdmin = false }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    // Opening the thread marks it read for this side.
    fetch("/api/access/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId: project.id, markRead: true }),
    });
  }, [project.id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [messages.length]);

  async function send(e) {
    e.preventDefault();
    if (!body.trim() || busy) return;
    setBusy(true);
    const res = await fetch("/api/access/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId: project.id, body }),
    });
    setBusy(false);
    if (res.ok) {
      setBody("");
      setSent(true);
      setTimeout(() => setSent(false), 4000);
      router.refresh();
    }
  }

  return (
    <div className="acc-messages">
      <div className="acc-thread">
        {messages.length === 0 && <p className="acc-sub">No messages yet — say hello.</p>}
        {messages.map((m) => (
          <div className={`acc-msg ${m.fromId === me ? "mine" : ""}`} key={m.id}>
            <div className="acc-msg-bubble">{m.body}</div>
            <span className="label">
              {m.fromName} · {fmtTime(m.createdAt)}
            </span>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <form className="acc-composer" onSubmit={send}>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={isAdmin ? "Reply to the client…" : "Message Joe about this project…"}
          rows={3}
          required
        />
        <div className="acc-composer-row">
          <span className="label">
            {sent
              ? "Delivered ✓"
              : isAdmin
                ? "The client sees this in their portal."
                : "Your message is delivered instantly and Joe is immediately notified."}
          </span>
          <button className="acc-btn primary" disabled={busy || !body.trim()}>
            {busy ? "Sending…" : isAdmin ? "Send reply" : "Message Joe"}
          </button>
        </div>
      </form>
    </div>
  );
}
