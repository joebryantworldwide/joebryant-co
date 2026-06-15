"use client";

import { useRef, useEffect } from "react";
import { gsap } from "../lib/gsap";
import Photo from "./Photo";
import { photos } from "../lib/photos";

/*
 * Portraits — the people who shape the spaces. Frames unveil
 * top-to-bottom like a curtain lifting; each image settles with
 * a slow push-in.
 */
export default function Portraits({ data, wide }) {
  const root = useRef(null);
  const row = photos.portraits.map((d, i) => data?.[i] ?? d);
  const wideItem = wide ?? photos.portraitWide;

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray(".portrait-card .photo, .portraits-wide .photo", root.current).forEach((frame, i) => {
        gsap.to(frame, {
          clipPath: "inset(0% 0 0% 0)",
          duration: 1.5,
          delay: (i % 3) * 0.12,
          ease: "power4.inOut",
          scrollTrigger: { trigger: frame, start: "top 84%" },
        });
        const img = frame.querySelector("img");
        gsap.fromTo(
          img,
          { yPercent: -8, scale: 1.06 },
          {
            yPercent: 6,
            scale: 1,
            ease: "none",
            scrollTrigger: {
              trigger: frame,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          }
        );
      });

      gsap.fromTo(
        ".portraits-head",
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 1.4,
          ease: "power3.out",
          scrollTrigger: { trigger: ".portraits-head", start: "top 80%" },
        }
      );
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <section className="portraits" ref={root}>
      <div className="portraits-head">
        <span className="label">Portraits</span>
        <h2>
          The visionaries <em>behind the walls.</em>
        </h2>
      </div>

      <div className="portraits-row">
        {row.map((p, i) => (
          <figure className="portrait-card" key={p.caption || i}>
            <Photo
              src={p.src}
              alt={p.alt}
              drift={false}
              sizes="(max-width: 880px) 100vw, 33vw"
              className={p.duo ? "duo" : undefined}
              position={p.position || (p.duo ? "52% 50%" : undefined)}
              caption={[p.caption, p.meta].filter(Boolean).join(" — ")}
            />
            <figcaption>
              <span className="serif">{p.caption}</span>
              <span className="label">{p.meta}</span>
            </figcaption>
          </figure>
        ))}
      </div>

      <figure className="portraits-wide portrait-card">
        <Photo
          src={wideItem.src}
          alt={wideItem.alt}
          drift={false}
          sizes="100vw"
          position={wideItem.position}
          caption={[wideItem.caption, wideItem.meta].filter(Boolean).join(" — ")}
        />
        <figcaption>
          <span className="serif">{wideItem.caption}</span>
          <span className="label">{wideItem.meta}</span>
        </figcaption>
      </figure>
    </section>
  );
}
