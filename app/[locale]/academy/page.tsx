import Link from "next/link";
import { notFound } from "next/navigation";
import { games } from "@/content/games";
import { tutorialsForGame } from "@/content/tutorials";
import { isLocale } from "@/lib/i18n";
import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import PageSchema from '@/components/seo/PageSchema';
const pageCopy = {
  zh: { title: '棋类、魔方与牌桌零基础教程目录', description: '按顺序学习魔方、国际象棋、中国象棋、将棋、围棋、麻将和牌桌规则。从零基础第一课进入图文课程，边读边操作，理解每一步的原因。' },
  en: { title: 'Beginner Tutorials: Chess, Go, Mahjong & Cube', description: 'Browse English beginner lessons for the cube, chess, xiangqi, shogi, Go, mahjong and table games. Start at lesson one and follow written explanations with practice.' },
};
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return pageMetadata(locale, '/academy', pageCopy[locale].title, pageCopy[locale].description);
}
export default async function Academy({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const zh = locale === "zh";
  return (<>
    <Breadcrumbs locale={locale} items={[{name:zh?'弈方首页':'Yifang home',path:`/${locale}`},{name:pageCopy[locale].title,path:`/${locale}/academy`}]} />
    <div className="rpg-directory">
      <PageSchema locale={locale} path="/academy" name={pageCopy[locale].title} description={pageCopy[locale].description} type="CollectionPage"
        items={games.flatMap(g => tutorialsForGame(g.slug).map(t => ({name:t.title[locale],path:`/${locale}/${g.slug}/learn/${t.slug}`})))} />
      <span className="atlas-eyebrow">THE ADVENTURER’S ACADEMY</span>
      <h1>{pageCopy[locale].title}</h1>
      <p>
        {zh
          ? "先认识棋子与规则，再动手练习。不需要任何基础。"
          : "Meet the pieces, learn the rules, then put them into practice. No experience needed."}
      </p>
      <div className="academy-list">
        {games.map((g) => (
          <section key={g.slug}>
            <h2>{g.name[locale]}</h2>
            {tutorialsForGame(g.slug).map((t, i) => (
              <Link key={t.slug} href={`/${locale}/${g.slug}/learn/${t.slug}`}>
                <span>{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <h3>{t.title[locale]}</h3>
                  <p>{t.description[locale]}</p>
                </div>
                <small>
                  {t.minutes} {zh ? "分钟" : "min"} ↗
                </small>
              </Link>
            ))}
          </section>
        ))}
      </div>
    </div>
  </>);
}
