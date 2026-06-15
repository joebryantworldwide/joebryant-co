"use client";

import { useRef, useEffect } from "react";
import { gsap } from "../lib/gsap";
import Photo from "./Photo";
import { photos } from "../lib/photos";

export default function About({ photo }) {
  const root = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".about-media img",
        { yPercent: -8 },
        {
          yPercent: 8,
          ease: "none",
          scrollTrigger: {
            trigger: ".about-media",
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        }
      );
      gsap.fromTo(
        ".about-copy > *",
        { opacity: 0, y: 36 },
        {
          opacity: 1,
          y: 0,
          duration: 1.3,
          stagger: 0.12,
          ease: "power3.out",
          scrollTrigger: { trigger: root.current, start: "top 70%" },
        }
      );
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section className="about" id="about" ref={root}>
      <div className="about-grid">
        <div className="about-copy">
          <span className="label">About</span>
          <h2>
            Twenty-one years of chasing light <em>through extraordinary spaces.</em>
          </h2>
          <p>
            Joe Bryant picked up a camera at eighteen and never put it down. He
            photographs architecture, luxury residences, interiors and the
            people who imagine them. His work has appeared in Architectural Digest,
            the Wall Street Journal, Dwell, the LA Times and on NBC — and has carried
            the visual identity of estates, hotels and brands from Los Angeles to the
            other side of the world.
          </p>
          <p>
            He has photographed for Disney, Sotheby’s International, Dolce&nbsp;&amp;&nbsp;Gabbana,
            Amangiri and Booking.com, and made portraits of John Legend and the
            architects, designers and developers shaping Los Angeles — but the brief
            never changes: find the light, honor the design, tell the story the
            architecture is already telling.
          </p>
          <div className="about-stats">
            <div className="stat">
              <span className="serif">21</span>
              <span className="label">Years behind the lens</span>
            </div>
            <div className="stat">
              <span className="serif">9</span>
              <span className="label">Major publications</span>
            </div>
            <div className="stat">
              <span className="serif">LA</span>
              <span className="label">& Worldwide</span>
            </div>
          </div>
        </div>
        <div className="about-media">
          <Photo src={(photo ?? photos.about).src} alt={(photo ?? photos.about).alt} drift={false} sizes="(max-width: 880px) 100vw, 50vw" position={photo?.position} caption="Joe Bryant — Los Angeles" />
        </div>
      </div>
    </section>
  );
}
