#!/usr/bin/env node
/**
 * ของดีบอกต่อ — Shopee AFF Dashboard
 * ====================================
 * Admin dashboard สำหรับจัดการสินค้า, สร้างรีวิว, deploy, โพสต์ X
 *
 * Usage: node dashboard.js
 * Open:  http://localhost:4000
 */

const express = require("express");
const fs = require("fs");
const path = require("path");
const { execSync, exec } = require("child_process");
const crypto = require("crypto");
const https = require("https");
const http = require("http");

const app = express();
const PORT = 4000;
const ROOT = __dirname;
const REVIEWS_DIR = path.join(ROOT, "content/reviews");

// Load .env.local
try {
  const envPath = path.join(ROOT, ".env.local");
  if (fs.existsSync(envPath)) {
    fs.readFileSync(envPath, "utf-8").split("\n").forEach((line) => {
      const [key, ...vals] = line.split("=");
      if (key && vals.length) {
        process.env[key.trim()] = vals.join("=").trim().replace(/^["']|["']$/g, "");
      }
    });
  }
} catch (e) {}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================
// API: List all products
// ============================================
app.get("/api/products", (req, res) => {
  try {
    if (!fs.existsSync(REVIEWS_DIR)) return res.json([]);
    const files = fs.readdirSync(REVIEWS_DIR).filter((f) => f.endsWith(".md"));
    const products = files.map((file) => {
      const raw = fs.readFileSync(path.join(REVIEWS_DIR, file), "utf-8");
      const frontmatter = parseFrontmatter(raw);
      return {
        slug: file.replace(/\.md$/, ""),
        title: frontmatter.title || file,
        price: frontmatter.price || "",
        category: frontmatter.category || "",
        date: frontmatter.date || "",
        shopeeLink: frontmatter.shopeeLink || "",
      };
    });
    res.json(products.sort((a, b) => (b.date || "").localeCompare(a.date || "")));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// API: Add new product (generate review)
// ============================================
app.post("/api/products", (req, res) => {
  try {
    const { name, price, category, shopeeLink, description } = req.body;
    if (!name || !price || !shopeeLink) {
      return res.status(400).json({ error: "Missing: name, price, shopeeLink" });
    }

    const slug = slugify(name);
    const date = new Date().toISOString().slice(0, 10);
    const review = generateReview({ name, price, category: category || "tech", shopeeLink, description, date, slug });

    if (!fs.existsSync(REVIEWS_DIR)) fs.mkdirSync(REVIEWS_DIR, { recursive: true });
    fs.writeFileSync(path.join(REVIEWS_DIR, `${slug}.md`), review);

    // Update sitemap
    updateSitemap(slug, date);

    res.json({ success: true, slug, message: `Review created: ${slug}.md` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// API: Delete product
// ============================================
app.delete("/api/products/:slug", (req, res) => {
  try {
    const file = path.join(REVIEWS_DIR, `${req.params.slug}.md`);
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "Not found" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// API: Build website
// ============================================
app.post("/api/build", (req, res) => {
  try {
    const output = execSync("npx next build", { cwd: ROOT, timeout: 120000 }).toString();
    const success = output.includes("Generating static pages");
    res.json({ success, output: output.slice(-500) });
  } catch (err) {
    res.status(500).json({ error: err.stderr?.toString() || err.message });
  }
});

// ============================================
// API: Deploy (git push to Vercel)
// ============================================
app.post("/api/deploy", (req, res) => {
  try {
    // First build
    execSync("npx next build", { cwd: ROOT, timeout: 120000 });
    // Then git add + commit + push
    execSync("git add -A", { cwd: ROOT });
    try {
      execSync('git commit -m "Add new product review"', { cwd: ROOT });
    } catch (e) {
      // Nothing to commit
    }
    const pushOutput = execSync("git push 2>&1", { cwd: ROOT }).toString();
    res.json({ success: true, output: pushOutput.slice(-300) });
  } catch (err) {
    res.status(500).json({ error: err.stderr?.toString()?.slice(-300) || err.message });
  }
});

// ============================================
// API: Post tweet
// ============================================
app.post("/api/tweet", (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "Missing tweet text" });
  if (text.length > 280) return res.status(400).json({ error: `Too long: ${text.length}/280` });

  const keys = {
    consumer_key: process.env.X_CONSUMER_KEY,
    consumer_secret: process.env.X_CONSUMER_SECRET,
    access_token: process.env.X_ACCESS_TOKEN,
    access_token_secret: process.env.X_ACCESS_TOKEN_SECRET,
  };

  if (!keys.consumer_key || !keys.access_token) {
    return res.status(400).json({ error: "X API credentials not set in .env.local" });
  }

  postTweet(text, keys)
    .then((result) => res.json({ success: true, tweet_id: result.data?.id, url: `https://x.com/Drk_thorSx/status/${result.data?.id}` }))
    .catch((err) => res.status(500).json({ error: err.message }));
});

// ============================================
// API: Generate tweet text for a product
// ============================================
app.post("/api/generate-tweet", (req, res) => {
  const { name, price, slug } = req.body;
  const url = `https://khongdee-boktor.vercel.app/review/${slug}`;
  const templates = [
    `${name} ราคา ${price} คุ้มไหม? รีวิวจริงจากคนใช้ ดูที่นี่เลย 👇\n${url}`,
    `ของดีบอกต่อ! ${name} แค่ ${price} ใช้จริงแล้วเป็นยังไง? อ่านรีวิวเต็ม 👇\n${url}`,
    `หาอยู่ไหม? ${name} ${price} รีวิวจริง ข้อดีข้อเสียครบ!\n${url}`,
  ];
  const tweet = templates[Math.floor(Math.random() * templates.length)];
  res.json({ tweet, length: tweet.length });
});

// ============================================
// API: Fetch Shopee product info from URL
// ============================================
app.post("/api/fetch-shopee", (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "Missing URL" });

  // Extract item ID from Shopee URL
  const match = url.match(/i\.(\d+)\.(\d+)/);
  if (match) {
    res.json({
      shopId: match[1],
      itemId: match[2],
      affiliateLink: url.includes("af_sub_siteid") ? url : `${url}${url.includes("?") ? "&" : "?"}af_sub_siteid=15306100390`,
    });
  } else {
    res.json({ affiliateLink: url.includes("af_sub_siteid") ? url : `${url}${url.includes("?") ? "&" : "?"}af_sub_siteid=15306100390` });
  }
});

// ============================================
// Dashboard HTML
// ============================================
app.get("/", (req, res) => {
  res.send(DASHBOARD_HTML);
});

// ============================================
// Helpers
// ============================================
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\u0E00-\u0E7Fs-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const data = {};
  match[1].split("\n").forEach((line) => {
    const idx = line.indexOf(":");
    if (idx > 0) {
      const key = line.slice(0, idx).trim();
      let val = line.slice(idx + 1).trim();
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      data[key] = val;
    }
  });
  return data;
}

function generateReview({ name, price, category, shopeeLink, description, date, slug }) {
  const desc = description || name;
  return `---
title: "${name} — รีวิวจริงจากคนใช้"
excerpt: "รีวิว ${name} ราคา ${price} คุ้มค่าไหม? ข้อดีข้อเสียจากคนซื้อจริง ข้อมูลจาก Shopee"
category: ${category}
rating: 4
price: "${price}"
shopeeLink: "${shopeeLink}"
image: ""
date: "${date}"
tags: ["${name.split(" ").slice(0, 3).join('", "')}", "shopee", "รีวิว"]
products:
  - name: "${name}"
    price: "${price}"
    link: "${shopeeLink}"
    badge: ""
pros:
  - "รอเพิ่มข้อดี"
cons:
  - "รอเพิ่มข้อควรระวัง"
faq:
  - q: "${name} คุ้มค่าไหม?"
    a: "ดูรายละเอียดและรีวิวจากผู้ซื้อจริงในบทความ"
---

## ${name} — รีวิวจริงจากคนใช้

${desc}

### ข้อมูลสินค้า

สินค้านี้มีราคา ${price} บน Shopee Thailand

### สิ่งที่ควรรู้ก่อนซื้อ

(รอเพิ่มเนื้อหารีวิว 800+ คำ)

### สรุป

แนะนำให้ดูรายละเอียดเพิ่มเติมและอ่านรีวิวจากผู้ซื้อจริงที่หน้าสินค้าใน Shopee ก่อนตัดสินใจ
`;
}

function updateSitemap(slug, date) {
  const sitemapPath = path.join(ROOT, "public/sitemap.xml");
  if (!fs.existsSync(sitemapPath)) return;
  let sitemap = fs.readFileSync(sitemapPath, "utf-8");
  const newEntry = `  <url>\n    <loc>https://khongdee-boktor.vercel.app/review/${slug}</loc>\n    <lastmod>${date}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.9</priority>\n  </url>`;
  if (!sitemap.includes(slug)) {
    sitemap = sitemap.replace("</urlset>", `${newEntry}\n</urlset>`);
    fs.writeFileSync(sitemapPath, sitemap);
  }
}

function percentEncode(str) {
  return encodeURIComponent(str).replace(/[!'()*]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase());
}

function postTweet(text, keys) {
  return new Promise((resolve, reject) => {
    const url = "https://api.x.com/2/tweets";
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonce = crypto.randomBytes(16).toString("hex");
    const oauthParams = {
      oauth_consumer_key: keys.consumer_key,
      oauth_nonce: nonce,
      oauth_signature_method: "HMAC-SHA1",
      oauth_timestamp: timestamp,
      oauth_token: keys.access_token,
      oauth_version: "1.0",
    };
    const sorted = Object.keys(oauthParams).sort().map((k) => `${percentEncode(k)}=${percentEncode(oauthParams[k])}`).join("&");
    const baseString = `POST&${percentEncode(url)}&${percentEncode(sorted)}`;
    const sigKey = `${percentEncode(keys.consumer_secret)}&${percentEncode(keys.access_token_secret)}`;
    oauthParams.oauth_signature = crypto.createHmac("sha1", sigKey).update(baseString).digest("base64");
    const authHeader = "OAuth " + Object.keys(oauthParams).sort().map((k) => `${percentEncode(k)}="${percentEncode(oauthParams[k])}"`).join(", ");
    const body = JSON.stringify({ text });
    const req = https.request({ hostname: "api.x.com", path: "/2/tweets", method: "POST", headers: { Authorization: authHeader, "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) } }, (resp) => {
      let data = "";
      resp.on("data", (chunk) => (data += chunk));
      resp.on("end", () => {
        if (resp.statusCode >= 200 && resp.statusCode < 300) resolve(JSON.parse(data));
        else reject(new Error(`HTTP ${resp.statusCode}: ${data}`));
      });
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

// ============================================
// Dashboard HTML/CSS/JS
// ============================================
const DASHBOARD_HTML = `<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Shopee AFF Dashboard</title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@400;600;700&display=swap" rel="stylesheet">
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Noto Sans Thai', sans-serif; background: #0F172A; color: #E2E8F0; min-height: 100vh; }
.header { background: linear-gradient(135deg, #1E293B 0%, #0F172A 100%); border-bottom: 1px solid #334155; padding: 20px 32px; display: flex; justify-content: space-between; align-items: center; }
.header h1 { font-size: 1.5rem; font-weight: 700; }
.header h1 span { color: #EE4D2D; }
.status { font-size: 0.8rem; color: #10B981; display: flex; align-items: center; gap: 6px; }
.status::before { content: ''; width: 8px; height: 8px; background: #10B981; border-radius: 50%; }
.container { max-width: 1100px; margin: 0 auto; padding: 32px 24px; }
.tabs { display: flex; gap: 8px; margin-bottom: 24px; border-bottom: 1px solid #334155; padding-bottom: 12px; }
.tab { padding: 8px 20px; border: none; border-radius: 8px 8px 0 0; font-weight: 600; cursor: pointer; font-family: inherit; font-size: 0.875rem; background: transparent; color: #94A3B8; transition: all 0.2s; }
.tab.active { background: #EE4D2D; color: white; }
.tab:hover:not(.active) { background: #1E293B; color: #E2E8F0; }
.panel { display: none; }
.panel.active { display: block; }
.card { background: #1E293B; border: 1px solid #334155; border-radius: 16px; padding: 24px; margin-bottom: 20px; }
.card h2 { font-size: 1rem; font-weight: 700; margin-bottom: 16px; color: #EE4D2D; }
.form-group { margin-bottom: 16px; }
.form-group label { display: block; font-size: 0.8rem; font-weight: 600; color: #94A3B8; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.05em; }
input, select, textarea { width: 100%; padding: 10px 14px; background: #0F172A; border: 1px solid #334155; border-radius: 10px; color: #E2E8F0; font-family: inherit; font-size: 0.9rem; }
input:focus, select:focus, textarea:focus { outline: none; border-color: #EE4D2D; }
textarea { resize: vertical; min-height: 80px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
@media (max-width: 600px) { .form-row { grid-template-columns: 1fr; } }
.btn { padding: 10px 20px; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; font-family: inherit; font-size: 0.875rem; transition: all 0.2s; display: inline-flex; align-items: center; gap: 6px; }
.btn-primary { background: #EE4D2D; color: white; }
.btn-primary:hover { background: #D73211; transform: translateY(-1px); }
.btn-secondary { background: #334155; color: #E2E8F0; }
.btn-secondary:hover { background: #475569; }
.btn-success { background: #10B981; color: white; }
.btn-success:hover { background: #059669; }
.btn-danger { background: #DC2626; color: white; font-size: 0.75rem; padding: 6px 12px; }
.btn-danger:hover { background: #B91C1C; }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-group { display: flex; gap: 8px; margin-top: 16px; flex-wrap: wrap; }
.product-list { display: grid; gap: 12px; }
.product-item { display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; background: #0F172A; border: 1px solid #334155; border-radius: 12px; }
.product-item:hover { border-color: #EE4D2D; }
.product-info h3 { font-size: 0.9rem; font-weight: 600; margin-bottom: 4px; }
.product-meta { font-size: 0.75rem; color: #94A3B8; display: flex; gap: 12px; }
.product-meta .price { color: #EE4D2D; font-weight: 700; }
.badge { font-size: 0.65rem; padding: 2px 8px; border-radius: 100px; font-weight: 700; }
.badge-tech { background: #3B82F6; color: white; }
.badge-home { background: #10B981; color: white; }
.badge-beauty { background: #EC4899; color: white; }
.badge-health { background: #F59E0B; color: white; }
.toast { position: fixed; bottom: 24px; right: 24px; padding: 14px 24px; border-radius: 12px; font-weight: 600; font-size: 0.875rem; z-index: 1000; animation: slideIn 0.3s ease; display: none; }
.toast-success { background: #10B981; color: white; }
.toast-error { background: #DC2626; color: white; }
@keyframes slideIn { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
.log { background: #0F172A; border: 1px solid #334155; border-radius: 10px; padding: 12px; font-family: monospace; font-size: 0.75rem; color: #94A3B8; max-height: 200px; overflow-y: auto; margin-top: 12px; white-space: pre-wrap; display: none; }
.stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }
@media (max-width: 600px) { .stats { grid-template-columns: 1fr; } }
.stat-card { background: #1E293B; border: 1px solid #334155; border-radius: 12px; padding: 20px; text-align: center; }
.stat-num { font-size: 2rem; font-weight: 800; color: #EE4D2D; }
.stat-label { font-size: 0.75rem; color: #94A3B8; margin-top: 4px; }
.tweet-preview { background: #0F172A; border: 1px solid #334155; border-radius: 12px; padding: 16px; margin-top: 12px; font-size: 0.9rem; line-height: 1.6; }
.tweet-count { text-align: right; font-size: 0.75rem; color: #94A3B8; margin-top: 4px; }
</style>
</head>
<body>
<div class="header">
  <h1>Shopee <span>AFF</span> Dashboard</h1>
  <div class="status">Running on localhost:${PORT}</div>
</div>

<div class="container">
  <div class="stats" id="stats"></div>

  <div class="tabs">
    <button class="tab active" onclick="showTab('add')">+ เพิ่มสินค้า</button>
    <button class="tab" onclick="showTab('products')">สินค้าทั้งหมด</button>
    <button class="tab" onclick="showTab('deploy')">Build & Deploy</button>
    <button class="tab" onclick="showTab('tweet')">โพสต์ X</button>
  </div>

  <!-- Add Product -->
  <div class="panel active" id="panel-add">
    <div class="card">
      <h2>เพิ่มสินค้าใหม่</h2>
      <div class="form-group">
        <label>Shopee URL (วาง affiliate link)</label>
        <input type="url" id="shopeeUrl" placeholder="https://shopee.co.th/...?af_sub_siteid=15306100390" oninput="parseShopeeUrl()">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>ชื่อสินค้า</label>
          <input type="text" id="productName" placeholder="เช่น พัดลมคล้องคอ USB">
        </div>
        <div class="form-group">
          <label>ราคา</label>
          <input type="text" id="productPrice" placeholder="฿199">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>หมวดหมู่</label>
          <select id="productCategory">
            <option value="tech">Tech & Gadget</option>
            <option value="home">ของใช้ในบ้าน</option>
            <option value="beauty">ความสวยความงาม</option>
            <option value="health">สุขภาพ</option>
          </select>
        </div>
        <div class="form-group">
          <label>Affiliate Link (auto)</label>
          <input type="text" id="affiliateLink" placeholder="Auto-generated" readonly style="opacity:0.7">
        </div>
      </div>
      <div class="form-group">
        <label>คำอธิบายเพิ่มเติม (optional)</label>
        <textarea id="productDesc" placeholder="รายละเอียดสินค้าที่อยากเน้น..."></textarea>
      </div>
      <div class="btn-group">
        <button class="btn btn-primary" onclick="addProduct()">สร้างรีวิว + เพิ่มในเว็บ</button>
        <button class="btn btn-success" onclick="addAndDeploy()">สร้าง + Build + Deploy ทีเดียว</button>
      </div>
      <div class="log" id="add-log"></div>
    </div>
  </div>

  <!-- Products List -->
  <div class="panel" id="panel-products">
    <div class="card">
      <h2>สินค้าทั้งหมด</h2>
      <div class="product-list" id="product-list"></div>
    </div>
  </div>

  <!-- Build & Deploy -->
  <div class="panel" id="panel-deploy">
    <div class="card">
      <h2>Build & Deploy</h2>
      <p style="color:#94A3B8;font-size:0.875rem;margin-bottom:16px">Build เว็บ Next.js แล้ว push ไป Vercel อัตโนมัติ</p>
      <div class="btn-group">
        <button class="btn btn-secondary" onclick="buildSite()">Build เท่านั้น</button>
        <button class="btn btn-primary" onclick="deploySite()">Build + Deploy Vercel</button>
      </div>
      <div class="log" id="deploy-log"></div>
    </div>
  </div>

  <!-- Tweet -->
  <div class="panel" id="panel-tweet">
    <div class="card">
      <h2>โพสต์ X (@Drk_thorSx)</h2>
      <div class="form-group">
        <label>เลือกสินค้าที่จะโปรโมท</label>
        <select id="tweetProduct" onchange="generateTweet()">
          <option value="">-- เลือกสินค้า --</option>
        </select>
      </div>
      <div class="form-group">
        <label>ข้อความ Tweet</label>
        <textarea id="tweetText" rows="4" placeholder="เขียน tweet หรือกด Generate..." oninput="updateTweetCount()"></textarea>
        <div class="tweet-count"><span id="tweetCount">0</span>/280</div>
      </div>
      <div class="btn-group">
        <button class="btn btn-secondary" onclick="generateTweet()">Generate Tweet</button>
        <button class="btn btn-primary" onclick="postTweet()">โพสต์ X เลย!</button>
      </div>
      <div class="log" id="tweet-log"></div>
    </div>
  </div>
</div>

<div class="toast" id="toast"></div>

<script>
// Tab switching
function showTab(name) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.getElementById('panel-' + name).classList.add('active');
  event.target.classList.add('active');
  if (name === 'products') loadProducts();
  if (name === 'tweet') loadTweetProducts();
}

// Toast notification
function toast(msg, type = 'success') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'toast toast-' + type;
  el.style.display = 'block';
  setTimeout(() => el.style.display = 'none', 3000);
}

function showLog(id, text) {
  const el = document.getElementById(id);
  el.style.display = 'block';
  el.textContent = text;
}

// Parse Shopee URL
function parseShopeeUrl() {
  const url = document.getElementById('shopeeUrl').value;
  if (!url) return;
  let link = url;
  if (!url.includes('af_sub_siteid')) {
    link += (url.includes('?') ? '&' : '?') + 'af_sub_siteid=15306100390';
  }
  document.getElementById('affiliateLink').value = link;
}

// Add product
async function addProduct() {
  const data = getFormData();
  if (!data.name || !data.price || !data.shopeeLink) {
    return toast('กรุณากรอกข้อมูลให้ครบ: ชื่อ, ราคา, Shopee URL', 'error');
  }
  try {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (result.success) {
      toast('สร้างรีวิวเรียบร้อย: ' + result.slug);
      showLog('add-log', 'Created: content/reviews/' + result.slug + '.md');
      loadStats();
    } else {
      toast(result.error, 'error');
    }
  } catch (err) {
    toast('Error: ' + err.message, 'error');
  }
}

// Add + Deploy
async function addAndDeploy() {
  await addProduct();
  await deploySite();
}

// Build
async function buildSite() {
  toast('Building...');
  showLog('deploy-log', 'Building Next.js...');
  try {
    const res = await fetch('/api/build', { method: 'POST' });
    const result = await res.json();
    if (result.success) {
      toast('Build สำเร็จ!');
      showLog('deploy-log', result.output);
    } else {
      toast('Build failed', 'error');
      showLog('deploy-log', result.error);
    }
  } catch (err) {
    toast('Error: ' + err.message, 'error');
  }
}

// Deploy
async function deploySite() {
  toast('Building + Deploying...');
  showLog('deploy-log', 'Building and pushing to Vercel...');
  try {
    const res = await fetch('/api/deploy', { method: 'POST' });
    const result = await res.json();
    if (result.success) {
      toast('Deploy สำเร็จ!');
      showLog('deploy-log', result.output);
    } else {
      toast('Deploy failed', 'error');
      showLog('deploy-log', result.error);
    }
  } catch (err) {
    toast('Error: ' + err.message, 'error');
  }
}

// Load products
async function loadProducts() {
  try {
    const res = await fetch('/api/products');
    const products = await res.json();
    const list = document.getElementById('product-list');
    if (products.length === 0) {
      list.innerHTML = '<p style="color:#94A3B8;text-align:center;padding:24px">ยังไม่มีสินค้า</p>';
      return;
    }
    list.innerHTML = products.map(p => \`
      <div class="product-item">
        <div class="product-info">
          <h3>\${p.title}</h3>
          <div class="product-meta">
            <span class="price">\${p.price}</span>
            <span class="badge badge-\${p.category}">\${p.category}</span>
            <span>\${p.date}</span>
          </div>
        </div>
        <div style="display:flex;gap:8px;align-items:center">
          <a href="https://khongdee-boktor.vercel.app/review/\${p.slug}" target="_blank" class="btn btn-secondary" style="font-size:0.75rem;padding:6px 12px">ดูเว็บ</a>
          <button class="btn btn-danger" onclick="deleteProduct('\${p.slug}')">ลบ</button>
        </div>
      </div>
    \`).join('');
  } catch (err) {
    toast('Error loading products', 'error');
  }
}

// Delete product
async function deleteProduct(slug) {
  if (!confirm('ลบ ' + slug + ' ?')) return;
  try {
    await fetch('/api/products/' + slug, { method: 'DELETE' });
    toast('ลบแล้ว');
    loadProducts();
    loadStats();
  } catch (err) {
    toast('Error', 'error');
  }
}

// Tweet functions
async function loadTweetProducts() {
  const res = await fetch('/api/products');
  const products = await res.json();
  const sel = document.getElementById('tweetProduct');
  sel.innerHTML = '<option value="">-- เลือกสินค้า --</option>' +
    products.map(p => \`<option value='\${JSON.stringify({name:p.title,price:p.price,slug:p.slug}).replace(/'/g,"&#39;")}'>\${p.title} (\${p.price})</option>\`).join('');
}

async function generateTweet() {
  const val = document.getElementById('tweetProduct').value;
  if (!val) return;
  const product = JSON.parse(val);
  try {
    const res = await fetch('/api/generate-tweet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    });
    const result = await res.json();
    document.getElementById('tweetText').value = result.tweet;
    updateTweetCount();
  } catch (err) {
    toast('Error', 'error');
  }
}

function updateTweetCount() {
  const len = document.getElementById('tweetText').value.length;
  const counter = document.getElementById('tweetCount');
  counter.textContent = len;
  counter.style.color = len > 280 ? '#DC2626' : '#94A3B8';
}

async function postTweet() {
  const text = document.getElementById('tweetText').value;
  if (!text) return toast('เขียน tweet ก่อน', 'error');
  if (text.length > 280) return toast('Tweet ยาวเกิน 280 ตัวอักษร', 'error');
  try {
    const res = await fetch('/api/tweet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    const result = await res.json();
    if (result.success) {
      toast('โพสต์สำเร็จ!');
      showLog('tweet-log', 'Tweet URL: ' + result.url);
    } else {
      toast(result.error, 'error');
      showLog('tweet-log', result.error);
    }
  } catch (err) {
    toast('Error: ' + err.message, 'error');
  }
}

// Stats
async function loadStats() {
  try {
    const res = await fetch('/api/products');
    const products = await res.json();
    const cats = {};
    products.forEach(p => cats[p.category] = (cats[p.category] || 0) + 1);
    document.getElementById('stats').innerHTML = \`
      <div class="stat-card"><div class="stat-num">\${products.length}</div><div class="stat-label">สินค้าทั้งหมด</div></div>
      <div class="stat-card"><div class="stat-num">\${Object.keys(cats).length}</div><div class="stat-label">หมวดหมู่</div></div>
      <div class="stat-card"><div class="stat-num">\${products.filter(p=>p.price && !p.price.includes('รอ')).length}</div><div class="stat-label">พร้อม publish</div></div>
    \`;
  } catch (err) {}
}

function getFormData() {
  return {
    name: document.getElementById('productName').value.trim(),
    price: document.getElementById('productPrice').value.trim(),
    category: document.getElementById('productCategory').value,
    shopeeLink: document.getElementById('affiliateLink').value || document.getElementById('shopeeUrl').value,
    description: document.getElementById('productDesc').value.trim(),
  };
}

// Init
loadStats();
</script>
</body>
</html>`;

// ============================================
// Start server
// ============================================
app.listen(PORT, () => {
  console.log("");
  console.log("  ┌──────────────────────────────────────┐");
  console.log("  │  Shopee AFF Dashboard                │");
  console.log("  │  http://localhost:" + PORT + "               │");
  console.log("  │                                      │");
  console.log("  │  Functions:                          │");
  console.log("  │  + เพิ่มสินค้า + สร้างรีวิว             │");
  console.log("  │  + Build & Deploy Vercel             │");
  console.log("  │  + โพสต์ X (@Drk_thorSx)              │");
  console.log("  │  + จัดการสินค้า (ดู/ลบ)                │");
  console.log("  └──────────────────────────────────────┘");
  console.log("");
});
