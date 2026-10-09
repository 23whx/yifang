import type { MetadataRoute } from 'next';
import { publicContentPaths } from '@/lib/seo-routes';
import { locales } from '@/lib/i18n';
import { absoluteUrl, SITE_INDEXABLE } from '@/lib/site';
import { languageAlternates } from '@/lib/seo';

export const dynamic = 'force-static';
export default function sitemap(): MetadataRoute.Sitemap {
  if (!SITE_INDEXABLE) return [];
  return [
    { url: absoluteUrl('/'), alternates: { languages: languageAlternates() } },
    ...locales.flatMap(locale => publicContentPaths().map(path => ({
      url: absoluteUrl(`/${locale}${path}`), alternates: { languages: languageAlternates(path) },
    }))),
  ];
}
