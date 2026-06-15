import { findUserByLogin } from "../../../../lib/access/store";
import { setSession } from "../../../../lib/access/auth";

export async function POST(request) {
  const { email, code } = await request.json().catch(() => ({}));
  const user = findUserByLogin(email, code);

  if (!user) {
    return Response.json(
      { ok: false, error: "That email and access code don't match. Check your invite, or email joe@joebryant.co." },
      { status: 401 }
    );
  }

  await setSession(email, code);
  return Response.json({ ok: true, isAdmin: !!user.isAdmin });
}
