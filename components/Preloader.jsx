"use client";

import { useEffect, useRef } from "react";

export default function Preloader() {
  const ref = useRef(null);

  useEffect(() => {
    const node = ref.current;
    const remove = () => node?.remove();
    node?.addEventListener("animationend", remove);
    return () => node?.removeEventListener("animationend", remove);
  }, []);

  return (
    <div className="preloader" ref={ref} aria-hidden="true">
      <div className="wordmark">Joe Bryant</div>
      <div className="label">Architectural Photographer</div>
    </div>
  );
}
