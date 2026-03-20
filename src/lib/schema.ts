import type { Review } from "./reviews";

const SITE_URL = "https://khongdee-boktor.vercel.app";
const SITE_NAME = "ของดีบอกต่อ";

export function generateWebsiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description:
      "รีวิวของดี สินค้าน่าซื้อจาก Shopee คัดสรรโดยทีมงานคนไทย ทดสอบจริง เปรียบเทียบราคา",
    inLanguage: "th",
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
      sameAs: ["https://x.com/Drk_thorSx"],
    },
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function generateReviewSchema(review: Review) {
  return {
    "@context": "https://schema.org",
    "@type": "Review",
    name: review.title,
    reviewBody: review.excerpt,
    datePublished: review.date,
    author: {
      "@type": "Person",
      name: "ของดีบอกต่อ",
      url: "https://x.com/Drk_thorSx",
    },
    itemReviewed: {
      "@type": "Product",
      name: review.products[0]?.name || review.title,
      image: review.image || undefined,
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
      ratingValue: review.rating || 4,
      bestRating: 5,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
  };
}

export function generateProductSchema(review: Review) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: review.products[0]?.name || review.title,
    description: review.excerpt,
    image: review.image || undefined,
    offers: {
      "@type": "Offer",
      price: review.price.replace(/[^0-9.]/g, ""),
      priceCurrency: "THB",
      url: review.shopeeLink,
      availability: "https://schema.org/InStock",
      seller: { "@type": "Organization", name: "Shopee Thailand" },
    },
    review: {
      "@type": "Review",
      reviewRating: {
        "@type": "Rating",
        ratingValue: review.rating || 4,
        bestRating: 5,
      },
      author: { "@type": "Person", name: "ของดีบอกต่อ" },
    },
  };
}

export function generateFAQSchema(faqs: { q: string; a: string }[]) {
  if (!faqs || faqs.length === 0) return null;
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

export function generateBreadcrumbSchema(
  items: { name: string; url: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
