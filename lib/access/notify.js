// "Joe is immediately notified." — Phase 1 delivery.
//
// Every event always lands in the admin dashboard (it reads the store
// directly). If RESEND_API_KEY is set, Joe also gets an email at
// NOTIFY_EMAIL (default joe@joebryant.co). No key → logged to the server
// console so nothing is silently dropped in development.

const TO = process.env.NOTIFY_EMAIL || "joe@joebryant.co";
const FROM = process.env.NOTIFY_FROM || "Joe Bryant Access <access@joebryant.co>";

export async function notifyJoe(subject, lines) {
  const body = Array.isArray(lines) ? lines.filter(Boolean).join("\n") : String(lines);
  const key = process.env.RESEND_API_KEY;

  if (!key) {
    console.log(`[access notify] ${subject}\n${body}`);
    return { delivered: "console" };
  }

  return sendEmail({ to: TO, subject, body });
}

// — Email —
async function sendEmail({ to, subject, body }) {
  const key = process.env.RESEND_API_KEY;
  if (!key || !to) {
    console.log(`[access email → ${to || "?"}] ${subject}\n${body}`);
    return { channel: "email", to, delivered: key ? "skipped" : "console" };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM, to: [to], subject, text: body }),
    });
    if (!res.ok) throw new Error(`Resend ${res.status}`);
    return { channel: "email", to, delivered: "sent" };
  } catch (err) {
    console.error("[access email] failed:", err.message);
    return { channel: "email", to, delivered: "console", error: err.message };
  }
}

// — SMS — wired for Twilio; until TWILIO_* env vars are set, the text is
// logged so the flow is testable without an SMS account.
async function sendSms({ to, body }) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM;
  if (!sid || !token || !from || !to) {
    console.log(`[access sms → ${to || "?"}] ${body}`);
    return { channel: "sms", to, delivered: sid ? "skipped" : "console" };
  }
  try {
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(`${sid}:${token}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: to, From: from, Body: body }).toString(),
    });
    if (!res.ok) throw new Error(`Twilio ${res.status}`);
    return { channel: "sms", to, delivered: "sent" };
  } catch (err) {
    console.error("[access sms] failed:", err.message);
    return { channel: "sms", to, delivered: "console", error: err.message };
  }
}

// Notify a CLIENT across the channels Joe chose (e.g. ["email","sms"]).
// Returns a per-channel delivery report for the UI to show honestly.
export async function notifyClient({ email, phone, subject, lines, channels = [] }) {
  const body = Array.isArray(lines) ? lines.filter(Boolean).join("\n") : String(lines);
  const results = [];
  if (channels.includes("email")) results.push(await sendEmail({ to: email, subject, body }));
  if (channels.includes("sms")) results.push(await sendSms({ to: phone, body }));
  return results;
}
