"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { sizedUrl } from "./Photo";

function timeGreeting() {
  const h = new Date().getHours();
  if (h < 5) return "Up late";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function fmtDate(d) {
  if (!d) return "";
  return new Date(d + "T12:00:00Z").toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function fmtMoney(n) {
  return (n ?? 0).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export default function PortalDashboard({ account, news }) {
  const [greeting, setGreeting] = useState("Welcome");
  const [copied, setCopied] = useState(null);

  useEffect(() => setGreeting(timeGreeting()), []);

  async function logout() {
    await fetch("/api/portal/logout", { method: "POST" });
    window.location.reload();
  }

  function share(shoot) {
    const url = shoot.pixiesetUrl;
    if (navigator.share) {
      navigator.share({ title: shoot.title, url }).catch(() => {});
      return;
    }
    navigator.clipboard?.writeText(url).then(() => {
      setCopied(shoot.title);
      setTimeout(() => setCopied(null), 2200);
    });
  }

  const firstName = (account.name || "").split(" ")[0];
  const due = (account.invoices || []).filter((i) => i.status !== "Paid");

  return (
    <main className="portal">
      <header className="portal-hero">
        <span className="label">Your Private Collection</span>
        <h1 className="serif">
          {greeting}, <em>{firstName}.</em>
        </h1>
        {account.welcomeNote && <p className="portal-note">{account.welcomeNote}</p>}
        <button className="portal-logout label" onClick={logout}>
          Sign out
        </button>
      </header>

      <section className="portal-section">
        <div className="portal-section-head">
          <h2 className="serif">Your shoots</h2>
          <span className="label">
            {(account.shoots || []).length} galler{(account.shoots || []).length === 1 ? "y" : "ies"}
          </span>
        </div>
        <div className="portal-shoots">
          {(account.shoots || []).map((s, i) => (
            <article className="portal-shoot" key={i}>
              {s.cover && (
                <a className="photo" href={s.pixiesetUrl} target="_blank" rel="noreferrer">
                  <img src={sizedUrl(s.cover, 1000)} alt={s.title} loading="lazy" />
                </a>
              )}
              <div className="portal-shoot-copy">
                <span className="label">{fmtDate(s.date)}</span>
                <h3 className="serif">{s.title}</h3>
                <div className="portal-shoot-actions">
                  {s.pixiesetUrl && (
                    <a className="portal-btn" href={s.pixiesetUrl} target="_blank" rel="noreferrer">
                      View &amp; download ↗
                    </a>
                  )}
                  <button className="portal-btn ghost" onClick={() => share(s)}>
                    {copied === s.title ? "Link copied ✓" : "Invite someone"}
                  </button>
                </div>
                {s.downloadPin && (
                  <span className="label portal-pin">Download PIN · {s.downloadPin}</span>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      {(account.invoices || []).length > 0 && (
        <section className="portal-section">
          <div className="portal-section-head">
            <h2 className="serif">Invoices</h2>
            <span className="label">{due.length ? `${due.length} open` : "All settled — thank you"}</span>
          </div>
          <div className="portal-invoices">
            {account.invoices.map((inv, i) => (
              <div className={`portal-invoice ${inv.status === "Paid" ? "paid" : ""}`} key={i}>
                <div className="portal-invoice-main">
                  <span className="serif">{inv.title}</span>
                  <span className="label">
                    {inv.status === "Paid"
                      ? `Paid ${fmtDate(inv.paidDate)}`
                      : inv.dueDate
                        ? `Due ${fmtDate(inv.dueDate)}`
                        : "Open"}
                  </span>
                </div>
                <div className="portal-invoice-side">
                  <span className="portal-amount serif">{fmtMoney(inv.amount)}</span>
                  {inv.status === "Paid" ? (
                    <span className="portal-chip">Paid ✓</span>
                  ) : inv.squareLink ? (
                    <a className="portal-btn" href={inv.squareLink} target="_blank" rel="noreferrer">
                      Pay securely ↗
                    </a>
                  ) : (
                    <span className="portal-chip open">{inv.status}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {(account.licenseText || account.licenseFileUrl) && (
        <section className="portal-section">
          <div className="portal-section-head">
            <h2 className="serif">{account.licenseTitle || "Your license"}</h2>
            <span className="label">Agreed at payment</span>
          </div>
          <details className="portal-license">
            <summary className="label">Read the full terms</summary>
            <p>{account.licenseText}</p>
            {account.licenseFileUrl && (
              <a className="portal-btn" href={account.licenseFileUrl} target="_blank" rel="noreferrer">
                Download signed copy ↓
              </a>
            )}
          </details>
        </section>
      )}

      {news?.length > 0 && (
        <section className="portal-section">
          <div className="portal-section-head">
            <h2 className="serif">Meanwhile, on set</h2>
            <span className="label">Latest from Joe</span>
          </div>
          <div className="portal-news">
            {news.map((n) => (
              <Link href={`/journal/${n.slug}`} className="portal-news-item" key={n.slug}>
                <span className="label">{fmtDate(n.date)}</span>
                <h3 className="serif">{n.title}</h3>
                <p>{n.description}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <footer className="portal-foot">
        <span className="label">Questions? joe@joebryant.co · 310 890 3687</span>
      </footer>
    </main>
  );
}
