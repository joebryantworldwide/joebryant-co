// Live payment sync. Square webhooks need a public URL (they won't reach
// localhost), so we also reconcile on demand: whenever a project page
// loads — or Joe taps "Check for payment" — every open invoice that has a
// Square order is checked against Square and flipped to Paid if settled.
// In production the webhook makes this instant; this keeps it correct
// everywhere else too.

import { getProject, markInvoicePaidByOrder } from "./store";
import { isConfigured, getOrderPaid } from "./square";

export async function syncProjectPayments(projectId) {
  if (!isConfigured()) return { changed: 0 };
  const project = getProject(projectId);
  if (!project) return { changed: 0 };

  const open = (project.invoices || []).filter(
    (i) => i.status !== "Paid" && i.squareOrderId
  );
  let changed = 0;
  for (const inv of open) {
    const { paid } = await getOrderPaid(inv.squareOrderId);
    if (paid) {
      markInvoicePaidByOrder(inv.squareOrderId);
      changed += 1;
    }
  }
  return { changed };
}
