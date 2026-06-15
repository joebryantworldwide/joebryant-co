"use client";

import { useRef, useEffect } from "react";
import { gsap } from "../lib/gsap";
import Photo from "./Photo";
import { photos } from "../lib/photos";

/*
 * Interiors — slow vertical parallax inside every frame, plus a
 * light sweep that passes across the full-bleed images as they
 * cross the viewport, like sun tracking through a room.
 */
export default function Interiors({ data, captions }) {
  const root = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // vertical parallax for every interior frame
      gsap.utils.toArray(".interiors .photo img", root.current).forEach((img) => {
        gsap.fromTo(
          img,
          { yPercent: -9 },
          {
            yPercent: 9,
            ease: "none",
            scrollTrigger: {
              trigger: img.closest(".photo"),
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          }
        );
      });

      // travelling light across the full-bleed frames
      gsap.utils.toArray(".full-bleed .sweep", root.current).forEach((sweep) => {
        gsap.fromTo(
          sweep,
          { backgroundPosition: "120% 0" },
          {
            backgroundPosition: "-20% 0",
            ease: "none",
            scrollTrigger: {
              trigger: sweep.closest(".full-bleed"),
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          }
        );
      });

      // copy reveals
      gsap.utils.toArray(".duet-copy", root.current).forEach((copy) => {
        gsap.fromTo(
          copy,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 1.4,
            ease: "power3.out",
            scrollTrigger: { trigger: copy, start: "top 82%" },
          }
        );
      });
    }, root);

    return () => ctx.revert();
  }, []);

  const I = { ...photos.interiors, ...(data || {}) };
  const cap1 = captions?.first || "Primary Suite · Modern Farmhouse, Los Angeles";
  const cap2 = captions?.second || "Passage · Private Residence, Los Angeles";

  return (
    <section className="interiors" ref={root}>
      <div className="interiors-intro">
        <span className="label">Interiors</span>
        <h2>
          Rooms hold their breath. <em>The photograph lets them exhale.</em>
        </h2>
      </div>

      <figure className="full-bleed">
        <Photo src={I.bedroom.src} alt={I.bedroom.alt} drift={false} sizes="100vw" position={I.bedroom.position} caption={cap1} />
        <div className="sweep" aria-hidden="true" />
        <figcaption className="label">{cap1}</figcaption>
      </figure>

      <div className="interior-duet">
        <div className="col-a">
          <Photo src={I.courtyard.src} alt={I.courtyard.alt} drift={false} sizes="(max-width: 880px) 100vw, 58vw" position={I.courtyard.position} />
        </div>
        <div className="col-b">
          <Photo src={I.living.src} alt={I.living.alt} drift={false} className="tall" sizes="(max-width: 880px) 100vw, 33vw" position={I.living.position} />
          <div className="duet-copy">
            <p>Stone, bronze, oak — materials photographed the way they were designed to be touched.</p>
            <span className="label">Material studies</span>
          </div>
        </div>
      </div>

      <div className="interior-duet flip">
        <div className="col-a">
          <Photo src={I.kitchen.src} alt={I.kitchen.alt} drift={false} sizes="(max-width: 880px) 100vw, 58vw" position={I.kitchen.position} />
        </div>
        <div className="col-b">
          <Photo src={I.shower.src} alt={I.shower.alt} drift={false} className="tall" sizes="(max-width: 880px) 100vw, 33vw" position={I.shower.position} />
          <div className="duet-copy">
            <p>Every surface is a record of decisions. The camera honors each one.</p>
            <span className="label">Detail work</span>
          </div>
        </div>
      </div>

      <figure className="full-bleed">
        <Photo src={I.corridor.src} alt={I.corridor.alt} drift={false} sizes="100vw" position={I.corridor.position} caption={cap2} />
        <div className="sweep" aria-hidden="true" />
        <figcaption className="label">{cap2}</figcaption>
      </figure>
    </section>
  );
}
