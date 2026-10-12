import Breadcrumbs from '@/components/seo/Breadcrumbs';
import JsonLd from '@/components/seo/JsonLd';
import { absoluteUrl } from '@/lib/site';
import { pageMetadata } from '@/lib/seo';
import { gamePageCopy } from '@/content/seo';
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getGame, isGameSlug } from "@/content/games";
import { gamesWith, glossaries } from "@/content/sections";
import { getDict, isLocale, locales } from "@/lib/i18n";
import MahjongFigure from "@/components/cards/MahjongFigure";

// Basic table vocabulary now lives in Lesson 1; the optional reference covers later terms.
const foundationSections: Record<string, string> = { 'table-words': 'beginner-draw', sets: 'beginner-names', calls: 'beginner-calls' };
function mahjongTermLesson(locale: 'zh' | 'en', id: string) {
  const section = foundationSections[id];
  return section ? `/${locale}/mahjong/learn/mahjong-first-lesson/#step-${section}` : `/${locale}/mahjong/learn/mahjong-terms/#step-${id}`;
}

export function generateStaticParams() {
  return locales.flatMap((locale) => gamesWith("glossary").map((game) => ({ locale, game })));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; game: string }> }): Promise<Metadata> {
  const { locale, game } = await params;
  const g = getGame(game);
  if (!isLocale(locale) || !g) return {};
  const copy = gamePageCopy(g.slug, g.name[locale], locale, 'glossary');
  return pageMetadata(locale, `/${game}/glossary`, copy.title, copy.description);
}

export default async function GlossaryPage({ params }: { params: Promise<{ locale: string; game: string }> }) {
  const { locale, game } = await params;
  if (!isLocale(locale) || !isGameSlug(game)) notFound();
  const entries = glossaries[game];
  if (!entries) notFound();
  const g = getGame(game)!;
  const dict = getDict(locale);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "DefinedTermSet",
    name: `${g.name[locale]} · ${dict.glossaryTitle}`,
    inLanguage: locale === "zh" ? "zh-CN" : "en",
    url: absoluteUrl(`/${locale}/${game}/glossary`),
    hasDefinedTerm: entries.map((e) => ({
      "@type": "DefinedTerm",
      name: e.term[locale],
      description: e.def[locale],
      url: `${absoluteUrl(`/${locale}/${game}/glossary`)}#${e.id}`,
    })),
  };

  return (
    <>
      <Breadcrumbs locale={locale} items={[{ name: locale === 'zh' ? '弈方首页' : 'Yifang home', path: `/${locale}` }, { name: g.name[locale], path: `/${locale}/${game}` }, { name: gamePageCopy(g.slug, g.name[locale], locale, 'glossary').title, path: `/${locale}/${game}/glossary` }]} />
      <JsonLd data={jsonLd} />
      <section className="border-b-2 border-ink">
        <div className="mx-auto max-w-[1400px] px-5 pt-4 pb-10 sm:px-8 lg:pb-14">
          <h1 className="page-title mt-2">{g.name[locale]} · {dict.glossaryTitle}</h1>
          <p className="prose-yf mt-6 max-w-2xl">{gamePageCopy(g.slug, g.name[locale], locale, 'glossary').description}</p>
        </div>
      </section>
      <div className="mx-auto max-w-[1400px] px-5 py-10 sm:px-8 lg:py-14">
        {game === 'mahjong' && <p className="mb-8 max-w-3xl leading-8">{locale === 'zh' ? '这里可以按词查图。第一次学习，先读认牌与摸打第一课，之后按需要查阅：' : 'Use this as a picture dictionary. Start with Lesson 1 for tiles and turns, then consult: '}<Link className="underline" href={`/${locale}/mahjong/learn/mahjong-terms/`}>{locale === 'zh' ? '可选参考：看图查麻将术语' : 'Optional illustrated mahjong reference'}</Link>。{locale === 'zh' ? '立直、役、宝牌、振听等日麻术语不适用于所有地区麻将。' : 'Riichi-specific terms are not universal mahjong rules.'}</p>}
        <dl className="border-t-2 border-ink">
          {entries.map((e) => (
            <div key={e.id} id={e.id} className="grid gap-2 border-b border-rule py-6 scroll-mt-24 md:grid-cols-[280px_1fr] md:gap-8">
              <dt>
                <span className="text-xl font-bold">{e.term[locale]}</span>
                {e.alias && e.alias !== e.term[locale] && <span className="ml-2 text-sm text-ink-3">{e.alias}</span>}
              </dt>
              <dd className="min-w-0 text-[15px] leading-7 text-ink-2">
                {e.def[locale]}
                {e.alg && <span className="notation ml-2 bg-paper-2 px-1.5 py-0.5 text-sm text-ink">{e.alg}</span>}
                {game === 'mahjong' && <><MahjongFigure id={e.id} locale={locale}/><Link className="underline" href={mahjongTermLesson(locale, e.id)}>{locale === 'zh' ? '继续读：发生时机、反例与容易误解的地方 →' : 'Read timing, examples and pitfalls →'}</Link></>}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </>
  );
}
