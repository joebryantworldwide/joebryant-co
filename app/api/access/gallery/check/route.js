// Lightweight realtime checker — returns the current photo count for a
// gallery token so the client can detect when new images land on the
// server and offer a refresh.

import { getProjectByShareToken } from "../../../../../lib/access/store";
import { getGallerySets } from "../../../../../lib/access/smugmug";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  const project = getProjectByShareToken(token);
  if (!project) return Response.json({ count: 0 });
  const sets = await getGallerySets({ smugmugUrl: project.smugmugUrl, galleries: project.galleries });
  const count = sets.reduce((s, x) => s + x.images.length, 0);
  return Response.json({ count });
}
