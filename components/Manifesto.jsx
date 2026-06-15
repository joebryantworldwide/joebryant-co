"use client";

import { useRef, useEffect } from "react";
import { gsap } from "../lib/gsap";

const LINES = ["The spaces we remember", "are never accidental."];

export default function Manifesto() {
  const root = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to(".line-in", {
        y: 0,
        yPercent: 0,
        transform: "none",
        duration: 1.4,
        ease: "power4.out",
        stagger: 0.18,
        scrollTrigger: {
          trigger: root.current,
          start: "top 72%",
        },
      });
      gsap.fromTo(
        ".manifesto .label",
        { opacity: 0 },
        {
          opacity: 0.8,
          duration: 1.6,
          ease: "power2.out",
          scrollTrigger: { trigger: root.current, start: "top 72%" },
        }
      );
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section className="manifesto" ref={root}>
      <span className="label">Architecture as Art</span>
      <h2 className="statement">
        {LINES.map((line, i) => (
          <span className="line" key={i}>
            <span className="line-in">
              {i === 1 ? <em>{line}</em> : line}
            </span>
          </span>
        ))}
      </h2>
    </section>
  );
}
