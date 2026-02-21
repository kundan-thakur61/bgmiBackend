// Schema.org markup generator for SEO
const generateOrganizationSchema = () => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "BattleXZone",
  "url": process.env.FRONTEND_URL,
  "logo": `${process.env.FRONTEND_URL}/logo.png`,
  "description": "Premier BGMI tournament and match booking platform",
  "sameAs": [
    "https://facebook.com/battlexzone",
    "https://twitter.com/battlexzone",
    "https://instagram.com/battlexzone"
  ]
});

const generateWebsiteSchema = () => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "BattleXZone",
  "url": process.env.FRONTEND_URL,
  "potentialAction": {
    "@type": "SearchAction",
    "target": `${process.env.FRONTEND_URL}/search?q={search_term_string}`,
    "query-input": "required name=search_term_string"
  }
});

const generateTournamentSchema = (tournament) => ({
  "@context": "https://schema.org",
  "@type": "SportsEvent",
  "name": tournament.name,
  "description": tournament.description,
  "startDate": tournament.startDate,
  "endDate": tournament.endDate,
  "location": {
    "@type": "VirtualLocation",
    "url": `${process.env.FRONTEND_URL}/tournaments/${tournament._id}`
  },
  "offers": {
    "@type": "Offer",
    "price": tournament.entryFee,
    "priceCurrency": "INR",
    "availability": "https://schema.org/InStock"
  },
  "organizer": {
    "@type": "Organization",
    "name": "BattleXZone"
  }
});

const generateMatchSchema = (match) => ({
  "@context": "https://schema.org",
  "@type": "SportsEvent",
  "name": match.title,
  "description": match.description,
  "startDate": match.scheduledTime,
  "eventStatus": "https://schema.org/EventScheduled",
  "location": {
    "@type": "VirtualLocation",
    "url": `${process.env.FRONTEND_URL}/matches/${match._id}`
  }
});

const generateBreadcrumbSchema = (items) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": items.map((item, index) => ({
    "@type": "ListItem",
    "position": index + 1,
    "name": item.name,
    "item": item.url
  }))
});

const generateFAQSchema = (faqs) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": faqs.map(faq => ({
    "@type": "Question",
    "name": faq.question,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": faq.answer
    }
  }))
});

const generateArticleSchema = (article) => ({
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": article.title,
  "description": article.description,
  "image": article.image,
  "datePublished": article.publishedDate,
  "dateModified": article.modifiedDate,
  "author": {
    "@type": "Organization",
    "name": "BattleXZone"
  }
});

const generateReviewSchema = (reviews, itemName) => ({
  "@context": "https://schema.org",
  "@type": "Product",
  "name": itemName,
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": reviews.avgRating,
    "reviewCount": reviews.count
  }
});

module.exports = {
  generateOrganizationSchema,
  generateWebsiteSchema,
  generateTournamentSchema,
  generateMatchSchema,
  generateBreadcrumbSchema,
  generateFAQSchema,
  generateArticleSchema,
  generateReviewSchema
};
