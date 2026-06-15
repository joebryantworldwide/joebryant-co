// Joe Bryant | Access — data layer.
//
// Phase 1 stores everything in data/access.json so the system works the
// moment it runs, with zero configuration. Every read/write goes through
// this module, so swapping in Sanity or a database later means replacing
// one file. Delete data/access.json to reset to the demo seed.

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { seedData } from "./seed";
import { deriveStatus, invoiceTotal } from "./status";

// Stamp the automatic status onto a project before it leaves the store,
// so every page (admin, dashboard, client) shows the same derived value.
function withStatus(project) {
  if (!project) return project;
  project.status = deriveStatus(project);
  return project;
}

function lineItemsTotal(lineItems, fallback) {
  if (Array.isArray(lineItems) && lineItems.length) {
    return lineItems.reduce((s, li) => s + (Number(li.amount) || 0), 0);
  }
  return Number(fallback) || 0;
}

// On a normal server we keep the store in the project's /data dir. On a
// serverless host (Vercel) the project dir is read-only, so we fall back to
// the one writable location, /tmp. That filesystem is per-instance and
// ephemeral, so we also keep the live store in module memory — reads/writes
// stay consistent within an instance even if the disk can't be written.
const READONLY_FS = !!process.env.VERCEL;
const DATA_DIR = READONLY_FS
  ? path.join("/tmp", "jb-access")
  : path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "access.json");

export const uid = (p = "") => p + crypto.randomBytes(6).toString("hex");

let memDb = null; // in-memory copy; the source of truth when disk is unavailable

function load() {
  // If we're holding an in-memory store (disk unwritable), trust it.
  if (memDb) return memDb;

  let raw;
  try {
    raw = fs.readFileSync(FILE, "utf8");
  } catch (err) {
    if (err.code === "ENOENT") {
      // First run — the file genuinely doesn't exist yet. Seed it.
      const db = seedData();
      persist(db);
      return db;
    }
    // A transient read error (EBUSY, EACCES, etc.) must NEVER fall through
    // to re-seeding — that would overwrite real client data with the demo.
    throw err;
  }

  try {
    const db = JSON.parse(raw);
    if (!db || !Array.isArray(db.users)) throw new Error("malformed store");
    return db;
  } catch (err) {
    // The file exists but is corrupt/half-written. Preserve it for recovery
    // instead of silently destroying it, then fail loudly.
    try {
      fs.copyFileSync(FILE, `${FILE}.corrupt-${Date.now()}`);
    } catch {}
    throw new Error(`[access] store unreadable, backed up: ${err.message}`);
  }
}

function persist(db) {
  // Always keep the latest in memory so the app keeps working even if the
  // filesystem rejects the write (serverless / read-only).
  memDb = db;
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const tmp = FILE + ".tmp";
    fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
    fs.renameSync(tmp, FILE);
  } catch (err) {
    // Read-only filesystem is expected on serverless — operate from memory.
    // Anything else is unexpected and should surface so we don't lose data.
    if (!["EROFS", "EACCES", "EPERM", "ENOENT"].includes(err.code)) throw err;
  }
}

function mutate(fn) {
  const db = load();
  const result = fn(db);
  persist(db);
  return result;
}

const norm = (e) => String(e || "").trim().toLowerCase();

// ——— users ———

export function getUsers() {
  return load().users;
}

export function getUser(id) {
  return load().users.find((u) => u.id === id) || null;
}

export function findUserByEmail(email) {
  const e = norm(email);
  return load().users.find((u) => norm(u.email) === e) || null;
}

export function findUserByLogin(email, code) {
  const u = findUserByEmail(email);
  if (!u || !code) return null;
  return u.accessCode === String(code).trim() ? u : null;
}

export function createUser(fields) {
  return mutate((db) => {
    const existing = db.users.find((u) => norm(u.email) === norm(fields.email));
    if (existing) return existing;
    const user = {
      id: uid("u-"),
      name: "",
      email: "",
      phone: "",
      company: "",
      role: "Client / Owner",
      isAdmin: false,
      accessCode: generateCode(),
      createdAt: new Date().toISOString(),
      ...fields,
      email: norm(fields.email),
    };
    db.users.push(user);
    return user;
  });
}

