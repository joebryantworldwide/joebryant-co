// The old portal grew up — everything now lives at /access
// (Joe Bryant | Access). Old links and bookmarks land safely here.

import { redirect } from "next/navigation";

export default function PortalPage() {
  redirect("/access");
}
