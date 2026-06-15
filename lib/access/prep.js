// Prep guide template. Every project gets its own copy so clients can
// check items off; sections that don't apply can be removed by Joe.

export function buildPrepGuide({ twilight = true, pool = true } = {}) {
  const sections = [
    {
      title: "Exterior Prep",
      items: [
        "Sweep entries, walkways and patios",
        "Remove hoses, garbage bins and garden tools from view",
        "Straighten outdoor furniture and open umbrellas",
        "Clear cobwebs from eaves and light fixtures",
        "Hide pet items, toys and seasonal decorations",
      ],
    },
    {
      title: "Interior Prep",
      items: [
        "Declutter counters, shelves and tabletops",
        "Remove personal photos, mail and magnets",
        "Make all beds with pressed linens",
        "Hide cords, chargers, remotes and bins",
        "Style key vignettes — books, florals, trays",
        "Set dining and patio tables simply",
      ],
    },
    {
      title: "Lighting Prep",
      items: [
        "Replace any burned-out bulbs (match color temperature)",
        "Turn ON every interior light, lamp and sconce",
        "Turn OFF ceiling fans and televisions",
        "Open blinds and curtains evenly",
      ],
    },
    {
      title: "Window Cleaning",
      items: [
        "Clean interior glass on featured rooms",
        "Clean exterior glass on the main elevation",
        "Remove screens from key view windows where possible",
      ],
    },
    {
      title: "Landscaping",
      items: [
        "Mow, edge and blow 1–2 days before the shoot",
        "Trim hedges and remove dead plants",
        "Fresh mulch in beds where needed",
        "Water the lawn the evening before",
      ],
    },
    {
      title: "Vehicle & Trash Removal",
      items: [
        "Move all vehicles off the driveway and street frontage",
        "Garbage and recycling bins out of sight",
        "Close garage doors",
      ],
    },
  ];

  if (pool) {
    sections.push({
      title: "Pool & Spa Prep",
      items: [
        "Skim and vacuum — water should read glass-clear",
        "Remove cleaning equipment, hoses and pool toys",
        "Turn on water features and spa jets for the shoot",
        "Uncover the pool and spa completely",
      ],
    });
  }

  if (twilight) {
    sections.push({
      title: "Twilight Prep",
      items: [
        "All exterior and landscape lighting ON and working",
        "Interior lights ON in every street- and yard-facing room",
        "Fire features and pool lights ON",
        "Property staff/owner available 30 minutes before sunset",
      ],
    });
  }

  return sections.map((s) => ({
    title: s.title,
    items: s.items.map((text) => ({ text, done: false })),
  }));
}
