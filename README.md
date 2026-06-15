# JOE BRYANT — Cinematic Portfolio

A scroll-driven, cinematic reimagining of joebryant.co. Less website, more
interactive architectural film. All photography is served directly from the
existing Squarespace CDN library — nothing is re-hosted or altered.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build (fully static)
```

## The experience

1. **Opening sequence** — begins inside an extreme detail of a twilight
   courtyard (stone, water, the olive tree). Scroll pulls the camera back
   until the full residence is revealed, then the name arrives.
2. **Architecture as Art** — manifesto, line-masked type reveal.
3. **Signature Work** — a pinned horizontal film strip of five residences;
   each photograph counter-pans inside its frame like a lateral dolly move.
4. **Interiors** — full-bleed frames with vertical parallax and a travelling
   light sweep that crosses each room as it crosses the viewport.
5. **Luxury Estates** — "Scroll, and the sun goes down." A pinned aerial
   sequence scrubbed through golden hour → sunset → dusk → blue hour.
6. **Portraits** — the visionaries behind the walls: John Legend, Brian
   Ludlow (CEO, Creative Art Partners), Michael Mortenson & Craig Taggart
   (Mortenson Taggart), and the Einstein-reimagined editorial study.
7. **Commercial** — Bentley Mills campaigns and commercial spaces in a
   staggered editorial grid.
8. **Published / Clients** — Architectural Digest, WSJ, Dwell… plus a
   client marquee (Disney, Sotheby's, Dolce & Gabbana, Amangiri…).
8. **About** — 21 years, sticky copy beside parallax imagery.
9. **Contact** — joe@joebryant.co, full-frame closer.

## Stack

- **Next.js 15** (App Router, static output)
- **SEO + AI search (GEO)** — canonical + OG/Twitter cards, JSON-LD
  structured data (Person, LocalBusiness/ProfessionalService, ImageGallery
  with named subjects), image sitemap (15 key photographs), `robots.txt`
  explicitly welcoming 17 AI/search crawlers (GPTBot, ClaudeBot,
  PerplexityBot, Google-Extended…), `/llms.txt` for AI answer engines,
  CDN preconnect, descriptive alt text throughout
- **GSAP + ScrollTrigger** — every scroll-scrubbed camera move, pin and reveal
- **Lenis** — inertial smooth scroll (the "film" feel)
- **No UI framework** — hand-built design system in `app/globals.css`
- Type: Instrument Serif (display) + Inter Tight (labels), via `next/font`

## Motion principles

- Stills never sit still: scroll-scrubbed push-ins/pull-backs, parallax
  panning, light sweeps, and a 36-second idle drift on resting imagery.
- A fixed film-grain layer unifies every frame.
- All motion is transform/opacity only (GPU-composited), images lazy-load
  with responsive `srcset`, and everything respects
  `prefers-reduced-motion`.

## Your backend (swap any image yourself)

The site has a built-in admin studio at **`/studio`** (Sanity). Every image
slot on the site is editable there — upload a photo, drag the **hotspot
circle** to choose where the image focuses (this drives the crop AND the
hero zoom center), edit captions, hit **Publish**. The site updates within
a minute. You cannot break the layout from the studio — it only exposes
the slots the design defines, and any empty slot silently falls back to
the built-in photography.

### One-time setup (≈5 minutes)

1. Create the (free) backend project — run this in the site folder and log
   in with Google when the browser opens:
   ```bash
   npx sanity@latest init --bare
   ```
   It prints a **Project ID** (e.g. `ab12cd34`).
2. Copy `.env.local.example` to `.env.local` and paste the ID:
   ```
   NEXT_PUBLIC_SANITY_PROJECT_ID=ab12cd34
   NEXT_PUBLIC_SANITY_DATASET=production
   ```
3. Allow the site to talk to it:
   ```bash
   npx sanity cors add http://localhost:3000 --credentials
   ```

Then `npm run dev` and open **http://localhost:3000/studio**. Keep the
site open in a second tab — Publish in the studio, refresh the site tab,
see your change. (After deploying, run the CORS command again with your
live domain.)

## Client backend — Joe Bryant | Access (`/access`)

The private client system. Clients sign in with their **email + access
code** and get a branded, mobile-first workspace per project: shoot
status, an interactive **prep guide** (shareable by public link), the
**Gallery** tab (native SmugMug — see below), **invoices** with a
**Pay securely** button, a **Message Joe** thread, and **team invites**
with per-person access levels. You get a separate **admin command
center**. The old `/portal` URL now redirects here.

**Try it now** (`npm run dev`, then open `/access`):

| Role   | Email                  | Access code |
| ------ | ---------------------- | ----------- |
| Client | `demo@joebryant.co`    | `PREVIEW`   |
| Admin  | `joe@joebryant.co`     | `JOEADMIN`  |

Change the admin code by setting `ACCESS_ADMIN_CODE` in `.env.local`.

**Admin command center (`/access/admin`)** — your operation at a glance:

- **Needs your attention** queue: manual payments awaiting confirmation,
  new booking requests, unread client messages.
- **Confirm receipt** on a manual payment flips the retainer to Paid and
  moves the project to *Confirmed* — the client is updated instantly.
- **Approve → project** turns a booking request into a live project and
  mints the client's login in one click.
- Open any project to set status, paste the **SmugMug** gallery link,
  add **Square** invoice links, mark invoices paid, and reply to messages.
- Open any client to edit their profile and reset their access code
  ("changing the code = changing their password").

**Booking & estimates** — anyone can *Request Availability / Start
Planning / Book Project* at `/access/book`. The form shows a live estimate
($1,000 base + $100 per 1,000 sq ft, + drone/twilight/styling) — clearly
labelled *estimate only* until you approve — and drops a request into your
queue. Date fields take a calendar **or** loose typing (`6/25/26` works).

**Automatic status** — a project's status is never set by hand. It's
derived from real signals (`lib/access/status.js`): a confirmed payment →
*Confirmed*, an unverified manual payment → *Awaiting Payment
Verification*, shoot date passed → *Editing*, SmugMug link added →
*Gallery Delivered*, delivered + all invoices paid → *Closed*. The admin
project page shows this as a read-only timeline with what triggers each
step.

**Invoices** — click any invoice to open a full, editable invoice
document: billed-to, project, line items (add/remove), live total, due
date. **Mark paid** toggles status. Once an invoice is **paid**, an
**Add a charge** button creates a linked follow-up invoice — *Part 2* in
the same thread — so the original stays settled while the new charge bills
separately. Invoices carry sequential numbers.

**Square payments (live)** — set `SQUARE_*` in `.env.local` (sandbox by
default). On a paid-or-open invoice, **Generate Square payment link**
creates a real hosted checkout via Square's API and stores the order id;
the client sees **Pay securely**. Payment status reconciles automatically:
every time a project page loads (and via **Check for payment**), open
invoices with a Square order are checked against Square and flipped to
*Paid* when settled (`lib/access/squareSync.js`). In production, the
webhook at `app/api/square/webhook/route.js` makes this instant — point a
Square webhook there (events `payment.updated`, `invoice.payment_made`)
and set `SQUARE_WEBHOOK_SIGNATURE_KEY`. (Square requires hosted checkout,
so to test the full loop: open a generated sandbox link, pay with test
card `4111 1111 1111 1111`, reload the project — it marks itself paid.)

**Pay in-app (no leaving the page)** — in the client Billing tab, every
open invoice has a **Pay now** button that drops in Square's Web Payments
card form inline (`components/access/SquarePayForm.jsx`). The card is
tokenized in Square-hosted iframes (PCI-safe) and charged server-side via
`/api/access/pay` — the client never leaves the portal. Needs the
publishable `NEXT_PUBLIC_SQUARE_APP_ID` + `NEXT_PUBLIC_SQUARE_LOCATION_ID`
(the secret access token stays server-only). Sandbox test card:
`4111 1111 1111 1111`, any future expiry, any CVV. On success the client
sees a **"Payment received — thank you"** confirmation and **Joe is
notified instantly** (admin queue + email if `RESEND_API_KEY` is set). The
admin invoice's **Copy payment link** button copies the hosted link to the
clipboard for texting/emailing.

**Apple Pay & Google Pay** are layered onto the same in-app form as
progressive enhancement — they appear only on supported devices/browsers
and fall back silently to the card form everywhere else. Google Pay works
once live; **Apple Pay needs a one-time domain verification**: in the
Square dashboard, register your production domain, download the
association file, and place it at
`public/.well-known/apple-developer-merchantid-domain-association`. (Both
require HTTPS, so they won't render on localhost.)

Clients can still pay a manual method (Cash, Wire, Zelle, Venmo, Apple
Cash, Cash App); choosing one sets *Awaiting Payment Verification* and
notifies you to **Confirm receipt**.

**Notifications** — every client message and booking request always lands
in your admin queue. To also get them by **email**, set `RESEND_API_KEY`
(from resend.com) and `NOTIFY_EMAIL` in `.env.local`. Without a key,
notifications log to the server console — nothing is silently dropped.
SMS/push are later-phase.

**Where the data lives** — Phase 1 stores everything in a single JSON file
at `data/access.json` (created from a demo seed on first run; delete it to
reset). The whole store is isolated behind `lib/access/store.js`, so moving
to Sanity or a database later is a contained change. ⚠️ Because it's one
file, run on a **single instance**; before deploying to a multi-instance
host (e.g. Vercel serverless), swap the store internals for a real
database, or client data can be lost between instances.

## Client galleries (SmugMug)

The client **Gallery** tab renders each shoot's photographs **natively
inside `/access`** — Joe's own grid + lightbox + download — by pulling
them through the SmugMug API. (We use SmugMug rather than Pixieset because
Pixieset sends `X-Frame-Options` and has no public API, so it can't be
embedded or read; SmugMug's API is open to every subscriber.) Clients
never see SmugMug — they browse and download right in the portal.

**How it flows:** in the admin project editor, paste the gallery's
**share link** into "SmugMug gallery link." The portal resolves it via
SmugMug's `weburilookup`, fetches the album's images server-side using
Joe's credentials, and displays them. Access is enforced first — only
viewers with `full` or `gallery` access to that project can load it.

**Setup (one time, ~10 min):**

1. At **smugmug.com** → account settings → *Authorize/Apply for an API
   Key* → get a **consumer key + secret**.
2. Authorize your own account once to mint an **access token + secret**
   (OAuth 1.0a; any SmugMug OAuth helper or their docs walk through it).
3. Put all four in `.env.local` (`SMUGMUG_API_KEY`, `SMUGMUG_API_SECRET`,
   `SMUGMUG_ACCESS_TOKEN`, `SMUGMUG_ACCESS_SECRET`).

Until those are set, the Gallery tab shows a **preview grid** (real UI,
placeholder photos) so the experience is visible — admins see a "Preview
mode" flag; the moment credentials are added it switches to live photos
with zero code changes. Code: `lib/access/smugmug.js`,
`app/api/access/gallery/route.js`, and the `Gallery` block in
`components/access/ProjectView.jsx`.

**The app:** the site ships as an installable PWA (manifest + standalone
mode, opens straight to `/access`). Clients can "Add to Home Screen"
today on iPhone and Android. For true App Store / Play Store listings,
wrap this site with Capacitor — requires an Apple Developer account
($99/yr) and Google Play account ($25 one-time).

## Where things live

- `lib/photos.js` — the curated image manifest (swap/add imagery here)
- `components/` — one component per cinematic section
- `app/globals.css` — the whole design system
- `lib/access/` — the Joe Bryant | Access backend (store, auth, pricing,
  prep, SmugMug, notifications); `data/access.json` is its store
- `components/access/` + `app/access/` — the client & admin UI
- `app/api/access/` — login, messages, booking, invites, payments, gallery
