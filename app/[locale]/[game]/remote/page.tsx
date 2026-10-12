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
        ? (zh ? '房主点“创建房间”，把邀请链接发给朋友；朋友点开链接就自动入座，人齐后开局。不用注册账号。' : 'The host creates a room and sends the invitation link; friends open it to take a seat, and play starts once everyone is in. No account needed.')
        : (zh ? '一人点“创建房间”，把邀请链接发给朋友；朋友点开链接就自动进房，马上开始对局。不用注册账号。' : 'One player creates a room and sends the invitation link; the friend opens it, joins automatically and the game starts. No account needed.')}</p>
      <div className="mt-8">
      {game==='mahjong'?<RoomTabs label={zh?'选择麻将规则':'Choose mahjong rules'} tabs={[
        {id:'riichi',kind:'riichi',title:zh?'日式立直':'Japanese Riichi',note:zh?'四人同桌，先选好大家约定的规则。三种麻将分别开房，规则不混用。':'Four players. Pick the rules your table agreed on; each ruleset has its own room.',panel:<RiichiRemote locale={locale}/>},
        {id:'sichuan',kind:'sichuan-four',title:zh?'四川血战':'Sichuan Blood Battle',note:zh?'四人同桌，先选好大家约定的规则。三种麻将分别开房，规则不混用。':'Four players. Pick the rules your table agreed on; each ruleset has its own room.',panel:<SichuanRemote locale={locale}/>},
        {id:'mcr',kind:'mcr-four',title:zh?'国标麻将':'MCR (Chinese Official)',note:zh?'国标房为固定座位的十六手预设；番种计分仍在逐项验收。':'MCR uses a fixed-seat 16-hand preset; scoring patterns are still being verified one by one.',panel:<McrRemote locale={locale}/>},
      ]}/>:game === 'holdem' ? <RoomTabs label={zh?'选择人数':'Choose table size'} tabs={[
        {id:'four',kind:'holdem-four',title:zh?'四人桌':'Four players',panel:<MultiPokerRemote locale={locale}/>},
        {id:'two',kind:'holdem',title:zh?'两人桌':'Two players',panel:<HoldemRemote locale={locale}/>},
      ]}/> : <RemoteGame game={game} locale={locale} />}
      </div>
    </div>
  </>);
}
