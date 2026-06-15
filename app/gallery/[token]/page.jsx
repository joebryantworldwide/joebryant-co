// Public client gallery — no login, unguessable token. The "your photos
// are ready" experience Joe shares with clients. Cinematic, fast, and on
// brand: a film-style cover, a justified grid, and an immersive lightbox.

import GalleryExperience from "../../../components/access/GalleryExperience";
import { getProjectByShareToken } from "../../../lib/access/store";
import { getGallerySets } from "../../../lib/access/smugmug";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { token } = await params;
  const project = getProjectByShareToken(token);
  return {
    title: project ? `${project.propertyName} — Joe Bryant` : "Gallery — Joe Bryant",
    description: project ? `Photography of ${project.propertyName} by Joe Bryant.` : "",
    robots: { index: false, follow: false },
  };
}

function Shell({ children }) {
  return (
    <main className="gx-empty">
      <div>
        <span className="label gx-empty-brand">Joe Bryant</span>
        {children}
      </div>
    </main>
  );
}

export default async function PublicGalleryPage({ params }) {
  const { token } = await params;
  const project = getProjectByShareToken(token);

  if (!project) {
    return (
      <Shell>
        <h1 className="serif">This gallery link has expired.</h1>
        <p>Ask Joe for a fresh link, or email <a href="mailto:joe@joebryant.co">joe@joebryant.co</a>.</p>
      </Shell>
    );
  }

  const sets = await getGallerySets({ smugmugUrl: project.smugmugUrl, galleries: project.galleries });

  if (!sets.length) {
    return (
      <Shell>
        <h1 className="serif">Your gallery is almost ready.</h1>
        <p>{project.propertyName} is being finished now — you&rsquo;ll have the link the moment it&rsquo;s delivered.</p>
      </Shell>
    );
  }

  return (
    <GalleryExperience
      title={project.propertyName}
      address={project.address}
      cover={project.coverImage || sets[0].images[0]?.large}
      sets={sets}
      token={token}
    />
  );
}
