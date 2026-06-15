// Public proposal — the client opens this from the link Joe sends. No
// login. Opening it records a read receipt; the client can approve or
// reply right here.

import ProposalActions from "../../../components/access/ProposalActions";
import { getBookingByToken, recordBookingView } from "../../../lib/access/store";
import { fmtDate, fmtMoney } from "../../../lib/access/format";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Your Proposal — Joe Bryant",
  robots: { index: false, follow: false },
};

function Expired() {
  return (
    <main className="acc acc-login">
      <div className="acc-login-card">
        <span className="label acc-gold">Joe Bryant</span>
        <h1 className="serif">
          This proposal link <em>is no longer active.</em>
        </h1>
        <p className="acc-help">
          Ask for a fresh link, or email <a href="mailto:joe@joebryant.co">joe@joebryant.co</a>.
        </p>
      </div>
    </main>
  );
}

export default async function ProposalPage({ params }) {
  const { token } = await params;
  recordBookingView(token); // read receipt
  const booking = getBookingByToken(token);
  if (!booking || !booking.proposal) return <Expired />;

  const p = booking.proposal;
  const approved = booking.status === "Client Approved" || booking.status === "Approved";
  const isInfo = p.mode === "info";
  const first = booking.name.split(" ")[0];
  const dateChanged = booking.desiredDate && p.shootDate && booking.desiredDate !== p.shootDate;

  return (
    <>
      <div className="grain" aria-hidden="true" />
      <main className="acc acc-shared acc-proposal">
        <header className="acc-header">
          <span className="acc-wordmark">
            <span className="serif">Joe Bryant</span>
            <span className="acc-divider">|</span>
            <span className="label acc-gold">Architectural Photography</span>
          </span>
        </header>

        <section className="acc-proposal-hero">
          <span className="label acc-gold">{isInfo ? "A quick question" : "Your proposal"}</span>
          <h1 className="serif">
            {isInfo ? <>Before we confirm, {first}…</> : <>For {first} — {booking.address.split(",")[0]}</>}
          </h1>
          {p.revision > 1 && <span className="acc-chip">Revised · v{p.revision}</span>}
        </section>

        {approved && (
          <p className="acc-notice">
            You approved this on {fmtDate((booking.approvedAt || "").slice(0, 10))} — thank you.
            Joe will follow up with next steps and your private client access.
          </p>
        )}

        {p.message && (
          <section className="acc-card acc-proposal-note">
            <p className="serif">{p.message}</p>
            <span className="label">— Joe</span>
          </section>
        )}

        {!isInfo && (
          <section className="acc-card acc-proposal-quote">
            <div className="acc-proposal-meta">
              <div>
                <span className="label acc-gold">Property</span>
                <p className="serif">{booking.address}</p>
              </div>
              <div>
                <span className="label acc-gold">Shoot date</span>
                <p className="serif">
                  {p.shootDate ? fmtDate(p.shootDate) : "To be scheduled"}
                  {dateChanged && <span className="acc-chip" style={{ marginLeft: ".6rem" }}>Updated</span>}
                </p>
              </div>
            </div>

            <div className="acc-proposal-items">
              {(p.lineItems || []).map((li, i) => (
                <div className="acc-proposal-item" key={i}>
                  <span>{li.description}</span>
                  <span className="serif">{fmtMoney(li.amount)}</span>
                </div>
              ))}
              <div className="acc-proposal-item total">
                <span className="label">Total</span>
                <span className="serif">{fmtMoney(p.total)}</span>
              </div>
              <div className="acc-proposal-item retainer">
                <span className="label">50% retainer to confirm the date</span>
                <span className="serif">{fmtMoney(p.retainer)}</span>
              </div>
            </div>
          </section>
        )}

        <ProposalActions token={token} approved={approved} isInfo={isInfo} />

        <footer className="acc-proposal-foot">
          <span className="label">Questions? joe@joebryant.co · 310 890 3687</span>
        </footer>
      </main>
    </>
  );
}