export function updateUser(id, fields) {
  return mutate((db) => {
    const u = db.users.find((x) => x.id === id);
    if (!u) return null;
    Object.assign(u, fields);
    return u;
  });
}

export function generateCode() {
  // Short, readable, no ambiguous characters — easy to text to a client.
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  return Array.from(crypto.randomBytes(6))
    .map((b) => alphabet[b % alphabet.length])
    .join("");
}

// ——— projects ———

export function getProjects() {
  return load().projects.map(withStatus);
}

export function getProject(id) {
  const p = load().projects.find((p) => p.id === id) || null;
  return withStatus(p);
}

export function getProjectByShareToken(token) {
  if (!token) return null;
  return withStatus(load().projects.find((p) => p.shareToken === token) || null);
}

// What can this user see? Admin → everything. Project owner → full.
// Team members get the access level they were invited with.
export function accessLevelFor(user, project) {
  if (!user || !project) return null;
  if (user.isAdmin) return "full";
  if (project.clientId === user.id) return "full";
  const member = (project.team || []).find((m) => norm(m.email) === norm(user.email));
  return member ? member.access || "view" : null;
}

export function getProjectsForUser(user) {
  if (!user) return [];
  const all = load().projects;
  if (user.isAdmin) return all.map(withStatus);
  return all
    .filter(
      (p) =>
        p.clientId === user.id ||
        (p.team || []).some((m) => norm(m.email) === norm(user.email))
    )
    .map(withStatus);
}

export function createProject(fields) {
  return mutate((db) => {
    const project = {
      id: uid("p-"),
      propertyName: "",
      address: "",
      shootDate: "",
      status: "Planning",
      clientId: null,
      team: [],
      services: { drone: false, twilight: false, styling: false, sqft: 0 },
      prepGuide: [],
      smugmugUrl: "",
      coverImage: "",
      invoices: [],
      payment: { manualMethod: null, awaitingVerification: false },
      notes: "",
      shareToken: uid("share-"),
      createdAt: new Date().toISOString(),
      ...fields,
    };
    db.projects.push(project);
    return project;
  });
}

export function updateProject(id, fields) {
  return mutate((db) => {
    const p = db.projects.find((x) => x.id === id);
    if (!p) return null;
    Object.assign(p, fields);
    return p;
  });
}

export function addTeamMember(projectId, member) {
  return mutate((db) => {
    const p = db.projects.find((x) => x.id === projectId);
    if (!p) return null;
    p.team = p.team || [];
    const e = norm(member.email);
    if (!p.team.some((m) => norm(m.email) === e)) p.team.push({ ...member, email: e });
    return p;
  });
}

export function removeTeamMember(projectId, email) {
  return mutate((db) => {
    const p = db.projects.find((x) => x.id === projectId);
    if (!p) return null;
    p.team = (p.team || []).filter((m) => norm(m.email) !== norm(email));
    return p;
  });
}

export function togglePrepItem(projectId, sectionIndex, itemIndex, done) {
  return mutate((db) => {
    const p = db.projects.find((x) => x.id === projectId);
    const item = p?.prepGuide?.[sectionIndex]?.items?.[itemIndex];
    if (!item) return null;
    item.done = !!done;
    return p;
  });
}

export function prepProgress(project) {
  const items = (project.prepGuide || []).flatMap((s) => s.items || []);
  const done = items.filter((i) => i.done).length;
  return { done, total: items.length };
}

// ——— invoices & payments ———

