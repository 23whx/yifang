import type { Metadata } from 'next';
import { getDict, type Locale } from '@/lib/i18n';
import { absoluteUrl, SITE_INDEXABLE, SITE_URL } from '@/lib/site';
import { contact } from '@/content/site-info';
import { games, type GameSlug } from '@/content/games';
import { socialCards } from '@/content/social';

export const htmlLanguage = (locale: Locale) => locale === 'zh' ? 'zh-CN' : 'en';

/** path is the locale-independent suffix, e.g. /chess/learn. */
export function languageAlternates(path = '') {
  return { 'zh-CN': absoluteUrl(`/zh${path}`), en: absoluteUrl(`/en${path}`), 'x-default': absoluteUrl(path ? `/zh${path}` : '/') };
}

/** Share card for a page: the game's own card under /{game}, otherwise the site card. */
export function socialImage(locale: Locale, path = '') {
  const game = games.find(g => path === `/${g.slug}` || path.startsWith(`/${g.slug}/`))?.slug as GameSlug | undefined;
  const card = game ? socialCards.games[game][locale] : socialCards.site[locale];
  return { url: `${SITE_URL}/social/${game ? `${game}-` : ''}${locale}.jpg`, width: 1200, height: 630, alt: card.alt, type: 'image/jpeg' };
}

export function pageMetadata(locale: Locale, path: string, title: string, description: string): Metadata {
  const dict = getDict(locale);
  const url = absoluteUrl(`/${locale}${path}`);
  const fullTitle = `${title} | ${dict.siteName}`;
  const index = SITE_INDEXABLE;
  const image = socialImage(locale, path);
  return {
    metadataBase: new URL(SITE_URL),
    title: { absolute: fullTitle },
    description,
    alternates: { canonical: url, languages: languageAlternates(path) },
    robots: { index, follow: true, googleBot: { index, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 } },
    openGraph: {
      title: fullTitle, description, url, siteName: dict.siteName, type: 'website',
      locale: locale === 'zh' ? 'zh_CN' : 'en_US', alternateLocale: [locale === 'zh' ? 'en_US' : 'zh_CN'],
      images: [image],
    },
    twitter: { card: 'summary_large_image', title: fullTitle, description, images: [{ url: image.url, alt: image.alt }] },
    // Baidu reads this to serve the same page to phones and computers.
    other: { 'applicable-device': 'pc,mobile' },
  };
}

/** Search-console ownership tags, filled from the deployment environment only. */
export function siteVerification(): Metadata['verification'] {
  const other: Record<string, string> = {};
  if (process.env.BAIDU_SITE_VERIFICATION) other['baidu-site-verification'] = process.env.BAIDU_SITE_VERIFICATION;
  if (process.env.BING_SITE_VERIFICATION) other['msvalidate.01'] = process.env.BING_SITE_VERIFICATION;
  if (!process.env.GOOGLE_SITE_VERIFICATION && !Object.keys(other).length) return undefined;
  return { ...(process.env.GOOGLE_SITE_VERIFICATION ? { google: process.env.GOOGLE_SITE_VERIFICATION } : {}), ...(Object.keys(other).length ? { other } : {}) };
}

/** Who runs the site: name, address and a contact point, for search engines' site details. */
export function organizationSchema() {
  return { '@context': 'https://schema.org', '@type': 'Organization', '@id': `${SITE_URL}/#organization`, name: '弈方 · Yifang', alternateName: ['弈方', 'Yifang'], url: `${SITE_URL}/`,
    email: contact.email, contactPoint: { '@type': 'ContactPoint', contactType: 'customer support', email: contact.email, availableLanguage: ['zh-CN', 'en'] } };
}

export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

export type Breadcrumb = { name: string; path: string };
/** The trail's @id is the current (last) page URL + #breadcrumb, so the page entity can point at it. */
export function breadcrumbSchema(items: Breadcrumb[]) {
  return { '@context': 'https://schema.org', '@type': 'BreadcrumbList', '@id': `${absoluteUrl(items[items.length - 1].path)}#breadcrumb`, itemListElement: items.map((item, index) => ({
    '@type': 'ListItem', position: index + 1, name: item.name, item: absoluteUrl(item.path),
  })) };
}

/** The game a page is about; one node per locale, identified by its hub page. */
export function gameEntity(locale: Locale, slug: GameSlug) {
  const game = games.find(g => g.slug === slug)!;
  const url = absoluteUrl(`/${locale}/${slug}`);
  return { '@type': 'Game', '@id': `${url}#game`, name: game.name[locale], url };
}

/** A free browser app on a play/remote page (no install, no account). */
export function webAppSchema(locale: Locale, path: string, name: string, description: string, educational = false, features: string[] = []) {
  return { '@type': 'WebApplication', '@id': `${absoluteUrl(`/${locale}${path}`)}#app`, name, description, url: absoluteUrl(`/${locale}${path}`),
    applicationCategory: educational ? 'EducationalApplication' : 'GameApplication', operatingSystem: 'Any', browserRequirements: 'Requires JavaScript and a modern browser',
    inLanguage: htmlLanguage(locale), isAccessibleForFree: true, offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
    ...(features.length ? { featureList: features } : {}), publisher: { '@id': `${SITE_URL}/#organization` } };
}
