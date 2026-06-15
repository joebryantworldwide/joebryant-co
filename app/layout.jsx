import { Instrument_Serif, Inter_Tight } from "next/font/google";
import "./globals.css";

const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

const sans = Inter_Tight({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-sans",
  display: "swap",
});

const SITE = "https://joebryant.co";
const CDN = "https://images.squarespace-cdn.com/content/v1/644a110ae9f62a105d8f1892";
const OG_IMAGE = `${CDN}/87d2ae8a-5017-4044-949c-87b45cbe066e/2H1A9754-Edit.jpg?format=1500w`;

export const metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: "Joe Bryant — Architectural Photographer | Los Angeles",
    template: "%s | Joe Bryant",
  },
  description:
    "Cinematic architectural photography by Joe Bryant. Luxury residences, interiors, estates, hospitality and portraits — John Legend, visionary architects, designers and developers. Featured in Architectural Digest, the Wall Street Journal and Dwell. Los Angeles & worldwide.",
  keywords: [
    "architectural photographer",
    "architectural photography Los Angeles",
    "luxury real estate photographer",
    "luxury real estate photography Beverly Hills",
    "interior design photographer",
    "celebrity home photography",
    "hospitality photographer",
    "estate photography",
    "architect portraits",
    "John Legend portrait",
    "commercial photographer Los Angeles",
    "brand campaign photography",
    "Joe Bryant photographer",
  ],
  authors: [{ name: "Joe Bryant", url: SITE }],
  creator: "Joe Bryant",
  publisher: "Joe Bryant",
  category: "photography",
  alternates: {
    canonical: "/",
    types: {
      "application/rss+xml": [{ url: "/feed.xml", title: "Journal — Joe Bryant" }],
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: `${CDN}/dd3db4c5-a60d-45bf-81fe-d8b6e8965fc5/JoeBryant_Logo_1x1_gray.png?format=300w`,
    apple: `${CDN}/dd3db4c5-a60d-45bf-81fe-d8b6e8965fc5/JoeBryant_Logo_1x1_gray.png?format=300w`,
  },
  openGraph: {
    title: "Joe Bryant — Architectural Photographer",
    description:
      "Architecture is not seen. It is experienced. Cinematic photography of luxury residences, interiors, estates and the visionaries behind them.",
    url: SITE,
    siteName: "Joe Bryant",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: OG_IMAGE,
        width: 1500,
        height: 1000,
        alt: "Twilight courtyard with reflecting pool and olive tree, photographed by Joe Bryant",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@joebryantco",
    creator: "@joebryantco",
    title: "Joe Bryant — Architectural Photographer | Los Angeles",
    description:
      "Cinematic architectural photography. Luxury residences, interiors, estates and portraits. Architectural Digest · WSJ · Dwell.",
    images: [OG_IMAGE],
  },
  formatDetection: {
    telephone: false,
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Joe Bryant",
    statusBarStyle: "black-translucent",
  },
};

