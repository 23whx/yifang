import type { Metadata } from 'next';
import { getDict, type Locale } from '@/lib/i18n';
import { absoluteUrl, SITE_INDEXABLE, SITE_URL } from '@/lib/site';

export const htmlLanguage = (locale: Locale) => locale === 'zh' ? 'zh-CN' : 'en';

/** path is the locale-independent suffix, e.g. /chess/learn. */
export function languageAlternates(path = '') {
  return { 'zh-CN': absoluteUrl(`/zh${path}`), en: absoluteUrl(`/en${path}`), 'x-default': absoluteUrl(path ? `/zh${path}` : '/') };
}

export function pageMetadata(locale: Locale, path: string, title: string, description: string): Metadata {
  const dict = getDict(locale);
  const url = absoluteUrl(`/${locale}${path}`);
  const fullTitle = `${title} | ${dict.siteName}`;
  const index = SITE_INDEXABLE;
  return {
    metadataBase: new URL(SITE_URL),
    title: { absolute: fullTitle },
    description,
    alternates: { canonical: url, languages: languageAlternates(path) },
    robots: { index, follow: true, googleBot: { index, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 } },
    openGraph: {
      title: fullTitle, description, url, siteName: dict.siteName, type: 'website',
      locale: locale === 'zh' ? 'zh_CN' : 'en_US', alternateLocale: [locale === 'zh' ? 'en_US' : 'zh_CN'],
      images: [{ url: `${SITE_URL}/social/${locale}.png`, width: 1200, height: 630, alt: locale === 'zh' ? '弈方：学习规则，动手练习' : 'Yifang: learn the rules and practice' }],
    },
    twitter: { card: 'summary_large_image', title: fullTitle, description, images: [`${SITE_URL}/social/${locale}.png`] },
  };
}

export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

export type Breadcrumb = { name: string; path: string };
export function breadcrumbSchema(items: Breadcrumb[]) {
  return { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items.map((item, index) => ({
    '@type': 'ListItem', position: index + 1, name: item.name, item: absoluteUrl(item.path),
  })) };
}
