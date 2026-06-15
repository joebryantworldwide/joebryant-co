"use client";

// A quiet, premium connection indicator with an illuminated status light:
// green (linked & healthy) · orange (connected, comms issue) · red (not
// connected). No raw URLs — just a clean, reassuring "Linked by Square".

import { useEffect, useState } from "react";

export default function ConnectionPill({ service = "Square", endpoint = "/api/access/square/health" }) {
  const [s, setS] = useState({ state: "loading", label: `Checking ${service}…` });

  useEffect(() => {
    let on = true;
    fetch(endpoint)
      .then((r) => r.json())
      .then((d) => on && setS(d))
      .catch(() => on && setS({ state: "orange", label: `${service} — unreachable` }));
    return () => { on = false; };
  }, [endpoint, service]);

  const label =
    s.label ||
    (s.state === "green" ? `Linked by ${service}`
      : s.state === "red" ? `${service} not connected`
      : `${service} — issue`);

  return (
    <span className={`acc-conn acc-conn-${s.state}`} title={label}>
      <span className="acc-conn-dot" aria-hidden="true" />
      {label}
    </span>
  );
}