export function addInvoice(projectId, invoice) {
  return mutate((db) => {
    const p = db.projects.find((x) => x.id === projectId);
    if (!p) return null;
    p.invoices = p.invoices || [];
    // Every invoice carries line items; fall back to a single line from
    // the legacy { title, amount } shape so old data keeps working.
    const lineItems =
      Array.isArray(invoice.lineItems) && invoice.lineItems.length
        ? invoice.lineItems
        : [{ description: invoice.title || "Photography services", amount: Number(invoice.amount) || 0 }];
    p.invoices.push({
      id: uid("inv-"),
      number: nextInvoiceNumber(db),
      status: "Open",
      createdAt: new Date().toISOString(),
      ...invoice,
      lineItems,
      amount: lineItemsTotal(lineItems, invoice.amount),
    });
    return p;
  });
}

// Sequential, human-friendly invoice numbers across all projects.
function nextInvoiceNumber(db) {
  const nums = db.projects
    .flatMap((p) => p.invoices || [])
    .map((i) => i.number)
    .filter((n) => typeof n === "number");
  const next = (nums.length ? Math.max(...nums) : 1000) + 1;
  return next;
}

// An additional charge after an invoice is settled: a linked follow-up
// invoice in the same thread (Part 2, Part 3…).
export function addCharge(projectId, parentInvoiceId, charge) {
  return mutate((db) => {
    const p = db.projects.find((x) => x.id === projectId);
    if (!p) return null;
    const parent = (p.invoices || []).find((i) => i.id === parentInvoiceId);
    if (!parent) return null;
    const rootId = parent.parentId || parent.id;
    const partCount = (p.invoices || []).filter(
      (i) => i.id === rootId || i.parentId === rootId
    ).length;
    const lineItems =
      Array.isArray(charge.lineItems) && charge.lineItems.length
        ? charge.lineItems
        : [{ description: charge.description || "Additional charge", amount: Number(charge.amount) || 0 }];
    const inv = {
      id: uid("inv-"),
      number: nextInvoiceNumber(db),
      parentId: rootId,
      part: partCount + 1,
      title: charge.title || `${parent.title} — Additional charges`,
      lineItems,
      amount: lineItemsTotal(lineItems),
      squareUrl: charge.squareUrl || "",
      dueDate: charge.dueDate || "",
      status: "Open",
      createdAt: new Date().toISOString(),
    };
    p.invoices.push(inv);
    return inv;
  });
}

export function updateInvoice(projectId, invoiceId, fields) {
  return mutate((db) => {
    const p = db.projects.find((x) => x.id === projectId);
    const inv = p?.invoices?.find((i) => i.id === invoiceId);
    if (!inv) return null;
    Object.assign(inv, fields);
    // Keep the total in sync whenever the line items change.
    if (Array.isArray(inv.lineItems)) {
      inv.amount = lineItemsTotal(inv.lineItems, inv.amount);
    }
    return p;
  });
}

// Mark whichever invoice owns this Square order as paid (used by the
// webhook and the on-load payment sync).
export function markInvoicePaidByOrder(orderId) {
  if (!orderId) return null;
  return mutate((db) => {
    for (const p of db.projects) {
      const inv = (p.invoices || []).find((i) => i.squareOrderId === orderId);
      if (inv && inv.status !== "Paid") {
        inv.status = "Paid";
        inv.paidDate = new Date().toISOString().slice(0, 10);
        return { projectId: p.id, invoiceId: inv.id };
      }
    }
    return null;
  });
}

export function selectManualPayment(projectId, method) {
  return mutate((db) => {
    const p = db.projects.find((x) => x.id === projectId);
    if (!p) return null;
    p.payment = { manualMethod: method, awaitingVerification: true };
    if (["Planning", "Availability Requested", "Confirmed"].includes(p.status)) {
      p.status = "Awaiting Payment Verification";
    }
    return p;
  });
}

export function confirmManualPayment(projectId) {
  return mutate((db) => {
    const p = db.projects.find((x) => x.id === projectId);
    if (!p) return null;
    p.payment = { ...p.payment, awaitingVerification: false, confirmedAt: new Date().toISOString() };
    (p.invoices || []).forEach((inv) => {
      if (inv.status === "Awaiting Verification") {
        inv.status = "Paid";
        inv.paidDate = new Date().toISOString().slice(0, 10);
      }
    });
    if (p.status === "Awaiting Payment Verification") p.status = "Confirmed";
    return p;
  });
}

