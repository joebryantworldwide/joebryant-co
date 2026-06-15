"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AccessHeader({ user, crumb, back }) {
  const pathname = usePathname();

  async function logout() {
    await fetch("/api/access/logout", { method: "POST" });
    window.location.href = "/access";
  }

  const home = user?.isAdmin ? "/access/admin" : "/access";
  const links = user?.isAdmin
    ? [
        { href: "/access/admin", label: "Dashboard" },
        { href: "/access/admin/settings", label: "Settings" },
      ]
    : [
        { href: "/access", label: "My projects" },
        { href: "/access/book", label: "Book" },
      ];

  return (
    <header className="acc-header">
      <div className="acc-header-left">
        <Link href={home} className="acc-wordmark">
          <span className="serif">Joe Bryant</span>
          <span className="acc-divider">|</span>
          <span className="label acc-gold">Access</span>
        </Link>
        {back ? (
          <Link href={back.href} className="acc-back">
            ← {back.label}
          </Link>
        ) : (
          crumb && <span className="label acc-crumb">{crumb}</span>
        )}
      </div>

      <nav className="acc-header-nav">
        {user ? (
          <>
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`acc-nav-link${pathname === l.href ? " active" : ""}`}
              >
                {l.label}
              </Link>
            ))}
            <button className="acc-nav-link acc-linkbtn" onClick={logout}>
              Sign out
            </button>
          </>
        ) : (
          <Link className="acc-nav-link" href="/access">
            Sign in
          </Link>
        )}
      </nav>
    </header>
  );
}
