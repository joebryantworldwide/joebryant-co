import { cookies } from "next/headers";
import { findClient } from "../../../../lib/portal";

export async function POST(request) {
  const { email, code } = await request.json().catch(() => ({}));
  const account = await findClient(email, code);

  if (!account) {
    return Response.json(
      { ok: false, error: "That email and access code don't match. Check your invite, or email joe@joebryant.co." },
      { status: 401 }
    );
  }

  const jar = await cookies();
  jar.set("jb_portal", Buffer.from(JSON.stringify({ email, code })).toString("base64"), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return Response.json({ ok: true });
}