// ——— messages ———

export function getMessages(projectId) {
  return load().messages.filter((m) => m.projectId === projectId);
}

export function getAllMessages() {
  return load().messages;
}

export function addMessage({ projectId, fromId, fromName, body, fromAdmin = false }) {
  return mutate((db) => {
    const msg = {
      id: uid("m-"),
      projectId,
      fromId,
      fromName,
      body,
      createdAt: new Date().toISOString(),
      readByAdmin: fromAdmin,
      readByClient: !fromAdmin,
    };
    db.messages.push(msg);
    return msg;
  });
}

export function markMessagesRead(projectId, { admin = false } = {}) {
  return mutate((db) => {
    db.messages
      .filter((m) => m.projectId === projectId)
      .forEach((m) => {
        if (admin) m.readByAdmin = true;
        else m.readByClient = true;
      });
    return true;
  });
}

// ——— booking requests ———

export function getBookings() {
  return load().bookings;
}

export function getBooking(id) {
  return load().bookings.find((b) => b.id === id) || null;
}

export function addBooking(fields) {
  return mutate((db) => {
    const booking = {
      id: uid("b-"),
      status: "New",
      createdAt: new Date().toISOString(),
      ...fields,
    };
    db.bookings.push(booking);
    return booking;
  });
}

export function updateBooking(id, fields) {
  return mutate((db) => {
    const b = db.bookings.find((x) => x.id === id);
    if (!b) return null;
    Object.assign(b, fields);
    return b;
  });
}

export function getBookingByToken(token) {
  if (!token) return null;
  return load().bookings.find((b) => b.proposalToken === token) || null;
}

// Joe revises a request (date, line items, message) and sends it to the
// client for approval. Keeps a revision history so changes are visible.
export function sendProposal(bookingId, { shootDate, lineItems, message, mode } = {}) {
  return mutate((db) => {
    const b = db.bookings.find((x) => x.id === bookingId);
    if (!b) return null;
    const items = (lineItems || [])
      .map((li) => ({ description: String(li.description || "").trim(), amount: Number(li.amount) || 0 }))
      .filter((li) => li.description || li.amount);
    const total = items.reduce((s, li) => s + li.amount, 0);
    const sentAt = new Date().toISOString();
    const revision = (b.proposal?.revision || 0) + 1;

    b.proposalToken = b.proposalToken || uid("prop-");
    b.proposal = {
      shootDate: shootDate || b.desiredDate || "",
      lineItems: items,
      total,
      retainer: Math.round(total * 0.5),
      message: message || "",
      sentAt,
      revision,
      mode: mode === "info" ? "info" : "proposal",
    };
    b.revisions = b.revisions || [];
    b.revisions.push({ revision, sentAt, shootDate: b.proposal.shootDate, total, mode: b.proposal.mode });
    b.thread = b.thread || [];
    if (message) b.thread.push({ from: "joe", body: message, at: sentAt });
    b.status = mode === "info" ? "Info Requested" : "Proposal Sent";
    return b;
  });
}

// Read receipt — records each time the client opens the proposal link.
export function recordBookingView(token) {
  return mutate((db) => {
    const b = db.bookings.find((x) => x.proposalToken === token);
    if (!b) return null;
    b.views = b.views || [];
    const last = b.views[b.views.length - 1];
    const now = Date.now();
    if (!last || now - new Date(last.at).getTime() > 30000) {
      b.views.push({ at: new Date().toISOString() });
    }
    if (b.status === "Proposal Sent" || b.status === "Info Requested") {
      b.viewedAt = b.viewedAt || new Date().toISOString();
    }
    return b;
  });
}

