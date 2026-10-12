import type { Metadata } from "next";
import { SITE_URL, SITE_INDEXABLE, absoluteUrl } from '@/lib/site';
import { languageAlternates, siteVerification, organizationSchema, socialImage } from '@/lib/seo';
import JsonLd from '@/components/seo/JsonLd';

const title = '弈方 Yifang｜象棋、围棋、国际象棋与魔方入门教程 · Learn Chess, Go & More';
const image = socialImage('zh');
const description = '免费学下棋：象棋、围棋、国际象棋、将棋、麻将、德州扑克与魔方的中英文入门教程，人机对弈与好友在线对战，无需注册。 Free bilingual lessons for classic games.';

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  metadataBase: new URL(SITE_URL),
  alternates: { canonical: absoluteUrl('/'), languages: languageAlternates() },
  robots: { index: SITE_INDEXABLE, follow: true },
  openGraph: { title, description, url: absoluteUrl('/'), siteName: '弈方 · Yifang', type: 'website', locale: 'zh_CN', alternateLocale: ['en_US'],
    images: [image] },
  twitter: { card: 'summary_large_image', title, description, images: [{ url: image.url, alt: image.alt }] },
  verification: siteVerification(),
  other: { 'applicable-device': 'pc,mobile' },
};

export default function EntryLayout({ children }: { children: React.ReactNode }) {
  return <html lang="zh-CN"><body>
    <JsonLd data={{ '@context': 'https://schema.org', '@type': 'WebSite', '@id': `${SITE_URL}/#website`, url: `${SITE_URL}/`,
      name: '弈方 · Yifang', alternateName: ['弈方', 'Yifang'], inLanguage: ['zh-CN', 'en'], publisher: { '@id': `${SITE_URL}/#organization` },
    }} />
    <JsonLd data={organizationSchema()} />
    {children}</body></html>;
}
