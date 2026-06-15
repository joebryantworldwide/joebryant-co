import { redirect } from "next/navigation";
import AccessHeader from "../../../../../components/access/AccessHeader";
import AdminProject from "../../../../../components/access/AdminProject";
import { requireAdmin } from "../../../../../lib/access/auth";
import { getProject, getUser, getMessages } from "../../../../../lib/access/store";
import { isConfigured as smugmugConfigured } from "../../../../../lib/access/smugmug";
import { syncProjectPayments } from "../../../../../lib/access/squareSync";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Project — Admin — Joe Bryant | Access",
  robots: { index: false, follow: false },
};

export default async function AdminProjectPage({ params }) {
  const admin = await requireAdmin();
  if (!admin) redirect("/access");

  const { id } = await params;
  await syncProjectPayments(id);
  const project = getProject(id);
  if (!project) redirect("/access/admin");

  const client = project.clientId ? getUser(project.clientId) : null;
  const messages = getMessages(id);
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://joebryant.co";

  return (
    <>
      <div className="grain" aria-hidden="true" />
      <main className="acc">
        <AccessHeader user={{ name: admin.name, isAdmin: true }} crumb={project.propertyName} back={{ href: "/access/admin", label: "Dashboard" }} />
        <AdminProject
          project={project}
          client={client}
          messages={messages}
          me={admin.id}
          shareUrl={`${base}/prep/${project.shareToken}`}
          smugmugReady={smugmugConfigured()}
        />
      </main>
    </>
  );
}
