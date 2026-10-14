import type { Metadata } from "next";
import { lessonSearch } from '@/content/seo';
import Link from "next/link";
import { notFound } from "next/navigation";
import TutorialPlayer from "@/components/cube/TutorialPlayer";
import BoardTutorialPlayer from "@/components/board/BoardTutorialPlayer";
import GoLesson from "@/components/go/GoLesson";
import GuidedTableLesson from "@/components/cards/GuidedTableLesson";
import CubeFirstPractice from "@/components/cube/CubeFirstPractice";
import WinCondition from "@/components/ui/WinCondition";
import MahjongTile, { mahjongTiles, mahjongFlowers } from "@/components/cards/MahjongTile";
import MahjongVariantPractice from "@/components/cards/MahjongVariantPractice";
import { getMahjongCourse, mahjongCourses } from "@/content/mahjong-variants";
import MahjongFigure from "@/components/cards/MahjongFigure";
import McrFanExample from "@/components/cards/McrFanExample";
import {mcrFanHelp} from "@/content/mcr-fan-help";
import { isBoardGame } from "@/lib/board/variants";
import { getGame, isGameSlug } from "@/content/games";
import { tutorials, getTutorial, localizeTutorial } from "@/content/tutorials";
import { getDict, isLocale, locales } from "@/lib/i18n";
import { absoluteUrl, SITE_URL } from "@/lib/site";
import { pageMetadata, htmlLanguage, gameEntity } from '@/lib/seo';
import PageSchema from '@/components/seo/PageSchema';
import UpdatedOn from '@/components/seo/UpdatedOn';
import { contentDate } from '@/lib/content-dates';
import JsonLd from '@/components/seo/JsonLd';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import LessonNavigation from '@/components/seo/LessonNavigation';

