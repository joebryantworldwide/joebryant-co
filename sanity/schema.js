// The content model behind Joe's admin studio. One "Site Photography"
// document holds every image slot on the site — each with Sanity's
// hotspot tool so Joe can drag the focal point on any photo.

const img = (name, title, description) => ({
  name,
  title,
  description,
  type: "image",
  options: { hotspot: true },
  fields: [
    {
      name: "alt",
      title: "Description (for Google & accessibility)",
      type: "string",
      description: "One sentence describing the photo — helps SEO.",
    },
  ],
});

const captioned = (name, title, extra = []) => ({
  name,
  title,
  type: "object",
  fields: [
    img("image", "Photograph"),
    { name: "title", title: "Title", type: "string" },
    { name: "meta", title: "Caption line (location / credit)", type: "string" },
    ...extra,
  ],
  preview: {
    select: { title: "title", media: "image" },
  },
});

export const sitePhotos = {
  name: "sitePhotos",
  title: "Site Photography",
  type: "document",
  groups: [
    { name: "hero", title: "1 · Opening" },
    { name: "projects", title: "2 · Signature Work" },
    { name: "interiors", title: "3 · Interiors" },
    { name: "estates", title: "4 · Estates (Twilight)" },
    { name: "portraits", title: "5 · Portraits" },
    { name: "commercial", title: "6 · Commercial" },
    { name: "about", title: "7 · About" },
  ],
  fields: [
    // — 1 · Opening —
    {
      ...img(
        "hero",
        "Opening photograph",
        "The site opens zoomed into this image and pulls back as visitors scroll. Drag the hotspot circle onto the detail the zoom should center on."
      ),
      group: "hero",
    },

    // — 2 · Signature Work —
    {
      name: "projects",
      title: "Signature projects (the horizontal film strip)",
      type: "array",
      group: "projects",
      of: [captioned("project", "Project")],
      validation: (Rule) => Rule.max(6),
    },

    // — 3 · Interiors —
    { ...img("interiorFull1", "Full-width interior — top"), group: "interiors" },
    { ...img("interiorWideA", "Pair 1 — wide photo (left)"), group: "interiors" },
    { ...img("interiorTallA", "Pair 1 — tall photo (right)"), group: "interiors" },
    { ...img("interiorWideB", "Pair 2 — wide photo"), group: "interiors" },
    { ...img("interiorTallB", "Pair 2 — tall photo"), group: "interiors" },
    { ...img("interiorFull2", "Full-width interior — bottom"), group: "interiors" },
    { name: "interiorCaption1", title: "Top photo caption", type: "string", group: "interiors" },
    { name: "interiorCaption2", title: "Bottom photo caption", type: "string", group: "interiors" },

    // — 4 · Estates —
    { ...img("estateGolden", "Golden hour aerial"), group: "estates" },
    { ...img("estateSunset", "Sunset aerial"), group: "estates" },
    { ...img("estateDusk", "Dusk aerial"), group: "estates" },
    { ...img("estateBlue", "Blue hour aerial"), group: "estates" },

    // — 5 · Portraits —
    {
      name: "portraits",
      title: "Portrait row (three photos)",
      type: "array",
      group: "portraits",
      of: [
        captioned("portrait", "Portrait", [
          {
            name: "duo",
            title: "Two people in frame? (uses a wider crop)",
            type: "boolean",
            initialValue: false,
          },
        ]),
      ],
      validation: (Rule) => Rule.max(3),
    },
    { ...captioned("portraitWide", "Full-width portrait (bottom)"), group: "portraits" },

    // — 6 · Commercial —
    {
      name: "commercial",
      title: "Commercial grid (four photos: tall, wide, wide, tall)",
      type: "array",
      group: "commercial",
      of: [captioned("commercialItem", "Commercial photo")],
      validation: (Rule) => Rule.max(4),
    },

    // — 7 · About —
    { ...img("aboutPhoto", "Photo of Joe"), group: "about" },
  ],
  preview: {
    prepare: () => ({ title: "Site Photography" }),
  },
};

// — Client portal accounts —
// Each document is one client login at joebryant.co/portal.
export const client = {
  name: "client",
  title: "Client",
  type: "document",
  groups: [
    { name: "account", title: "Account & Login" },
    { name: "shoots", title: "Shoots" },
    { name: "billing", title: "Invoices" },
    { name: "license", title: "License" },
  ],
  fields: [
    { name: "name", title: "Client name", type: "string", group: "account", validation: (R) => R.required() },
    { name: "company", title: "Company (optional)", type: "string", group: "account" },
    {
      name: "email",
      title: "Login email",
      type: "string",
      group: "account",
      validation: (R) => R.required(),
    },
    {
      name: "accessCode",
      title: "Access code (their password)",
      type: "string",
      group: "account",
      description:
        "Set anything — e.g. TROUSDALE24. To 'change their password', edit this and re-send the invite.",
      validation: (R) => R.required(),
    },
    { name: "phone", title: "Mobile (for text updates)", type: "string", group: "account" },
    {
      name: "textUpdates",
      title: "Opted in to text updates",
      type: "boolean",
      group: "account",
      initialValue: false,
    },
    {
      name: "welcomeNote",
      title: "Personal welcome line",
      type: "text",
      rows: 2,
      group: "account",
      description: "Shown under their greeting, e.g. 'The Trousdale twilights came out spectacular.'",
    },
    {
      name: "shoots",
      title: "Their shoots",
      type: "array",
      group: "shoots",
      of: [
        {
          name: "shoot",
          title: "Shoot",
          type: "object",
          fields: [
            { name: "title", title: "Title", type: "string" },
            { name: "date", title: "Shoot date", type: "date" },
            img("cover", "Cover photo"),
            {
              name: "pixiesetUrl",
              title: "Pixieset gallery link",
              type: "url",
              description: "Their direct gallery URL — opens full screen from the portal.",
            },
            {
              name: "downloadPin",
              title: "Download PIN (if the gallery has one)",
              type: "string",
            },
          ],
          preview: { select: { title: "title", media: "cover" } },
        },
      ],
    },
    {
      name: "invoices",
      title: "Invoices",
      type: "array",
      group: "billing",
      of: [
        {
          name: "invoice",
          title: "Invoice",
          type: "object",
          fields: [
            { name: "title", title: "For", type: "string" },
            { name: "amount", title: "Amount (USD)", type: "number" },
            {
              name: "status",
              title: "Status",
              type: "string",
              options: { list: ["Sent", "Paid", "Overdue"], layout: "radio" },
              initialValue: "Sent",
            },
            {
              name: "squareLink",
              title: "Square payment link",
              type: "url",
              description: "The invoice/checkout link from Square — the Pay button in their portal.",
            },
            {
              name: "squareInvoiceId",
              title: "Square invoice ID (for live auto-updates)",
              type: "string",
            },
            { name: "dueDate", title: "Due", type: "date" },
            { name: "paidDate", title: "Paid on", type: "date" },
          ],
          preview: { select: { title: "title", subtitle: "status" } },
        },
      ],
    },
    {
      name: "licenseTitle",
      title: "License name",
      type: "string",
      group: "license",
      initialValue: "Image Licensing Agreement",
    },
    {
      name: "licenseText",
      title: "License terms (as agreed at payment)",
      type: "text",
      rows: 12,
      group: "license",
    },
    { name: "licenseFile", title: "Signed PDF (optional)", type: "file", group: "license" },
  ],
  preview: {
    select: { title: "name", subtitle: "company" },
  },
};

export const schemaTypes = [sitePhotos, client];
