import { addBooking } from "../../../../lib/access/store";
import { estimate } from "../../../../lib/access/pricing";
import { notifyJoe } from "../../../../lib/access/notify";

export async function POST(request) {
  const data = await request.json().catch(() => ({}));
  const { name, email, phone, company, address, sqft, desiredDate, services = {}, notes, kind, birthMonth, birthDay, birthYear } = data;

  if (!name || !email || !address) {
    return Response.json({ ok: false, error: "Name, email and property address are required." }, { status: 400 });
  }

  const est = estimate({ sqft, ...services });
  const booking = addBooking({
    kind: kind || "Request Availability",
    name: String(name).slice(0, 120),
    email: String(email).slice(0, 160),
    phone: String(phone || "").slice(0, 40),
    company: String(company || "").slice(0, 120),
    address: String(address).slice(0, 240),
    sqft: Number(sqft) || 0,
    desiredDate: String(desiredDate || "").slice(0, 20),
    birthMonth: Number(birthMonth) || null,
    birthDay: Number(birthDay) || null,
    birthYear: Number(birthYear) || null,
    services: {
      drone: !!services.drone,
      twilight: !!services.twilight,
      styling: !!services.styling,
    },
    notes: String(notes || "").slice(0, 2000),
    estimate: est,
  });

  await notifyJoe(`New booking request — ${booking.address}`, [
    `${booking.kind} from ${booking.name} (${booking.email}, ${booking.phone})`,
    booking.company && `Company: ${booking.company}`,
    `Property: ${booking.address} · ${booking.sqft ? booking.sqft.toLocaleString() + " sq ft" : "size not given"}`,
    `Desired date: ${booking.desiredDate || "flexible"}`,
    `Services: ${Object.entries(booking.services).filter(([, v]) => v).map(([k]) => k).join(", ") || "photography"}`,
    `Estimate: $${est.low.toLocaleString()}–$${est.high.toLocaleString()}`,
    booking.notes && `Notes: ${booking.notes}`,
  ]);

  return Response.json({ ok: true, estimate: est });
}
