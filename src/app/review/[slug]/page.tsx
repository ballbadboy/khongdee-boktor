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
  const url = `https://khongdee-boktor.vercel.app/review/${slug}`;
  const img = review.image && !review.image.includes("placeholder") ? review.image : "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=630&fit=crop";
  return {
    title: `${review.title} — ของดีบอกต่อ`,
    description: review.excerpt.length < 100 ? `${review.excerpt} — รีวิวจริงจากคนใช้จริง เปรียบเทียบราคา คุณภาพ คัดมาแล้วว่าคุ้มค่า ดูรายละเอียดและราคาล่าสุดที่นี่` : review.excerpt,
    alternates: { canonical: url },
    openGraph: { title: review.title, description: review.excerpt, type: "article", url, images: [{ url: img, width: 1200, height: 630 }], locale: "th_TH" },
    twitter: { card: "summary_large_image", title: review.title, images: [img] },
  };
}

export default async function ReviewPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const review = await getReviewBySlug(slug);
  if (!review) return <p>ไม่พบรีวิว</p>;

  const schema = generateReviewSchema(review);

  return (
    <article className="review-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <div className="review-page-back">
        <a href="/">← กลับหน้าแรก</a>
      </div>

      <div className="review-page-meta">
        <span className="review-page-cat">{review.category}</span>
        <span className="review-page-date">{review.date}</span>
      </div>

      <h1 className="review-page-title">{review.title}</h1>
      <p className="review-page-excerpt">{review.excerpt}</p>

      {review.image && !review.image.includes("placeholder") && (
        <img src={review.image} alt={review.title} className="review-page-hero" loading="lazy" />
      )}

      {/* ── Product Buy Buttons — ซื้อตรงยี่ห้อเลย ── */}
      {review.products.length > 0 && (
        <div className="product-grid">
          <h2 className="product-grid-title">เลือกซื้อได้เลย</h2>
          {review.products.map((product, i) => (
            <a
              key={i}
              href={product.link}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="product-card"
            >
              <div className="product-card-info">
                <div className="product-card-name">
                  {product.name}
                  {product.badge && <span className="product-badge">{product.badge}</span>}
                </div>
                <div className="product-card-price">{product.price}</div>
              </div>
              <div className="product-card-btn">
                ซื้อเลย
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8h10m0 0L9 4m4 4L9 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
            </a>
          ))}
        </div>
      )}

      {/* ── Fallback: single buy button ── */}
      {review.products.length === 0 && (
        <div className="review-page-cta-bar">
          <div>
            <span className="review-page-stars">
              {Array.from({ length: 5 }, (_, i) => (i < review.rating ? "★" : "☆")).join("")}
            </span>
            <span className="review-page-price">{review.price}</span>
          </div>
          <a href={review.shopeeLink} target="_blank" rel="noopener noreferrer nofollow" className="shopee-btn">
            ซื้อเลยที่ Shopee
          </a>
        </div>
      )}

      <div className="prose" dangerouslySetInnerHTML={{ __html: review.content || "" }} />

      {/* ── Bottom CTA ── */}
      {review.products.length > 0 ? (
        <div className="product-grid" style={{ marginTop: 48 }}>
          <h2 className="product-grid-title">สนใจสินค้าไหน? กดซื้อได้เลย</h2>
          {review.products.map((product, i) => (
            <a
              key={i}
              href={product.link}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="product-card"
            >
              <div className="product-card-info">
                <div className="product-card-name">
                  {product.name}
                  {product.badge && <span className="product-badge">{product.badge}</span>}
                </div>
                <div className="product-card-price">{product.price}</div>
              </div>
              <div className="product-card-btn">
                ซื้อเลย
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8h10m0 0L9 4m4 4L9 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
            </a>
          ))}
        </div>
      ) : (
        <div className="review-page-bottom-cta">
          <p>สนใจสินค้านี้?</p>
          <a href={review.shopeeLink} target="_blank" rel="noopener noreferrer nofollow" className="shopee-btn">
            ดูราคาล่าสุดใน Shopee
          </a>
        </div>
      )}
    </article>
  );
}
