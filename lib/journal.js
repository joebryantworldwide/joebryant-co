import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { marked } from "marked";

const DIR = path.join(process.cwd(), "content", "journal");

export function getPosts() {
  if (!fs.existsSync(DIR)) return [];
  return fs
    .readdirSync(DIR)
    .filter((f) => f.endsWith(".md"))
    .map((file) => {
      const slug = file.replace(/\.md$/, "");
      const raw = fs.readFileSync(path.join(DIR, file), "utf8");
      const { data, content } = matter(raw);
      return {
        slug,
        title: data.title || slug,
        description: data.description || "",
        date: data.date || "1970-01-01",
        image: data.image || null,
        imageAlt: data.imageAlt || data.title || "",
        tags: data.tags || [],
        content,
      };
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

export function getPost(slug) {
  const post = getPosts().find((p) => p.slug === slug);
  if (!post) return null;
  return { ...post, html: marked.parse(post.content) };
}

export function formatDate(date) {
  return new Date(date + "T12:00:00Z").toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}
