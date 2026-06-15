"use client";

import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { schemaTypes } from "./sanity/schema";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "missing";
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";

export default defineConfig({
  name: "joebryant",
  title: "Joe Bryant — Site",
  projectId,
  dataset,
  basePath: "/studio",
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title("Your Website")
          .items([
            S.listItem()
              .title("Site Photography")
              .id("sitePhotos")
              .child(
                S.document().schemaType("sitePhotos").documentId("sitePhotos")
              ),
            S.divider(),
            S.documentTypeListItem("client").title("Clients (portal logins)"),
          ]),
    }),
  ],
  schema: { types: schemaTypes },
});
