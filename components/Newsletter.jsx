"use client";

import { useRef, useState, useEffect } from "react";
import { gsap } from "../lib/gsap";

/*
 * The List — a quiet, inline subscribe band. No popups, no interruptions.
 *
 * Hook up a provider by setting SUBSCRIBE_ENDPOINT to a form-post URL,
 * e.g. Buttondown:  https://buttondown.com/api/emails/embed-subscribe/<user>
 * or Mailchimp's embedded form action URL. Until one is configured the
 * form falls back to a pre-filled email to joe@joebryant.co.
 */
const SUBSCRIBE_ENDPOINT = "";

export default function Newsletter() {
  const root = useRef(null);
  const [state, setState] = useState("idle"); // idle | sending | done | error

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".newsletter > *",
        { opacity: 0, y: 36 },
        {
          opacity: 1,
          y: 0,
          duration: 1.3,
          stagger: 0.12,
          ease: "power3.out",
          scrollTrigger: { trigger: root.current, start: "top 78%" },
        }
      );
    }, root);
    return () => ctx.revert();
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    const email = new FormData(e.currentTarget).get("email");
    if (!email) return;

    if (!SUBSCRIBE_ENDPOINT) {
      window.location.href = `mailto:joe@joebryant.co?subject=${encodeURIComponent(
        "Add me to The List"
      )}&body=${encodeURIComponent(`Please add ${email} to the mailing list.`)}`;
      setState("done");
      return;
    }

    try {
      setState("sending");
      const body = new URLSearchParams({ email });
      await fetch(SUBSCRIBE_ENDPOINT, { method: "POST", body, mode: "no-cors" });
      setState("done");
    } catch {
      setState("error");
    }
  }

  return (
    <section className="newsletter" id="newsletter" ref={root}>
      <span className="label">The List</span>
      <h2>
        Be first to see <em>the work.</em>
      </h2>
      <p className="newsletter-sub">
        An occasional dispatch — new projects, published features, prints.
        No noise, unsubscribe anytime.
      </p>
      {state === "done" ? (
        <p className="newsletter-done serif">
          Welcome to the list. <em>Talk soon.</em>
        </p>
      ) : (
        <form className="newsletter-form" onSubmit={onSubmit}>
          <input
            type="email"
            name="email"
            required
            placeholder="your@email.com"
            aria-label="Email address"
            autoComplete="email"
          />
          <button type="submit" disabled={state === "sending"}>
            {state === "sending" ? "Joining…" : "Subscribe"}
          </button>
        </form>
      )}
      {state === "error" && (
        <p className="newsletter-error label">
          Something slipped — email joe@joebryant.co instead.
        </p>
      )}
    </section>
  );
}
