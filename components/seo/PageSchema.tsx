import JsonLd from './JsonLd';
import { absoluteUrl, SITE_URL } from '@/lib/site';
import { gameEntity, htmlLanguage, socialImage } from '@/lib/seo';
import type { GameSlug } from '@/content/games';
import type { Locale } from '@/lib/i18n';

/** The page node every indexable page carries; it links the site, its breadcrumb trail, its game and its main content by @id. */
export default function PageSchema({ locale, path, name, description, type = 'WebPage', items, game, mainEntity, dateModified }: {
  locale: Locale; path: string; name: string; description: string;
  type?: 'WebPage' | 'CollectionPage' | 'AboutPage' | 'ContactPage';
  items?: { name: string; path: string }[];
  game?: GameSlug;
  /** Full node, or { '@id' } of a node published separately on the page. */
  mainEntity?: Record<string, unknown>;
  dateModified?: string;
}) {
  const url = absoluteUrl(`/${locale}${path}`);
  const list = items ? { '@type': 'ItemList', numberOfItems: items.length, itemListElement: items.map((item, index) => ({
    '@type': 'ListItem', position: index + 1, name: item.name, url: absoluteUrl(item.path),
  })) } : undefined;
  return <JsonLd data={{ '@context': 'https://schema.org', '@type': type, '@id': `${url}#webpage`, url, name, description,
    inLanguage: htmlLanguage(locale), isPartOf: { '@id': `${SITE_URL}/#website` }, publisher: { '@id': `${SITE_URL}/#organization` },
    ...(path ? { breadcrumb: { '@id': `${url}#breadcrumb` } } : {}),
    primaryImageOfPage: { '@type': 'ImageObject', url: socialImage(locale, path).url, width: 1200, height: 630 },
    ...(game ? { about: gameEntity(locale, game) } : {}),
    ...(dateModified ? { dateModified } : {}),
    ...(mainEntity ?? list ? { mainEntity: mainEntity ?? list } : {}),
  }} />;
}
