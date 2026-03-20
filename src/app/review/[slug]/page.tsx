import { getAllReviews, getReviewBySlug } from "@/lib/reviews";
import {
  generateReviewSchema,
  generateProductSchema,
  generateFAQSchema,
  generateBreadcrumbSchema,
} from "@/lib/schema";
import type { Metadata } from "next";

export async function generateStaticParams() {
  return getAllReviews().map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const review = await getReviewBySlug(slug);
  if (!review) return { title: "ไม่พบรีวิว" };
  const url = `https://khongdee-boktor.vercel.app/review/${slug}`;
  return {
    title: `${review.title} — ของดีบอกต่อ`,
    description:
      review.excerpt.length < 120
        ? `${review.excerpt} — รีวิวจริงจากคนใช้จริง เปรียบเทียบราคา คัดมาแล้วว่าคุ้มค่า`
        : review.excerpt,
    alternates: { canonical: url },
    openGraph: {
      title: review.title,
      description: review.excerpt,
      type: "article",
      url,
      locale: "th_TH",
    },
    twitter: {
      card: "summary_large_image",
      site: "@Drk_thorSx",
      title: review.title,
    },
  };
}

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const review = await getReviewBySlug(slug);
  if (!review) return <p>ไม่พบรีวิว</p>;

  const reviewSchema = generateReviewSchema(review);
  const productSchema = generateProductSchema(review);
  const faqSchema = generateFAQSchema(review.faq);
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "หน้าแรก", url: "https://khongdee-boktor.vercel.app" },
    {
      name: review.category,
      url: `https://khongdee-boktor.vercel.app/category/${review.category}`,
    },
    {
      name: review.title,
      url: `https://khongdee-boktor.vercel.app/review/${slug}`,
    },
  ]);

  return (
    <article className="review-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(reviewSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}

      <nav className="breadcrumb">
        <a href="/">หน้าแรก</a>
        <span className="breadcrumb-sep">/</span>
        <a href={`/category/${review.category}`}>{review.category}</a>
        <span className="breadcrumb-sep">/</span>
        <span>{review.title.slice(0, 40)}...</span>
      </nav>

      <div className="review-page-meta">
        <span className="review-page-cat">{review.category}</span>
        <span className="review-page-date">{review.date}</span>
      </div>

      <h1 className="review-page-title">{review.title}</h1>
      <p className="review-page-excerpt">{review.excerpt}</p>

      {/* Product Buy Buttons */}
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
                  {product.badge && (
                    <span className="product-badge">{product.badge}</span>
                  )}
                </div>
                <div className="product-card-price">{product.price}</div>
              </div>
              <div className="product-card-btn">
                ซื้อเลย
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M3 8h10m0 0L9 4m4 4L9 12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </a>
          ))}
        </div>
      )}

      {/* Pros & Cons */}
      {(review.pros.length > 0 || review.cons.length > 0) && (
        <div className="pros-cons">
          {review.pros.length > 0 && (
            <div className="pros-box">
              <h3>ข้อดี</h3>
              <ul>
                {review.pros.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </div>
          )}
          {review.cons.length > 0 && (
            <div className="cons-box">
              <h3>ข้อควรระวัง</h3>
              <ul>
                {review.cons.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Article Body */}
      <div
        className="prose"
        dangerouslySetInnerHTML={{ __html: review.content || "" }}
      />

      {/* FAQ */}
      {review.faq.length > 0 && (
        <div className="faq-section">
          <h2>คำถามที่พบบ่อย</h2>
          {review.faq.map((item, i) => (
            <div key={i} className="faq-item">
              <div className="faq-q">{item.q}</div>
              <div className="faq-a">{item.a}</div>
            </div>
          ))}
        </div>
      )}

      {/* Bottom CTA */}
      {review.products.length > 0 && (
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
                <div className="product-card-name">{product.name}</div>
                <div className="product-card-price">{product.price}</div>
              </div>
              <div className="product-card-btn">
                ดูราคาล่าสุด
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M3 8h10m0 0L9 4m4 4L9 12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </a>
          ))}
        </div>
      )}
    </article>
  );
}
