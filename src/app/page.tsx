import { getAllReviews, getCategories } from "@/lib/reviews";

function StarRating({ rating }: { rating: number }) {
  return <span>{Array.from({ length: 5 }, (_, i) => (i < rating ? "★" : "☆")).join("")}</span>;
}

export default function Home() {
  const reviews = getAllReviews();
  const categories = getCategories();

  return (
    <>
      <section style={{ textAlign: "center", padding: "48px 0" }} className="fade-in">
        <h1 style={{ fontSize: "2.5rem", fontWeight: 700, marginBottom: 16 }}>
          🛒 ของดีบอกต่อ
        </h1>
        <p style={{ fontSize: "1.25rem", color: "var(--text-muted)", maxWidth: 600, margin: "0 auto" }}>
          รวมรีวิวสินค้าดี ราคาโดน จาก Shopee คัดสรรแล้วว่าดีจริง ไม่ต้องเสียเวลาหาเอง
        </p>
      </section>

      <section style={{ marginBottom: 48 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 16 }}>
          {categories.map((cat) => (
            <a key={cat.slug} href={`/category/${cat.slug}`} className="card" style={{ textAlign: "center", textDecoration: "none", color: "var(--text)" }}>
              <span style={{ fontSize: "2rem" }}>{cat.emoji}</span>
              <p style={{ fontWeight: 600, marginTop: 8 }}>{cat.name}</p>
            </a>
          ))}
        </div>
      </section>

      <section>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 24 }}>รีวิวล่าสุด</h2>
        {reviews.length === 0 ? (
          <p style={{ color: "var(--text-muted)", textAlign: "center", padding: 48 }}>
            กำลังเตรียมรีวิวให้... เร็วๆ นี้!
          </p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 24 }}>
            {reviews.map((review) => (
              <a key={review.slug} href={`/review/${review.slug}`} className="card fade-in" style={{ textDecoration: "none", color: "var(--text)", overflow: "hidden" }}>
                {review.image && !review.image.includes("placeholder") && (
                  <img src={review.image} alt={review.title} style={{ width: "100%", height: 180, objectFit: "cover", borderRadius: 8, marginBottom: 12 }} loading="lazy" />
                )}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 12 }}>
                  <span style={{ fontSize: "0.75rem", background: "var(--shopee-light)", color: "var(--shopee)", padding: "4px 8px", borderRadius: 4, fontWeight: 600 }}>
                    {review.category}
                  </span>
                  <span style={{ color: "#F59E0B" }}><StarRating rating={review.rating} /></span>
                </div>
                <h3 style={{ fontWeight: 600, fontSize: "1.1rem", marginBottom: 8 }}>{review.title}</h3>
                <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: 12 }}>{review.excerpt}</p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 700, color: "var(--shopee)" }}>{review.price}</span>
                  <span className="shopee-btn" style={{ padding: "8px 16px", fontSize: "0.85rem" }}>ดูใน Shopee</span>
                </div>
              </a>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
