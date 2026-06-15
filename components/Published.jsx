"use client";

import { useRef, useEffect } from "react";
import { gsap } from "../lib/gsap";
import { publications, clients } from "../lib/photos";

export default function Published() {
  const root = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray(".pub-line", root.current).forEach((line, i) => {
        gsap.fromTo(
          line,
          { yPercent: 110 },
          {
            yPercent: 0,
            duration: 1.1,
            ease: "power4.out",
            scrollTrigger: { trigger: line.parentElement, start: "top 92%" },
          }
        );
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section className="published" ref={root}>
      <span className="label">As seen in</span>
      <ul className="pub-list">
        {publications.map((p) => (
          <li key={p}>
            <span className="pub-line">{p}</span>
          </li>
        ))}
      </ul>
      <div className="clients-marquee" aria-label="Clients">
        <div className="clients-track">
          {[...clients, ...clients].map((c, i) => (
            <span key={i}>{c}</span>
          ))}
        </div>
      </div>
    </section>
  );
}
