// SmugMug API v2 — read-only gallery client.
//
// Joe owns every gallery, so the portal authenticates ONCE as Joe (a set
// of OAuth 1.0a credentials in env vars) and fetches any of his albums on
// a client's behalf. The client never signs in to SmugMug — their photos
// render natively inside /access, exactly like Pixieset, but in Joe's
// own design and on his own domain.
//
// Required env (see .env.local.example and the README):
//   SMUGMUG_API_KEY         (consumer key)
//   SMUGMUG_API_SECRET      (consumer secret)
//   SMUGMUG_ACCESS_TOKEN    (Joe's access token)
//   SMUGMUG_ACCESS_SECRET   (Joe's access token secret)
//
// Everything fails soft: any error returns a status the UI can explain,
// never a thrown crash.

import crypto from "crypto";

const HOST = "https://api.smugmug.com";

const CK = process.env.SMUGMUG_API_KEY;
const CS = process.env.SMUGMUG_API_SECRET;
const TK = process.env.SMUGMUG_ACCESS_TOKEN;
const TS = process.env.SMUGMUG_ACCESS_SECRET;

export function isConfigured() {
  return Boolean(CK && CS && TK && TS);
}

// — OAuth 1.0a (HMAC-SHA1) request signing, GET only —

function rfc3986(str) {
  return encodeURIComponent(str).replace(
    /[!*'()]/g,
    (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase()
  );
}

function signedHeader(method, url, queryParams = {}) {
  const oauth = {
    oauth_consumer_key: CK,
    oauth_token: TK,
    oauth_nonce: crypto.randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_version: "1.0",
  };

  // Base string includes BOTH oauth params and query params, sorted.
  const all = { ...oauth, ...queryParams };
  const paramString = Object.keys(all)
    .sort()
    .map((k) => `${rfc3986(k)}=${rfc3986(all[k])}`)
    .join("&");

  const base = [method.toUpperCase(), rfc3986(url), rfc3986(paramString)].join("&");
  const signingKey = `${rfc3986(CS)}&${rfc3986(TS)}`;
  const signature = crypto.createHmac("sha1", signingKey).update(base).digest("base64");

  const headerParams = { ...oauth, oauth_signature: signature };
  return (
    "OAuth " +
    Object.keys(headerParams)
      .map((k) => `${rfc3986(k)}="${rfc3986(headerParams[k])}"`)
      .join(", ")
  );
}

async function smugGet(pathOrUrl, params = {}) {
  const url = pathOrUrl.startsWith("http") ? pathOrUrl : HOST + pathOrUrl;
  const auth = signedHeader("GET", url, params);
  const qs = Object.keys(params).length
    ? "?" + Object.keys(params).map((k) => `${rfc3986(k)}=${rfc3986(params[k])}`).join("&")
    : "";
  const res = await fetch(url + qs, {
    headers: { Accept: "application/json", Authorization: auth },
    // SmugMug content is stable for a delivered gallery; cache briefly.
    next: { revalidate: 120 },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`SmugMug ${res.status}: ${text.slice(0, 180)}`);
  }
  return res.json();
}

// — Resolve a pasted gallery link to an album that exposes its images —

async function resolveAlbumImagesUri(galleryUrl) {
  // Admin may paste a full share URL, an album API path, or a raw key.
  let obj;
  if (/^album\//i.test(galleryUrl) || /\/api\/v2\/album\//i.test(galleryUrl)) {
    const path = galleryUrl.startsWith("http")
      ? galleryUrl
      : "/api/v2/" + galleryUrl.replace(/^\/?(api\/v2\/)?/, "");
    obj = (await smugGet(path)).Response?.Album;
  } else {
    const lookup = await smugGet("/api/v2!weburilookup", { WebUri: galleryUrl });
    const r = lookup.Response || {};
    // weburilookup returns Album, or a Node that points at an Album.
    obj = r.Album;
    if (!obj && r.Node?.Uris?.Album?.Uri) {
      obj = (await smugGet(r.Node.Uris.Album.Uri)).Response?.Album;
    }
  }
  const imagesUri = obj?.Uris?.AlbumImages?.Uri;
  if (!imagesUri) throw new Error("Could not locate album images for that link.");
  return { imagesUri, album: obj };
}

// — Normalize one SmugMug AlbumImage into what the UI needs —

function pickSizes(image, sizeDetails) {
  const d = sizeDetails || {};
  const grid =
    d.ImageSizeMedium?.Url ||
    d.ImageSizeLarge?.Url ||
    image.ThumbnailUrl ||
    null;
  const large =
    d.ImageSizeX2Large?.Url ||
    d.ImageSizeXLarge?.Url ||
    d.ImageSizeLarge?.Url ||
    grid;
  const download =
    image.ArchivedUri || d.ImageSizeOriginal?.Url || large || grid;
  return { grid, large, download };
}

export async function getGallery(galleryUrl, { start = 1, count = 48 } = {}) {
  if (!isConfigured()) return { status: "unconfigured" };
  if (!galleryUrl) return { status: "pending" };

  try {
    const { imagesUri, album } = await resolveAlbumImagesUri(galleryUrl);
    const data = await smugGet(imagesUri, {
      start: String(start),
      count: String(count),
      _expand: "ImageSizeDetails",
    });

    const resp = data.Response || {};
    const items = resp.AlbumImage || [];
    const expansions = data.Expansions || {};

    const images = items
      .map((img) => {
        const sizeUri = img.Uris?.ImageSizeDetails?.Uri;
        const details = sizeUri
          ? expansions[sizeUri]?.ImageSizeDetails || expansions[sizeUri]
          : null;
        const { grid, large, download } = pickSizes(img, details);
        if (!grid) return null;
        return {
          id: img.ImageKey || img.Uri,
          title: img.Title || img.FileName || "",
          // Original capture filename — preserved on download so the client
          // can reference an exact image number back to Joe.
          filename: img.FileName || `${img.ImageKey || "photo"}.jpg`,
          caption: img.Caption || "",
          isVideo: !!img.IsVideo,
          thumb: grid,
          large,
          download,
        };
      })
      .filter(Boolean);

    const total = resp.Pages?.Total ?? images.length;
    const nextStart =
      resp.Pages?.NextPage && images.length ? start + count : null;

    return {
      status: "ready",
      images,
      total,
      nextStart,
      title: album?.Name || album?.Title || "",
      webUri: album?.WebUri || galleryUrl,
    };
  } catch (err) {
    console.error("[smugmug] gallery fetch failed:", err.message);
    return { status: "error", message: err.message, webUri: galleryUrl };
  }
}

// Demo gallery — shown only before SmugMug credentials are added, so the
// native gallery experience is visible immediately. Clearly flagged in the
// UI as a preview.
const CDN = "https://images.squarespace-cdn.com/content/v1/644a110ae9f62a105d8f1892";
const DEMO = [
  ["a574431b-f275-41bd-b513-f316a6e34595/DJI_0648.jpg", "Twilight, west elevation"],
  ["946cb6c8-579c-4f75-85d5-e5faa3d686d1/DJI_0968.jpg", "Pool deck at golden hour"],
  ["11ec365a-1880-410b-a876-e0ece9423383/DJI_0923.jpg", "Sunset, full property"],
  ["cb4fb9bb-a363-4d7b-83de-44151d0d6319/_63A1315.jpg", "Primary suite"],
  ["7458f685-5245-4b51-8437-b19cfa90577c/163A5312.jpg", "Sculptural stair"],
  ["d6390491-3cd7-4a7a-830d-5648eb25a76b/163A5632-2.jpg", "Living room"],
  ["319c9d94-f8eb-4fc8-b8af-416b00c8ae40/163A4780.jpg", "Kitchen island"],
  ["63061acf-69f5-4e2f-b2e1-885364dc4b63/163A6048.jpg", "Plaster passage"],
  ["9e05065e-26ee-45fc-9cca-89eac0973269/163A4832.jpg", "Travertine shower"],
  ["0a3ce05d-38aa-4682-b200-ee84923c5fcd/DJI_0927.jpg", "Blue hour, coastline"],
];

export function demoGallery(seed = 0) {
  // Rotate the order a little per album so multiple demo sets look distinct.
  const rot = ((seed % DEMO.length) + DEMO.length) % DEMO.length;
  const list = [...DEMO.slice(rot), ...DEMO.slice(0, rot)];
  return {
    status: "demo",
    title: "Preview gallery",
    images: list.map(([p, title], i) => ({
      id: `demo-${seed}-${i}`,
      title,
      filename: p.split("/").pop(),
      caption: "",
      isVideo: false,
      thumb: `${CDN}/${p}?format=750w`,
      large: `${CDN}/${p}?format=2500w`,
      download: `${CDN}/${p}?format=2500w`,
    })),
    total: DEMO.length,
    nextStart: null,
  };
}

// Resolve a project's albums into display-ready sets. Accepts the legacy
// single `smugmugUrl` plus an optional `galleries: [{name, url}]` array.
export async function getGallerySets({ smugmugUrl, galleries } = {}) {
  const albums =
    Array.isArray(galleries) && galleries.length
      ? galleries.filter((a) => a && a.url)
      : smugmugUrl
        ? [{ name: "Gallery", url: smugmugUrl }]
        : [];
  if (!albums.length) return [];

  const sets = [];
  for (let i = 0; i < albums.length; i++) {
    const a = albums[i];
    let g = await getGallery(a.url);
    if (g.status !== "ready" || !g.images?.length) g = demoGallery(i);
    sets.push({ name: a.name || `Set ${i + 1}`, images: g.images, webUri: g.webUri || a.url });
  }
  return sets;
}
