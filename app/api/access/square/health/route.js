// Connection health for the status pill. green/orange/red.

import { requireAdmin } from "../../../../../lib/access/auth";
import { ping } from "../../../../../lib/access/square";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return Response.json({ state: "red", label: "Not authorized" }, { status: 403 });

  const state = await ping();
  const label =
    state === "green" ? "Linked by Square"
    : state === "orange" ? "Square — connection issue"
    : "Square not connected";
  return Response.json({ state, label });
}
