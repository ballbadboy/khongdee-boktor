#!/usr/bin/env node
// Generate Review — สร้างรีวิวพร้อม Shopee search link + stock image
// Usage: node generate-review.js "หมอนยางพารา" "health"

const fs = require("fs");
const path = require("path");
const https = require("https");

const AFFILIATE_ID = "15306100390";
const REVIEWS_DIR = path.join(__dirname, "../content/reviews");
const IMAGES_DIR = path.join(__dirname, "../public/images");

function createShopeeSearchLink(keyword) {
  return `https://shopee.co.th/search?keyword=${encodeURIComponent(keyword)}&af_sub_siteid=${AFFILIATE_ID}`;
}

function fetchStockImage(keyword) {
  return new Promise((resolve) => {
    const url = `https://source.unsplash.com/800x600/?${encodeURIComponent(keyword)},product`;
    const req = https.get(url, (res) => {
      // Unsplash redirects to actual image URL
      if (res.statusCode === 302 || res.statusCode === 301) {
        resolve(res.headers.location || "");
      } else {
        resolve("");
      }
    });
    req.on("error", () => resolve(""));
    req.setTimeout(5000, () => { req.destroy(); resolve(""); });
  });
}

function slugify(text) {
  const date = new Date().toISOString().slice(0, 10);
  const slug = text
    .toLowerCase()
    .replace(/[^a-z0-9ก-๙\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 50);
  return `${slug}-${date}`;
}

async function main() {
  const keyword = process.argv[2] || "หมอนยางพารา";
  const category = process.argv[3] || "home";
  const date = new Date().toISOString().slice(0, 10);
  const slug = slugify(keyword);

  console.log(`📝 สร้างรีวิว: ${keyword}`);
  console.log(`📁 Category: ${category}`);

  // สร้าง Shopee search link เฉพาะสินค้า
  const shopeeLink = createShopeeSearchLink(keyword);
  console.log(`🔗 Shopee Link: ${shopeeLink}`);

  // ดึง stock image
  console.log(`🖼️ หารูป stock...`);
  const imageUrl = await fetchStockImage(keyword);

  // สร้าง frontmatter
  const frontmatter = `---
title: "รีวิว ${keyword} — ตัวไหนดี คุ้มค่าที่สุด?"
excerpt: "รวม ${keyword} ที่ดีที่สุด เปรียบเทียบราคา คุณภาพ คัดมาแล้วว่าคุ้มจริง"
category: ${category}
rating: 4
price: "ดูราคาล่าสุด"
shopeeLink: "${shopeeLink}"
image: "${imageUrl || "/images/placeholder.svg"}"
date: "${date}"
tags: ["${keyword}", "${category}", "รีวิว", "shopee"]
---

## [CONTENT_PLACEHOLDER]

Claude จะเขียน content ที่นี่
`;

  // เขียนไฟล์
  if (!fs.existsSync(REVIEWS_DIR)) fs.mkdirSync(REVIEWS_DIR, { recursive: true });
  const filePath = path.join(REVIEWS_DIR, `${slug}.md`);
  fs.writeFileSync(filePath, frontmatter);
  console.log(`✅ สร้างไฟล์: ${filePath}`);
  console.log(`\n📋 ลูกค้ากดลิงก์ → เห็นสินค้า "${keyword}" ใน Shopee ทันที`);

  // Output JSON สำหรับ automation
  console.log(JSON.stringify({
    slug,
    file: filePath,
    shopeeLink,
    image: imageUrl,
    keyword,
    category,
  }));
}

main().catch(console.error);
