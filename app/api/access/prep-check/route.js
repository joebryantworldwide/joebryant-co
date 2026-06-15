import { getProject, accessLevelFor, togglePrepItem } from "../../../../lib/access/store";
import { getSessionUser } from "../../../../lib/access/auth";

export async function POST(request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false, error: "Sign in first." }, { status: 401 });

  const { projectId, section, item, done } = await request.json().catch(() => ({}));
  const project = getProject(projectId);
  const level = accessLevelFor(user, project);
  if (!project || !["full", "prep"].includes(level)) {
    return Response.json({ ok: false, error: "No prep access on this project." }, { status: 403 });
  }

  const updated = togglePrepItem(projectId, Number(section), Number(item), !!done);
  if (!updated) return Response.json({ ok: false, error: "Item not found." }, { status: 404 });
  return Response.json({ ok: true });
}
