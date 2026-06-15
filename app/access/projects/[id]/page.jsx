import { redirect } from "next/navigation";
import AccessHeader from "../../../../components/access/AccessHeader";
import ProjectView from "../../../../components/access/ProjectView";
import { getSessionUser } from "../../../../lib/access/auth";
import { getProject, accessLevelFor, getMessages } from "../../../../lib/access/store";
import { syncProjectPayments } from "../../../../lib/access/squareSync";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Project — Joe Bryant | Access",
  robots: { index: false, follow: false },
};

export default async function ProjectPage({ params }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/access");

  // Reconcile any Square payments before showing the project.
  await syncProjectPayments(id);

  const project = getProject(id);
  const access = accessLevelFor(user, project);
  if (!project || !access) redirect("/access");

  const messages = getMessages(id);
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://joebryant.co";
  const shareUrl = `${base}/prep/${project.shareToken}`;

  return (
    <>
      <div className="grain" aria-hidden="true" />
      <main className="acc">
        <AccessHeader
          user={{ name: user.name, isAdmin: !!user.isAdmin }}
          crumb={project.propertyName}
          back={{ href: user.isAdmin ? "/access/admin" : "/access", label: user.isAdmin ? "Dashboard" : "My projects" }}
        />
        <ProjectView
          project={project}
          messages={messages}
          viewer={{ id: user.id, name: user.name }}
          access={access}
          shareUrl={shareUrl}
        />
      </main>
    </>
  );
}
