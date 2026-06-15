// Joe's command-center actions — one endpoint, action-based, admin only.

import {
  createUser,
  updateUser,
  findUserByEmail,
  createProject,
  updateProject,
  getProject,
  getUser,
  addInvoice,
  updateInvoice,
  addCharge,
  confirmManualPayment,
  getBooking,
  updateBooking,
  sendProposal,
  addBookingMessage,
  addMessage,
  resolveEditRequest,
  updateSettings,
  generateCode,
} from "../../../../lib/access/store";
import { buildPrepGuide } from "../../../../lib/access/prep";
import { requireAdmin } from "../../../../lib/access/auth";
import { notifyClient } from "../../../../lib/access/notify";
import { STATUSES } from "../../../../lib/access/constants";
import { invoiceTotal } from "../../../../lib/access/status";
import { createPaymentLink } from "../../../../lib/access/square";
import { syncProjectPayments } from "../../../../lib/access/squareSync";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://joebryant.co";

// Keep only valid { description, amount } rows.
function cleanLineItems(items) {
  if (!Array.isArray(items)) return undefined;
  const rows = items
    .map((li) => ({ description: String(li.description || "").trim(), amount: Number(li.amount) || 0 }))
    .filter((li) => li.description || li.amount);
  return rows.length ? rows : undefined;
}

