import Link from "next/link";

export default function Nav() {
  return (
    <nav className="nav" aria-label="Primary">
      <Link href="/" className="brand">
        Joe Bryant
      </Link>
      <div className="nav-links">
        <Link href="/#work">Work</Link>
        <Link href="/journal">Journal</Link>
        <Link href="/#about">About</Link>
        <Link href="/#contact">Contact</Link>
      </div>
    </nav>
  );
}