export function generateStaticParams() {
  return locales.flatMap((locale) => tutorials.map((t) => ({ locale, game: t.game, slug: t.slug })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; game: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, game, slug } = await params;
  const tutorial = getTutorial(slug);
  if (!isLocale(locale) || !tutorial || tutorial.game !== game) return {};
  const lt = localizeTutorial(tutorial, locale);
  const seo = lessonSearch[slug]?.[locale];
  return pageMetadata(locale, `/${game}/learn/${slug}`, seo?.title ?? lt.title, seo?.description ?? lt.description);
}

export default async function TutorialPage({
  params,
}: {
  params: Promise<{ locale: string; game: string; slug: string }>;
}) {
  const { locale, game, slug } = await params;
  const tutorial = getTutorial(slug);
  if (!isLocale(locale) || !isGameSlug(game) || !tutorial || tutorial.game !== game) notFound();
  const g = getGame(game)!;
  const dict = getDict(locale);
  const lt = localizeTutorial(tutorial, locale);
  const mahjongCourse = game === "mahjong" ? getMahjongCourse(slug) : undefined;

  const url = absoluteUrl(`/${locale}/${game}/learn/${slug}`);
  const updated = contentDate(`lesson:${slug}`);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    "@id": `${url}#lesson`,
    name: lt.title,
    description: lt.description,
    url,
    inLanguage: htmlLanguage(locale),
    timeRequired: `PT${lt.minutes}M`,
    learningResourceType: 'Tutorial',
    educationalLevel: lt.level,
    isAccessibleForFree: true,
    ...(updated ? { dateModified: updated } : {}),
    teaches: lt.steps.map(step => step.title),
    isPartOf: { '@type': 'CollectionPage', '@id': `${absoluteUrl(`/${locale}/${game}/learn`)}#webpage`, url: absoluteUrl(`/${locale}/${game}/learn`) },
    mainEntityOfPage: { '@id': `${url}#webpage` },
    about: gameEntity(locale, game),
    publisher: { '@id': `${SITE_URL}/#organization` },
    hasPart: lt.steps.map((s) => ({
      "@type": "WebPageElement",
      name: s.title,
      text: s.body.join(" "),
      url: `${url}#step-${s.id}`,
    })),
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <PageSchema locale={locale} path={`/${game}/learn/${slug}`} game={game} name={lessonSearch[slug]?.[locale]?.title ?? lt.title}
        description={lessonSearch[slug]?.[locale]?.description ?? lt.description} mainEntity={{ '@id': `${url}#lesson` }} dateModified={updated} />
      <Breadcrumbs locale={locale} items={[
        {name:locale === 'zh' ? '弈方首页' : 'Yifang home',path:`/${locale}`},
        {name:g.name[locale],path:`/${locale}/${game}`},
        {name:dict.hubLearnTitle,path:`/${locale}/${game}/learn`},
        {name:lt.title,path:`/${locale}/${game}/learn/${slug}`},
      ]} />
      <section className="border-b-2 border-ink">
        <div className="mx-auto max-w-[1400px] px-5 pt-4 pb-10 sm:px-8 lg:pb-14">
          <h1 className="page-title mt-2 max-w-5xl">{lt.title}</h1>
          {mahjongCourse ? <section aria-label={locale === 'zh' ? '本规则胜利条件' : 'Ruleset objective'} className="mt-6 max-w-prose border border-[#ae8550] p-5 leading-8"><h2 className="font-bold">{locale === 'zh' ? '先知道：本规则怎样才算和牌？' : 'First: what makes a legal win here?'}</h2><p>{mahjongCourse.objective[locale]}</p><p>{locale === 'zh' ? '规则参考：' : 'Reference: '}<a href={mahjongCourse.reference.url} className="underline">{mahjongCourse.reference.label}</a></p></section> : <WinCondition game={game} locale={locale} />}
          <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-2 text-sm text-ink-3">
            <span>{dict.level} · <b className="text-ink">{lt.level}</b></span>
            <span>{lt.steps.length} {dict.stepsCount}</span>
            <span>{lt.minutes} {dict.minutes}</span>
            <UpdatedOn locale={locale} date={updated} />
          </div>
          <p className="prose-yf mt-6">{lt.description}</p>
        </div>
      </section>
      <div className="mx-auto max-w-[1400px] px-5 py-10 sm:px-8 lg:py-14">
        {game === 'mahjong' && <nav aria-label={locale === 'zh' ? '选择麻将规则教程' : 'Choose a mahjong ruleset'} className="mb-6 flex flex-wrap gap-3">{mahjongCourses.map(c=><Link key={c.tutorial.slug} className="btn-sign btn-sign-outline" aria-current={slug===c.tutorial.slug ? 'page' : undefined} href={`/${locale}/mahjong/learn/${c.tutorial.slug}`}>{c.tutorial.title[locale]}</Link>)}</nav>}
        <nav className="mb-8 flex flex-wrap gap-4 border-y border-rule py-4" aria-label={locale === "zh" ? "学习方式" : "Learning modes"}>
          <a className="btn-sign btn-sign-outline" href="#written-lesson">{locale === "zh" ? "读详细文字教程" : "Read the written lesson"}</a>
          <a className="btn-sign" href={slug === 'mahjong-terms' ? `/${locale}/mahjong/learn/mahjong-first-lesson#guided-practice` : '#guided-practice'}>{locale === "zh" ? "跟着操作练习" : "Practice step by step"}</a>
          {game === 'mahjong' && (!mahjongCourse || slug === 'mahjong-riichi') && <Link className="btn-sign btn-sign-outline" href={`/${locale}/mahjong/${slug === 'mahjong-terms' ? 'glossary' : 'learn/mahjong-terms#written-lesson'}`}>{locale === 'zh' ? '看图学术语：立直、自摸、听牌…' : 'Illustrated vocabulary: riichi, tsumo, tenpai…'}</Link>}
          {slug !== `${game}-first-lesson` && <Link className="btn-sign btn-sign-outline" href={`/${locale}/${game}/learn/${game}-first-lesson`}>{locale === "zh" ? "术语不懂？先读零基础第一课" : "New terminology? Start with lesson one"}</Link>}
        </nav>
        {slug !== 'mahjong-terms' && <div id={isBoardGame(game) || (game === 'cube' && slug !== 'cube-first-lesson') ? undefined : 'guided-practice'}>
        {game === "mahjong" && !mahjongCourse && <section className="my-6 space-y-4"><h2 className="text-2xl font-bold">{locale === "zh" ? "先认牌：图案和名称一起看" : "Learn the tiles: pictures and names"}</h2><p className="leading-7">{locale === "zh" ? "万牌看汉字数字，筒牌数圆圈，条牌数竹节（一条通常画鸟）。东南西北与中发白是字牌，不能像数字牌一样连成顺子。每种图案在基础牌组中各有四张。" : "Characters use Chinese numerals; dots use circles; bamboo uses stalks (one bamboo traditionally shows a bird). Winds and dragons are honours and cannot form numerical sequences. The base set contains four copies of each design."}</p><div className="flex flex-wrap gap-3">{mahjongTiles.map(tile => <MahjongTile key={tile} tile={tile} locale={locale} />)}</div></section>}
        {mahjongCourse && <MahjongVariantPractice key={slug} slug={slug} locale={locale}/>}
        {(game === "baccarat" || game === "holdem" || (game === "mahjong" && !mahjongCourse)) && <GuidedTableLesson game={game} locale={locale} />}
        {game === "cube" && slug === 'cube-first-lesson' && <CubeFirstPractice locale={locale} />}
        {game === "go" && <GoLesson locale={locale} />}
        </div>}
        {slug === 'mahjong-terms' && <aside className="mb-8 max-w-3xl border-l-4 border-[#803d2b] pl-5 leading-8"><h2 className="text-xl font-bold">{locale === 'zh' ? '先选规则，再理解词语' : 'Choose a ruleset before applying a term'}</h2><p>{locale === 'zh' ? '这是第一课之后按需查阅的图解，不是所有路线的必修第二课。先认识听牌，再按日式语境理解门前、役与后续术语；国标和四川请以对应分支为准。本页图例用于解释词语，不是正在进行的对局。随机日式练习在麻将实战页，四人好友直连在麻将对战页；请先阅读所选牌桌的规则与限制，不把日式、国标和四川计分混用。好友直连不需要账号，但能否连通取决于双方网络，不保证跨网络成功。日麻术语参考：' : 'Consult these illustrations as needed after Lesson 1, not as compulsory Lesson 2 for every branch. Begin with ready hands, then read closed status, yaku and subsequent terms in the riichi context. MCR and Sichuan use their own courses. These diagrams explain vocabulary, not a game in progress. Random riichi practice is on the Mahjong play page; four-person direct friend rooms are on the Mahjong online-play page. Read the chosen table’s rules and limitations first; do not mix Japanese, MCR and Sichuan scoring. Direct connections need no account, but connectivity depends on both networks and is not guaranteed across networks. Riichi terminology reference: '}<a className="underline" href="https://www.worldriichi.org/wrc-rules">WRC Rules 2025</a>。</p></aside>}
        <div id="written-lesson" className="scroll-mt-6">
        {isBoardGame(game) ? (
          <div id="guided-practice"><BoardTutorialPlayer game={game} tutorial={lt} dict={dict} locale={locale} /></div>
        ) : game === "cube" ? (
          <div id={slug !== 'cube-first-lesson' ? 'guided-practice' : undefined}><TutorialPlayer tutorial={lt} dict={dict} locale={locale} /></div>
        ) : (
          <article className="max-w-3xl"><nav aria-label={locale === "zh" ? "课程目录" : "Lesson contents"} className="mb-10 border-y border-rule py-5">{lt.steps.map((s,i)=><a key={s.id} href={`#step-${s.id}`} className="block py-2">{String(i+1).padStart(2,"0")} · {s.title}</a>)}</nav>{lt.steps.map((s,i)=><section key={s.id} id={`step-${s.id}`} className="mb-12 scroll-mt-8"><h2 className="mb-5 text-2xl font-bold">{String(i+1).padStart(2,"0")} · {s.title}</h2><div className="prose-yf"><p>{s.body[0]}</p></div>{game === 'mahjong' && <MahjongFigure id={s.id} locale={locale}/>}<div className="prose-yf mt-[1.1em]">{s.body.slice(1).map((p,j)=><p key={j}>{p}</p>)}</div></section>)}<Link href={`/${locale}/${game}/play`} className="btn-sign">{locale === "zh" ? "前往练习" : "Go to practice"} →</Link>{game === 'mahjong' && !mahjongCourse && slug !== 'mahjong-terms' && <><Link className="btn-sign ml-3 mt-3" href={`/${locale}/mahjong/learn`}>{locale === 'zh' ? '选择一条地区路线 →' : 'Choose a regional branch →'}</Link><Link className="btn-sign ml-3 mt-3" href={`/${locale}/mahjong/learn/mahjong-terms`}>{locale === 'zh' ? '可选参考：看图查术语 →' : 'Optional: illustrated vocabulary →'}</Link></>}</article>
        )}
        {game === 'mahjong' && slug === 'mahjong-mcr' && <aside id="mcr-extra-reference" className="my-8 space-y-6">
          <h2 className="text-2xl font-bold">{locale === 'zh' ? '课后图解：花牌与容易混淆的番种' : 'After the lesson: flowers and easily confused patterns'}</h2>
          <p className="max-w-prose leading-8">{locale === 'zh' ? '先完成上面的八番门槛、清龙和结算案例，再按需要查阅这些图解；不用在第一次摸打之前背完全部番种。' : 'Finish the eight-point threshold, Pure Straight and settlement examples above, then consult these illustrations as needed. Do not memorise every scoring pattern before your first turns.'}</p>
          <section className="space-y-4"><h3 className="text-xl font-bold">{locale === 'zh' ? '认一认：国标的八张花牌' : 'Meet the eight MCR flower tiles'}</h3><p className="max-w-prose leading-8">{locale === 'zh' ? '梅、兰、竹、菊、春、夏、秋、冬各只有一张。看图时也读下面的名字：“竹”花牌不是一条、二条这样的条牌，不能拿来组成顺子或刻子。补花是把花牌亮在自己面前，再从牌墙末端补一张；补到的还是花牌，就再补一次。花牌另计加分，不能用它凑足和牌所需的不含花八分。' : 'There is one each of Plum, Orchid, Bamboo, Chrysanthemum, Spring, Summer, Autumn and Winter. Read the names under the pictures: the Bamboo flower is not a numbered bamboo-suit tile and cannot form a sequence or triplet. To replace a flower, expose it in front of you and take a replacement from the end of the wall. If that is another flower, replace it again. Flower bonuses do not count toward the eight non-flower points required to win.'}</p><div className="flex flex-wrap gap-3">{mahjongFlowers.map(tile => <MahjongTile key={tile} tile={tile} locale={locale}/>)}</div></section>
          {Object.keys(mcrFanHelp).map(code=><McrFanExample key={code} code={code} locale={locale}/>)}
          <MahjongVariantPractice slug={slug} locale={locale} supplementary />
        </aside>}
        </div>
      </div>
      <LessonNavigation game={game} slug={slug} locale={locale} />
    </>
  );
}
