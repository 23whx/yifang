import Breadcrumbs from '@/components/seo/Breadcrumbs';
import GameLearningGuide from '@/components/seo/GameLearningGuide';
import PageSchema from '@/components/seo/PageSchema';
import { contentDate } from '@/lib/content-dates';
import { pageMetadata } from '@/lib/seo';
import { searchTopics, gamePageCopy } from '@/content/seo';
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import GameDiagram from "@/components/ui/GameDiagram";
import { Building } from "@/components/atlas/WorldAtlas";
import { atlasSites } from "@/content/atlas";
import PlayCube from "@/components/cube/PlayCube";
import BoardGame from "@/components/board/BoardGame";
import { isBoardGame } from "@/lib/board/variants";
import { games, getGame, isGameSlug } from "@/content/games";
import { tutorialsForGame, localizeTutorial } from "@/content/tutorials";
import { sectionsFor } from "@/content/sections";
import { getDict, isLocale, locales } from "@/lib/i18n";

export function generateStaticParams() {
  return locales.flatMap((locale) => games.map((g) => ({ locale, game: g.slug })));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; game: string }> }): Promise<Metadata> {
  const { locale, game } = await params;
  const g = getGame(game);
  if (!isLocale(locale) || !g) return {};
  const copy = searchTopics[g.slug];
  return pageMetadata(locale, `/${game}`, copy.title[locale], copy.description[locale]);
}

