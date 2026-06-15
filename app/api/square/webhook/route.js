// Square → portal live sync (production).
//
// In production, point a Square webhook at https://joebryant.co/api/square/webhook
// for events: payment.created, payment.updated, invoice.payment_made.
// Set SQUARE_WEBHOOK_SIGNATURE_KEY (from the Square dashboard). When a
// client pays, the matching invoice flips to "Paid" instantly — in the
// admin dashboard and in the client's portal.
//
// (On localhost, Square can't reach you; the on-load sync in
// lib/access/squareSync.js keeps everything correct there.)

import crypto from "crypto";
import { markInvoicePaidByOrder } from "../../../../lib/access/store";
import { getPaymentOrderId } from "../../../../lib/access/square";

const SIGNATURE_KEY = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;
const NOTIFICATION_URL =
  (process.env.NEXT_PUBLIC_SITE_URL || "https://joebryant.co") + "/api/square/webhook";

export async function POST(request) {
  const raw = await request.text();

  // Verify the request really came from Square (when a key is configured).
  if (SIGNATURE_KEY) {
    const expected = crypto
      .createHmac("sha256", SIGNATURE_KEY)
      .update(NOTIFICATION_URL + raw)
      .digest("base64");
    const given = request.headers.get("x-square-hmacsha256-signature") || "";
    if (expected !== given) {
      return Response.json({ ok: false }, { status: 401 });
    }
  }

  let event;
  try {
    event = JSON.parse(raw);
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }

  const obj = event?.data?.object || {};
  const payment = obj.payment;
  const invoice = obj.invoice;

  // Resolve to the Square order id behind this event.
  let orderId = payment?.order_id || invoice?.order_id || null;
  if (!orderId && payment?.id) orderId = await getPaymentOrderId(payment.id);

  const completed =
    event?.type === "invoice.payment_made" ||
    payment?.status === "COMPLETED" ||
    invoice?.status === "PAID";

  if (completed && orderId) {
    markInvoicePaidByOrder(orderId);
  }

  return Response.json({ ok: true });
}
