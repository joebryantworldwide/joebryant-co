import { redirect } from "next/navigation";
import AccessHeader from "../../../../components/access/AccessHeader";
import AdminNav from "../../../../components/access/AdminNav";
import Marketing from "../../../../components/access/Marketing";
import { requireAdmin } from "../../../../lib/access/auth";
import { getContacts, getCampaigns, getMarketingSettings } from "../../../../lib/access/store";
import { zodiacFor, birthdayLabel, daysUntilBirthday } from "../../../../lib/access/zodiac";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Marketing — Joe Bryant | Access",
  robots: { index: false, follow: false },
};

export default async function MarketingPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/access");

  const contacts = getContacts();
  const campaigns = getCampaigns();
  const settings = getMarketingSettings();

  const birthdays = contacts
    .filter((c) => c.birthMonth && c.birthDay)
    .map((c) => ({
      id: c.id,
      name: c.name,
      type: c.type,
      label: birthdayLabel(c),
      days: daysUntilBirthday(c),
      ...zodiacFor(c),
    }))
    .sort((a, b) => a.days - b.days)
    .slice(0, 14);

  return (
    <>
      <div className="grain" aria-hidden="true" />
      <main className="acc">
        <AccessHeader user={{ name: admin.name, isAdmin: true }} />
        <section className="acc-hero">
          <span className="label acc-gold">Marketing</span>
          <h1 className="serif">
            Stay in front of <em>everyone who matters.</em>
          </h1>
        </section>
        <AdminNav active="marketing" />
        <Marketing contacts={contacts} campaigns={campaigns} settings={settings} birthdays={birthdays} />
      </main>
    </>
  );
}
