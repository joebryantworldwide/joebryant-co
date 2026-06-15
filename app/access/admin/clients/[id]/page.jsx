import { redirect } from "next/navigation";
import AccessHeader from "../../../../../components/access/AccessHeader";
import AdminClient from "../../../../../components/access/AdminClient";
import { requireAdmin } from "../../../../../lib/access/auth";
import { getUser, getProjects } from "../../../../../lib/access/store";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Client — Admin — Joe Bryant | Access",
  robots: { index: false, follow: false },
};

export default async function AdminClientPage({ params }) {
  const admin = await requireAdmin();
  if (!admin) redirect("/access");

  const { id } = await params;
  const client = getUser(id);
  if (!client) redirect("/access/admin");

  const projects = getProjects().filter(
    (p) => p.clientId === id || (p.team || []).some((t) => t.email === client.email)
  );

  return (
    <>
      <div className="grain" aria-hidden="true" />
      <main className="acc">
        <AccessHeader user={{ name: admin.name, isAdmin: true }} crumb={client.name} back={{ href: "/access/admin", label: "Dashboard" }} />
        <AdminClient client={client} projects={projects} />
      </main>
    </>
  );
}
