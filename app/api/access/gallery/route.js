// Native gallery feed for the client portal. Enforces the same access
// rules as the project page, then returns normalized SmugMug images the
// Gallery tab renders in Joe's own design.

import { getProject, accessLevelFor } from "../../../../lib/access/store";
import { getSessionUser } from "../../../../lib/access/auth";
import { getGallery, isConfigured, demoGallery } from "../../../../lib/access/smugmug";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ status: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");
  const start = Math.max(1, parseInt(searchParams.get("start") || "1", 10));

  const project = getProject(projectId);
  const level = accessLevelFor(user, project);
  if (!project || !["full", "gallery"].includes(level)) {
    return Response.json({ status: "forbidden" }, { status: 403 });
  }

  if (!project.smugmugUrl) {
    return Response.json({ status: "pending" });
  }

  // Before credentials are added, show the native gallery with preview
  // images so the experience is visible. Admin sees a "preview" flag.
  if (!isConfigured()) {
    return Response.json({ ...demoGallery(), admin: !!user.isAdmin });
  }

  const result = await getGallery(project.smugmugUrl, { start });
  return Response.json({ ...result, webUri: result.webUri || project.smugmugUrl });
}
