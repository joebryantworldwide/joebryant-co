// Public, shareable prep guide — no login required, unguessable token.

import PrepGuide from "../../../components/access/PrepGuide";
import { getProjectByShareToken, getUser } from "../../../lib/access/store";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Shoot Preparation Guide — Joe Bryant",
  robots: { index: false, follow: false },
};

export default async function SharedPrepPage({ params }) {
  const { token } = await params;
  const project = getProjectByShareToken(token);

  if (!project) {
    return (
      <main className="acc acc-login">
        <div className="acc-login-card">
          <span className="label acc-gold">Joe Bryant</span>
          <h1 className="serif">
            This guide link <em>has expired.</em>
          </h1>
          <p className="acc-help">
            Ask whoever shared it for a fresh link, or email{" "}
            <a href="mailto:joe@joebryant.co">joe@joebryant.co</a>.
          </p>
        </div>
      </main>
    );
  }

  const client = project.clientId ? getUser(project.clientId) : null;

  return (
    <>
      <div className="grain" aria-hidden="true" />
      <main className="acc acc-shared">
        <header className="acc-header">
          <span className="acc-wordmark">
            <span className="serif">Joe Bryant</span>
            <span className="acc-divider">|</span>
            <span className="label acc-gold">Access</span>
          </span>
        </header>
        <PrepGuide project={project} clientName={client?.name} canCheck={false} />
      </main>
    </>
  );
}
