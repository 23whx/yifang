import type { Metadata } from "next";
import { SITE_URL, SITE_INDEXABLE, absoluteUrl } from '@/lib/site';
import { languageAlternates } from '@/lib/seo';
import JsonLd from '@/components/seo/JsonLd';

export const metadata: Metadata = {
  title: "弈方 · Yifang",
  description: "选择语言，开始学习与游玩。 Choose a language to learn and play.",
  metadataBase: new URL(SITE_URL),
  alternates: { canonical: absoluteUrl('/'), languages: languageAlternates() },
  robots: { index: SITE_INDEXABLE, follow: true },
};

export default function EntryLayout({ children }: { children: React.ReactNode }) {
  return <html lang="zh-CN"><body>
    <JsonLd data={{ '@context': 'https://schema.org', '@type': 'WebSite', '@id': `${SITE_URL}/#website`, url: `${SITE_URL}/`,
      name: '弈方 · Yifang', alternateName: ['弈方', 'Yifang'], inLanguage: ['zh-CN', 'en'],
    }} />
    {children}</body></html>;
}
