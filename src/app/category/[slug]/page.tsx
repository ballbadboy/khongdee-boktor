import { getCategories, getReviewsByCategory } from "@/lib/reviews";
import type { Metadata } from "next";

export async function generateStaticParams() {
  return getCategories().map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const cat = getCategories().find((c) => c.slug === slug);
  const name = cat?.name || slug;
  return {
    title: `${name} — ของดีบอกต่อ`,
    description: `รวมรีวิวสินค้า ${name} จาก Shopee คัดสรรแล้วว่าดีจริง`,
    alternates: {
      canonical: `https://khongdee-boktor.vercel.app/category/${slug}`,
    },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const cat = getCategories().find((c) => c.slug === slug);
  const reviews = getReviewsByCategory(slug);

  return (
    <div className="section" style={{ paddingTop: "clamp(32px, 4vw, 48px)" }}>
      <nav className="breadcrumb">
        <a href="/">หน้าแรก</a>
        <span className="breadcrumb-sep">/</span>
        <span>{cat?.name || slug}</span>
      </nav>

      <div className="section-header">
        <h1 style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)" }}>
          {cat?.emoji} {cat?.name || slug}
        </h1>
        <span style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
          {reviews.length} รีวิว
        </span>
      </div>

      {reviews.length === 0 ? (
        <div className="empty-state">
          <p>ยังไม่มีรีวิวในหมวดนี้</p>
        </div>
      ) : (
        <div className="review-grid">
          {reviews.map((review) => (
            <a
              key={review.slug}
              href={`/review/${review.slug}`}
              className="review-card"
            >
              <div className="review-card-body">
                <div className="review-card-meta">
                  <span className="review-card-cat">{review.category}</span>
                  <span className="review-card-stars">
                    {Array.from({ length: 5 }, (_, i) =>
                      i < review.rating ? "★" : "☆"
                    ).join("")}
                  </span>
                </div>
                <h3 className="review-card-title">{review.title}</h3>
                <p className="review-card-excerpt">{review.excerpt}</p>
                <div className="review-card-footer">
                  <span className="review-card-price">{review.price}</span>
                  <span className="review-card-btn">อ่านรีวิว →</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