export function addBookingMessage(idOrToken, { from, body }) {
  return mutate((db) => {
    const b = db.bookings.find((x) => x.id === idOrToken || x.proposalToken === idOrToken);
    if (!b || !body) return null;
    b.thread = b.thread || [];
    b.thread.push({ from, body: String(body).slice(0, 2000), at: new Date().toISOString() });
    if (from === "client") b.status = "Client Replied";
    return b;
  });
}

export function clientApproveBooking(token) {
  return mutate((db) => {
    const b = db.bookings.find((x) => x.proposalToken === token);
    if (!b) return null;
    b.status = "Client Approved";
    b.approvedAt = new Date().toISOString();
    return b;
  });
}

// ——— financials (aggregation across all projects) ———

export function getAllInvoices() {
  const db = load();
  const usersById = Object.fromEntries(db.users.map((u) => [u.id, u]));
  const rows = [];
  for (const p of db.projects) {
    const client = usersById[p.clientId];
    for (const inv of p.invoices || []) {
      rows.push({
        ...inv,
        amount: invoiceTotal(inv),
        projectId: p.id,
        projectName: p.propertyName,
        clientId: p.clientId,
        clientName: client?.name || "—",
      });
    }
  }
  return rows.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
}

export function financialSummary() {
  const rows = getAllInvoices();
  const sum = (pred) => rows.filter(pred).reduce((a, i) => a + (i.amount || 0), 0);
  const ym = new Date().toISOString().slice(0, 7);
  return {
    lifetime: sum((i) => i.status === "Paid"),
    outstanding: sum((i) => i.status !== "Paid"),
    paidThisMonth: sum((i) => i.status === "Paid" && (i.paidDate || "").slice(0, 7) === ym),
    invoiceCount: rows.length,
    openCount: rows.filter((i) => i.status !== "Paid").length,
  };
}

// Revenue by month (last n months), for the simple chart.
export function revenueByMonth(months = 6) {
  const rows = getAllInvoices().filter((i) => i.status === "Paid" && i.paidDate);
  const out = [];
  const now = new Date();
  for (let k = months - 1; k >= 0; k--) {
    const d = new Date(now.getFullYear(), now.getMonth() - k, 1);
    const key = d.toISOString().slice(0, 7);
    const total = rows.filter((i) => i.paidDate.slice(0, 7) === key).reduce((a, i) => a + i.amount, 0);
    out.push({ key, label: d.toLocaleString("en-US", { month: "short" }), total });
  }
  return out;
}

// ——— contacts (clients + leads), for marketing audience ———

export function getContacts() {
  const db = load();
  const contacts = db.users
    .filter((u) => !u.isAdmin)
    .map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone || "",
      company: u.company || "",
      type: "Client",
      birthMonth: u.birthMonth || null,
      birthDay: u.birthDay || null,
      birthYear: u.birthYear || null,
    }));
  const clientEmails = new Set(contacts.map((c) => norm(c.email)));
  for (const b of db.bookings || []) {
    if (!clientEmails.has(norm(b.email)) && !["Approved"].includes(b.status)) {
      contacts.push({
        id: b.id,
        name: b.name,
        email: b.email,
        phone: b.phone || "",
        company: b.company || "",
        type: "Lead",
        birthMonth: b.birthMonth || null,
        birthDay: b.birthDay || null,
        birthYear: b.birthYear || null,
      });
    }
  }
  return contacts;
}

// ——— marketing campaigns ———

export function getCampaigns() {
  return (load().campaigns || []).slice().reverse();
}

export function getCampaign(id) {
  return (load().campaigns || []).find((c) => c.id === id) || null;
}

export function addCampaign(fields) {
  return mutate((db) => {
    db.campaigns = db.campaigns || [];
    const c = {
      id: uid("c-"),
      type: "newsletter",
      title: "Untitled",
      status: "Draft",
      audience: "All",
      createdAt: new Date().toISOString(),
      ...fields,
    };
    db.campaigns.push(c);
    return c;
  });
}

export function updateCampaign(id, fields) {
  return mutate((db) => {
    db.campaigns = db.campaigns || [];
    const c = db.campaigns.find((x) => x.id === id);
    if (!c) return null;
    Object.assign(c, fields);
    return c;
  });
}

