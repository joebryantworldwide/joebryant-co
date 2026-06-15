import {
  addMessage,
  getProject,
  accessLevelFor,
  markMessagesRead,
} from "../../../../lib/access/store";
import { getSessionUser } from "../../../../lib/access/auth";
import { notifyJoe } from "../../../../lib/access/notify";

export async function POST(request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false, error: "Sign in first." }, { status: 401 });

  const { projectId, body, markRead } = await request.json().catch(() => ({}));
  const project = getProject(projectId);
  if (!project || !accessLevelFor(user, project)) {
    return Response.json({ ok: false, error: "Project not found." }, { status: 404 });
  }

  if (markRead) {
    markMessagesRead(projectId, { admin: !!user.isAdmin });
    return Response.json({ ok: true });
  }

  const text = String(body || "").trim();
  if (!text) return Response.json({ ok: false, error: "Write a message first." }, { status: 400 });

  const msg = addMessage({
    projectId,
    fromId: user.id,
    fromName: user.name,
    body: text.slice(0, 4000),
    fromAdmin: !!user.isAdmin,
  });

  if (!user.isAdmin) {
    await notifyJoe(`New message — ${project.propertyName}`, [
      `From: ${user.name} (${user.email})`,
      `Project: ${project.propertyName} — ${project.address}`,
      "",
      text,
    ]);
  }

  return Response.json({ ok: true, message: msg });
}
