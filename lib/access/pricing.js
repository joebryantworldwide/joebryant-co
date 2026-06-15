// Phase 1 pricing — shown as an estimate only, until Joe approves.

export const PRICING = {
  base: 1000,
  perThousandSqFt: 100,
  drone: 150,
  twilight: 250,
  stylingMin: 300,
  stylingMax: 600,
};

export function estimate({ sqft = 0, drone = false, twilight = false, styling = false }) {
  const sq = Math.max(0, Number(sqft) || 0);
  let low = PRICING.base + Math.ceil(sq / 1000) * PRICING.perThousandSqFt;
  let high = low;
  if (drone) {
    low += PRICING.drone;
    high += PRICING.drone;
  }
  if (twilight) {
    low += PRICING.twilight;
    high += PRICING.twilight;
  }
  if (styling) {
    low += PRICING.stylingMin;
    high += PRICING.stylingMax;
  }
  return { low, high };
}

export function fmtEstimate({ low, high }) {
  const f = (n) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  return low === high ? f(low) : `${f(low)} – ${f(high)}`;
}

// Itemized breakdown for the admin review — line items, total, and the
// 50% retainer that confirms the date.
export function estimateBreakdown({ sqft = 0, drone = false, twilight = false, styling = false } = {}) {
  const sq = Math.max(0, Number(sqft) || 0);
  const units = Math.ceil(sq / 1000);
  const items = [{ label: "Base shoot fee", low: PRICING.base, high: PRICING.base }];

  if (units > 0) {
    items.push({
      label: `Square footage — ${sq.toLocaleString()} sq ft (${units} × $100)`,
      low: units * PRICING.perThousandSqFt,
      high: units * PRICING.perThousandSqFt,
    });
  }
  if (drone) items.push({ label: "Drone / Aerial", low: PRICING.drone, high: PRICING.drone });
  if (twilight) items.push({ label: "Twilight", low: PRICING.twilight, high: PRICING.twilight });
  if (styling) items.push({ label: "Styling / Cleanup Prep", low: PRICING.stylingMin, high: PRICING.stylingMax });

  const total = items.reduce((a, i) => ({ low: a.low + i.low, high: a.high + i.high }), { low: 0, high: 0 });
  const retainer = { low: Math.round(total.low * 0.5), high: Math.round(total.high * 0.5) };
  return { items, total, retainer };
}
