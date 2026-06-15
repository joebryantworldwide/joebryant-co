import { redirect } from "next/navigation";
import AccessHeader from "../../../../../components/access/AccessHeader";
import BookingProposal from "../../../../../components/access/BookingProposal";
import { requireAdmin } from "../../../../../lib/access/auth";
import { getBooking } from "../../../../../lib/access/store";
import { estimateBreakdown } from "../../../../../lib/access/pricing";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Request — Admin — Joe Bryant | Access",
  robots: { index: false, follow: false },
};

export default async function AdminBookingPage({ params }) {
  const admin = await requireAdmin();
  if (!admin) redirect("/access");

  const { id } = await params;
  const booking = getBooking(id);
  if (!booking) redirect("/access/admin");

  // Seed the proposal editor with an itemized quote from the request.
  const breakdown = estimateBreakdown({ sqft: booking.sqft, ...(booking.services || {}) });
  const defaultLineItems = breakdown.items.map((i) => ({ description: i.label, amount: i.high }));
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://joebryant.co";

  return (
    <>
      <div className="grain" aria-hidden="true" />
      <main className="acc">
        <AccessHeader user={{ name: admin.name, isAdmin: true }} crumb="Request" back={{ href: "/access/admin", label: "Dashboard" }} />
        <BookingProposal
          booking={booking}
          defaultLineItems={defaultLineItems}
          proposalBase={`${base}/proposal/`}
        />
      </main>
    </>
  );
}
