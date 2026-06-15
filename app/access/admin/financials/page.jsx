import { redirect } from "next/navigation";
import AccessHeader from "../../../../components/access/AccessHeader";
import AdminNav from "../../../../components/access/AdminNav";
import Financials from "../../../../components/access/Financials";
import { requireAdmin } from "../../../../lib/access/auth";
import {
  getAllInvoices,
  financialSummary,
  revenueByMonth,
  getProjects,
} from "../../../../lib/access/store";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Financials — Joe Bryant | Access",
  robots: { index: false, follow: false },
};

export default async function FinancialsPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/access");

  const invoices = getAllInvoices();
  const summary = financialSummary();
  const revenue = revenueByMonth(6);
  const projects = getProjects().map((p) => ({ id: p.id, name: p.propertyName }));

  return (
    <>
      <div className="grain" aria-hidden="true" />
      <main className="acc">
        <AccessHeader user={{ name: admin.name, isAdmin: true }} />
        <section className="acc-hero">
          <span className="label acc-gold">Financials</span>
          <h1 className="serif">
            Every dollar, <em>accounted for.</em>
          </h1>
        </section>
        <AdminNav active="financials" />
        <Financials invoices={invoices} summary={summary} revenue={revenue} projects={projects} />
      </main>
    </>
  );
}
