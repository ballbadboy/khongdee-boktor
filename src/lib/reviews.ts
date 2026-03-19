import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";

const reviewsDir = path.join(process.cwd(), "content/reviews");

export interface Review {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  rating: number;
  price: string;
  shopeeLink: string;
  image: string;
  date: string;
  tags: string[];
  content?: string;
}

export function getAllReviews(): Review[] {
  if (!fs.existsSync(reviewsDir)) return [];
  const files = fs.readdirSync(reviewsDir).filter((f) => f.endsWith(".md"));
  return files
    .map((file) => {
      const slug = file.replace(/\.md$/, "");
      const raw = fs.readFileSync(path.join(reviewsDir, file), "utf-8");
      const { data } = matter(raw);
      return {
        slug,
        title: data.title || slug,
        excerpt: data.excerpt || "",
        category: data.category || "other",
        rating: data.rating || 0,
        price: data.price || "",
        shopeeLink: data.shopeeLink || "https://s.shopee.co.th/5AnsGpL3Qg",
        image: data.image || "/images/placeholder.svg",
        date: data.date || new Date().toISOString().slice(0, 10),
        tags: data.tags || [],
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

export async function getReviewBySlug(slug: string): Promise<Review | null> {
  const file = path.join(reviewsDir, `${slug}.md`);
  if (!fs.existsSync(file)) return null;
  const raw = fs.readFileSync(file, "utf-8");
  const { data, content: md } = matter(raw);
  const result = await remark().use(html).process(md);
  return {
    slug,
    title: data.title || slug,
    excerpt: data.excerpt || "",
    category: data.category || "other",
    rating: data.rating || 0,
    price: data.price || "",
    shopeeLink: data.shopeeLink || "https://s.shopee.co.th/5AnsGpL3Qg",
    image: data.image || "/images/placeholder.svg",
    date: data.date || new Date().toISOString().slice(0, 10),
    tags: data.tags || [],
    content: result.toString(),
  };
}

export function getCategories() {
  return [
    { slug: "tech", name: "Tech & Gadget", emoji: "💻" },
    { slug: "home", name: "ของใช้ในบ้าน", emoji: "🏠" },
    { slug: "beauty", name: "ความสวยความงาม", emoji: "💄" },
    { slug: "health", name: "สุขภาพ", emoji: "💪" },
    { slug: "kids", name: "แม่และเด็ก", emoji: "👶" },
    { slug: "food", name: "อาหาร", emoji: "🍜" },
  ];
}

export function getReviewsByCategory(category: string): Review[] {
  return getAllReviews().filter((r) => r.category === category);
}
