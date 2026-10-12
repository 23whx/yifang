import Breadcrumbs from '@/components/seo/Breadcrumbs';
import { pageMetadata } from '@/lib/seo';
import PageSchema from '@/components/seo/PageSchema';
import { gamePageCopy } from '@/content/seo';
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CubePuzzles from "@/components/cube/CubePuzzles";
import KnowledgePuzzles from "@/components/board/KnowledgePuzzles";
import TacticsPlayer from '@/components/board/TacticsPlayer';
import GoTactics from '@/components/go/GoTactics';
import { tacticalLessons } from '@/content/board/tactics';
import { boardPuzzles } from "@/content/board/library";
import { getGame, isGameSlug } from "@/content/games";
import { gamesWith, puzzleSets } from "@/content/sections";
import { getDict, isLocale, locales } from "@/lib/i18n";

function puzzleDescription(game: string, locale: 'zh' | 'en') {
  const g = getGame(game)!;
  return gamePageCopy(g.slug, g.name[locale], locale, 'puzzles').description;
}

export function generateStaticParams() {
  return locales.flatMap((locale) => gamesWith("puzzles").map((game) => ({ locale, game })));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; game: string }> }): Promise<Metadata> {
  const { locale, game } = await params;
  const g = getGame(game);
  if (!isLocale(locale) || !g) return {};
  const copy = gamePageCopy(g.slug, g.name[locale], locale, 'puzzles');
  return pageMetadata(locale, `/${game}/puzzles`, copy.title, copy.description);
}

export default async function PuzzlesPage({ params }: { params: Promise<{ locale: string; game: string }> }) {
  const { locale, game } = await params;
  if (!isLocale(locale) || !isGameSlug(game)) notFound();
  const puzzles = puzzleSets[game];
  const questions = boardPuzzles[game];
  if (!puzzles && !questions) notFound();
  const g = getGame(game)!;
  const dict = getDict(locale);

  return (
    <>
      <Breadcrumbs locale={locale} items={[{ name: locale === 'zh' ? '弈方首页' : 'Yifang home', path: `/${locale}` }, { name: g.name[locale], path: `/${locale}/${game}` }, { name: gamePageCopy(g.slug, g.name[locale], locale, 'puzzles').title, path: `/${locale}/${game}/puzzles` }]} />
      <PageSchema locale={locale} path={`/${game}/puzzles`} game={game} name={gamePageCopy(g.slug, g.name[locale], locale, 'puzzles').title}
        description={puzzleDescription(game, locale)} />
      <section className="border-b-2 border-ink">
        <div className="mx-auto max-w-[1400px] px-5 pt-4 pb-10 sm:px-8 lg:pb-14">
          <h1 className="page-title mt-2">{g.name[locale]} · {dict.puzzlesTitle}</h1>
          <p className="prose-yf mt-6 max-w-2xl">{puzzleDescription(game, locale)}</p>
        </div>
      </section>
      <div className="mx-auto max-w-[1400px] px-5 py-10 sm:px-8 lg:py-14">
        <TacticsPlayer lessons={tacticalLessons.filter(l=>l.game===game)} locale={locale}/>
        {game==='go' && <GoTactics locale={locale}/>}
        {puzzles ? <CubePuzzles puzzles={puzzles} dict={dict} locale={locale} /> : questions && <KnowledgePuzzles puzzles={questions} locale={locale} date={new Date().toISOString().slice(0,10)} />}
      </div>
    </>
  );
}
