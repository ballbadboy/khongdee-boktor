import { getAllReviews, getReviewBySlug } from "@/lib/reviews";
import { generateReviewSchema } from "@/lib/schema";
import type { Metadata } from "next";

export async function generateStaticParams() {
  return getAllReviews().map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const review = await getReviewBySlug(slug);
  if (!review) return { title: "ไม่พบรีวิว" };
  return {
    title: `${review.title} — ของดีบอกต่อ`,
    description: review.excerpt,
    openGraph: { title: review.title, description: review.excerpt, type: "article" },
  };
}

export default async function ReviewPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const review = await getReviewBySlug(slug);
  if (!review) return <p>ไม่พบรีวิว</p>;

  const schema = generateReviewSchema(review);

  return (
    <article className="fade-in">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <div style={{ marginBottom: 32 }}>
        <a href="/" style={{ color: "var(--text-muted)", textDecoration: "none" }}>← กลับหน้าแรก</a>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <span style={{ background: "var(--shopee-light)", color: "var(--shopee)", padding: "4px 12px", borderRadius: 4, fontSize: "0.85rem", fontWeight: 600 }}>
          {review.category}
        </span>
        <span style={{ color: "var(--text-muted)", fontSize: "0.85rem", lineHeight: "28px" }}>{review.date}</span>
      </div>

      <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: 16 }}>{review.title}</h1>
      <p style={{ fontSize: "1.1rem", color: "var(--text-muted)", marginBottom: 24 }}>{review.excerpt}</p>

      {review.image && !review.image.includes("placeholder") && (
        <img
          src={review.image}
          alt={review.title}
          style={{ width: "100%", maxHeight: 400, objectFit: "cover", borderRadius: 12, marginBottom: 24 }}
          loading="lazy"
        />
      )}

      <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <div>
          <span style={{ color: "#F59E0B", fontSize: "1.25rem" }}>
            {Array.from({ length: 5 }, (_, i) => (i < review.rating ? "★" : "☆")).join("")}
          </span>
          <span style={{ marginLeft: 12, fontWeight: 700, fontSize: "1.25rem", color: "var(--shopee)" }}>{review.price}</span>
        </div>
        <a href={review.shopeeLink} target="_blank" rel="noopener noreferrer nofollow" className="shopee-btn">
          🛒 ซื้อเลยที่ Shopee
        </a>
      </div>

      <div className="prose" dangerouslySetInnerHTML={{ __html: review.content || "" }} />

      <div style={{ background: "var(--shopee-light)", borderRadius: 12, padding: 32, textAlign: "center", marginTop: 48 }}>
        <p style={{ fontWeight: 600, fontSize: "1.25rem", marginBottom: 16 }}>สนใจสินค้านี้?</p>
        <a href={review.shopeeLink} target="_blank" rel="noopener noreferrer nofollow" className="shopee-btn" style={{ fontSize: "1.1rem", padding: "14px 32px" }}>
          🛒 ดูราคาล่าสุดใน Shopee
        </a>
      </div>
    </article>
  );
}
