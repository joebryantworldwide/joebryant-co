const CDN = "https://images.squarespace-cdn.com/content/v1/644a110ae9f62a105d8f1892";

// Image sitemap entries put the photography itself into Google Images /
// Bing visual search, not just the page.
const KEY_IMAGES = [
  `${CDN}/87d2ae8a-5017-4044-949c-87b45cbe066e/2H1A9754-Edit.jpg?format=2500w`,
  `${CDN}/f3e98f90-82db-4f01-894c-1e8b5e4111fb/2H1A0224.jpg?format=2500w`,
  `${CDN}/ae5faca5-2533-46f1-a78c-cf49635e3835/PaulMcClean18392.jpg?format=2500w`,
  `${CDN}/3275e544-6cbc-4943-a98b-1e3101169c89/_63A1166.jpg?format=2500w`,
  `${CDN}/ff111ab7-bad9-4f7e-84e0-703982258722/_63A1097.jpg?format=2500w`,
  `${CDN}/cb4fb9bb-a363-4d7b-83de-44151d0d6319/_63A1315.jpg?format=2500w`,
  `${CDN}/7458f685-5245-4b51-8437-b19cfa90577c/163A5312.jpg?format=2500w`,
  `${CDN}/946cb6c8-579c-4f75-85d5-e5faa3d686d1/DJI_0968.jpg?format=2500w`,
  `${CDN}/11ec365a-1880-410b-a876-e0ece9423383/DJI_0923.jpg?format=2500w`,
  `${CDN}/82a2cf88-476a-467c-82bf-352f9c0f40b6/2H1A0441web.jpg?format=2500w`,
  `${CDN}/64261224-0bb5-4eb2-810f-a521fa417626/BrianLudlow_15696.jpg?format=2500w`,
  `${CDN}/65399a1a-de46-4bb4-aa71-4c7ff006ac81/MT.jpg?format=2500w`,
  `${CDN}/0df85c67-3e37-4fa1-b451-50888ef4239a/TrainedEye_Impresions_18X36_Monolithic_0028_RF.jpg?format=2500w`,
  `${CDN}/97165f22-88bc-4c86-a873-0784ae3234ae/SeeingThings_Smolder_18X36_Brick_0038_RF.jpg?format=2500w`,
  `${CDN}/abdecc14-4a4b-42c2-824f-df60767072e0/JoeBryantonDesk.jpg?format=2500w`,
];

import { getPosts } from "../lib/journal";

export default function sitemap() {
  const posts = getPosts().map((p) => ({
    url: `https://joebryant.co/journal/${p.slug}`,
    lastModified: new Date(p.date),
    changeFrequency: "yearly",
    priority: 0.7,
    images: p.image ? [p.image] : undefined,
  }));

  return [
    {
      url: "https://joebryant.co",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
      images: KEY_IMAGES,
    },
    {
      url: "https://joebryant.co/journal",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...posts,
  ];
}
