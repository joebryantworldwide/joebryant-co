// Sanity data layer. When the studio is connected (env vars set), the
// site pulls every image slot from the CMS — including each photo's
// hotspot, which becomes its on-screen focal point. When it isn't,
// getContent() returns null and every section falls back to the
// built-in manifest in lib/photos.js. The site can never render empty.

import { createClient } from "next-sanity";
import imageUrlBuilder from "@sanity/image-url";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";

const client = projectId
  ? createClient({ projectId, dataset, apiVersion: "2024-10-01", useCdn: true })
  : null;

const builder = client ? imageUrlBuilder(client) : null;

function pic(image, extra = {}) {
  if (!image?.asset) return null;
  const hotspot = image.hotspot
    ? `${(image.hotspot.x * 100).toFixed(1)}% ${(image.hotspot.y * 100).toFixed(1)}%`
    : undefined;
  return {
    src: builder.image(image).url(),
    alt: image.alt || extra.alt || "",
    position: hotspot,
    ...extra,
  };
}

function clean(obj) {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v != null));
}

export async function getContent() {
  if (!client) return null;
  try {
    const doc = await client.fetch(
      `*[_id == "sitePhotos"][0]`,
      {},
      { next: { revalidate: 30 } }
    );
    if (!doc) return null;

    return {
      hero: pic(doc.hero),
      projects: doc.projects
        ?.map((p) => pic(p.image, { title: p.title, meta: p.meta }))
        .filter(Boolean),
      interiors: clean({
        bedroom: pic(doc.interiorFull1),
        courtyard: pic(doc.interiorWideA),
        living: pic(doc.interiorTallA),
        kitchen: pic(doc.interiorWideB),
        shower: pic(doc.interiorTallB),
        corridor: pic(doc.interiorFull2),
      }),
      interiorCaptions: clean({
        first: doc.interiorCaption1,
        second: doc.interiorCaption2,
      }),
      estates: [
        pic(doc.estateGolden),
        pic(doc.estateSunset),
        pic(doc.estateDusk),
        pic(doc.estateBlue),
      ],
      portraits: doc.portraits?.map((p) =>
        pic(p.image, { caption: p.title, meta: p.meta, duo: p.duo })
      ),
      portraitWide: doc.portraitWide
        ? pic(doc.portraitWide.image, {
            caption: doc.portraitWide.title,
            meta: doc.portraitWide.meta,
          })
        : null,
      commercial: doc.commercial?.map((c) =>
        pic(c.image, { caption: c.title, meta: c.meta })
      ),
      about: pic(doc.aboutPhoto),
    };
  } catch (err) {
    console.error("[cms] falling back to built-in photography:", err.message);
    return null;
  }
}
