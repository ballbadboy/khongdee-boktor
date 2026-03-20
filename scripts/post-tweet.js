#!/usr/bin/env node
/**
 * Shopee AFF — Post to X (Twitter)
 *
 * Usage:
 *   node scripts/post-tweet.js "ข้อความที่ต้องการโพสต์"
 *
 * Environment variables required:
 *   X_CONSUMER_KEY
 *   X_CONSUMER_SECRET
 *   X_ACCESS_TOKEN
 *   X_ACCESS_TOKEN_SECRET
 *
 * Set them in .env.local or export before running
 */

const crypto = require("crypto");
const https = require("https");

// Load .env.local if exists
try {
  const fs = require("fs");
  const envPath = require("path").join(__dirname, "..", ".env.local");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    envContent.split("\n").forEach((line) => {
      const [key, ...vals] = line.split("=");
      if (key && vals.length) {
        process.env[key.trim()] = vals.join("=").trim().replace(/^["']|["']$/g, "");
      }
    });
  }
} catch (e) {}

const CONSUMER_KEY = process.env.X_CONSUMER_KEY;
const CONSUMER_SECRET = process.env.X_CONSUMER_SECRET;
const ACCESS_TOKEN = process.env.X_ACCESS_TOKEN;
const ACCESS_TOKEN_SECRET = process.env.X_ACCESS_TOKEN_SECRET;

if (!CONSUMER_KEY || !CONSUMER_SECRET || !ACCESS_TOKEN || !ACCESS_TOKEN_SECRET) {
  console.error("Missing X API credentials. Set in .env.local:");
  console.error("  X_CONSUMER_KEY=...");
  console.error("  X_CONSUMER_SECRET=...");
  console.error("  X_ACCESS_TOKEN=...");
  console.error("  X_ACCESS_TOKEN_SECRET=...");
  process.exit(1);
}

function percentEncode(str) {
  return encodeURIComponent(str).replace(/[!'()*]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase());
}

function generateOAuthSignature(method, url, params, consumerSecret, tokenSecret) {
  const sortedParams = Object.keys(params).sort().map((k) => `${percentEncode(k)}=${percentEncode(params[k])}`).join("&");
  const baseString = `${method}&${percentEncode(url)}&${percentEncode(sortedParams)}`;
  const signingKey = `${percentEncode(consumerSecret)}&${percentEncode(tokenSecret)}`;
  return crypto.createHmac("sha1", signingKey).update(baseString).digest("base64");
}

function postTweet(text) {
  return new Promise((resolve, reject) => {
    const url = "https://api.x.com/2/tweets";
    const method = "POST";
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonce = crypto.randomBytes(16).toString("hex");

    const oauthParams = {
      oauth_consumer_key: CONSUMER_KEY,
      oauth_nonce: nonce,
      oauth_signature_method: "HMAC-SHA1",
      oauth_timestamp: timestamp,
      oauth_token: ACCESS_TOKEN,
      oauth_version: "1.0",
    };

    const signature = generateOAuthSignature(method, url, oauthParams, CONSUMER_SECRET, ACCESS_TOKEN_SECRET);
    oauthParams.oauth_signature = signature;

    const authHeader = "OAuth " + Object.keys(oauthParams).sort().map((k) => `${percentEncode(k)}="${percentEncode(oauthParams[k])}"`).join(", ");

    const body = JSON.stringify({ text });

    const options = {
      hostname: "api.x.com",
      path: "/2/tweets",
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const result = JSON.parse(data);
          console.log(`Tweet posted! ID: ${result.data.id}`);
          console.log(`URL: https://x.com/Drk_thorSx/status/${result.data.id}`);
          resolve(result);
        } else {
          console.error(`Error ${res.statusCode}: ${data}`);
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

// Main
const text = process.argv.slice(2).join(" ");
if (!text) {
  console.error("Usage: node post-tweet.js \"your tweet text\"");
  process.exit(1);
}

if (text.length > 280) {
  console.error(`Tweet too long: ${text.length}/280 characters`);
  process.exit(1);
}

postTweet(text).catch((err) => {
  console.error("Failed:", err.message);
  process.exit(1);
});
