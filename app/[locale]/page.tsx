import { notFound } from "next/navigation";
import WorldAtlas from "@/components/atlas/WorldAtlas";
import { isLocale } from "@/lib/i18n";
import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';
import { siteSearch } from '@/content/seo';
import HomeLearningGuide from '@/components/seo/HomeLearningGuide';
import PageSchema from '@/components/seo/PageSchema';
import { games } from '@/content/games';
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return pageMetadata(locale, '', siteSearch[locale].title, siteSearch[locale].description);
}
export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <>
    <PageSchema locale={locale} path="" name={siteSearch[locale].title} description={siteSearch[locale].description} type="CollectionPage"
      items={games.map(game => ({ name: game.name[locale], path: `/${locale}/${game.slug}` }))} />
    <WorldAtlas locale={locale} />
    <HomeLearningGuide locale={locale} />
  </>;
}
