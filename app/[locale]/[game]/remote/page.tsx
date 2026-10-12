import { notFound } from "next/navigation";
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
import RoomTabs from '@/components/remote/RoomTabs';
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
  const zh = locale === 'zh', name = getGame(game)!.name[locale];
  const table = game === 'mahjong' || game === 'holdem';
  return (<>
    <Breadcrumbs locale={locale} items={[
        { name: zh ? '弈方首页' : 'Yifang home', path: `/${locale}` },
        { name, path: `/${locale}/${game}` },
        { name: zh ? '好友对战' : 'Friend play', path: `/${locale}/${game}/remote` },
      ]} />
    <div className="rpg-directory">
      <h1>{zh ? `${name} · 好友对战` : `${name} · Play with friends`}</h1>
      <p>{table
        ? (zh ? '每位玩家用自己的设备打开本页。房主开房后，分别和每位朋友交换一次“邀请码”与“回复码”，人齐后就能开局。不用注册账号。' : 'Each player opens this page on their own device. The host opens a room and swaps one invitation and one reply with each friend; start once everyone is in. No account needed.')
        : (zh ? '你和朋友各用一台设备打开本页。一人开房，把“邀请码”发给对方；对方生成“回复码”发回来，就能开始对局。不用注册账号。' : 'You and a friend each open this page on your own device. One of you opens a room and sends the invitation; the other sends back a reply, and the game starts. No account needed.')}</p>
      <div className="mt-8">
      {game==='mahjong'?<RoomTabs label={zh?'选择麻将规则':'Choose mahjong rules'} tabs={[
        {id:'riichi',title:zh?'日式立直':'Japanese Riichi',note:zh?'四人同桌，先选好大家约定的规则。三种麻将分别开房，规则不混用。':'Four players. Pick the rules your table agreed on; each ruleset has its own room.',panel:<RiichiRemote locale={locale}/>},
        {id:'sichuan',title:zh?'四川血战':'Sichuan Blood Battle',note:zh?'四人同桌，先选好大家约定的规则。三种麻将分别开房，规则不混用。':'Four players. Pick the rules your table agreed on; each ruleset has its own room.',panel:<SichuanRemote locale={locale}/>},
        {id:'mcr',title:zh?'国标麻将':'MCR (Chinese Official)',note:zh?'国标房为固定座位的十六手预设；番种计分仍在逐项验收。':'MCR uses a fixed-seat 16-hand preset; scoring patterns are still being verified one by one.',panel:<McrRemote locale={locale}/>},
      ]}/>:game === 'holdem' ? <RoomTabs label={zh?'选择人数':'Choose table size'} tabs={[
        {id:'four',title:zh?'四人桌':'Four players',panel:<MultiPokerRemote locale={locale}/>},
        {id:'two',title:zh?'两人桌':'Two players',panel:<HoldemRemote locale={locale}/>},
      ]}/> : <RemoteGame game={game} locale={locale} />}
      </div>
    </div>
  </>);
}
