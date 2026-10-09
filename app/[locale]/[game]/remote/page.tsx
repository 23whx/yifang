import { notFound } from "next/navigation";
import Link from "next/link";
import RemoteGame from "@/components/board/RemoteGame";
import HoldemRemote from "@/components/cards/HoldemRemote";
import MultiPokerRemote from "@/components/cards/MultiPokerRemote";
import RiichiRemote from "@/components/cards/RiichiRemote";
import SichuanRemote from "@/components/cards/SichuanRemote";
import McrRemote from "@/components/cards/McrRemote";
import { isBoardGame } from "@/lib/board/variants";
import { getGame } from "@/content/games";
import { isLocale, locales } from "@/lib/i18n";
import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';
import { gamePageCopy } from '@/content/seo';
import { remoteGames } from '@/lib/seo-routes';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
export async function generateMetadata({ params }: { params: Promise<{ locale: string; game: string }> }): Promise<Metadata> {
  const { locale, game } = await params;
  const g = getGame(game);
  if (!isLocale(locale) || !g || !remoteGames.some(slug => slug === game)) notFound();
  const copy = gamePageCopy(g.slug, g.name[locale], locale, 'remote');
  return pageMetadata(locale, `/${game}/remote`, copy.title, copy.description);
}
export function generateStaticParams() {
  return locales.flatMap((locale) =>
    ["chess", "xiangqi", "shogi", "go", "holdem", "mahjong"].map((game) => ({ locale, game })),
  );
}
export default async function Remote({
  params,
}: {
  params: Promise<{ locale: string; game: string }>;
}) {
  const { locale, game } = await params;
  if (!isLocale(locale) || (!isBoardGame(game) && game !== "go" && game !== "holdem" && game !== "mahjong")) notFound();
  return (
    <div className="rpg-directory">
      <Breadcrumbs locale={locale} items={[
        { name: locale === 'zh' ? '弈方首页' : 'Yifang home', path: `/${locale}` },
        { name: getGame(game)!.name[locale], path: `/${locale}/${game}` },
        { name: locale === 'zh' ? '好友对战' : 'Friend play', path: `/${locale}/${game}/remote` },
      ]} />
      <Link href={`/${locale}/${game}/play`}>
        ← {getGame(game)!.name[locale]}
      </Link>
      <h1>
        {game==='mahjong'||game==='holdem'?(locale==='zh'?'邀请朋友同桌':'Invite friends to the table'):(locale === "zh" ? "邀请一位远方的朋友" : "Invite a distant friend")}
      </h1>
      <p>{gamePageCopy(getGame(game)!.slug, getGame(game)!.name[locale], locale, 'remote').description}</p>
      {game==='mahjong'?<>
        <p className="mb-5 leading-7">{locale==='zh'?'请选择同桌约定的规则。日式立直、四川血战、国标分别建房，不混用规则。国标为十六手固定座位版本；81番规则仍在逐项验收。同机直连已测试，真实跨设备局域网连接尚未验证。':'Choose the rules agreed by your table. Riichi, Sichuan and MCR use separate rooms. MCR uses a fixed-seat 16-hand preset; its 81 scoring patterns are still being verified one by one. Same-device direct play has been tested, but a real cross-device LAN connection has not yet been verified.'}</p>
        <details open className="mb-8"><summary className="mb-4 cursor-pointer text-xl font-bold">{locale==='zh'?'日式立直麻将':'Japanese Riichi Mahjong'}</summary><RiichiRemote locale={locale}/></details>
        <details className="mb-8"><summary className="mb-4 cursor-pointer text-xl font-bold">{locale==='zh'?'四川血战麻将':'Sichuan Blood Battle Mahjong'}</summary><SichuanRemote locale={locale}/></details>
        <details className="mb-8"><summary className="mb-4 cursor-pointer text-xl font-bold">{locale==='zh'?'国标麻将（验收中）':'MCR Mahjong (under verification)'}</summary><McrRemote locale={locale}/></details>
      </>:game === 'holdem' ? <><MultiPokerRemote locale={locale}/><details className="mt-8"><summary>{locale==='zh'?'两人对战模式':'Two-player mode'}</summary><HoldemRemote locale={locale}/></details></> : <RemoteGame game={game} locale={locale} />}
    </div>
  );
}
