import JsonLd from './JsonLd';
import { absoluteUrl, SITE_URL } from '@/lib/site';
import { htmlLanguage } from '@/lib/seo';
import type { Locale } from '@/lib/i18n';

export default function PageSchema({ locale, path, name, description, type = 'WebPage', items }: {
  locale: Locale; path: string; name: string; description: string;
  type?: 'WebPage' | 'CollectionPage' | 'AboutPage' | 'ContactPage';
  items?: { name: string; path: string }[];
}) {
  const url = absoluteUrl(`/${locale}${path}`);
  return <JsonLd data={{ '@context': 'https://schema.org', '@type': type, '@id': `${url}#webpage`, url, name, description,
    inLanguage: htmlLanguage(locale), isPartOf: { '@id': `${SITE_URL}/#website` },
    ...(items ? { mainEntity: { '@type': 'ItemList', itemListElement: items.map((item, index) => ({
      '@type': 'ListItem', position: index + 1, name: item.name, url: absoluteUrl(item.path),
    })) } } : {}),
  }} />;
}
