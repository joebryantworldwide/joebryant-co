"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const PILLARS = [
  { key: "booking", href: "/access/admin", label: "Booking Center", hint: "Requests · projects · clients" },
  { key: "financials", href: "/access/admin/financials", label: "Financials", hint: "Revenue · invoices · reports" },
  { key: "marketing", href: "/access/admin/marketing", label: "Marketing", hint: "Newsletters · texts · birthdays" },
];

export default function AdminNav({ active }) {
  const pathname = usePathname();
  return (
    <nav className="acc-pillars" aria-label="Command center">
      {PILLARS.map((p) => {
        const isActive = active ? active === p.key : pathname === p.href;
        return (
          <Link key={p.key} href={p.href} className={`acc-pillar${isActive ? " active" : ""}`}>
            <span className="acc-pillar-label serif">{p.label}</span>
            <span className="acc-pillar-hint label">{p.hint}</span>
          </Link>
        );
      })}
    </nav>
  );
}
