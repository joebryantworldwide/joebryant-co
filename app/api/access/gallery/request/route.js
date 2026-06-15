// Public edit-request endpoint — a client submits a requested edit from
// their gallery lightbox (token-based, no login). Logs it on the project
// and notifies Joe.

import { addEditRequest } from "../../../../../lib/access/store";
import { notifyJoe } from "../../../../../lib/access/notify";

export async function POST(request) {
  const { token, imageId, imageName, setName, categories, note } = await request.json().catch(() => ({}));
  if (!token) return Response.json({ ok: false, error: "Missing gallery." }, { status: 400 });
  if (!(Array.isArray(categories) && categories.length) && !note) {
    return Response.json({ ok: false, error: "Tell us what to change." }, { status: 400 });
  }

  const result = addEditRequest(token, { imageId, imageName, setName, categories, note });
  if (!result) return Response.json({ ok: false, error: "Gallery not found." }, { status: 404 });

  await notifyJoe(`Edit request — ${result.project.propertyName}`, [
    `Image: ${imageName || imageId}${setName ? ` (${setName})` : ""}`,
    `Wants: ${(categories || []).join(", ") || "—"}`,
    note ? `Note: ${note}` : "",
    "Review it under the project's Pending requests.",
  ]);

  return Response.json({ ok: true });
}
