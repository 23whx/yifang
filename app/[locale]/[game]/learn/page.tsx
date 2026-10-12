import Breadcrumbs from '@/components/seo/Breadcrumbs';
import PageSchema from '@/components/seo/PageSchema';
import { pageMetadata } from '@/lib/seo';
import { gamePageCopy } from '@/content/seo';
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { games, getGame, isGameSlug } from "@/content/games";
import { tutorialsForGame, localizeTutorial } from "@/content/tutorials";
import { getDict, isLocale, locales } from "@/lib/i18n";
import WinCondition from "@/components/ui/WinCondition";

export function generateStaticParams() {
  return locales.flatMap((locale) => games.map((g) => ({ locale, game: g.slug })));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; game: string }> }): Promise<Metadata> {
  const { locale, game } = await params;
  const g = getGame(game);
  if (!isLocale(locale) || !g) return {};
  const copy = gamePageCopy(g.slug, g.name[locale], locale, 'learn');
  return pageMetadata(locale, `/${game}/learn`, copy.title, copy.description);
}

export default async function LearnIndex({ params }: { params: Promise<{ locale: string; game: string }> }) {
  const { locale, game } = await params;
  if (!isLocale(locale) || !isGameSlug(game)) notFound();
  const g = getGame(game)!;
  const dict = getDict(locale);
  const tuts = tutorialsForGame(game).map((t) => localizeTutorial(t, locale));

  return (<>
    <Breadcrumbs locale={locale} items={[{ name: locale === 'zh' ? '弈方首页' : 'Yifang home', path: `/${locale}` }, { name: g.name[locale], path: `/${locale}/${game}` }, { name: gamePageCopy(g.slug, g.name[locale], locale, 'learn').title, path: `/${locale}/${game}/learn` }]} />
    <PageSchema locale={locale} path={`/${game}/learn`} type="CollectionPage" game={game} name={gamePageCopy(g.slug, g.name[locale], locale, 'learn').title}
      description={gamePageCopy(g.slug, g.name[locale], locale, 'learn').description} items={tuts.map(t => ({ name: t.title, path: `/${locale}/${game}/learn/${t.slug}` }))} />
    <div className="mx-auto max-w-[1400px] px-5 pt-4 pb-12 sm:px-8 lg:pb-16">
      <h1 className="page-title mt-2">
        {g.name[locale]}
        <span className="sep">·</span><wbr />
        {dict.hubLearnTitle}
      </h1>
      <WinCondition game={game} locale={locale} />
      <div className="mt-8 max-w-3xl space-y-3 border-l-4 border-vermilion pl-5 leading-8">
        <h2 className="text-xl font-bold">{locale === "zh" ? "从零开始，不需要先懂术语" : "Start from zero—no terminology assumed"}</h2>
        <p>{locale === "zh" ? "先读第一课的用具、词语和流程解释，再进入同页的跟做练习。文字可以随时回看，案例可以重开；完成操作后，请试着解释‘我做了什么、为什么、发生了什么变化’。之后再学后续规则与进阶课程。" : "Read lesson one's equipment, vocabulary and sequence, then try the hands-on practice on the same page. Revisit the text and restart examples freely. Explain what you did, why, and what changed before moving on to advanced lessons."}</p>
        <Link className="btn-sign" href={`/${locale}/${game}/learn/${game}-first-lesson`}>{locale === "zh" ? "开始零基础第一课" : "Start lesson one"} →</Link>
      </div>
      {tuts.length > 0 ? (
        <ol className="mt-12 border-t-2 border-ink">
          {tuts.map((t) => (
            <li key={t.slug} className="border-b border-rule">
              <Link href={`/${locale}/${game}/learn/${t.slug}`} className="group grid gap-4 py-8 md:grid-cols-[1fr_auto] md:items-center">
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
        <p className="mt-12 border-t-2 border-ink pt-6 text-ink-3">
          {locale === "zh" ? "教程撰写中，先去看看其他项目。" : "Tutorials are being written. Try another game meanwhile."}
        </p>
      )}
    </div>
  </>);
}
