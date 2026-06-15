// First-run data so Joe can preview the whole Access experience before
// any real clients exist. Sign in at /access with:
//   client · demo@joebryant.co  / code PREVIEW
//   admin  · joe@joebryant.co   / code JOEADMIN  (override with ACCESS_ADMIN_CODE)
import { buildPrepGuide } from "./prep";

const CDN = "https://images.squarespace-cdn.com/content/v1/644a110ae9f62a105d8f1892";

export function seedData() {
  const now = new Date().toISOString();
  return {
    users: [
      {
        id: "u-joe",
        name: "Joe Bryant",
        email: "joe@joebryant.co",
        phone: "310 890 3687",
        company: "Joe Bryant",
        role: "Admin / Joe",
        accessCode: process.env.ACCESS_ADMIN_CODE || "JOEADMIN",
        isAdmin: true,
        createdAt: now,
      },
      {
        id: "u-demo",
        name: "Alexandra Reyes",
        email: "demo@joebryant.co",
        phone: "424 555 0188",
        company: "Meridian Estates",
        role: "Client / Owner",
        accessCode: "PREVIEW",
        isAdmin: false,
        birthMonth: 6,
        birthDay: 18,
        birthYear: 1986,
        createdAt: now,
      },
    ],
    campaigns: [],
    marketingSettings: {
      birthdayAuto: true,
      birthdayMessage:
        "Wishing you a wonderful birthday from Joe Bryant. May your year ahead be beautifully lit. ✨",
    },
    projects: [
      {
        id: "p-hillside",
        propertyName: "Hillside Estate",
        address: "1480 Carla Ridge, Beverly Hills, CA 90210",
        shootDate: "2026-06-25",
        status: "Awaiting Payment Verification",
        clientId: "u-demo",
        team: [
          {
            name: "Marcus Lee",
            email: "marcus@meridianestates.com",
            phone: "310 555 0142",
            role: "Marketing Director",
            access: "gallery",
          },
        ],
        services: { drone: true, twilight: true, styling: false, sqft: 8200 },
        prepGuide: buildPrepGuide({ twilight: true, pool: true }),
        smugmugUrl: "",
        coverImage: `${CDN}/a574431b-f275-41bd-b513-f316a6e34595/DJI_0648.jpg`,
        invoices: [
          {
            id: "inv-1",
            title: "Retainer — 50% to confirm",
            amount: 1150,
            status: "Awaiting Verification",
            squareUrl: "https://squareup.com",
            dueDate: "2026-06-15",
            paidDate: null,
          },
          {
            id: "inv-2",
            title: "Balance — due end of shoot day",
            amount: 1150,
            status: "Open",
            squareUrl: "https://squareup.com",
            dueDate: "2026-06-25",
            paidDate: null,
          },
        ],
        payment: { manualMethod: "Zelle", awaitingVerification: true },
        notes: "Twilight set is the priority — west-facing pool deck.",
        shareToken: "hillside-prep-demo",
        createdAt: now,
      },
      {
        id: "p-farmhouse",
        propertyName: "Modern Farmhouse",
        address: "2204 Mandeville Canyon Rd, Los Angeles, CA 90049",
        shootDate: "2026-04-14",
        status: "Gallery Delivered",
        clientId: "u-demo",
        team: [],
        services: { drone: false, twilight: false, styling: true, sqft: 5400 },
        prepGuide: buildPrepGuide({ twilight: false, pool: false }).map((s) => ({
          ...s,
          items: s.items.map((i) => ({ ...i, done: true })),
        })),
        smugmugUrl: "https://joebryant.smugmug.com",
        galleries: [
          { name: "Interiors", url: "https://joebryant.smugmug.com/interiors" },
          { name: "Exteriors", url: "https://joebryant.smugmug.com/exteriors" },
          { name: "Special Edits", url: "https://joebryant.smugmug.com/special" },
        ],
        coverImage: `${CDN}/cb4fb9bb-a363-4d7b-83de-44151d0d6319/_63A1315.jpg`,
        invoices: [
          {
            id: "inv-3",
            title: "Modern Farmhouse — full shoot",
            amount: 2390,
            status: "Paid",
            squareUrl: "https://squareup.com",
            dueDate: "2026-04-14",
            paidDate: "2026-04-14",
          },
        ],
        payment: { manualMethod: null, awaitingVerification: false },
        notes: "",
        shareToken: "farmhouse-prep-demo",
        createdAt: now,
      },
    ],
    messages: [
      {
        id: "m-1",
        projectId: "p-hillside",
        fromId: "u-demo",
        fromName: "Alexandra Reyes",
        body: "Sent the retainer via Zelle this morning — let me know it landed.",
        createdAt: now,
        readByAdmin: false,
        readByClient: true,
      },
      {
        id: "m-2",
        projectId: "p-farmhouse",
        fromId: "u-joe",
        fromName: "Joe Bryant",
        body: "Gallery is live — the kitchen series came out beautifully. Download PIN is in your gallery card.",
        createdAt: now,
        readByAdmin: true,
        readByClient: false,
      },
    ],
    bookings: [
      {
        id: "b-1",
        name: "Daniel Okafor",
        email: "daniel@pacificline.dev",
        phone: "323 555 0117",
        company: "Pacific Line Development",
        address: "744 Stradella Rd, Bel Air, CA 90077",
        sqft: 11200,
        desiredDate: "2026-07-10",
        services: { drone: true, twilight: true, styling: true },
        notes: "New construction, furnished last week. Want it shot before the broker open.",
        estimate: { low: 2900, high: 3200 },
        status: "New",
        createdAt: now,
      },
    ],
  };
}
