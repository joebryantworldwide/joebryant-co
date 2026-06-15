// Square integration — real hosted payment links + payment status sync.
//
// Sandbox by default (SQUARE_ENV=sandbox). Set production credentials and
// SQUARE_ENV=production to go live. Everything fails soft: if Square isn't
// configured or a call fails, the portal keeps working on manual payments.

import crypto from "crypto";

const ENV = process.env.SQUARE_ENV || "sandbox";
const TOKEN = process.env.SQUARE_ACCESS_TOKEN;
const LOCATION = process.env.SQUARE_LOCATION_ID;
const VERSION = "2024-10-17";
const BASE =
  ENV === "production"
    ? "https://connect.squareup.com"
    : "https://connect.squareupsandbox.com";

export function isConfigured() {
  return Boolean(TOKEN && LOCATION);
}

async function squareFetch(path, { method = "GET", body } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Square-Version": VERSION,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json?.errors?.[0]?.detail || `Square ${res.status}`;
    throw new Error(msg);
  }
  return json;
}

// Create a hosted checkout link for an invoice (Quick Pay).
export async function createPaymentLink({ name, amount, note }) {
  if (!isConfigured()) throw new Error("Square is not configured.");
  const cents = Math.round((Number(amount) || 0) * 100);
  if (cents <= 0) throw new Error("Amount must be greater than zero.");

  const data = await squareFetch("/v2/online-checkout/payment-links", {
    method: "POST",
    body: {
      idempotency_key: crypto.randomUUID(),
      quick_pay: {
        name: (name || "Photography services").slice(0, 255),
        price_money: { amount: cents, currency: "USD" },
        location_id: LOCATION,
      },
      ...(note ? { description: note.slice(0, 255) } : {}),
    },
  });

  const link = data.payment_link || {};
  return {
    url: link.long_url || link.url,
    paymentLinkId: link.id,
    orderId: link.order_id,
  };
}

// Charge a tokenized card from the in-app payment form. The card itself
// is tokenized in the browser by Square's SDK — only the one-time token
// reaches us, never raw card data.
export async function createPayment({ sourceId, amount, note }) {
  if (!isConfigured()) throw new Error("Square is not configured.");
  const cents = Math.round((Number(amount) || 0) * 100);
  if (cents <= 0) throw new Error("Amount must be greater than zero.");
  const data = await squareFetch("/v2/payments", {
    method: "POST",
    body: {
      idempotency_key: crypto.randomUUID(),
      source_id: sourceId,
      amount_money: { amount: cents, currency: "USD" },
      location_id: LOCATION,
      ...(note ? { note: note.slice(0, 500) } : {}),
    },
  });
  return data.payment;
}

// Lightweight health check for the connection indicator.
// green = linked & healthy · red = not configured · orange = configured but unreachable.
export async function ping() {
  if (!isConfigured()) return "red";
  try {
    await squareFetch("/v2/locations");
    return "green";
  } catch {
    return "orange";
  }
}

// Has this order been paid? Returns { paid, state } — never throws.
export async function getOrderPaid(orderId) {
  if (!isConfigured() || !orderId) return { paid: false };
  try {
    const data = await squareFetch(`/v2/orders/${orderId}`);
    const order = data.order || {};
    const due = order.net_amount_due_money?.amount;
    const paid =
      order.state === "COMPLETED" ||
      (Array.isArray(order.tenders) && order.tenders.length > 0) ||
      due === 0;
    return { paid, state: order.state };
  } catch (err) {
    console.error("[square] order check failed:", err.message);
    return { paid: false };
  }
}

// Look up the order id behind a webhook payment event.
export async function getPaymentOrderId(paymentId) {
  if (!isConfigured() || !paymentId) return null;
  try {
    const data = await squareFetch(`/v2/payments/${paymentId}`);
    return data.payment?.order_id || null;
  } catch {
    return null;
  }
}
