// Newsletter design model + 5 modern templates + email-HTML renderer.
// Client-safe (pure). A design = { theme, blocks[] }.

const CDN = "https://images.squarespace-cdn.com/content/v1/644a110ae9f62a105d8f1892";
const IMG = {
  estate: `${CDN}/a574431b-f275-41bd-b513-f316a6e34595/DJI_0648.jpg?format=1500w`,
  interior: `${CDN}/cb4fb9bb-a363-4d7b-83de-44151d0d6319/_63A1315.jpg?format=1500w`,
  stair: `${CDN}/7458f685-5245-4b51-8437-b19cfa90577c/163A5312.jpg?format=1500w`,
};

export const FONTS = [
  { label: "Instrument Serif", value: "'Instrument Serif', Georgia, serif" },
  { label: "Inter Tight", value: "'Inter Tight', -apple-system, sans-serif" },
  { label: "Georgia", value: "Georgia, 'Times New Roman', serif" },
  { label: "Helvetica", value: "'Helvetica Neue', Arial, sans-serif" },
  { label: "Courier", value: "'Courier New', monospace" },
];

let _id = 0;
export const blockId = () => `b${Date.now().toString(36)}${_id++}`;

const b = (type, props) => ({ id: blockId(), type, align: "center", ...props });

export const TEMPLATES = [
  {
    key: "editorial",
    name: "Editorial",
    theme: { bg: "#0b0b0c", fg: "#eae6df", accent: "#c8a878", heading: FONTS[0].value, body: FONTS[1].value },
    blocks: [
      b("cover", { src: IMG.estate, heading: "The Light Report", sub: "Notes from the studio" }),
      b("heading", { text: "What we've been shooting", size: 30, weight: 400, color: "#eae6df", font: FONTS[0].value }),
      b("text", { text: "A few frames from a remarkable month — twilight estates, sculptural interiors, and the people who shape them.", size: 16, color: "#9b958c", font: FONTS[1].value }),
      b("image", { src: IMG.interior, alt: "Recent interior" }),
      b("button", { btnLabel: "View the latest work", href: "https://joebryant.co", color: "#0b0b0c", bg: "#c8a878" }),
      b("divider", {}),
      b("text", { text: "Joe Bryant · Architectural Photography · Los Angeles", size: 12, color: "#9b958c", font: FONTS[1].value }),
    ],
  },
  {
    key: "minimal",
    name: "Minimal",
    theme: { bg: "#f7f5f1", fg: "#16140f", accent: "#a8814a", heading: FONTS[0].value, body: FONTS[1].value },
    blocks: [
      b("heading", { text: "Hello.", size: 40, weight: 400, color: "#16140f", font: FONTS[0].value, align: "left" }),
      b("text", { text: "A short, warm note — what's new, what's coming, and a little inspiration for the month ahead.", size: 17, color: "#5b554c", font: FONTS[1].value, align: "left" }),
      b("image", { src: IMG.stair, alt: "Featured frame" }),
      b("button", { btnLabel: "See more", href: "https://joebryant.co", color: "#ffffff", bg: "#16140f", align: "left" }),
    ],
  },
  {
    key: "gallery",
    name: "Gallery",
    theme: { bg: "#101012", fg: "#eae6df", accent: "#c8a878", heading: FONTS[0].value, body: FONTS[1].value },
    blocks: [
      b("heading", { text: "This Month, in Frames", size: 30, weight: 400, color: "#eae6df", font: FONTS[0].value }),
      b("image", { src: IMG.estate, alt: "Estate" }),
      b("image", { src: IMG.interior, alt: "Interior" }),
      b("text", { text: "Every space tells a story. Here are three that stayed with us.", size: 15, color: "#9b958c", font: FONTS[1].value }),
      b("button", { btnLabel: "Browse the portfolio", href: "https://joebryant.co", color: "#0b0b0c", bg: "#c8a878" }),
    ],
  },
  {
    key: "announcement",
    name: "Announcement",
    theme: { bg: "#0b0b0c", fg: "#eae6df", accent: "#c8a878", heading: FONTS[0].value, body: FONTS[1].value },
    blocks: [
      b("heading", { text: "Now Booking Spring", size: 36, weight: 400, color: "#c8a878", font: FONTS[0].value }),
      b("text", { text: "Calendars are opening for spring shoots. Reply to reserve your light.", size: 18, color: "#eae6df", font: FONTS[1].value }),
      b("button", { btnLabel: "Request availability", href: "https://joebryant.co/access/book", color: "#0b0b0c", bg: "#c8a878" }),
      b("divider", {}),
      b("text", { text: "Joe Bryant · joe@joebryant.co · 310 890 3687", size: 12, color: "#9b958c", font: FONTS[1].value }),
    ],
  },
  {
    key: "letter",
    name: "The Letter",
    theme: { bg: "#faf8f4", fg: "#1a1712", accent: "#a8814a", heading: FONTS[2].value, body: FONTS[2].value },
    blocks: [
      b("heading", { text: "Dear friends,", size: 30, weight: 400, color: "#1a1712", font: FONTS[2].value, align: "left" }),
      b("text", { text: "Thank you for letting me photograph the spaces you love. Here's a little of what moved me this month — and a wish for the one ahead.", size: 17, color: "#43403a", font: FONTS[2].value, align: "left" }),
      b("reading", { label: "Your reading for the month", color: "#1a1712", font: FONTS[2].value }),
      b("text", { text: "Warmly,\nJoe", size: 17, color: "#1a1712", font: FONTS[2].value, align: "left" }),
    ],
  },
];

