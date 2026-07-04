import type { Metadata } from 'next';

import { siteConfig } from '@/config/site';

type BuildMetadataInput = {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
  noIndex?: boolean;
  keywords?: string[];
};

export function buildMetadata({
  title,
  description = siteConfig.description,
  path = '/',
  image,
  noIndex,
  keywords,
}: BuildMetadataInput = {}): Metadata {
  const fullTitle = title
    ? `${title} — ${siteConfig.name}`
    : `${siteConfig.name} — ${siteConfig.tagline}`;
  const canonical = new URL(path, siteConfig.url).toString();
  const ogImage = image ?? siteConfig.ogImage;

  return {
    metadataBase: new URL(siteConfig.url),
    title: fullTitle,
    description,
    keywords: keywords ?? [...siteConfig.keywords],
    alternates: { canonical },
    openGraph: {
      type: 'website',
      siteName: siteConfig.name,
      title: fullTitle,
      description,
      url: canonical,
      locale: siteConfig.locale,
      images: [{ url: ogImage, width: 1200, height: 630, alt: siteConfig.name }],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [ogImage],
    },
    robots: noIndex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
        },
    // Icons are provided by the app/ file convention (icon.svg, icon.png,
    // apple-icon.png), which Next injects into every page automatically.
  };
}

export const defaultMetadata: Metadata = buildMetadata();
