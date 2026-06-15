import Link from "next/link";
import Nav from "../../components/Nav";
import { getPosts, formatDate } from "../../lib/journal";

export const metadata = {
  title: "Journal",
  description:
    "Notes on architectural photography from Joe Bryant — twilight technique, interiors, luxury estates and the craft of photographing space. Los Angeles & worldwide.",
  alternates: { canonical: "/journal" },
  openGraph: {
    title: "Journal | Joe Bryant — Architectural Photographer",
    description:
      "Notes on architectural photography — twilight technique, interiors, estates and craft.",
    url: "https://joebryant.co/journal",
    type: "website",
  },
};

export default function JournalPage() {
  const posts = getPosts();

  const blogLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "@id": "https://joebryant.co/journal#blog",
    name: "Journal — Joe Bryant",
    url: "https://joebryant.co/journal",
    author: { "@id": "https://joebryant.co/#person" },
    blogPost: posts.map((p) => ({
      "@type": "BlogPosting",
      headline: p.title,
      datePublished: p.date,
      url: `https://joebryant.co/journal/${p.slug}`,
      image: p.image || undefined,
      author: { "@id": "https://joebryant.co/#person" },
    })),
  };

  return (
    <>
      <Nav />
      <div className="grain" aria-hidden="true" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogLd) }}
      />
      <main className="journal">
        <header className="journal-head">
          <span className="label">Journal</span>
          <h1>
            Notes on light <em>& space.</em>
          </h1>
        </header>
        <div className="journal-list">
          {posts.map((p) => (
            <Link className="journal-item" href={`/journal/${p.slug}`} key={p.slug}>
              {p.image && (
                <span className="journal-thumb photo">
                  <img src={p.image} alt={p.imageAlt} loading="lazy" />
                </span>
              )}
              <span className="journal-item-copy">
                <span className="label">{formatDate(p.date)}</span>
                <h2 className="serif">{p.title}</h2>
                <p>{p.description}</p>
                <span className="journal-more label">Read —</span>
              </span>
            </Link>
          ))}
        </div>
        <footer className="journal-foot">
          <Link href="/" className="label">
            ← Back to the work
          </Link>
        </footer>
      </main>
    </>
  );
}
