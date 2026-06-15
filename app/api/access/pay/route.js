// In-app payment. The client's card is tokenized in the browser by
// Square's Web Payments SDK; this endpoint receives only the one-time
// token, charges it for the invoice amount, and marks the invoice paid —
// all without the client ever leaving the page.

import { getProject, accessLevelFor, updateInvoice } from "../../../../lib/access/store";
import { getSessionUser } from "../../../../lib/access/auth";
import { createPayment } from "../../../../lib/access/square";
import { invoiceTotal } from "../../../../lib/access/status";
import { fmtMoney } from "../../../../lib/access/format";
import { notifyJoe } from "../../../../lib/access/notify";

export async function POST(request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false, error: "Please sign in." }, { status: 401 });

  const { projectId, invoiceId, sourceId } = await request.json().catch(() => ({}));
  if (!sourceId) return Response.json({ ok: false, error: "Missing card token." }, { status: 400 });

  const project = getProject(projectId);
  const level = accessLevelFor(user, project);
  if (!project || !["full", "billing"].includes(level)) {
    return Response.json({ ok: false, error: "No billing access on this project." }, { status: 403 });
  }

  const inv = (project.invoices || []).find((i) => i.id === invoiceId);
  if (!inv) return Response.json({ ok: false, error: "Invoice not found." }, { status: 404 });
  if (inv.status === "Paid") return Response.json({ ok: true, already: true });

  try {
    const payment = await createPayment({
      sourceId,
      amount: invoiceTotal(inv),
      note: `${project.propertyName} — ${inv.title}`,
    });
    updateInvoice(projectId, invoiceId, {
      status: "Paid",
      paidDate: new Date().toISOString().slice(0, 10),
      squarePaymentId: payment?.id,
    });

    // Close the loop — tell Joe immediately.
    await notifyJoe(`Payment received — ${project.propertyName}`, [
      `${user.name} (${user.email}) just paid ${fmtMoney(invoiceTotal(inv))} in-app.`,
      `Invoice: ${inv.title}`,
      `Project: ${project.propertyName}${project.address ? ` — ${project.address}` : ""}`,
      payment?.id ? `Square payment id: ${payment.id}` : "",
    ]);

    return Response.json({ ok: true, amount: invoiceTotal(inv) });
  } catch (err) {
    return Response.json({ ok: false, error: err.message || "Payment failed." }, { status: 402 });
  }
}