export const viewport = {
  themeColor: "#0b0b0c",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE}/#website`,
      url: SITE,
      name: "Joe Bryant — Architectural Photographer",
      publisher: { "@id": `${SITE}/#person` },
      inLanguage: "en-US",
    },
    {
      "@type": "Person",
      "@id": `${SITE}/#person`,
      name: "Joe Bryant",
      jobTitle: "Architectural Photographer",
      description:
        "Los Angeles-based architectural and commercial photographer with 21 years of experience photographing luxury residences, interiors, celebrity homes, hospitality spaces and portraits.",
      url: SITE,
      email: "mailto:joe@joebryant.co",
      telephone: "+1-310-890-3687",
      image: `${CDN}/abdecc14-4a4b-42c2-824f-df60767072e0/JoeBryantonDesk.jpg?format=1500w`,
      address: {
        "@type": "PostalAddress",
        addressLocality: "Los Angeles",
        addressRegion: "CA",
        addressCountry: "US",
      },
      sameAs: [
        "https://www.instagram.com/joebryantco",
        "https://twitter.com/joebryantco",
        "https://www.facebook.com/joebryantco",
        "https://www.linkedin.com/in/joebryantla",
        "https://www.pinterest.com/joebryantnyla",
      ],
      knowsAbout: [
        "Architectural photography",
        "Luxury real estate photography",
        "Interior design photography",
        "Hospitality photography",
        "Editorial photography",
        "Portrait photography",
      ],
    },
    {
      "@type": ["LocalBusiness", "ProfessionalService"],
      "@id": `${SITE}/#business`,
      name: "Joe Bryant",
      url: SITE,
      image: OG_IMAGE,
      logo: `${CDN}/dd3db4c5-a60d-45bf-81fe-d8b6e8965fc5/JoeBryant_Logo_1x1_gray.png?format=300w`,
      telephone: "+1-310-890-3687",
      email: "joe@joebryant.co",
      priceRange: "$$$",
      founder: { "@id": `${SITE}/#person` },
      address: {
        "@type": "PostalAddress",
        addressLocality: "Los Angeles",
        addressRegion: "CA",
        addressCountry: "US",
      },
      areaServed: [
        { "@type": "City", name: "Los Angeles" },
        { "@type": "City", name: "Beverly Hills" },
        { "@type": "City", name: "Malibu" },
        { "@type": "Country", name: "United States" },
        { "@type": "Place", name: "Worldwide" },
      ],
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "Photography Services",
        itemListElement: [
          { "@type": "Offer", itemOffered: { "@type": "Service", name: "Architectural Photography" } },
          { "@type": "Offer", itemOffered: { "@type": "Service", name: "Luxury Real Estate Photography" } },
          { "@type": "Offer", itemOffered: { "@type": "Service", name: "Interior Design Photography" } },
          { "@type": "Offer", itemOffered: { "@type": "Service", name: "Hospitality Photography" } },
          { "@type": "Offer", itemOffered: { "@type": "Service", name: "Commercial & Brand Campaign Photography" } },
          { "@type": "Offer", itemOffered: { "@type": "Service", name: "Editorial & Portrait Photography" } },
        ],
      },
    },
    {
      "@type": "ImageGallery",
      "@id": `${SITE}/#gallery`,
      name: "Selected Work — Joe Bryant",
      url: SITE,
      author: { "@id": `${SITE}/#person` },
      associatedMedia: [
        {
          "@type": "ImageObject",
          contentUrl: OG_IMAGE,
          name: "Olive-tree courtyard — McClean Design residence",
          caption:
            "Twilight courtyard with two-level water feature, antique olive tree and book-matched stone — McClean Design residence, Beverly Hills.",
          creator: { "@id": `${SITE}/#person` },
        },
        {
          "@type": "ImageObject",
          contentUrl: `${CDN}/f3e98f90-82db-4f01-894c-1e8b5e4111fb/2H1A0224.jpg?format=1500w`,
          name: "Marble bridge entry at sunset",
          caption: "Marble bridge entry through a bronze corridor at sunset — private residence.",
          creator: { "@id": `${SITE}/#person` },
        },
        {
          "@type": "ImageObject",
          contentUrl: `${CDN}/82a2cf88-476a-467c-82bf-352f9c0f40b6/2H1A0441web.jpg?format=1500w`,
          name: "John Legend — studio session",
          caption: "John Legend at a grand piano in deep blue studio light.",
          about: { "@type": "Person", name: "John Legend" },
          creator: { "@id": `${SITE}/#person` },
        },
        {
          "@type": "ImageObject",
          contentUrl: `${CDN}/64261224-0bb5-4eb2-810f-a521fa417626/BrianLudlow_15696.jpg?format=1500w`,
          name: "Brian Ludlow — CEO, Creative Art Partners",
          caption: "Brian Ludlow, CEO of Creative Art Partners, seated before a large abstract canvas.",
          about: { "@type": "Person", name: "Brian Ludlow", jobTitle: "CEO, Creative Art Partners" },
          creator: { "@id": `${SITE}/#person` },
        },
        {
          "@type": "ImageObject",
          contentUrl: `${CDN}/764b4390-752e-439d-ade2-963738bacac8/2H1A6390_crop_web.jpg?format=1500w`,
          name: "The Genius — Albert Einstein, reimagined",
          caption: "Studio portrait of an Albert Einstein lookalike — editorial series.",
          creator: { "@id": `${SITE}/#person` },
        },
        {
          "@type": "ImageObject",
          contentUrl: `${CDN}/65399a1a-de46-4bb4-aa71-4c7ff006ac81/MT.jpg?format=1500w`,
          name: "Michael Mortenson & Craig Taggart — Mortenson Taggart",
          caption:
            "Michael Mortenson and Craig Taggart, founders and lead trial lawyers of Mortenson Taggart, photographed in their office.",
          about: [
            { "@type": "Person", name: "Michael Mortenson", jobTitle: "Founder & Lead Trial Lawyer, Mortenson Taggart" },
            { "@type": "Person", name: "Craig Taggart", jobTitle: "Founder & Lead Trial Lawyer, Mortenson Taggart" },
          ],
          creator: { "@id": `${SITE}/#person` },
        },
        {
          "@type": "ImageObject",
          contentUrl: `${CDN}/0df85c67-3e37-4fa1-b451-50888ef4239a/TrainedEye_Impresions_18X36_Monolithic_0028_RF.jpg?format=1500w`,
          name: "Bentley Mills — product campaign",
          caption: "Bentley Mills carpet campaign photography by Joe Bryant.",
          about: { "@type": "Organization", name: "Bentley Mills" },
          creator: { "@id": `${SITE}/#person` },
        },
      ],
    },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`}>
      <body>
        <link rel="preconnect" href="https://images.squarespace-cdn.com" />
        <link rel="dns-prefetch" href="https://images.squarespace-cdn.com" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
