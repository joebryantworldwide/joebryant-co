"use client";

import { useEffect, useState, useCallback } from "react";
import { sizedUrl } from "./Photo";

/*
 * A quiet full-screen viewer. Any Photo on the site opens here;
 * ESC, the close button, or clicking the backdrop returns to the film.
 */
export default function Lightbox() {
  const [item, setItem] = useState(null);

  const close = useCallback(() => {
    setItem(null);
    window.__lenis?.start();
  }, []);

  useEffect(() => {
    const onOpen = (e) => {
      setItem(e.detail);
      window.__lenis?.stop();
    };
    const onKey = (e) => e.key === "Escape" && close();
    window.addEventListener("jb:lightbox", onOpen);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("jb:lightbox", onOpen);
      window.removeEventListener("keydown", onKey);
    };
  }, [close]);

  if (!item) return null;

  return (
    <div className="lightbox" onClick={close} role="dialog" aria-modal="true">
      <button className="lightbox-close label" onClick={close} aria-label="Close">
        Close ✕
      </button>
      <figure onClick={(e) => e.stopPropagation()}>
        <img src={sizedUrl(item.src, 2500)} alt={item.alt} />
        {item.caption && <figcaption className="label">{item.caption}</figcaption>}
      </figure>
    </div>
  );
}
