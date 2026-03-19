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
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@300;400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      </head>
      <body>
        <nav style={{ background: "var(--bg-card)", borderBottom: "1px solid rgba(0,0,0,0.08)", padding: "16px 0", position: "sticky", top: 0, zIndex: 50 }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <a href="/" style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--shopee)", textDecoration: "none" }}>
              🛒 ของดีบอกต่อ
            </a>
            <div style={{ display: "flex", gap: 24 }}>
              <a href="/category/tech" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Tech</a>
              <a href="/category/home" style={{ color: "var(--text-muted)", textDecoration: "none" }}>บ้าน</a>
              <a href="/category/beauty" style={{ color: "var(--text-muted)", textDecoration: "none" }}>ความสวย</a>
              <a href="/category/health" style={{ color: "var(--text-muted)", textDecoration: "none" }}>สุขภาพ</a>
            </div>
          </div>
        </nav>
        <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
          {children}
        </main>
        <footer style={{ background: "var(--bg-card)", padding: "48px 24px", marginTop: 64, textAlign: "center", color: "var(--text-muted)" }}>
          <p style={{ fontWeight: 600, marginBottom: 8 }}>🛒 ของดีบอกต่อ</p>
          <p style={{ fontSize: "0.875rem" }}>รีวิวสินค้าจาก Shopee คัดสรรโดยคนไทย</p>
          <p style={{ fontSize: "0.75rem", marginTop: 16 }}>* ลิงก์บางส่วนเป็น affiliate link เราอาจได้รับค่าคอมมิชชันจากการซื้อสินค้าผ่านลิงก์</p>
        </footer>
      </body>
    </html>
  );
}
