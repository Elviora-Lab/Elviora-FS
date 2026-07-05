import { siteConfig } from '@/config/site';

type Product = {
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  price: number;
  currency: string;
  rating?: number;
  reviewCount?: number;
  inStock?: boolean;
  brand?: string;
};

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteConfig.name,
    url: siteConfig.url,
    logo: `${siteConfig.url}/logo.png`,
    sameAs: Object.values(siteConfig.social),
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: siteConfig.contact.email,
      telephone: siteConfig.contact.phone,
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
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    description: p.description,
    image: [p.imageUrl],
    brand: { '@type': 'Brand', name: p.brand ?? siteConfig.name },
    url: `${siteConfig.url}/products/${p.slug}`,
    offers: {
      '@type': 'Offer',
      price: p.price.toFixed(2),
      priceCurrency: p.currency,
      availability:
        p.inStock === false ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
      url: `${siteConfig.url}/products/${p.slug}`,
    },
    ...(typeof p.rating === 'number' && typeof p.reviewCount === 'number' && p.reviewCount > 0
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: p.rating.toFixed(1),
            reviewCount: p.reviewCount,
          },
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
