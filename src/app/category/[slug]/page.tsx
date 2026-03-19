import { getReviewsByCategory, getCategories } from "@/lib/reviews";
import type { Metadata } from "next";

export function generateStaticParams() {
  return getCategories().map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const cat = getCategories().find((c) => c.slug === slug);
  return {
    title: `${cat?.name || slug} — ของดีบอกต่อ`,
    description: `รวมรีวิวสินค้า${cat?.name || ""}ที่ดีที่สุด คัดสรรจาก Shopee`,
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cat = getCategories().find((c) => c.slug === slug);
  const reviews = getReviewsByCategory(slug);

  return (
    <div className="fade-in">
      <a href="/" style={{ color: "var(--text-muted)", textDecoration: "none" }}>← กลับหน้าแรก</a>

      <h1 style={{ fontSize: "2rem", fontWeight: 700, margin: "24px 0 8px" }}>
        {cat?.emoji} {cat?.name || slug}
      </h1>
      <p style={{ color: "var(--text-muted)", marginBottom: 32 }}>
        รวมรีวิวสินค้า{cat?.name || ""}ที่ดีที่สุด คัดสรรจาก Shopee
      </p>

      {reviews.length === 0 ? (
        <p style={{ color: "var(--text-muted)", textAlign: "center", padding: 48 }}>
          ยังไม่มีรีวิวในหมวดนี้ เร็วๆ นี้!
        </p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 24 }}>
          {reviews.map((review) => (
            <a key={review.slug} href={`/review/${review.slug}`} className="card" style={{ textDecoration: "none", color: "var(--text)" }}>
              <h3 style={{ fontWeight: 600, marginBottom: 8 }}>{review.title}</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: 12 }}>{review.excerpt}</p>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#F59E0B" }}>
                  {Array.from({ length: 5 }, (_, i) => (i < review.rating ? "★" : "☆")).join("")}
                </span>
                <span style={{ fontWeight: 700, color: "var(--shopee)" }}>{review.price}</span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
