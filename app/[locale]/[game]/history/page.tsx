import Breadcrumbs from '@/components/seo/Breadcrumbs';
import { pageMetadata } from '@/lib/seo';
import { gamePageCopy } from '@/content/seo';
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getGame, isGameSlug } from "@/content/games";
import { gamesWith, histories } from "@/content/sections";
import { getDict, isLocale, locales } from "@/lib/i18n";

export function generateStaticParams() {
  return locales.flatMap((locale) => gamesWith("history").map((game) => ({ locale, game })));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; game: string }> }): Promise<Metadata> {
  const { locale, game } = await params;
  const g = getGame(game);
  if (!isLocale(locale) || !g) return {};
  const copy = gamePageCopy(g.slug, g.name[locale], locale, 'history');
  return pageMetadata(locale, `/${game}/history`, copy.title, copy.description);
}

export default async function HistoryPage({ params }: { params: Promise<{ locale: string; game: string }> }) {
  const { locale, game } = await params;
  if (!isLocale(locale) || !isGameSlug(game)) notFound();
  const entries = histories[game];
  if (!entries) notFound();
  const g = getGame(game)!;
  const dict = getDict(locale);

  return (
    <>
      <Breadcrumbs locale={locale} items={[{ name: locale === 'zh' ? '弈方首页' : 'Yifang home', path: `/${locale}` }, { name: g.name[locale], path: `/${locale}/${game}` }, { name: gamePageCopy(g.slug, g.name[locale], locale, 'history').title, path: `/${locale}/${game}/history` }]} />
      <section className="border-b-2 border-ink">
        <div className="mx-auto max-w-[1400px] px-5 py-10 sm:px-8 lg:py-14">
          <Link href={`/${locale}/${game}`} className="text-sm font-semibold text-ink-3 hover:text-vermilion">
            ← {g.name[locale]}
          </Link>
          <h1 className="display-cjk mt-4 text-[clamp(36px,5.5vw,84px)]">{g.name[locale]} · {dict.historyTitle}</h1>
          <p className="prose-yf mt-6 max-w-2xl">{gamePageCopy(g.slug, g.name[locale], locale, 'history').description}</p>
        </div>
      </section>
      <div className="mx-auto max-w-[1400px] px-5 py-10 sm:px-8 lg:py-14">
        <ol className="border-t-2 border-ink">
          {entries.map((e) => (
            <li key={e.year} className="grid gap-3 border-b border-rule py-8 md:grid-cols-[200px_1fr] md:gap-8">
              <p className="display text-[48px] leading-none text-vermilion md:text-[64px]">{e.year}</p>
              <div>
                <h2 className="text-2xl font-bold leading-snug">{e.title[locale]}</h2>
                <p className="mt-3 max-w-3xl text-[15px] leading-7 text-ink-2">{e.body[locale]}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </>
  );
}
