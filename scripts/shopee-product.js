#!/usr/bin/env node
// Shopee Product Scraper — ดึงรูป + link สินค้าจริงจาก Shopee
// Usage: node shopee-product.js "หมอนยางพารา"
// Output: JSON { title, price, image, shopeeLink, shop }

const https = require("https");

const AFFILIATE_ID = "15306100390";

function shopeeSearch(keyword) {
  return new Promise((resolve, reject) => {
    const params = new URLSearchParams({
      keyword,
      limit: "5",
      newest: "0",
      order: "relevancy",
      page_type: "search",
      scenario: "PAGE_GLOBAL_SEARCH",
      version: "2",
    });

    const options = {
      hostname: "shopee.co.th",
      path: `/api/v4/search/search_items?${params}`,
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "Accept": "application/json",
        "Accept-Language": "th-TH,th;q=0.9",
        "Referer": "https://shopee.co.th/",
        "af-ac-enc-dat": "",
        "x-shopee-language": "th",
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          const items = json.items || [];
          const results = items.map((item) => {
            const info = item.item_basic || item;
            const shopId = info.shopid;
            const itemId = info.itemid;
            const name = info.name;
            const price = info.price ? (info.price / 100000).toFixed(0) : "0";
            const priceMax = info.price_max ? (info.price_max / 100000).toFixed(0) : price;
            const image = info.image ? `https://down-th.img.susercontent.com/file/${info.image}` : "";
            const images = (info.images || []).map((img) => `https://down-th.img.susercontent.com/file/${img}`);
            const sold = info.historical_sold || info.sold || 0;
            const rating = info.item_rating?.rating_star?.toFixed(1) || "0";
            const shopName = info.shop_name || "";

            // สร้าง affiliate link
            const productUrl = `https://shopee.co.th/product/${shopId}/${itemId}`;
            const affiliateLink = `https://shopee.co.th/product/${shopId}/${itemId}?af_sub_siteid=${AFFILIATE_ID}&utm_source=affiliate&utm_medium=referral`;

            return {
              title: name,
              price: `฿${price}${priceMax !== price ? `-${priceMax}` : ""}`,
              image,
              images: images.slice(0, 3),
              shopeeLink: affiliateLink,
              shortUrl: productUrl,
              sold,
              rating,
              shopName,
              shopId,
              itemId,
            };
          });
          resolve(results);
        } catch (e) {
          // API อาจบล็อก ลองใช้ fallback
          resolve([]);
        }
      });
    });
    req.on("error", reject);
    req.end();
  });
}

// Fallback: สร้าง search URL ที่ลูกค้ากดแล้วเจอสินค้าเลย
function createSearchLink(keyword) {
  const encoded = encodeURIComponent(keyword);
  return `https://shopee.co.th/search?keyword=${encoded}&af_sub_siteid=${AFFILIATE_ID}`;
}

async function main() {
  const keyword = process.argv.slice(2).join(" ") || "หมอนยางพารา";

  console.error(`🔍 ค้นหา Shopee: "${keyword}"`);

  const results = await shopeeSearch(keyword);

  if (results.length > 0) {
    console.log(JSON.stringify(results, null, 2));
  } else {
    // Fallback — ส่ง search link แทน
    const fallback = [{
      title: keyword,
      price: "ดูราคาใน Shopee",
      image: "",
      images: [],
      shopeeLink: createSearchLink(keyword),
      shortUrl: createSearchLink(keyword),
      sold: 0,
      rating: "0",
      shopName: "",
      note: "ใช้ search link (API ไม่ตอบ)"
    }];
    console.log(JSON.stringify(fallback, null, 2));
  }
}

main().catch((e) => {
  console.error("Error:", e.message);
  process.exit(1);
});
