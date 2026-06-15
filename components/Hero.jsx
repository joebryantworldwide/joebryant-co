"use client";

import { useRef, useEffect } from "react";
import { gsap } from "../lib/gsap";
import Photo from "./Photo";
import { photos } from "../lib/photos";

/*
 * Opening sequence — the name lands immediately over a vivid
 * architectural detail; scrolling pulls the camera back until the
 * full interior is revealed and the title returns over a scrim.
 */
export default function Hero({ data }) {
  const root = useRef(null);
  const hero = data ?? photos.hero;

  useEffect(() => {
    const ctx = gsap.context(() => {
      const img = root.current.querySelector(".hero-frame img");
      const phrases = gsap.utils.toArray(".hero-phrase", root.current);
      const intro = root.current.querySelector(".hero-intro");
      const title = root.current.querySelector(".hero-title");
      const veil = root.current.querySelector(".hero-veil");
      const shade = root.current.querySelector(".hero-shade");
      const bottomshade = root.current.querySelector(".hero-bottomshade");
      const cue = root.current.querySelector(".hero-scrollcue");

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 1.2,
        },
      });

      // the pull-back: vivid detail → full architecture.
      // x/yPercent hold the focal point at the optical center while
      // zoomed, easing back to the natural composition at reveal.
      tl.fromTo(
        img,
        { scale: 2.5, xPercent: 10, yPercent: -7 },
        { scale: 1, xPercent: 0, yPercent: 0, duration: 10 },
        0
      );
      tl.fromTo(shade, { opacity: 0.22 }, { opacity: 0, duration: 4 }, 0);
      tl.to(veil, { opacity: 0.3, duration: 10 }, 0);

      // the arrival title hands off to the film as scroll begins
      tl.to(intro, { opacity: 0, y: -50, duration: 1.6 }, 0.2);

      // phrases surface and dissolve as the camera moves
      tl.fromTo(phrases[0], { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1.6 }, 2.4);
      tl.to(phrases[0], { opacity: 0, y: -30, duration: 1.4 }, 4.6);
      tl.fromTo(phrases[1], { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1.6 }, 5.6);
      tl.to(phrases[1], { opacity: 0, y: -30, duration: 1.4 }, 7.4);

      // final reveal — the name returns with the full frame, readable
      tl.fromTo(bottomshade, { opacity: 0 }, { opacity: 1, duration: 2 }, 8.2);
      tl.fromTo(title, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 2 }, 8.4);

      // entry cue fades once scrolling begins
      gsap.to(cue, {
        opacity: 0,
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          end: "+=500",
          scrub: true,
        },
      });
    }, root);

    return () => ctx.revert();
  }, []);

  const focal = hero.position
    ? { objectPosition: hero.position, transformOrigin: hero.position }
    : undefined;

  return (
    <section className="hero" id="top" ref={root}>
      <div className="hero-stage">
        <div className="hero-frame">
          <Photo
            src={hero.src}
            alt={hero.alt}
            drift={false}
            priority
            sizes="100vw"
            lightbox={false}
            imgStyle={focal}
          />
        </div>
        <div className="hero-veil" />
        <div className="hero-shade" />
        <div className="hero-bottomshade" />
        <div className="hero-intro">
          <div className="hero-intro-inner">
            <h1>Joe Bryant</h1>
            <span className="label">Architectural Photographer — Los Angeles</span>
          </div>
        </div>
        <div className="hero-copy">
          <p className="hero-phrase">
            Architecture is not seen. <em>It is experienced.</em>
          </p>
          <p className="hero-phrase">
            <em>Light</em> shapes every story.
          </p>
          <div className="hero-title">
            <h1>Joe Bryant</h1>
            <span className="label">Architectural Photographer — Los Angeles</span>
          </div>
        </div>
        <div className="hero-scrollcue" aria-hidden="true">
          <span className="label">Scroll</span>
          <span className="tick" />
        </div>
      </div>
    </section>
  );
}
