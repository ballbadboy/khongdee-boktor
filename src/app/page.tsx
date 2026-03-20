import { getAllReviews, getCategories } from "@/lib/reviews";

function Stars({ rating }: { rating: number }) {
  return (
    <span className="review-card-stars">
      {Array.from({ length: 5 }, (_, i) => (i < rating ? "★" : "☆")).join("")}
    </span>
  );
}

export default function Home() {
  const reviews = getAllReviews();
  const categories = getCategories();

  return (
    <>
      <section className="hero">
        <div className="hero-badge animate-in">
          <span>●</span> อัพเดทล่าสุด{" "}
          {new Date().toLocaleDateString("th-TH", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </div>
        <h1 className="animate-in delay-1">
          คัดมาแล้ว
          <br />
          <em>ของดีจริง</em>
        </h1>
        <p className="hero-sub animate-in delay-2">
          รวมรีวิวสินค้าจาก Shopee ที่คนใช้จริงบอกต่อ
          ไม่ต้องเสียเวลาหาเอง ไม่ต้องเสี่ยงซื้อผิด ทุกชิ้นคัดสรรมาแล้วว่าคุ้มค่า
        </p>
        <a href="#reviews" className="hero-cta animate-in delay-3">
          ดูรีวิวล่าสุด
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M3 8h10m0 0L9 4m4 4L9 12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </a>
      </section>

      <div className="trust-bar animate-in delay-4">
        <div className="trust-item">
          <div className="trust-icon">✓</div>
          <span>รีวิวจากคนใช้จริง</span>
        </div>
        <div className="trust-item">
          <div className="trust-icon">✕</div>
          <span>ไม่รับสปอนเซอร์</span>
        </div>
        <div className="trust-item">
          <div className="trust-icon">↻</div>
          <span>อัพเดททุกสัปดาห์</span>
        </div>
        <div className="trust-item">
          <div className="trust-icon">🛡</div>
          <span>คัดสรรก่อนแนะนำ</span>
        </div>
      </div>

      <section className="section">
        <div className="section-header">
          <h2>หมวดหมู่</h2>
        </div>
        <div className="cat-grid">
          {categories.map((cat) => (
            <a key={cat.slug} href={`/category/${cat.slug}`} className="cat-card">
              <div className="cat-icon">{cat.emoji}</div>
              <span className="cat-name">{cat.name}</span>
            </a>
          ))}
        </div>
      </section>

      <section className="section" id="reviews">
        <div className="section-header">
          <h2>รีวิวล่าสุด</h2>
        </div>

        {reviews.length === 0 ? (
          <div className="empty-state">
            <p>กำลังเตรียมรีวิวให้... เร็วๆ นี้</p>
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
                    <Stars rating={review.rating} />
                  </div>
                  <h3 className="review-card-title">{review.title}</h3>
                  <p className="review-card-excerpt">{review.excerpt}</p>
                  <div className="review-card-footer">
                    <span className="review-card-price">{review.price}</span>
                    <span className="review-card-btn">
                      อ่านรีวิว
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                        <path
                          d="M3 8h10m0 0L9 4m4 4L9 12"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
