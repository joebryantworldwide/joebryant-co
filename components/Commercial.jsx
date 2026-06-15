"use client";

import { useRef, useEffect } from "react";
import { gsap } from "../lib/gsap";
import Photo from "./Photo";
import { photos } from "../lib/photos";

/*
 * Commercial — campaign and brand work. Frames unveil with the same
 * curtain-lift as portraits; each image carries a slow internal pan.
 */
export default function Commercial({ data }) {
  const root = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray(".commercial-card .photo", root.current).forEach((frame, i) => {
        gsap.to(frame, {
          clipPath: "inset(0% 0 0% 0)",
          duration: 1.5,
          delay: (i % 2) * 0.15,
          ease: "power4.inOut",
          scrollTrigger: { trigger: frame, start: "top 84%" },
        });
        const img = frame.querySelector("img");
        gsap.fromTo(
          img,
          { yPercent: -7, scale: 1.05 },
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
        ".commercial-head",
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 1.4,
          ease: "power3.out",
          scrollTrigger: { trigger: ".commercial-head", start: "top 80%" },
        }
      );
    }, root);

    return () => ctx.revert();
  }, []);

  const [a, b, c, d] = photos.commercial.map((def, i) => data?.[i] ?? def);

  return (
    <section className="commercial" id="commercial" ref={root}>
      <div className="commercial-head">
        <span className="label">Commercial</span>
        <h2>
          Brands, in their <em>best light.</em>
        </h2>
        <p className="commercial-sub">
          Campaigns, products and commercial spaces — for Bentley Mills, Disney,
          Dolce&nbsp;&amp;&nbsp;Gabbana, Panda Express and Booking.com.
        </p>
      </div>
      <div className="commercial-grid">
        <figure className="commercial-card slot-a">
          <Photo src={a.src} alt={a.alt} drift={false} position={a.position} caption={[a.caption, a.meta].filter(Boolean).join(" — ")} className="tall" sizes="(max-width: 880px) 100vw, 38vw" />
          <figcaption>
            <span className="serif">{a.caption}</span>
            <span className="label">{a.meta}</span>
          </figcaption>
        </figure>
        <figure className="commercial-card slot-b">
          <Photo src={b.src} alt={b.alt} drift={false} position={b.position} caption={[b.caption, b.meta].filter(Boolean).join(" — ")} sizes="(max-width: 880px) 100vw, 52vw" />
          <figcaption>
            <span className="serif">{b.caption}</span>
            <span className="label">{b.meta}</span>
          </figcaption>
        </figure>
        <figure className="commercial-card slot-c">
          <Photo src={c.src} alt={c.alt} drift={false} position={c.position} caption={[c.caption, c.meta].filter(Boolean).join(" — ")} sizes="(max-width: 880px) 100vw, 52vw" />
          <figcaption>
            <span className="serif">{c.caption}</span>
            <span className="label">{c.meta}</span>
          </figcaption>
        </figure>
        <figure className="commercial-card slot-d">
          <Photo src={d.src} alt={d.alt} drift={false} position={d.position} caption={[d.caption, d.meta].filter(Boolean).join(" — ")} className="tall" sizes="(max-width: 880px) 100vw, 38vw" />
          <figcaption>
            <span className="serif">{d.caption}</span>
            <span className="label">{d.meta}</span>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
