// Team invites. The invited person gets (or keeps) a login of their own;
// their access level is scoped per project.

import {
  getProject,
  accessLevelFor,
  addTeamMember,
  removeTeamMember,
  findUserByEmail,
  createUser,
} from "../../../../lib/access/store";
import { getSessionUser } from "../../../../lib/access/auth";
import { notifyJoe } from "../../../../lib/access/notify";

export async function POST(request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false, error: "Sign in first." }, { status: 401 });

  const { projectId, remove, name, email, phone, role, access } = await request.json().catch(() => ({}));
  const project = getProject(projectId);
  const level = accessLevelFor(user, project);
  if (!project || level !== "full") {
    return Response.json({ ok: false, error: "Only the project owner can manage the team." }, { status: 403 });
  }

  if (remove) {
    removeTeamMember(projectId, remove);
    return Response.json({ ok: true });
  }

  if (!name || !email) {
    return Response.json({ ok: false, error: "Name and email are required." }, { status: 400 });
  }

  // Reuse an existing account if they already have one.
  const account =
    findUserByEmail(email) ||
    createUser({ name, email, phone: phone || "", role: role || "Viewer" });

  addTeamMember(projectId, {
    name,
    email,
    phone: phone || "",
    role: role || "Viewer",
    access: access || "view",
  });

  await notifyJoe(`Team invite — ${project.propertyName}`, [
    `${user.name} invited ${name} (${email}) to ${project.propertyName}.`,
    `Role: ${role || "Viewer"} · Access: ${access || "view"}`,
    `Their access code: ${account.accessCode}`,
  ]);

  // The access code is returned so the inviter can pass it along —
  // Phase 1 has no outbound invite email to the member yet.
  return Response.json({ ok: true, accessCode: account.accessCode });
}