export default async function GameHub({ params }: { params: Promise<{ locale: string; game: string }> }) {
  const { locale, game } = await params;
  if (!isLocale(locale) || !isGameSlug(game)) notFound();
  const g = getGame(game)!;
  const dict = getDict(locale);
  const tuts = tutorialsForGame(game).map((t) => localizeTutorial(t, locale));
  const sections = sectionsFor(game);

  return (
    <>
      <Breadcrumbs locale={locale} items={[{ name: locale === 'zh' ? '弈方首页' : 'Yifang home', path: `/${locale}` }, { name: g.name[locale], path: `/${locale}/${game}` }]} />
      <PageSchema locale={locale} path={`/${game}`} name={searchTopics[game].title[locale]} description={searchTopics[game].description[locale]} type="CollectionPage" game={game} dateModified={contentDate(`hub:${game}`)} items={tuts.map(t => ({name:t.title,path:`/${locale}/${game}/learn/${t.slug}`}))} />
      {/* 刊头：巨字 + 示意图 */}
      <section className="rpg-hub-hero grid border-b border-ink lg:grid-cols-[3fr_2fr]">
        <div className="px-5 py-12 sm:px-8 lg:px-12 lg:py-16">
          <Link href={`/${locale}`} className="atlas-eyebrow">← {locale === "zh" ? "返回世界地图" : "BACK TO THE ATLAS"}</Link>
          <h1 className="page-title mt-6">
            {g.name[locale]}
            {locale === "zh" && (
              <span className="display ml-4 align-baseline text-[0.36em] text-vermilion">{g.glyph.en}</span>
            )}
          </h1>
          <p className="mt-6 max-w-[36rem] text-xl leading-9 text-ink-2">{g.tagline[locale]}</p>
          <p className="mt-4 max-w-[40rem] text-[17px] leading-8 text-ink">{g.definition[locale]}</p>
          <dl className="mt-10 grid max-w-xl grid-cols-3 border-t-2 border-ink">
            {g.facts.map((f) => (
              <div key={f.label.en} className="border-r border-rule py-4 pr-4 last:border-r-0">
                <dt className="text-xs text-ink-3">{f.label[locale]}</dt>
                <dd className="mt-1 text-base font-bold">{f.value[locale]}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="rpg-hub-art flex items-center justify-center p-10">
          <Building index={atlasSites.find(s=>s.game===game)!.sprite} className="max-w-[380px]" />
        </div>
      </section>

      {/* 认识它 */}
      <section className="mx-auto max-w-[1400px] px-5 py-16 sm:px-8 lg:grid lg:grid-cols-[1fr_2fr] lg:gap-16 lg:py-24">
        <h2 className="display-cjk text-[clamp(32px,4vw,56px)]">{locale === "zh" ? "认识它" : "Meet the game"}</h2>
        <div className="prose-yf mt-6 lg:mt-0">
          {g.intro[locale].map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </section>

      <GameLearningGuide game={game} locale={locale} />
      {/* 教程 */}
      <section className="border-t-2 border-ink">
        <div className="mx-auto max-w-[1400px] px-5 py-16 sm:px-8 lg:py-24">
          <div className="flex items-end justify-between">
            <h2 className="display-cjk text-[clamp(32px,4vw,56px)]">{dict.hubLearnTitle}</h2>
            <Link href={`/${locale}/${game}/learn`} className="text-sm font-semibold underline underline-offset-4 hover:text-vermilion">
              {locale === "zh" ? "全部教程" : "All tutorials"} →
            </Link>
          </div>
          {tuts.length > 0 ? (
            <ol className="mt-8 border-t-2 border-ink">
              {tuts.map((t) => (
                <li key={t.slug} className="border-b border-rule">
                  <Link href={`/${locale}/${game}/learn/${t.slug}`} className="group grid gap-4 py-7 md:grid-cols-[1fr_auto] md:items-center">
                    <div>
                      <p className="text-2xl font-bold leading-snug group-hover:text-vermilion">{t.title}</p>
                      <p className="mt-2 max-w-2xl text-[15px] leading-7 text-ink-2">{t.description}</p>
                    </div>
                    <p className="text-sm text-ink-3">
                      {t.level} · {t.steps.length} {dict.stepsCount} · {t.minutes} {dict.minutes}
                    </p>
                  </Link>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-8 border-t-2 border-ink pt-6 text-ink-3">
              {locale === "zh" ? "教程撰写中。" : "Tutorials are being written."}
            </p>
          )}
        </div>
      </section>

      {/* 栏目：谜题 / 术语 / 历史 */}
      {sections.length > 0 && (
        <section className="border-t-2 border-ink">
          <div className="mx-auto max-w-[1400px] px-5 py-16 sm:px-8 lg:py-24">
            <h2 className="display-cjk text-[clamp(32px,4vw,56px)]">{dict.sections}</h2>
            <div className="mt-8 grid border-t-2 border-ink sm:grid-cols-3">
              {sections.map((s, i) => (
                <Link
                  key={s}
                  href={`/${locale}/${game}/${s}`}
                  className={`group flex flex-col justify-between gap-8 border-b border-rule py-7 transition hover:bg-ink hover:text-paper sm:border-b-0 sm:px-6 ${i > 0 ? "sm:border-l border-rule" : "sm:pl-0 sm:hover:pl-6"}`}
                >
                  <div>
                    <p className="text-2xl font-bold">{dict[`${s}Title`]}</p>
                    <p className="mt-2 text-[15px] leading-7 text-ink-2 group-hover:text-paper">{gamePageCopy(game, g.name[locale], locale, s).description}</p>
                  </div>
                  <p className="text-sm font-semibold">{dict.enter} →</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 实战 */}
      <section className="border-t-2 border-ink bg-vermilion text-paper">
        <div className="mx-auto grid max-w-[1400px] gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[1fr_1fr] lg:py-24">
          <div>
            <h2 className="display-cjk text-[clamp(32px,4vw,56px)]">{dict.hubPlayTitle}</h2>
            <p className="mt-5 max-w-md text-[15px] leading-7 text-paper">
              {game === "cube" ? dict.hubPlayDescCube : isBoardGame(game) ? dict.board.hubDesc : game === "go" ? (locale === "zh" ? "从九路棋盘开始，练习气、提子与围地。支持入门人机、同屏双人和好友直连对弈。" : "Start on a 9×9 board. Practice liberties, captures and territory with beginner AI, local play or a directly connected friend.") : game === "mahjong" ? (locale === "zh" ? "先跟做摸牌与打牌，再选择日式、国标或四川独立牌桌。提供随机自由练习和四人好友直连；请先阅读所选牌桌的规则，不混用地区计分。" : "Learn drawing and discarding, then choose a separate Japanese, Chinese Official or Sichuan table. Try random free play or a four-person direct friend connection. Read the selected table's rules; regional scoring is not interchangeable.") : game === "holdem" ? (locale === "zh" ? "从认识花色、模拟下注和余额开始，再练习随机单挑或多人对局，也可进入好友直连房间。筹码只有教学用途，不可购买、兑现或兑换奖品。" : "Start with suits, simulated bets and balances, then try random heads-up or multiplayer hands, or a direct friend room. Teaching chips cannot be purchased, cashed out or exchanged for prizes.") : game === "baccarat" ? (locale === "zh" ? "逐步发牌、计算点数、对照补牌表。固定案例模拟下注、教学筹码与余额，另有随机练习；不涉及真钱或可兑换奖品。" : "Step through dealing, scoring and the drawing table. Guided examples simulate bets, teaching chips and balances, with random practice also available. No real money or redeemable prizes.") : dict.hubPlayDescSoon}
            </p>
            {g.playable && (
              <Link href={`/${locale}/${game}/play`} className="btn-sign btn-sign-paper mt-8">
                {dict.play} →
              </Link>
            )}
          </div>
          {game === "cube" ? (
            <div className="ruled border-2 border-ink bg-paper p-4 text-ink">
              <PlayCube
                heightClass="h-[320px] sm:h-[400px]"
                labels={{ scramble: dict.scramble, reset: dict.reset, hint: dict.playHint }}
              />
            </div>
          ) : isBoardGame(game) ? (
            <div className="border-2 border-ink bg-paper p-4 text-ink">
              <BoardGame game={game} dict={dict} locale={locale} compact />
            </div>
          ) : (
            <div className="flex items-center justify-center border-2 border-paper p-10">
              <GameDiagram game={game} className="w-full max-w-[300px] text-paper" accent="#f0b400" />
            </div>
          )}
        </div>
      </section>
    </>
  );
}
