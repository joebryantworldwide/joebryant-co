import Link from "next/link";
import { notFound } from "next/navigation";
import Nav from "../../../components/Nav";
import { getPosts, getPost, formatDate } from "../../../lib/journal";

export function generateStaticParams() {
  return getPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `/journal/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.description,
      url: `https://joebryant.co/journal/${post.slug}`,
      type: "article",
      publishedTime: post.date,
      authors: ["Joe Bryant"],
      images: post.image ? [{ url: post.image }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: post.image ? [post.image] : undefined,
    },
  };
}

export default async function PostPage({ params }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    image: post.image || undefined,
    datePublished: post.date,
    dateModified: post.date,
    keywords: post.tags.join(", "),
    url: `https://joebryant.co/journal/${post.slug}`,
    mainEntityOfPage: `https://joebryant.co/journal/${post.slug}`,
    author: {
      "@type": "Person",
      "@id": "https://joebryant.co/#person",
      name: "Joe Bryant",
    },
    publisher: { "@id": "https://joebryant.co/#business" },
  };

  return (
    <>
      <Nav />
      <div className="grain" aria-hidden="true" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }}
      />
      <main className="journal post">
        <article>
          <header className="post-head">
            <span className="label">{formatDate(post.date)}</span>
            <h1>{post.title}</h1>
            <p className="post-dek">{post.description}</p>
          </header>
          {post.image && (
            <figure className="post-hero photo">
              <img src={post.image} alt={post.imageAlt} />
            </figure>
          )}
          <div className="prose" dangerouslySetInnerHTML={{ __html: post.html }} />
          <footer className="post-foot">
            <Link href="/journal" className="label">
              ← All notes
            </Link>
            <Link href="/#newsletter" className="label">
              Get the next one by email —
            </Link>
          </footer>
        </article>
      </main>
    </>
  );
}
