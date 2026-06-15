// Client-safe formatting helpers (no fs / server imports here).

export function fmtDate(d) {
  if (!d) return "";
  return new Date(d + (d.length === 10 ? "T12:00:00Z" : "")).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: d.length === 10 ? "UTC" : undefined,
  });
}

export function fmtTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function fmtMoney(n) {
  return (n ?? 0).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

// Status → accent treatment in the UI.
export const STATUS_TONE = {
  Planning: "neutral",
  "Availability Requested": "neutral",
  Confirmed: "gold",
  "Awaiting Payment Verification": "alert",
  "Shoot Completed": "gold",
  Editing: "neutral",
  "Gallery Delivered": "gold",
  Completed: "muted",
};
