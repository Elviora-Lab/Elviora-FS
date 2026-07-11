import { siteConfig } from '@/config/site';

type ProductReview = {
  author: string;
  rating: number;
  title?: string | null;
  body?: string | null;
  date?: string;
};

type Product = {
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  images?: string[];
  price: number;
  currency: string;
  sku?: string;
  rating?: number;
  reviewCount?: number;
  inStock?: boolean;
  brand?: string;
  reviews?: ProductReview[];
};

export function organizationJsonLd() {
  const addr = siteConfig.shippingFrom;
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteConfig.name,
    url: siteConfig.url,
    logo: `${siteConfig.url}/logo.png`,
    description: siteConfig.description,
    email: siteConfig.contact.email,
    sameAs: Object.values(siteConfig.social),
    areaServed: { '@type': 'Country', name: 'Pakistan' },
    address: {
      '@type': 'PostalAddress',
      streetAddress: addr.addressLine1,
      addressLocality: addr.city,
      addressRegion: addr.area,
      postalCode: addr.postalCode,
      addressCountry: addr.country,
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: siteConfig.contact.email,
      telephone: siteConfig.contact.phone,
      areaServed: 'PK',
      availableLanguage: ['en', 'ur'],
    },
  } as const;
}

export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteConfig.name,
    url: siteConfig.url,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${siteConfig.url}/search?q={query}`,
      'query-input': 'required name=query',
    },
  } as const;
}

export function productJsonLd(p: Product) {
  const url = `${siteConfig.url}/products/${p.slug}`;
  // Keep the offer valid ~a year out so Google never flags the price as expired.
  const priceValidUntil = `${new Date().getFullYear() + 1}-12-31`;
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    description: p.description,
    image: p.images?.length ? p.images : [p.imageUrl],
    ...(p.sku ? { sku: p.sku } : {}),
    brand: { '@type': 'Brand', name: p.brand ?? siteConfig.name },
    url,
    offers: {
      '@type': 'Offer',
      price: p.price.toFixed(2),
      priceCurrency: p.currency,
      priceValidUntil,
      itemCondition: 'https://schema.org/NewCondition',
      availability:
        p.inStock === false ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
      url,
      seller: { '@type': 'Organization', name: siteConfig.name },
      // 30-day returns is a store-wide, advertised policy — safe to declare.
      hasMerchantReturnPolicy: {
        '@type': 'MerchantReturnPolicy',
        applicableCountry: 'PK',
        returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
        merchantReturnDays: 30,
        returnMethod: 'https://schema.org/ReturnByMail',
      },
    },
    ...(typeof p.rating === 'number' && typeof p.reviewCount === 'number' && p.reviewCount > 0
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: p.rating.toFixed(1),
            reviewCount: p.reviewCount,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
    ...(p.reviews?.length
      ? {
          review: p.reviews.map((r) => ({
            '@type': 'Review',
            author: { '@type': 'Person', name: r.author },
            reviewRating: {
              '@type': 'Rating',
              ratingValue: r.rating,
              bestRating: 5,
              worstRating: 1,
            },
            ...(r.title ? { name: r.title } : {}),
            ...(r.body ? { reviewBody: r.body } : {}),
            ...(r.date ? { datePublished: r.date } : {}),
          })),
        }
      : {}),
  } as const;
}

type Article = {
  title: string;
  description: string;
  slug: string;
  image?: string | null;
  publishedAt?: Date | null;
  modifiedAt?: Date | null;
};

export function articleJsonLd(a: Article) {
  const url = `${siteConfig.url}/blog/${a.slug}`;
  const published = a.publishedAt?.toISOString();
  const modified = (a.modifiedAt ?? a.publishedAt)?.toISOString();
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: a.title,
    description: a.description,
    ...(a.image ? { image: [a.image] } : {}),
    ...(published ? { datePublished: published } : {}),
    ...(modified ? { dateModified: modified } : {}),
    author: { '@type': 'Organization', name: siteConfig.name, url: siteConfig.url },
    publisher: {
      '@type': 'Organization',
      name: siteConfig.name,
      logo: { '@type': 'ImageObject', url: `${siteConfig.url}/logo.png` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    url,
  } as const;
}

export function faqJsonLd(items: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((i) => ({
      '@type': 'Question',
      name: i.question,
      acceptedAnswer: { '@type': 'Answer', text: i.answer },
    })),
  } as const;
}

/**
 * ItemList for a product listing / category page — helps Google understand the
 * collection and can surface it as a rich list. Positions are 1-based and point
 * at each product's canonical PDP URL.
 */
export function itemListJsonLd(items: { name: string; slug: string }[], opts: { path: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    url: new URL(opts.path, siteConfig.url).toString(),
    numberOfItems: items.length,
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${siteConfig.url}/products/${it.slug}`,
      name: it.name,
    })),
  } as const;
}

export function breadcrumbJsonLd(items: { label: string; href: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.label,
      item: new URL(item.href, siteConfig.url).toString(),
    })),
  } as const;
}