export async function POST(request) {
  const admin = await requireAdmin();
  if (!admin) return Response.json({ ok: false, error: "Admin only." }, { status: 403 });

  const { action, ...data } = await request.json().catch(() => ({}));

  switch (action) {
    case "createClient": {
      if (!data.name || !data.email)
        return Response.json({ ok: false, error: "Name and email are required." }, { status: 400 });
      if (findUserByEmail(data.email))
        return Response.json({ ok: false, error: "A login with that email already exists." }, { status: 409 });
      const user = createUser({
        name: data.name,
        email: data.email,
        phone: data.phone || "",
        company: data.company || "",
        role: data.role || "Client / Owner",
        birthMonth: Number(data.birthMonth) || null,
        birthDay: Number(data.birthDay) || null,
        birthYear: Number(data.birthYear) || null,
      });
      return Response.json({ ok: true, user });
    }

    case "updateClient": {
      const fields = {};
      for (const k of [
        "name", "email", "phone", "company", "role", "accessCode",
        "birthdate", "location", "category", "crmNotes",
        "birthMonth", "birthDay", "birthYear",
      ]) {
        if (data[k] !== undefined) fields[k] = data[k];
      }
      const user = updateUser(data.userId, fields);
      return user
        ? Response.json({ ok: true, user })
        : Response.json({ ok: false, error: "Client not found." }, { status: 404 });
    }

    case "resetCode": {
      const user = updateUser(data.userId, { accessCode: generateCode() });
      return user
        ? Response.json({ ok: true, accessCode: user.accessCode })
        : Response.json({ ok: false, error: "Client not found." }, { status: 404 });
    }

    case "createProject": {
      if (!data.propertyName || !data.clientId)
        return Response.json({ ok: false, error: "Property name and client are required." }, { status: 400 });
      const services = {
        drone: !!data.services?.drone,
        twilight: !!data.services?.twilight,
        styling: !!data.services?.styling,
        sqft: Number(data.services?.sqft) || 0,
      };
      const project = createProject({
        propertyName: data.propertyName,
        address: data.address || "",
        shootDate: data.shootDate || "",
        status: STATUSES.includes(data.status) ? data.status : "Planning",
        clientId: data.clientId,
        services,
        prepGuide: buildPrepGuide({ twilight: services.twilight, pool: data.pool !== false }),
        smugmugUrl: data.smugmugUrl || "",
        notes: data.notes || "",
      });
      return Response.json({ ok: true, project });
    }

    case "updateProject": {
      const fields = {};
      if (Array.isArray(data.galleries)) {
        data.galleries = data.galleries
          .map((a) => ({ name: String(a.name || "").trim(), url: String(a.url || "").trim() }))
          .filter((a) => a.name || a.url);
      }
      for (const k of ["propertyName", "address", "shootDate", "smugmugUrl", "notes", "coverImage", "galleries"]) {
        if (data[k] !== undefined) fields[k] = data[k];
      }
      if (data.status !== undefined) {
        if (!STATUSES.includes(data.status))
          return Response.json({ ok: false, error: "Unknown status." }, { status: 400 });
        fields.status = data.status;
      }
      const project = updateProject(data.projectId, fields);
      return project
        ? Response.json({ ok: true, project })
        : Response.json({ ok: false, error: "Project not found." }, { status: 404 });
    }

    case "addInvoice": {
      if (!getProject(data.projectId))
        return Response.json({ ok: false, error: "Project not found." }, { status: 404 });
      const project = addInvoice(data.projectId, {
        title: data.title || "Invoice",
        amount: Number(data.amount) || 0,
        lineItems: cleanLineItems(data.lineItems),
        squareUrl: data.squareUrl || "",
        dueDate: data.dueDate || "",
        status: data.status || "Open",
      });
      return Response.json({ ok: true, project });
    }

    case "updateInvoice": {
      const fields = {};
      for (const k of ["title", "amount", "squareUrl", "dueDate", "status", "paidDate"]) {
        if (data[k] !== undefined) fields[k] = data[k];
      }
      if (data.lineItems !== undefined) fields.lineItems = cleanLineItems(data.lineItems);
      if (fields.status === "Paid" && !fields.paidDate)
        fields.paidDate = new Date().toISOString().slice(0, 10);
      const project = updateInvoice(data.projectId, data.invoiceId, fields);
      return project
        ? Response.json({ ok: true, project })
        : Response.json({ ok: false, error: "Invoice not found." }, { status: 404 });
    }

    case "addCharge": {
      const charge = addCharge(data.projectId, data.invoiceId, {
        title: data.title,
        lineItems: cleanLineItems(data.lineItems),
        description: data.description,
        amount: Number(data.amount) || 0,
        squareUrl: data.squareUrl || "",
        dueDate: data.dueDate || "",
      });
      return charge
        ? Response.json({ ok: true, charge })
        : Response.json({ ok: false, error: "Couldn't add the charge." }, { status: 404 });
    }

    case "createSquareLink": {
      const project = getProject(data.projectId);
      const inv = project?.invoices?.find((i) => i.id === data.invoiceId);
      if (!inv) return Response.json({ ok: false, error: "Invoice not found." }, { status: 404 });
      try {
        const link = await createPaymentLink({
          name: inv.title,
          amount: invoiceTotal(inv),
          note: project.propertyName,
        });
        updateInvoice(data.projectId, data.invoiceId, {
          squareUrl: link.url,
          squareOrderId: link.orderId,
          squarePaymentLinkId: link.paymentLinkId,
        });
        return Response.json({ ok: true, url: link.url });
      } catch (err) {
        return Response.json({ ok: false, error: err.message }, { status: 502 });
      }
    }

    case "syncPayments": {
      const result = await syncProjectPayments(data.projectId);
      return Response.json({ ok: true, ...result });
    }

    case "confirmPayment": {
      const project = confirmManualPayment(data.projectId);
      return project
        ? Response.json({ ok: true, project })
        : Response.json({ ok: false, error: "Project not found." }, { status: 404 });
    }

    case "updateBooking": {
      const booking = updateBooking(data.bookingId, { status: data.status || "Reviewed" });
      return booking
        ? Response.json({ ok: true, booking })
        : Response.json({ ok: false, error: "Request not found." }, { status: 404 });
    }

    case "sendProposal": {
      const booking = sendProposal(data.bookingId, {
        shootDate: data.shootDate,
        lineItems: cleanLineItems(data.lineItems),
        message: data.message,
        mode: data.mode,
      });
      if (!booking) return Response.json({ ok: false, error: "Request not found." }, { status: 404 });

      const link = `${SITE}/proposal/${booking.proposalToken}`;
      const isInfo = booking.proposal?.mode === "info";
      await notifyClient({
        email: booking.email,
        phone: booking.phone,
        subject: isInfo
          ? `Joe Bryant — a quick question about your shoot`
          : `Your photography proposal from Joe Bryant`,
        lines: [
          `Hi ${booking.name.split(" ")[0]},`,
          "",
          isInfo
            ? "Before I confirm, I have a quick question — please take a look and reply here:"
            : "Here's your proposal — review the details and approve when you're ready:",
          link,
          data.message ? `\n${data.message}` : "",
          "",
          "— Joe Bryant",
        ],
        channels: Array.isArray(data.channels) ? data.channels : ["email"],
      });

      return Response.json({ ok: true, booking, link });
    }

    case "bookingReply": {
      const booking = addBookingMessage(data.bookingId, { from: "joe", body: data.body });
      return booking
        ? Response.json({ ok: true, booking })
        : Response.json({ ok: false, error: "Couldn't send." }, { status: 400 });
    }

    case "inviteClient": {
      const u = getUser(data.userId);
      if (!u) return Response.json({ ok: false, error: "Client not found." }, { status: 404 });
      await notifyClient({
        email: u.email,
        phone: u.phone,
        subject: "Welcome — complete your Joe Bryant profile",
        lines: [
          `Hi ${(u.name || "there").split(" ")[0]},`,
          "",
          "You've been added to Joe Bryant's private client portal. Sign in to complete your profile and view your projects, galleries and invoices:",
          `${SITE}/access`,
          `Email: ${u.email}`,
          `Access code: ${u.accessCode}`,
        ],
        channels: ["email"],
      });
      return Response.json({ ok: true });
    }

    case "updateSettings": {
      const settings = updateSettings(data.group, data.fields);
      return Response.json({ ok: true, settings });
    }

    case "resolveRequest": {
      const project = resolveEditRequest(data.projectId, data.requestId, data.resolved !== false);
      return project
        ? Response.json({ ok: true })
        : Response.json({ ok: false, error: "Request not found." }, { status: 404 });
    }

    case "requestInfo": {
      const project = getProject(data.projectId);
      if (!project || !data.message) {
        return Response.json({ ok: false, error: "Missing project or message." }, { status: 400 });
      }
      addMessage({
        projectId: project.id,
        fromId: admin.id,
        fromName: "Joe Bryant",
        body: data.message,
        fromAdmin: true,
      });
      const client = project.clientId ? getUser(project.clientId) : null;
      if (client) {
        await notifyClient({
          email: client.email,
          phone: client.phone,
          subject: `A quick question about ${project.propertyName}`,
          lines: [data.message, "", "Reply in your client portal: " + SITE + "/access"],
          channels: ["email"],
        });
      }
      return Response.json({ ok: true });
    }

    case "approveBooking": {
      const booking = getBooking(data.bookingId);
      if (!booking) return Response.json({ ok: false, error: "Request not found." }, { status: 404 });

      const user =
        findUserByEmail(booking.email) ||
        createUser({
          name: booking.name,
          email: booking.email,
          phone: booking.phone,
          company: booking.company,
          role: "Client / Owner",
          birthMonth: booking.birthMonth || null,
          birthDay: booking.birthDay || null,
          birthYear: booking.birthYear || null,
        });

      const project = createProject({
        propertyName: booking.address.split(",")[0] || booking.address,
        address: booking.address,
        shootDate: booking.proposal?.shootDate || booking.desiredDate || "",
        status: "Planning",
        clientId: user.id,
        services: { ...booking.services, sqft: booking.sqft },
        prepGuide: buildPrepGuide({ twilight: !!booking.services?.twilight, pool: true }),
        notes: booking.notes || "",
        estimate: booking.estimate,
      });

      // Carry an agreed proposal straight into billing as the first invoice.
      if (booking.proposal?.lineItems?.length) {
        addInvoice(project.id, {
          title: `${project.propertyName} — Photography`,
          lineItems: booking.proposal.lineItems,
          status: "Open",
        });
      }

      updateBooking(booking.id, { status: "Approved", projectId: project.id });

      // Notify the client on the channels Joe chose at the final step.
      const channels = Array.isArray(data.channels) ? data.channels : [];
      let notified = [];
      if (channels.length) {
        notified = await notifyClient({
          email: user.email,
          phone: user.phone,
          subject: `Your shoot is confirmed — ${project.propertyName}`,
          lines: [
            `Hi ${user.name.split(" ")[0]},`,
            "",
            `Great news — your shoot at ${project.address} is approved and set up in your private client workspace.`,
            booking.desiredDate ? `Requested date: ${booking.desiredDate}.` : "",
            "",
            "Sign in to view your prep guide, invoice and gallery:",
            `${SITE}/access`,
            `Email: ${user.email}`,
            `Access code: ${user.accessCode}`,
            "",
            "— Joe Bryant",
          ],
          channels,
        });
      }

      return Response.json({
        ok: true,
        project,
        user,
        accessCode: user.accessCode,
        notified,
      });
    }

    default:
      return Response.json({ ok: false, error: `Unknown action "${action}".` }, { status: 400 });
  }
}
