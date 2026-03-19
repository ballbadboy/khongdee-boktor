#!/usr/bin/env node
// Generate sitemap.xml from content/reviews
const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");

const BASE = "https://khongdee-boktor.vercel.app";
const reviewsDir = path.join(__dirname, "../content/reviews");
const outFile = path.join(__dirname, "../public/sitemap.xml");

const categories = ["tech", "home", "beauty", "health", "kids", "food"];
const today = new Date().toISOString().slice(0, 10);

let urls = [
  `  <url><loc>${BASE}</loc><lastmod>${today}</lastmod><changefreq>daily</changefreq><priority>1.0</priority></url>`,
];

for (const cat of categories) {
  urls.push(`  <url><loc>${BASE}/category/${cat}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`);
}

if (fs.existsSync(reviewsDir)) {
  const files = fs.readdirSync(reviewsDir).filter((f) => f.endsWith(".md"));
  for (const file of files) {
    const slug = file.replace(/\.md$/, "");
    const raw = fs.readFileSync(path.join(reviewsDir, file), "utf-8");
    const { data } = matter(raw);
    const date = data.date || today;
    urls.push(`  <url><loc>${BASE}/review/${slug}</loc><lastmod>${date}</lastmod><changefreq>monthly</changefreq><priority>0.9</priority></url>`);
  }
}

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

fs.writeFileSync(outFile, xml);
console.log(`Sitemap generated: ${urls.length} URLs → ${outFile}`);
