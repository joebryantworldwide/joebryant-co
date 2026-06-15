import AccessHeader from "../../../components/access/AccessHeader";
import BookingForm from "../../../components/access/BookingForm";
import { getSessionUser } from "../../../lib/access/auth";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Book a Project — Joe Bryant | Access",
  robots: { index: false, follow: false },
};

export default async function BookPage() {
  const user = await getSessionUser();
  const prefill = user
    ? { name: user.name, email: user.email, phone: user.phone, company: user.company }
    : {};

  return (
    <>
      <div className="grain" aria-hidden="true" />
      <main className="acc">
        <AccessHeader user={user ? { name: user.name, isAdmin: !!user.isAdmin } : null} crumb="Book" />
        <section className="acc-hero">
          <span className="label acc-gold">New project</span>
          <h1 className="serif">
            Let&rsquo;s plan <em>the shoot.</em>
          </h1>
          <p className="acc-sub">
            Local shoots from $1,000 — plus $100 per 1,000 sq ft. Final pricing confirmed by Joe.
          </p>
        </section>
        <section className="acc-section">
          <BookingForm prefill={prefill} />
        </section>
      </main>
    </>
  );
}
