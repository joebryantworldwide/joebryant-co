// Portal account lookup. With the Studio connected, clients live in
// Sanity ("Clients" in the sidebar). Without it, a demo account lets
// Joe preview the whole experience (see lib/demoClient.js).

import { createClient } from "next-sanity";
import { demoClient } from "./demoClient";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";

const sanity = projectId
  ? createClient({ projectId, dataset, apiVersion: "2024-10-01", useCdn: false })
  : null;

const QUERY = `*[_type == "client" && lower(email) == $email && accessCode == $code][0]{
  name, company, email, welcomeNote, licenseTitle, licenseText,
  "licenseFileUrl": licenseFile.asset->url,
  shoots[]{ title, date, pixiesetUrl, downloadPin, "cover": cover.asset->url },
  invoices[]{ title, amount, status, squareLink, dueDate, paidDate }
}`;

export async function findClient(email, code) {
  if (!email || !code) return null;
  const e = String(email).trim().toLowerCase();
  const c = String(code).trim();

  if (sanity) {
    try {
      const doc = await sanity.fetch(QUERY, { email: e, code: c }, { cache: "no-store" });
      if (doc) return doc;
    } catch (err) {
      console.error("[portal] lookup failed:", err.message);
    }
  }

  if (e === demoClient.email && c === demoClient.accessCode) {
    const { accessCode, ...account } = demoClient;
    return account;
  }
  return null;
}
