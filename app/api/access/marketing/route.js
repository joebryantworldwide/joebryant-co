// Marketing actions — admin only. Save/send/schedule/delete campaigns and
// update birthday automation. Sends personalize each recipient's monthly
// reading where a {{reading}} token (reading block) is present.

import {
  addCampaign, updateCampaign, deleteCampaign, getCampaign,
  getContacts, updateMarketingSettings,
} from "../../../../lib/access/store";
import { requireAdmin } from "../../../../lib/access/auth";
import { getMonthlyReading } from "../../../../lib/access/reading";
import { westernSign } from "../../../../lib/access/zodiac";

const norm = (e) => String(e || "").trim().toLowerCase();

function audienceContacts(audience) {
  const all = getContacts();
  if (audience === "Clients") return all.filter((c) => c.type === "Client");
  if (audience === "Leads") return all.filter((c) => c.type === "Lead");
  return all;
}

async function sendEmail(to, subject, html) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.log(`[marketing] (no RESEND key) would email ${to}: ${subject}`);
    return "console";
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.NOTIFY_FROM || "Joe Bryant <hello@joebryant.co>",
        to: [to], subject, html,
      }),
    });
    return res.ok ? "sent" : "error";
  } catch {
    return "error";
  }
}

export async function POST(request) {
  const admin = await requireAdmin();
  if (!admin) return Response.json({ ok: false, error: "Admin only." }, { status: 403 });

  const { action, ...data } = await request.json().catch(() => ({}));

  switch (action) {
    case "save": {
      const fields = {
        type: data.type || "newsletter",
        title: data.title || "Untitled",
        audience: data.audience || "All",
        design: data.design || null,
        html: data.html || null,
        bodyText: data.bodyText || null,
        scheduledAt: data.scheduledAt || null,
        status: data.scheduledAt ? "Scheduled" : "Draft",
      };
      const campaign = data.id ? updateCampaign(data.id, fields) : addCampaign(fields);
      return Response.json({ ok: true, campaign });
    }

    case "send": {
      const c = getCampaign(data.id);
      if (!c) return Response.json({ ok: false, error: "Campaign not found." }, { status: 404 });
      const recipients = audienceContacts(c.audience);
      const needsReading = (c.html || "").includes("{{reading}}");
      const results = [];

      for (const r of recipients) {
        if (c.type === "text") {
          // SMS path — ready for Twilio; logged until keys are added.
          console.log(`[marketing] (SMS) ${r.phone || "no phone"}: ${c.bodyText}`);
          results.push("console");
          continue;
        }
        let html = c.html || `<p>${c.bodyText || ""}</p>`;
        if (needsReading) {
          const sign = westernSign(r.birthMonth, r.birthDay)?.sign || null;
          const reading = await getMonthlyReading(sign);
          html = html.replaceAll("{{reading}}", reading.text);
        }
        results.push(await sendEmail(r.email, c.title, html));
      }

      const sentCount = results.filter((x) => x === "sent").length;
      updateCampaign(c.id, {
        status: "Sent",
        sentAt: new Date().toISOString(),
        recipientCount: recipients.length,
      });
      return Response.json({
        ok: true,
        recipients: recipients.length,
        delivered: sentCount,
        note: process.env.RESEND_API_KEY ? undefined : "No email key set — logged to server console.",
      });
    }

    case "delete": {
      deleteCampaign(data.id);
      return Response.json({ ok: true });
    }

    case "settings": {
      const s = updateMarketingSettings({
        birthdayAuto: !!data.birthdayAuto,
        birthdayMessage: data.birthdayMessage || "",
      });
      return Response.json({ ok: true, settings: s });
    }

    default:
      return Response.json({ ok: false, error: `Unknown action "${action}".` }, { status: 400 });
  }
}
