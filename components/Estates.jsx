"use client";

import { useRef, useEffect } from "react";
import { gsap } from "../lib/gsap";
import Photo from "./Photo";
import { photos } from "../lib/photos";

/*
 * Luxury estates — a pinned aerial sequence that scrubs through
 * golden hour, sunset, dusk and blue hour. Scroll controls time.
 */
export default function Estates({ data }) {
  const root = useRef(null);
  const slides = photos.estates.map((d, i) =>
    data?.[i] ? { ...d, ...data[i] } : d
  );

  useEffect(() => {
    const ctx = gsap.context(() => {
      const slides = gsap.utils.toArray(".estate-slide", root.current);
      const names = gsap.utils.toArray(".phase-name", root.current);
      const bar = root.current.querySelector(".phase-track i");

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 1,
        },
      });

      const SEG = 10;
      slides.forEach((slide, i) => {
        const img = slide.querySelector("img");
        // slow push-in across each slide's segment
        tl.fromTo(img, { scale: 1.12 }, { scale: 1.0, duration: SEG }, i * SEG);
        if (i > 0) {
          tl.fromTo(slide, { opacity: 0 }, { opacity: 1, duration: SEG * 0.32 }, i * SEG);
          tl.fromTo(names[i], { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: SEG * 0.2 }, i * SEG + SEG * 0.1);
        }
        if (i < slides.length - 1) {
          tl.to(names[i], { opacity: 0, y: -18, duration: SEG * 0.2 }, (i + 1) * SEG - SEG * 0.1);
        }
      });

      tl.fromTo(bar, { width: "0%" }, { width: "100%", duration: SEG * slides.length }, 0);
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <section className="estates" ref={root}>
      <div className="estates-stage">
        {slides.map((e) => (
          <div className="estate-slide" key={e.phase}>
            <Photo src={e.src} alt={e.alt} drift={false} sizes="100vw" position={e.position} caption={`${e.phase} · Luxury Estate`} />
          </div>
        ))}
        <div className="estates-hud" aria-hidden="true" />
        <div className="estates-title">
          <span className="label">Luxury Estates</span>
          <h2 className="serif">Scroll, and the sun goes down.</h2>
        </div>
        <div className="estates-phase">
          <div style={{ position: "relative", height: "2.6em", width: "100%" }}>
            {slides.map((e, i) => (
              <span
                className="phase-name"
                key={e.phase}
                style={{
                  position: "absolute",
                  right: 0,
                  whiteSpace: "nowrap",
                  opacity: i === 0 ? 1 : 0,
                }}
              >
                {e.phase}
              </span>
            ))}
          </div>
          <div className="phase-track">
            <i />
          </div>
        </div>
      </div>
    </section>
  );
}
