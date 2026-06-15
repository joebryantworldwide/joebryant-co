// Automatic project status. The status is never set by hand — it's
// derived from real signals (payments, shoot date, gallery delivery), so
// what the client sees always matches what has actually happened.
//
// Client-safe: pure functions, no server imports.

import { STATUSES } from "./constants";

export function invoiceTotal(inv) {
  if (!inv) return 0;
  if (Array.isArray(inv.lineItems) && inv.lineItems.length) {
    return inv.lineItems.reduce((s, li) => s + (Number(li.amount) || 0), 0);
  }
  return Number(inv.amount) || 0;
}

export function deriveStatus(project) {
  if (!project) return "Planning";
  const invoices = project.invoices || [];
  const hasInvoices = invoices.length > 0;
  const allPaid = hasInvoices && invoices.every((i) => i.status === "Paid");
  const anyPaid = invoices.some((i) => i.status === "Paid");
  const awaiting = !!project.payment?.awaitingVerification;
  const delivered = !!project.smugmugUrl;
  const confirmed = anyPaid || !!project.payment?.confirmedAt;
  const shootPassed =
    project.shootDate && new Date(project.shootDate + "T23:59:59") < new Date();

  // Highest-reached milestone wins; an unverified manual payment is an
  // alert that takes precedence so it never gets lost.
  if (awaiting) return "Awaiting Payment Verification";
  // Reconstructed historical work (imported from past email/Square records)
  // predates the gallery workflow — archive it as Completed, don't infer "Editing".
  if (project.archived) return "Completed";
  if (delivered && allPaid) return "Completed";
  if (delivered) return "Gallery Delivered";
  if (shootPassed && confirmed) return "Editing";
  if (confirmed) return "Confirmed";
  if (project.availabilityRequested) return "Availability Requested";
  return "Planning";
}

// One line explaining what advances each step — shown in the admin timeline.
export const STATUS_TRIGGERS = {
  Planning: "Project created",
  "Availability Requested": "Client requested a date",
  Confirmed: "Retainer paid / payment confirmed",
  "Awaiting Payment Verification": "Client flagged a manual payment — confirm receipt",
  "Shoot Completed": "Shoot day has passed",
  Editing: "Shoot done — in post-production",
  "Gallery Delivered": "SmugMug gallery link added",
  Completed: "Gallery delivered & every invoice paid",
};

export function statusIndex(status) {
  return STATUSES.indexOf(status);
}