export const NEW_BLOCKS = {
  heading: () => b("heading", { text: "New heading", size: 28, weight: 400, color: "#eae6df", font: FONTS[0].value }),
  text: () => b("text", { text: "Write something here…", size: 16, color: "#9b958c", font: FONTS[1].value }),
  image: () => b("image", { src: IMG.estate, alt: "Image" }),
  button: () => b("button", { btnLabel: "Click here", href: "https://joebryant.co", color: "#0b0b0c", bg: "#c8a878" }),
  divider: () => b("divider", {}),
  reading: () => b("reading", { label: "Your reading for the month", color: "#eae6df", font: FONTS[1].value }),
};

const esc = (s = "") => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// Render a design to email-safe HTML. The {{reading}} token (and reading
// blocks) are replaced per-recipient at send time.
export function renderEmail(design) {
  const t = design.theme || {};
  const parts = (design.blocks || []).map((bl) => {
    const a = bl.align || "center";
    if (bl.type === "cover") {
      return `<div style="position:relative;background:#111;text-align:center"><img src="${esc(bl.src)}" width="600" style="width:100%;max-width:600px;display:block"/><div style="padding:28px 24px"><div style="font-family:${t.heading};font-size:30px;color:${esc(t.fg)}">${esc(bl.heading || "")}</div><div style="font-family:${t.body};font-size:13px;letter-spacing:2px;text-transform:uppercase;color:${esc(t.accent)};margin-top:8px">${esc(bl.sub || "")}</div></div></div>`;
    }
    if (bl.type === "heading") return `<h2 style="margin:0;padding:18px 24px 6px;font-family:${bl.font || t.heading};font-size:${bl.size || 28}px;font-weight:${bl.weight || 400};color:${esc(bl.color || t.fg)};text-align:${a}">${esc(bl.text)}</h2>`;
    if (bl.type === "text") return `<p style="margin:0;padding:8px 24px;font-family:${bl.font || t.body};font-size:${bl.size || 16}px;line-height:1.7;color:${esc(bl.color || t.fg)};text-align:${a};white-space:pre-line">${esc(bl.text)}</p>`;
    if (bl.type === "image") return `<div style="padding:12px 24px;text-align:${a}"><img src="${esc(bl.src)}" width="552" style="width:100%;max-width:552px;border-radius:8px;display:inline-block"/></div>`;
    if (bl.type === "button") return `<div style="padding:18px 24px;text-align:${a}"><a href="${esc(bl.href)}" style="display:inline-block;padding:14px 28px;border-radius:999px;font-family:${t.body};font-size:13px;letter-spacing:2px;text-transform:uppercase;text-decoration:none;background:${esc(bl.bg || t.accent)};color:${esc(bl.color || "#0b0b0c")}">${esc(bl.btnLabel)}</a></div>`;
    if (bl.type === "divider") return `<div style="padding:16px 24px"><div style="border-top:1px solid ${esc(t.accent)};opacity:.4"></div></div>`;
    if (bl.type === "reading") return `<div style="margin:12px 24px;padding:20px 22px;border:1px solid ${esc(t.accent)};border-radius:10px;text-align:${a}"><div style="font-family:${t.body};font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${esc(t.accent)};margin-bottom:8px">${esc(bl.label || "Your reading for the month")}</div><div style="font-family:${bl.font || t.body};font-size:${bl.size || 16}px;line-height:1.7;color:${esc(bl.color || t.fg)}">{{reading}}</div></div>`;
    return "";
  });
  return `<div style="background:${esc(t.bg)};padding:24px 0"><div style="max-width:600px;margin:0 auto;background:${esc(t.bg)}">${parts.join("")}</div></div>`;
}
