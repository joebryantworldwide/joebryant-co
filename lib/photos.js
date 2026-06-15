// Curated photography manifest — all images served from Joe's existing
// Squarespace CDN library. `src` is the base URL; width variants are
// requested via ?format=<w>w at render time.

const CDN = "https://images.squarespace-cdn.com/content/v1/644a110ae9f62a105d8f1892";

export const photos = {
  // — Opening sequence —
  hero: {
    src: `${CDN}/7458f685-5245-4b51-8437-b19cfa90577c/163A5312.jpg`,
    alt: "Sculptural bronze spiral staircase sweeping over underlit marble treads — luxury residence interior, Los Angeles",
  },

  // — Signature projects (horizontal film strip) —
  projects: [
    {
      src: `${CDN}/f3e98f90-82db-4f01-894c-1e8b5e4111fb/2H1A0224.jpg`,
      alt: "Marble bridge entry through a bronze corridor at sunset",
      title: "The Approach",
      meta: "Private Residence · Los Angeles",
    },
    {
      src: `${CDN}/ae5faca5-2533-46f1-a78c-cf49635e3835/PaulMcClean18392.jpg`,
      alt: "Roof terrace by McClean Design with teak furniture overlooking the Los Angeles skyline",
      title: "Above the City",
      meta: "McClean Design · Los Angeles",
    },
    {
      src: `${CDN}/3275e544-6cbc-4943-a98b-1e3101169c89/_63A1166.jpg`,
      alt: "Double-height glass atrium with open fire and courtyard seating, modern farmhouse",
      title: "Glass & Fire",
      meta: "Modern Farmhouse · Los Angeles",
    },
    {
      src: `${CDN}/ff111ab7-bad9-4f7e-84e0-703982258722/_63A1097.jpg`,
      alt: "Modern farmhouse reflected in a still swimming pool",
      title: "Still Water",
      meta: "Modern Farmhouse · Los Angeles",
    },
    {
      src: `${CDN}/83f8b475-b59a-4bf0-994d-983239a5fd6c/JBP_7958.jpg`,
      alt: "White minimalist walls washed by uplights at dusk",
      title: "First Light",
      meta: "Private Residence · Southern California",
    },
  ],

  // — Interiors —
  interiors: {
    bedroom: {
      src: `${CDN}/cb4fb9bb-a363-4d7b-83de-44151d0d6319/_63A1315.jpg`,
      alt: "Primary suite wrapped in warm wood with vaulted ceiling",
    },
    courtyard: {
      src: `${CDN}/87d2ae8a-5017-4044-949c-87b45cbe066e/2H1A9754-Edit.jpg`,
      alt: "Olive-tree courtyard with two-level water feature and book-matched stone — McClean Design residence, Beverly Hills",
    },
    living: {
      src: `${CDN}/d6390491-3cd7-4a7a-830d-5648eb25a76b/163A5632-2.jpg`,
      alt: "Living room with bronze pendant, Eames lounge and garden light",
    },
    kitchen: {
      src: `${CDN}/319c9d94-f8eb-4fc8-b8af-416b00c8ae40/163A4780.jpg`,
      alt: "Monolithic black marble island under a skylight",
    },
    corridor: {
      src: `${CDN}/63061acf-69f5-4e2f-b2e1-885364dc4b63/163A6048.jpg`,
      alt: "Plaster corridor opening to green light",
    },
    shower: {
      src: `${CDN}/9e05065e-26ee-45fc-9cca-89eac0973269/163A4832.jpg`,
      alt: "Travertine shower in layered stone and glass",
    },
  },

  // — Estates · twilight progression —
  estates: [
    {
      src: `${CDN}/946cb6c8-579c-4f75-85d5-e5faa3d686d1/DJI_0968.jpg`,
      alt: "Hillside estate with infinity pool in late golden light",
      phase: "Golden Hour",
    },
    {
      src: `${CDN}/11ec365a-1880-410b-a876-e0ece9423383/DJI_0923.jpg`,
      alt: "Traditional estate glowing as the sun sets behind the hills",
      phase: "Sunset",
    },
    {
      src: `${CDN}/a574431b-f275-41bd-b513-f316a6e34595/DJI_0648.jpg`,
      alt: "Mediterranean estate and lit pool deep into dusk",
      phase: "Dusk",
    },
    {
      src: `${CDN}/0a3ce05d-38aa-4682-b200-ee84923c5fcd/DJI_0927.jpg`,
      alt: "Lone coastal residence beside still water at blue hour",
      phase: "Blue Hour",
    },
  ],

  // — Portraits —
  portraits: [
    {
      src: `${CDN}/64261224-0bb5-4eb2-810f-a521fa417626/BrianLudlow_15696.jpg`,
      alt: "Brian Ludlow, CEO of Creative Art Partners, seated before a large abstract canvas",
      caption: "The Artist",
      meta: "Brian Ludlow · CEO, Creative Art Partners",
    },
    {
      src: `${CDN}/764b4390-752e-439d-ade2-963738bacac8/2H1A6390_crop_web.jpg`,
      alt: "Albert Einstein lookalike in a studio portrait, wild white hair and dark suit",
      caption: "The Genius",
      meta: "Albert Einstein · Reimagined",
    },
    {
      src: `${CDN}/65399a1a-de46-4bb4-aa71-4c7ff006ac81/MT.jpg`,
      alt: "Michael Mortenson and Craig Taggart, founders and lead trial lawyers of Mortenson Taggart, in their office",
      caption: "The Founders",
      meta: "Michael Mortenson & Craig Taggart · Mortenson Taggart",
      duo: true,
    },
  ],
  portraitWide: {
    src: `${CDN}/82a2cf88-476a-467c-82bf-352f9c0f40b6/2H1A0441web.jpg`,
    alt: "John Legend at a grand piano in deep blue studio light",
    caption: "The Performer",
    meta: "John Legend · Studio Session",
  },

  // — Commercial —
  commercial: [
    {
      src: `${CDN}/0df85c67-3e37-4fa1-b451-50888ef4239a/TrainedEye_Impresions_18X36_Monolithic_0028_RF.jpg`,
      alt: "Bentley Mills carpet campaign — charcoal plank tile against a deep green courtyard wall",
      caption: "Bentley Mills",
      meta: "Product Campaign",
      tall: true,
    },
    {
      src: `${CDN}/78260cec-b162-4674-ab22-6072bb971691/163A8782.jpg`,
      alt: "Creative studio lounge with exposed brick, neon signage and acoustic clouds",
      caption: "Creative Studios",
      meta: "Commercial Space · Los Angeles",
    },
    {
      src: `${CDN}/1706252465202-J63KR7CASQVEJPWP1Q7Z/163A7430.jpg`,
      alt: "Recording studio control room with mixing console and brick walls",
      caption: "The Control Room",
      meta: "Commercial Space · Los Angeles",
    },
    {
      src: `${CDN}/97165f22-88bc-4c86-a873-0784ae3234ae/SeeingThings_Smolder_18X36_Brick_0038_RF.jpg`,
      alt: "Bentley Mills campaign — graphite carpet plank with a violet leather lounge chair",
      caption: "Bentley Mills",
      meta: "Product Campaign",
      tall: true,
    },
  ],

  // — About —
  about: {
    src: `${CDN}/abdecc14-4a4b-42c2-824f-df60767072e0/JoeBryantonDesk.jpg`,
    alt: "Joe Bryant standing at a desk inside a stone and glass interior",
  },
};

export const publications = [
  "Architectural Digest",
  "Wall Street Journal",
  "Dwell",
  "LA Times",
  "InStyle",
  "People",
  "Daily Mail",
  "Paper City",
  "NBC",
];

export const clients = [
  "Disney",
  "Sotheby’s International",
  "Dolce & Gabbana",
  "Amangiri",
  "Booking.com",
  "Aaron Kirman Group",
  "Bentley Mills",
  "Panda Express",
  "Atom Factory",
  "Tart Optical",
  "Renovis",
  "Mare Essentials",
];
