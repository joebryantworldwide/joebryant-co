import Link from "next/link";
import { redirect } from "next/navigation";
import AccessHeader from "../../components/access/AccessHeader";
import AccessLogin from "../../components/access/AccessLogin";
import { getSessionUser } from "../../lib/access/auth";
import { getProjectsForUser, getMessages, prepProgress } from "../../lib/access/store";
import { fmtDate, fmtMoney, STATUS_TONE } from "../../lib/access/format";
import { westernSign } from "../../lib/access/zodiac";
import { getMonthlyReading } from "../../lib/access/reading";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Joe Bryant | Access",
  description: "Planning, production, and delivery — elevated.",
  robots: { index: false, follow: false },
};

function timeGreeting() {
  const h = new Date().getHours();
  if (h < 5) return "Up late";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default async function AccessPage() {
  const user = await getSessionUser();

  if (!user) {
    return (
      <>
        <div className="grain" aria-hidden="true" />
        <AccessLogin />
      </>
    );
  }

  if (user.isAdmin) redirect("/access/admin");

  const projects = getProjectsForUser(user);
  const active = projects.filter((p) => p.status !== "Completed");
  const upcoming = active
    .filter((p) => p.shootDate && p.shootDate >= new Date().toISOString().slice(0, 10))
    .sort((a, b) => a.shootDate.localeCompare(b.shootDate));

  const sign = westernSign(user.birthMonth, user.birthDay);
  const reading = sign ? await getMonthlyReading(sign.sign) : null;

  return (
    <>
      <div className="grain" aria-hidden="true" />
      <main className="acc">
        <AccessHeader user={{ name: user.name, isAdmin: false }} />

        <section className="acc-hero">
          <span className="label acc-gold">Your projects</span>
          <h1 className="serif">
            {timeGreeting()}, <em>{(user.name || "").split(" ")[0]}.</em>
          </h1>
          {upcoming[0] && (
            <p className="acc-sub">
              Next shoot — {upcoming[0].propertyName}, {fmtDate(upcoming[0].shootDate)}.
            </p>
          )}
        </section>

        {reading ? (
          <section className="acc-reading">
            <div className="acc-reading-head">
              <span className="label acc-gold">Your reading · {reading.month}</span>
              <span className="acc-reading-sign serif">{sign.glyph} {sign.sign}</span>
            </div>
            <p>“{reading.text}”</p>
            <span className="label acc-reading-foot">A little inspiration, refreshed each month.</span>
          </section>
        ) : (
          <section className="acc-reading acc-bday-prompt">
            <div>
              <span className="label acc-gold">Make it personal</span>
              <p style={{ fontStyle: "normal", fontSize: "1rem" }}>
                Add your birthday and we&rsquo;ll share a monthly reading just for you — and never forget your special day.
              </p>
            </div>
            <Link href="/access/book" className="acc-btn">Add your birthday</Link>
          </section>
        )}

        <section className="acc-section">
          <div className="acc-section-head">
            <h2 className="serif">Projects</h2>
            <Link href="/access/book" className="acc-btn">
              Book a project
            </Link>
          </div>

          {projects.length === 0 && (
            <div className="acc-empty">
              <p className="acc-sub">No projects yet.</p>
              <Link href="/access/book" className="acc-btn primary">
                Request availability
              </Link>
            </div>
          )}

          <div className="acc-projects">
            {projects.map((p) => {
              const prep = prepProgress(p);
              const unread = getMessages(p.id).filter((m) => !m.readByClient).length;
              const due = (p.invoices || []).filter((i) => i.status !== "Paid");
              const dueTotal = due.reduce((s, i) => s + (i.amount || 0), 0);
              return (
                <Link href={`/access/projects/${p.id}`} className="acc-project-card" key={p.id}>
                  {p.coverImage && (
                    <div className="photo acc-project-cover">
                      <img src={p.coverImage} alt={p.propertyName} loading="lazy" />
                    </div>
                  )}
                  <div className="acc-project-body">
                    <span className={`acc-status ${STATUS_TONE[p.status] || "neutral"}`}>{p.status}</span>
                    <h3 className="serif">{p.propertyName}</h3>
                    <p className="acc-address">{p.address}</p>
                    <div className="acc-project-meta">
                      {p.shootDate && <span className="label">Shoot · {fmtDate(p.shootDate)}</span>}
                      {prep.total > 0 && (
                        <span className="label">
                          Prep · {prep.done}/{prep.total}
                        </span>
                      )}
                      {dueTotal > 0 && <span className="label">Open · {fmtMoney(dueTotal)}</span>}
                      {unread > 0 && <span className="label acc-gold">{unread} new message{unread > 1 ? "s" : ""}</span>}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <footer className="acc-foot">
          <span className="label">Questions? joe@joebryant.co · 310 890 3687</span>
        </footer>
      </main>
    </>
  );
}
