import { clearSession } from "../../../../lib/access/auth";

export async function POST() {
  await clearSession();
  return Response.json({ ok: true });
}
