import { redirect } from "next/navigation";
import AccessHeader from "../../../components/access/AccessHeader";
import AdminNav from "../../../components/access/AdminNav";
import AdminDashboard from "../../../components/access/AdminDashboard";
import { requireAdmin } from "../../../lib/access/auth";
import {
  getProjects,
  getUsers,
  getAllMessages,
  getBookings,
  pendingEditCount,
} from "../../../lib/access/store";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin — Joe Bryant | Access",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/access");

  const users = getUsers().filter((u) => !u.isAdmin);
  const allProjects = getProjects();
  const messages = getAllMessages();
  const bookings = getBookings().slice().reverse();

  const byId = Object.fromEntries(users.map((u) => [u.id, u]));

  const projects = allProjects
    .slice()
    .reverse()
    .map((p) => ({
      id: p.id,
      propertyName: p.propertyName,
      status: p.status,
      shootDate: p.shootDate,
      smugmugUrl: p.smugmugUrl,
      clientName: byId[p.clientId]?.name || "—",
      unread: messages.filter((m) => m.projectId === p.id && !m.readByAdmin).length,
      pending: pendingEditCount(p),
      openAmount: (p.invoices || [])
        .filter((i) => i.status !== "Paid")
        .reduce((s, i) => s + (i.amount || 0), 0),
    }));

  const queue = {
    payments: allProjects
      .filter((p) => p.payment?.awaitingVerification)
      .map((p) => ({ ...p, clientName: byId[p.clientId]?.name || "The client" })),
    messages: messages
      .filter((m) => !m.readByAdmin)
      .slice()
      .reverse()
      .map((m) => ({
        ...m,
        propertyName: allProjects.find((p) => p.id === m.projectId)?.propertyName || "a project",
      })),
  };

  const clients = users.map((u) => ({
    ...u,
    projectCount: allProjects.filter(
      (p) => p.clientId === u.id || (p.team || []).some((t) => t.email === u.email)
    ).length,
  }));

  // Time-based agenda: upcoming shoots + unpaid invoice due dates.
  const today = new Date().toISOString().slice(0, 10);
  const schedule = [];
  for (const p of allProjects) {
    const clientName = byId[p.clientId]?.name || "—";
    if (p.shootDate && p.status !== "Completed" && p.shootDate >= today) {
      schedule.push({
        type: "shoot",
        date: p.shootDate,
        projectId: p.id,
        title: p.propertyName,
        sub: clientName,
      });
    }
    for (const inv of p.invoices || []) {
      if (inv.status !== "Paid" && inv.dueDate) {
        schedule.push({
          type: "invoice",
          date: inv.dueDate,
          projectId: p.id,
          title: inv.title || "Invoice",
          sub: `${p.propertyName} · $${(inv.amount || 0).toLocaleString()}`,
        });
      }
    }
  }
  schedule.sort((a, b) => a.date.localeCompare(b.date));

  return (
    <>
      <div className="grain" aria-hidden="true" />
      <main className="acc">
        <AccessHeader user={{ name: admin.name, isAdmin: true }} crumb="Command center" />
        <section className="acc-hero">
          <span className="label acc-gold">Admin</span>
          <h1 className="serif">
            The whole operation, <em>one glance.</em>
          </h1>
        </section>
        <AdminNav active="booking" />
        <AdminDashboard
          queue={queue}
          projects={projects}
          clients={clients}
          bookings={bookings}
          schedule={schedule}
          today={today}
        />
      </main>
    </>
  );
}
