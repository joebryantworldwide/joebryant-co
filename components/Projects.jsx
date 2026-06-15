"use client";

import { useRef, useEffect } from "react";
import { gsap, ScrollTrigger } from "../lib/gsap";
import Photo from "./Photo";
import { photos } from "../lib/photos";

/*
 * Signature projects — a pinned horizontal film strip. Scroll drives a
 * lateral dolly across five frames; each photograph counter-pans inside
 * its frame so the architecture appears to glide past the lens.
 */
export default function Projects({ data }) {
  const root = useRef(null);
  const items = data?.length ? data : photos.projects;

  useEffect(() => {
    const ctx = gsap.context(() => {
      const track = root.current.querySelector(".projects-track");
      const panels = gsap.utils.toArray(".project-panel", root.current);

      const horizontal = gsap.to(track, {
        x: () => -(track.scrollWidth - window.innerWidth),
        ease: "none",
        scrollTrigger: {
          trigger: root.current.querySelector(".projects-stage"),
          start: "top top",
          end: () => `+=${track.scrollWidth - window.innerWidth}`,
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
          anticipatePin: 1,
        },
      });

      // internal parallax — each image pans against the dolly direction
      panels.forEach((panel) => {
        const img = panel.querySelector("img");
        gsap.fromTo(
          img,
          { xPercent: -6 },
          {
            xPercent: 6,
            ease: "none",
            scrollTrigger: {
              trigger: panel,
              containerAnimation: horizontal,
              start: "left right",
              end: "right left",
              scrub: true,
            },
          }
        );
      });
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <section className="projects" id="work" ref={root}>
      <div className="projects-head">
        <h2 className="serif">Signature work</h2>
        <span className="label">Selected residences · 2023 — 2026</span>
      </div>
      <div className="projects-stage">
        <div className="projects-track">
          {items.map((p, i) => (
            <div className="project-panel" key={p.title || i}>
              <figure className="frame">
                <Photo
                  src={p.src}
                  alt={p.alt}
                  drift={false}
                  sizes="80vw"
                  position={p.position}
                  caption={[p.title, p.meta].filter(Boolean).join(" — ")}
                />
                <figcaption className="project-caption">
                  <span className="num">{String(i + 1).padStart(2, "0")}</span>
                  <h3>{p.title}</h3>
                  <span className="meta">{p.meta}</span>
                </figcaption>
              </figure>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
