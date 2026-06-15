import { redirect } from "next/navigation";
import AccessHeader from "../../../../components/access/AccessHeader";
import Settings from "../../../../components/access/Settings";
import { requireAdmin } from "../../../../lib/access/auth";
import { getSettings } from "../../../../lib/access/store";
import { isConfigured as squareConfigured } from "../../../../lib/access/square";
import { isConfigured as smugmugConfigured } from "../../../../lib/access/smugmug";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Settings — Joe Bryant | Access",
  robots: { index: false, follow: false },
};

export default async function SettingsPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/access");

  const settings = getSettings();
  const integrations = {
    square: squareConfigured(),
    smugmug: smugmugConfigured(),
    dropbox: !!process.env.DROPBOX_TOKEN,
    email: !!process.env.RESEND_API_KEY,
    sms: !!process.env.TWILIO_ACCOUNT_SID,
  };

  return (
    <>
      <div className="grain" aria-hidden="true" />
      <main className="acc">
        <AccessHeader user={{ name: admin.name, isAdmin: true }} crumb="Settings" back={{ href: "/access/admin", label: "Dashboard" }} />
        <section className="acc-hero">
          <span className="label acc-gold">Settings</span>
          <h1 className="serif">
            The control room, <em>tuned to you.</em>
          </h1>
        </section>
        <Settings settings={settings} integrations={integrations} />
      </main>
    </>
  );
}
