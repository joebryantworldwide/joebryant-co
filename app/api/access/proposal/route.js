// Public proposal actions — the client approves or replies from the
// token link, no login required.

import {
  getBookingByToken,
  clientApproveBooking,
  addBookingMessage,
} from "../../../../lib/access/store";
import { notifyJoe } from "../../../../lib/access/notify";
import { fmtMoney } from "../../../../lib/access/format";

export async function POST(request) {
  const { token, action, body } = await request.json().catch(() => ({}));
  const booking = getBookingByToken(token);
  if (!booking) {
    return Response.json({ ok: false, error: "This link is no longer active." }, { status: 404 });
  }

  if (action === "approve") {
    clientApproveBooking(token);
    await notifyJoe(`Proposal approved — ${booking.address}`, [
      `${booking.name} (${booking.email}) just approved your proposal.`,
      `Total: ${fmtMoney(booking.proposal?.total || 0)}`,
      "Finalize it from the request in your admin dashboard to create their project & login.",
    ]);
    return Response.json({ ok: true });
  }

  if (action === "reply") {
    if (!body) return Response.json({ ok: false, error: "Write a message first." }, { status: 400 });
    addBookingMessage(token, { from: "client", body });
    await notifyJoe(`Reply on your proposal — ${booking.address}`, [
      `${booking.name} wrote:`,
      `"${String(body).slice(0, 400)}"`,
      "Open the request to revise and resend.",
    ]);
    return Response.json({ ok: true });
  }

  return Response.json({ ok: false, error: "Unknown action." }, { status: 400 });
}
