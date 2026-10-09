import Link from "next/link";
import { notFound } from "next/navigation";
import { games } from "@/content/games";
import { atlasSites } from "@/content/atlas";
import { Building } from "@/components/atlas/WorldAtlas";
import { isLocale } from "@/lib/i18n";
import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import PageSchema from '@/components/seo/PageSchema';
const pageCopy = {
  zh: {title:'八种棋类、魔方与牌桌规则指南',description:'比较八种传统游戏的用具、目标、规则与学习路线。选择魔方、棋类或牌桌，进入对应的入门教程、术语和浏览器练习。'},
  en: {title:'Explore Eight Games: Rules, Lessons & Practice',description:'Explore eight classic games and their equipment, objectives, rules and learning paths. Choose a game to find beginner lessons, glossaries and browser practice.'},
};
export async function generateMetadata({params}:{params:Promise<{locale:string}>}):Promise<Metadata> {
  const {locale}=await params;
  if(!isLocale(locale)) notFound();
  return pageMetadata(locale,'/collection',pageCopy[locale].title,pageCopy[locale].description);
}
export default async function Collection({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const zh = locale === "zh";
  return (
    <div className="rpg-directory">
      <Breadcrumbs locale={locale} items={[{name:zh?'弈方首页':'Yifang home',path:`/${locale}`},{name:pageCopy[locale].title,path:`/${locale}/collection`}]} />
      <PageSchema locale={locale} path="/collection" name={pageCopy[locale].title} description={pageCopy[locale].description} type="CollectionPage"
        items={games.map(g => ({name:g.name[locale],path:`/${locale}/${g.slug}`}))} />
      <span className="atlas-eyebrow">THE EXPLORER’S COLLECTION</span>
      <h1>{pageCopy[locale].title}</h1>
      <p>
        {zh
          ? "八处目的地，八种看待世界的方式。选择一座据点，认识它的规则与故事。"
          : "Eight destinations. Eight ways to see the world. Discover the rules and stories behind each game."}
      </p>
      <div className="rpg-game-grid">
        {games.map((g) => {
          const s = atlasSites.find((s) => s.game === g.slug)!;
          return (
            <Link
              key={g.slug}
              className="rpg-game-card"
              href={`/${locale}/${g.slug}`}
            >
              <Building index={s.sprite} />
              <small>{s.origin[zh ? 0 : 1]}</small>
              <h2>{g.name[locale]}</h2>
              <p>{g.tagline[locale]}</p>
              <span>
                {g.playable
                  ? zh
                    ? "探索与游玩"
                    : "Explore & play"
                  : zh
                    ? "规则与故事"
                    : "Rules & stories"}{" "}
                →
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
