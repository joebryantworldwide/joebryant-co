// A sample portal account so the experience can be previewed before any
// real clients exist in the Studio. Log in at /portal with:
//   email: demo@joebryant.co   ·   access code: PREVIEW
const CDN = "https://images.squarespace-cdn.com/content/v1/644a110ae9f62a105d8f1892";

export const demoClient = {
  email: "demo@joebryant.co",
  accessCode: "PREVIEW",
  name: "Alexandra",
  company: "Demo Account",
  welcomeNote: "The twilight set from Thursday is everything we hoped for. Take your time with the favorites.",
  shoots: [
    {
      title: "Hillside Estate — Twilight",
      date: "2026-05-28",
      cover: `${CDN}/a574431b-f275-41bd-b513-f316a6e34595/DJI_0648.jpg`,
      pixiesetUrl: "https://client.joebryant.co",
      downloadPin: "4821",
    },
    {
      title: "Modern Farmhouse — Interiors",
      date: "2026-04-14",
      cover: `${CDN}/cb4fb9bb-a363-4d7b-83de-44151d0d6319/_63A1315.jpg`,
      pixiesetUrl: "https://client.joebryant.co",
    },
    {
      title: "Founders' Portraits",
      date: "2026-03-02",
      cover: `${CDN}/65399a1a-de46-4bb4-aa71-4c7ff006ac81/MT.jpg`,
      pixiesetUrl: "https://client.joebryant.co",
    },
  ],
  invoices: [
    {
      title: "Hillside Estate — full shoot & licensing",
      amount: 4800,
      status: "Sent",
      squareLink: "https://squareup.com",
      dueDate: "2026-06-20",
    },
    {
      title: "Modern Farmhouse — interiors",
      amount: 2600,
      status: "Paid",
      paidDate: "2026-04-21",
    },
  ],
  licenseTitle: "Image Licensing Agreement",
  licenseText:
    "Upon receipt of payment in full, Joe Bryant grants the client a non-exclusive, perpetual license to use the delivered photographs for marketing, listing, portfolio and editorial purposes. Photographs may not be resold, sublicensed or altered beyond standard cropping without written consent. Copyright remains with Joe Bryant. Third parties (architects, designers, stagers, publications) require their own license — ask, it's quick.",
  licenseFile: null,
};
