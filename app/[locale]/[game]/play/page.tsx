import Breadcrumbs from '@/components/seo/Breadcrumbs';
import { pageMetadata, webAppSchema } from '@/lib/seo';
import PageSchema from '@/components/seo/PageSchema';
import { gamePageCopy } from '@/content/seo';
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PlayCube from "@/components/cube/PlayCube";
import BoardGame from "@/components/board/BoardGame";
import GoGame from "@/components/go/GoGame";
import BaccaratTrainer from "@/components/cards/BaccaratTrainer";
import BaccaratFreePractice from "@/components/cards/BaccaratFreePractice";
import GuidedTableLesson from "@/components/cards/GuidedTableLesson";
import HoldemPractice from "@/components/cards/HoldemPractice";
import MultiPokerPractice from '@/components/cards/MultiPokerPractice';
import RiichiPractice from "@/components/cards/RiichiPractice";
import SichuanPractice from "@/components/cards/SichuanPractice";
import McrPractice from "@/components/cards/McrPractice";
import WinCondition from "@/components/ui/WinCondition";
import { isBoardGame } from "@/lib/board/variants";
import GameDiagram from "@/components/ui/GameDiagram";
import { games, getGame, isGameSlug } from "@/content/games";
import { getDict, isLocale, locales } from "@/lib/i18n";

export function generateStaticParams() {
  return locales.flatMap((locale) => games.map((g) => ({ locale, game: g.slug })));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; game: string }> }): Promise<Metadata> {
  const { locale, game } = await params;
  const g = getGame(game);
  if (!isLocale(locale) || !g) return {};
  const copy = gamePageCopy(g.slug, g.name[locale], locale, 'play');
  return pageMetadata(locale, `/${game}/play`, copy.title, copy.description);
}

export default async function PlayPage({ params }: { params: Promise<{ locale: string; game: string }> }) {
  const { locale, game } = await params;
  if (!isLocale(locale) || !isGameSlug(game)) notFound();
  const g = getGame(game)!;
  const dict = getDict(locale);
  const copy = gamePageCopy(g.slug, g.name[locale], locale, 'play');

  return (<>
    <PageSchema locale={locale} path={`/${game}/play`} game={game} name={copy.title} description={copy.description}
      mainEntity={webAppSchema(locale, `/${game}/play`, copy.title, copy.description, game === 'cube' || game === 'baccarat')} />
    <Breadcrumbs locale={locale} items={[{ name: locale === 'zh' ? '弈方首页' : 'Yifang home', path: `/${locale}` }, { name: g.name[locale], path: `/${locale}/${game}` }, { name: gamePageCopy(g.slug, g.name[locale], locale, 'play').title, path: `/${locale}/${game}/play` }]} />
    <div className="mx-auto max-w-[1400px] px-5 pt-4 pb-10 sm:px-8 lg:pb-14">
      <h1 className="page-title mt-2">
        {g.name[locale]}
        <span className="sep">·</span><wbr />
        {game === "baccarat" ? (locale === "zh" ? "规则训练" : "Rules training") : dict.hubPlayTitle}
      </h1>
      <p className="mt-4 max-w-3xl leading-8 text-ink-2">{copy.description}</p>
      <WinCondition game={game} locale={locale} />
      {game==='holdem' && <MultiPokerPractice locale={locale}/>}
      {game==='mahjong' && <SichuanPractice locale={locale}/>}
      {game==='mahjong' && <details className="my-6"><summary className="cursor-pointer text-xl font-bold">{locale==='zh'?'国标麻将：独立规则练习':'MCR Mahjong: separate rules practice'}</summary><McrPractice locale={locale}/></details>}
      {(isBoardGame(game)||game==="go"||game==="holdem"||game==="mahjong")&&<Link className="rpg-button mt-6" href={`/${locale}/${game}/remote`}>{locale==="zh"?"网络对战 · 创建 / 加入好友房间":"Online play · Create / join a room"} ↗</Link>}
      {game === "cube" ? (
        <div className="ruled mt-10 border-2 border-ink p-4 sm:p-8">
          <PlayCube heightClass="h-[60vh] min-h-[420px]" labels={{ scramble: dict.scramble, reset: dict.reset, hint: dict.playHint }} />
        </div>
      ) : game === "go" ? (
        <div className="mt-10"><GoGame locale={locale}/></div>
      ) : game === "baccarat" ? (
        <div><Link className="btn-sign mt-6" href={`/${locale}/baccarat/learn/baccarat-first-lesson`}>{locale === "zh" ? "从零读懂：详细文字教程" : "Read the complete beginner lesson"}</Link><GuidedTableLesson game="baccarat" locale={locale} /><details className="mt-8 border-t border-rule pt-5"><summary className="cursor-pointer text-xl font-bold">{locale === "zh" ? "自由练习：自己选结果、投入与结算" : "Free practice: choose, commit and settle"}</summary><BaccaratFreePractice locale={locale} /></details><details className="mt-8 border-t border-rule pt-5"><summary className="cursor-pointer text-xl font-bold">{locale === "zh" ? "进阶查表与随机发牌（学完第一课后）" : "Drawing reference and random rounds (after lesson one)"}</summary><BaccaratTrainer locale={locale} /></details></div>
      ) : game === "holdem" || game === "mahjong" ? (
        <div><Link className="btn-sign mt-6" href={`/${locale}/${game}/learn/${game}-first-lesson`}>{locale === "zh" ? "先读详细文字教程" : "Read the written lesson first"}</Link><GuidedTableLesson game={game} locale={locale} />{game === 'holdem' && <HoldemPractice locale={locale}/>} {game === 'mahjong' && <RiichiPractice locale={locale}/>}</div>
      ) : isBoardGame(game) ? (
        <div className="mt-10 border-t-2 border-ink pt-8">
          <BoardGame game={game} dict={dict} locale={locale} />
        </div>
      ) : (
        <div className="mt-10 grid gap-10 border-t-2 border-ink pt-10 lg:grid-cols-[1fr_1fr]">
          <div>
            <p className="display-cjk text-[28px]">{dict.comingSoon}</p>
            <p className="prose-yf mt-4">{dict.hubPlayDescSoon}</p>
            <Link href={`/${locale}/${game}/learn`} className="btn-sign mt-8">
              {dict.learn} →
            </Link>
          </div>
          <div className="ruled flex items-center justify-center border-2 border-ink p-10">
            <GameDiagram game={game} className="w-full max-w-[360px] text-ink" />
          </div>
        </div>
      )}
    </div>
  </>);
}
