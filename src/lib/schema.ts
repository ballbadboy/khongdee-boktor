import type { Review } from "./reviews";

const SITE_URL = "https://khongdee-boktor.vercel.app";
const SITE_NAME = "ของดีบอกต่อ";

export function generateReviewSchema(review: Review) {
  return {
    "@context": "https://schema.org",
    "@type": "Review",
    name: review.title,
    reviewBody: review.excerpt,
    datePublished: review.date,
    author: { "@type": "Person", name: "ของดีบอกต่อ" },
    itemReviewed: {
      "@type": "Product",
      name: review.title,
      image: review.image,
      offers: {
        "@type": "Offer",
        price: review.price.replace(/[^0-9.]/g, ""),
        priceCurrency: "THB",
        url: review.shopeeLink,
        availability: "https://schema.org/InStock",
      },
    },
    reviewRating: {
      "@type": "Rating",
      ratingValue: review.rating,
      bestRating: 5,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
  };
}

export function generateWebsiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description: "รีวิวของดี สินค้าน่าซื้อจาก Shopee คัดสรรโดยทีมงานคนไทย",
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function generateFAQSchema(faqs: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: { "@type": "Answer", text: faq.a },
    })),
  };
}
