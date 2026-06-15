"use client";

import { useRef, useEffect } from "react";
import { gsap } from "../lib/gsap";

export default function Contact() {
  const root = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".contact > *:not(.footer)",
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 1.4,
          stagger: 0.14,
          ease: "power3.out",
          scrollTrigger: { trigger: root.current, start: "top 65%" },
        }
      );
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section className="contact" id="contact" ref={root}>
      <span className="label">Commissions · 2026</span>
      <h2>
        Let’s make something <em>worth remembering.</em>
      </h2>
      <a className="email" href="mailto:joe@joebryant.co">
        joe@joebryant.co
      </a>
      <div className="contact-meta">
        <a href="tel:+13108903687">310 · 890 · 3687</a>
        <a href="https://www.instagram.com/joebryantco" target="_blank" rel="noreferrer">
          Instagram
        </a>
        <a href="/portal">Client Access</a>
      </div>
      <footer className="footer">
        <span>© {new Date().getFullYear()} Joe Bryant</span>
        <span>Architecture · Interiors · Estates · Portraits</span>
        <span>Los Angeles, California</span>
      </footer>
    </section>
  );
}