export function deleteCampaign(id) {
  return mutate((db) => {
    db.campaigns = (db.campaigns || []).filter((c) => c.id !== id);
    return true;
  });
}

// ——— marketing settings (birthday automation) ———

export function getMarketingSettings() {
  return load().marketingSettings || { birthdayAuto: true, birthdayMessage: "" };
}

export function updateMarketingSettings(fields) {
  return mutate((db) => {
    db.marketingSettings = { ...(db.marketingSettings || {}), ...fields };
    return db.marketingSettings;
  });
}

// ——— gallery edit requests ———

export function addEditRequest(token, fields) {
  return mutate((db) => {
    const p = db.projects.find((x) => x.shareToken === token);
    if (!p) return null;
    p.editRequests = p.editRequests || [];
    const r = {
      id: uid("er-"),
      status: "Pending",
      createdAt: new Date().toISOString(),
      imageId: fields.imageId || "",
      imageName: fields.imageName || "",
      setName: fields.setName || "",
      categories: Array.isArray(fields.categories) ? fields.categories : [],
      note: String(fields.note || "").slice(0, 1000),
    };
    p.editRequests.push(r);
    return { project: p, request: r };
  });
}

export function resolveEditRequest(projectId, reqId, resolved = true) {
  return mutate((db) => {
    const p = db.projects.find((x) => x.id === projectId);
    const r = p?.editRequests?.find((x) => x.id === reqId);
    if (!r) return null;
    r.status = resolved ? "Resolved" : "Pending";
    r.resolvedAt = resolved ? new Date().toISOString() : null;
    return p;
  });
}

export function pendingEditCount(project) {
  return (project?.editRequests || []).filter((r) => r.status === "Pending").length;
}

// ——— platform settings (the Settings panel) ———

export const DEFAULT_SETTINGS = {
  profile: {
    contactEmail: "joe@joebryant.co",
    phone: "310 890 3687",
    website: "joebryant.co",
    address: "Los Angeles, CA",
    licenseId: "",
    instagram: "",
    linkedin: "",
  },
  pricing: { base: 1000, perThousandSqFt: 100, twilight: 250, drone: 150, stylingMin: 300, stylingMax: 500 },
  tax: { defaultRate: 0, convenienceFee: 0 },
  notifications: { email: true, sms: false, push: false, birthdayAuto: true },
  defaultDownloadSize: "orig",
  terms:
    "By approving, booking, or submitting payment for this invoice, the client agrees to Joe Bryant's standard Terms, Payment & Licensing Agreement. All deliverables remain the copyrighted property of Joe Bryant and are licensed for the specific property and agent named on the invoice. Deposits are non-refundable once a project is confirmed. Full terms governed by the laws of California.",
};

export function getSettings() {
  const s = load().settings || {};
  return {
    ...DEFAULT_SETTINGS,
    ...s,
    profile: { ...DEFAULT_SETTINGS.profile, ...(s.profile || {}) },
    pricing: { ...DEFAULT_SETTINGS.pricing, ...(s.pricing || {}) },
    tax: { ...DEFAULT_SETTINGS.tax, ...(s.tax || {}) },
    notifications: { ...DEFAULT_SETTINGS.notifications, ...(s.notifications || {}) },
  };
}

export function updateSettings(group, fields) {
  return mutate((db) => {
    db.settings = db.settings || {};
    if (typeof group === "string" && group && fields && typeof fields === "object") {
      // Merge into a named group, e.g. profile / pricing / tax.
      db.settings[group] = { ...(db.settings[group] || {}), ...fields };
    } else if (group && typeof group === "object") {
      // Top-level merge passed as the first argument.
      db.settings = { ...db.settings, ...group };
    } else if (fields && typeof fields === "object") {
      // Top-level merge passed as fields (group null), e.g. download size / terms.
      db.settings = { ...db.settings, ...fields };
    }
    return db.settings;
  });
}
