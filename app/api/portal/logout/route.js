import { cookies } from "next/headers";

export async function POST() {
  const jar = await cookies();
  jar.delete("jb_portal");
  return Response.json({ ok: true });
}
