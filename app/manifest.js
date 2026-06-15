// Makes Access installable to the home screen — it opens full-screen,
// like an app, starting at the client dashboard.

const CDN = "https://images.squarespace-cdn.com/content/v1/644a110ae9f62a105d8f1892";

export default function manifest() {
  return {
    name: "Joe Bryant | Access",
    short_name: "JB Access",
    description: "Planning, production, and delivery — elevated.",
    start_url: "/access",
    display: "standalone",
    background_color: "#0b0b0c",
    theme_color: "#0b0b0c",
    icons: [
      {
        src: `${CDN}/dd3db4c5-a60d-45bf-81fe-d8b6e8965fc5/JoeBryant_Logo_1x1_gray.png?format=300w`,
        sizes: "300x300",
        type: "image/png",
      },
    ],
  };
}
