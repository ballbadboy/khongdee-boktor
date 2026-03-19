import type { Metadata } from "next";
import "./globals.css";
import { generateWebsiteSchema } from "@/lib/schema";

export const metadata: Metadata = {
  title: "ของดีบอกต่อ — รีวิวสินค้า Shopee คัดสรรโดยคนไทย",
  description: "รวมรีวิวของดี สินค้าน่าซื้อจาก Shopee ทั้ง Tech, ของใช้ในบ้าน, ความสวยความงาม, สุขภาพ อุปกรณ์ WFH และ Gadget คัดสรรแล้วว่าดีจริง พร้อมเปรียบเทียบราคาให้",
  alternates: { canonical: "https://khongdee-boktor.vercel.app" },
  openGraph: {
    title: "ของดีบอกต่อ — รีวิวสินค้า Shopee คัดสรรโดยคนไทย",
    description: "รวมรีวิวของดี สินค้าน่าซื้อจาก Shopee คัดสรรแล้วว่าดีจริง พร้อมเปรียบเทียบราคา",
    type: "website",
    locale: "th_TH",
    url: "https://khongdee-boktor.vercel.app",
    images: [{ url: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=630&fit=crop", width: 1200, height: 630, alt: "ของดีบอกต่อ" }],
  },
  twitter: { card: "summary_large_image", title: "ของดีบอกต่อ", description: "รีวิวสินค้า Shopee คัดสรรโดยคนไทย", images: ["https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=630&fit=crop"] },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const schema = generateWebsiteSchema();
  return (
    <html lang="th">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@300;400;500;600;700;800&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      </head>
      <body>
        <nav className="site-nav">
          <div className="site-nav-inner">
            <a href="/" className="site-logo">ของดี<span>บอกต่อ</span></a>
            <div className="nav-links">
              <a href="/category/tech">Tech</a>
              <a href="/category/home">บ้าน</a>
              <a href="/category/beauty">ความสวย</a>
              <a href="/category/health">สุขภาพ</a>
              <a href="/category/kids">แม่และเด็ก</a>
            </div>
          </div>
        </nav>

        <main>{children}</main>

        <footer className="site-footer">
          <div className="footer-inner">
            <div className="footer-top">
              <div className="footer-brand">
                <div className="footer-brand-name">ของดีบอกต่อ</div>
                <p className="footer-brand-desc">
                  รีวิวสินค้าจาก Shopee คัดสรรโดยคนไทย เราทดสอบและเปรียบเทียบเพื่อให้คุณได้ของดีจริง ไม่ต้องเสี่ยง
                </p>
              </div>
              <div className="footer-links">
                <div className="footer-links-col">
                  <h4>หมวดหมู่</h4>
                  <a href="/category/tech">Tech & Gadget</a>
                  <a href="/category/home">ของใช้ในบ้าน</a>
                  <a href="/category/beauty">ความสวยความงาม</a>
                  <a href="/category/health">สุขภาพ</a>
                </div>
                <div className="footer-links-col">
                  <h4>เกี่ยวกับ</h4>
                  <a href="/">หน้าแรก</a>
                  <a href="https://x.com/Drk_thorSx" target="_blank" rel="noopener">X (Twitter)</a>
                </div>
              </div>
            </div>
            <div className="footer-bottom">
              <span>&copy; 2026 ของดีบอกต่อ — All rights reserved</span>
              <span>* ลิงก์บางส่วนเป็น affiliate link เราอาจได้รับค่าคอมมิชชัน</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
