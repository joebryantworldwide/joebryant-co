// Session handling for /access. The cookie stores the login pair and is
// re-verified against the store on every request, so revoking someone is
// as simple as changing their access code.

import { cookies } from "next/headers";
import { findUserByLogin } from "./store";

const COOKIE = "jb_access";

export function encodeSession(email, code) {
  return Buffer.from(JSON.stringify({ email, code })).toString("base64");
}

export async function setSession(email, code) {
  const jar = await cookies();
  jar.set(COOKIE, encodeSession(email, code), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function getSessionUser() {
  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value;
  if (!raw) return null;
  try {
    const { email, code } = JSON.parse(Buffer.from(raw, "base64").toString("utf8"));
    return findUserByLogin(email, code);
  } catch {
    return null;
  }
}

export async function requireAdmin() {
  const user = await getSessionUser();
  return user?.isAdmin ? user : null;
}
