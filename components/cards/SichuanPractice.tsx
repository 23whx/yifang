'use client';
import {useRef,useState} from 'react';
import {newSichuanSession,applySichuanSession,sichuanSessionView,type SichuanSession,type SichuanSessionAction} from '@/lib/mahjong/sichuan-session';
import {sichuanTeachingAction,shuffledSichuanDeck} from '@/lib/mahjong/sichuan-teaching';
import {sichuanTableGuide} from '@/content/sichuan-table';
import {tileEnglish} from '@/content/guided-tables';
import {tileNames,type Suit} from '@/lib/mahjong/shape';
import MahjongTile from './MahjongTile';
import ResultDialog from '@/components/ui/ResultDialog';
import {sichuanWinExplanation} from '@/lib/mahjong/sichuan-explanation';

type RemoteTable={view:ReturnType<typeof sichuanSessionView>|null;disabled:boolean;onAction:(action:SichuanSessionAction)=>void};
const paymentKindEnglish:Record<string,string>={
  'discard-win':'win on a discard','self-draw':'self-drawn win','kong':'kong points',
  'kong-refund':'kong points refunded','not-ready':'not-ready penalty',
  'missing-suit':'missing-suit penalty','kong-transfer':'kong points transferred',
};
const wallStatusEnglish:Record<string,string>={retired:'already won and left this hand',ready:'ready to win', 'not-ready':'not ready to win','missing-suit':'still holding the declared missing suit'};
export default function SichuanPractice({locale,remote}:{locale:'zh'|'en';remote?:RemoteTable}){
  const zh=locale==='zh',current=useRef<SichuanSession|null>(null),[session,setSession]=useState<SichuanSession|null>(null),[selected,setSelected]=useState<number[]>([]),[error,setError]=useState(''),[confirm,setConfirm]=useState(false);
  const tileLabel=(tile:number)=>zh?tileNames[tile]:tileEnglish(tileNames[tile]);
  const v=remote?remote.view:session?sichuanSessionView(session,0):null;
  const me=v?.stage==='setup'?v.setup.seat:v?.stage==='play'?v.round.seat:0;
  const locked=!!remote&&(remote.disabled||!v||v.closed);
  function publish(s:SichuanSession|null){current.current=s;setSession(s);setSelected([]);setError('');setConfirm(false);}
  function act(id:number,action:SichuanSessionAction){if(remote){if(!locked){remote.onAction(action);setSelected([]);}return;}const s=current.current;if(!s)return;try{publish(applySichuanSession(s,id,s.revision,action));}catch{setError(zh?'这一步不能这样操作。换三张须选择同花色；出牌请先清掉缺门，并等轮到自己。':'That action is unavailable. Exchange three of one suit; discard the missing suit first and wait for your turn.');}}
  function start(){publish(newSichuanSession(shuffledSichuanDeck()));}
  const tiles=(hand:number[])=><div className="my-3 flex flex-wrap gap-2">{hand.map((t,i)=><MahjongTile key={i} tile={tileNames[t]} locale={locale} compact/>)}</div>;
  const r=v?.stage==='play'?v.round:null;
  const humanHand=v?.stage==='setup'?v.setup.hand:r?.players[me].hand??[];
  const exchangeTiles=selected.map(i=>humanHand[i]);
  const validExchange=selected.length===3 && new Set(selected).size===3 && exchangeTiles.every(t=>Number.isInteger(t)&&t>=0&&t<27&&Math.floor(t/9)===Math.floor(exchangeTiles[0]/9));
  const bot=!remote&&session?[1,2,3].find(id=>sichuanTeachingAction(sichuanSessionView(session,id))!==null):undefined;
  const reason=v?sichuanWinExplanation(v,locale):'';
  return <section className="my-8 space-y-5 rounded-xl border-2 border-[#ae8550] bg-[#f3e7cd] p-4 text-[#392616] sm:p-6">
    <h2 className="text-2xl font-bold">{remote?(zh?'四川血战 · 四人直连牌桌':'Sichuan Blood Battle · Four-player direct table'):(zh?'四川血战 · 随机完整单手练习':'Sichuan Blood Battle · Random full-hand practice')}</h2>
    <p className="max-w-[68ch] leading-8">{sichuanTableGuide[0].body[locale]}</p>
    <p className="leading-7">{remote?(zh?`你在座位 ${me+1}，四位都是真人。每手从 0 分开始；所有人确认胡牌结果后才继续。整手结束后保留结果，重新建房可再玩一手。`:`You are seat ${me+1}; all four players are human. Each hand starts at zero points. Everyone must confirm a win before play continues. Results remain at the end; create a new room to play again.`):zh?'你在座位 1，其余三位是只看自己手牌的简单电脑。点击“电脑行动一步”才推进一次；没有后台、账号或真钱。每手独立从 0 分开始。':'You are seat 1; three simple computers see only their own tiles. “One computer action” advances one step. No backend, accounts or money. Each hand starts independently at zero points.'}</p>
    <details><summary className="cursor-pointer font-bold">{zh?'开局前阅读：本桌完整规则与计分':'Before starting: table rules and scoring'}</summary>{sichuanTableGuide.slice(1).map((item,i)=><article key={i} className="my-5 max-w-[68ch]"><h3 className="font-bold">{item.title[locale]}</h3><p className="leading-8">{item.body[locale]}</p></article>)}</details>
    {!v?remote?<p role="status">{zh?'等待房主开始发牌。':'Waiting for the host to deal.'}</p>:<button className="rpg-button" onClick={start}>{zh?'按上述规则开始':'Start with these rules'}</button>:<>
      <p role="status" className="font-bold">{v.stage==='setup'?(v.setup.phase==='exchange'?(zh?'第一步：选三张同花色牌交换':'Step 1: choose three tiles of one suit'):(zh?'第二步：选择缺门':'Step 2: choose your missing suit')):(zh?`剩余 ${r!.wallCount} 张 · ${r!.phase==='ended'?'本手结束':r!.phase==='result'?'胡牌结果，等待确认':r!.phase==='claims'?'等待碰杠胡响应':`轮到座位 ${r!.actor+1}`}`:`${r!.wallCount} tiles left · ${r!.phase==='ended'?'Hand ended':r!.phase==='result'?'Win result: awaiting confirmation':r!.phase==='claims'?'Waiting for claims':`Seat ${r!.actor+1} to act`}`)}</p>
      <h3 className="font-bold">{zh?'你的手牌':'Your hand'}</h3>
      <div className="flex flex-wrap gap-2">{humanHand.map((t,i)=>{const exchange=v.stage==='setup'&&v.setup.phase==='exchange'&&!v.setup.exchangeChosen[me],discard=!!r?.legal?.discards.includes(t);return <button key={i} aria-pressed={exchange?selected.includes(i):undefined} aria-label={`${v.stage==='setup'?(zh?'选择':'Select'):(zh?'打出':'Discard')} ${tileLabel(t)} ${i+1}`} disabled={locked||(!exchange&&!discard)} className={`min-h-11 rounded border-2 p-1 ${selected.includes(i)?'border-[#803d2b]':'border-transparent'}`} onClick={()=>exchange?setSelected(old=>old.includes(i)?old.filter(n=>n!==i):old.length<3?[...old,i]:old):act(me,{kind:'discard',tile:t})}><MahjongTile tile={tileNames[t]} locale={locale} compact/></button>;})}</div>
      {v.stage==='setup'&&v.setup.phase==='exchange'&&<><p role="status">{v.setup.exchangeChosen[me]?(zh?'已提交，等待其他玩家选好。':'Submitted; waiting for the other players.'):selected.length===3&&!validExchange?(zh?'这三张不是同一花色。请再点一次取消其中的牌，改选三张全是万、全是筒或全是条；数字可以不同。':'These tiles mix suits. Click a selected tile again to remove it, then choose three characters, three dots or three bamboo. Their numbers may differ.'):(zh?`已选 ${selected.length}/3 张。三张须是同一花色，数字可以不同；再点已选牌可以取消。`:`Selected ${selected.length}/3. Choose one suit; numbers may differ. Click a selected tile again to remove it.`)}</p><button className="rpg-button" disabled={locked||!validExchange||v.setup.exchangeChosen[me]} onClick={()=>{if(validExchange&&!locked&&!v.setup.exchangeChosen[me])act(me,{kind:'exchange',tiles:exchangeTiles});}}>{zh?'确认交换这三张':'Confirm these three tiles'}</button></>}
      {v.stage==='setup'&&v.setup.phase==='missing'&&<div className="flex flex-wrap gap-3">{[0,1,2].map(suit=><button className="rpg-button" key={suit} disabled={locked||v.setup.missingChosen[me]} onClick={()=>act(me,{kind:'missing',suit:suit as Suit})}>{zh?`定缺${['万','筒','条'][suit]}`:`Missing: ${['characters','dots','bamboo'][suit]}`}</button>)}</div>}
      {r&&<>
        <p>{r!.phase==='ended'?(zh?'本手已结束，不能再摸牌或出牌。最终手牌和逐笔计分保留在下方；请查看胡牌结果或牌墙结束检查，分数变化不一定代表有人胡牌。':'This hand has ended: no more draws or discards. Final tiles and itemized payments remain below. Review win results or wall-end checks; a score change does not necessarily mean someone won a hand.'):(zh?'轮到出牌时点击手牌；不能打的牌不会响应。':'On your discard turn, click a tile. Unavailable tiles are disabled.')}</p>
        <div className="flex flex-wrap gap-3">{r.canDraw&&<button className="rpg-button" disabled={locked} onClick={()=>act(me,{kind:'draw'})}>{zh?'摸一张牌':'Draw one tile'}</button>}{r.legal?.win&&<button className="rpg-button" disabled={locked} onClick={()=>act(me,{kind:'win'})}>{zh?'自摸胡牌':'Win by self-draw'}</button>}{r.legal?.concealedKongs.map(t=><button className="rpg-button" key={t} disabled={locked} onClick={()=>act(me,{kind:'concealed-kong',tile:t})}>{zh?'暗杠':'Concealed kong'} {tileLabel(t)}</button>)}{r.legal?.addedKongs.map(m=><button className="rpg-button" key={m} disabled={locked} onClick={()=>act(me,{kind:'added-kong',meld:m})}>{zh?'补杠':'Added kong'} {tileLabel(r.players[me].melds[m].tiles[0])}</button>)}</div>
        {r.claim&&<div><p>{zh?`座位 ${r.claim.from+1} 的牌：`:`Tile from seat ${r.claim.from+1}:`}</p>{tiles([r.claim.tile])}{r.claim.reply===null&&<div className="flex flex-wrap gap-3">{(['win','pung','kong','pass'] as const).filter(k=>k==='pass'||r.claim!.options[k]).map(choice=><button className="rpg-button" key={choice} disabled={locked} onClick={()=>act(me,{kind:'claim',choice})}>{zh?({win:'胡牌',pung:'碰牌',kong:'杠牌',pass:'放弃本次响应'})[choice]:choice}</button>)}</div>}</div>}
        <div className="grid gap-4 sm:grid-cols-2">{r.players.map((p,i)=><section key={i} className="min-w-0 border border-[#ae8550] p-3"><h3 className="font-bold">{zh?`座位 ${i+1} · ${v.stage==='play'?v.balances[i]:0} 分 · 缺${['万','筒','条'][p.missing]}${p.retired?' · 已胡退出':''}`:`Seat ${i+1} · ${v.stage==='play'?v.balances[i]:0} points · missing ${['characters','dots','bamboo'][p.missing]}${p.retired?' · Retired winner':''}`}</h3>{i!==me&&(p.hand.length?tiles(p.hand):<p>{zh?`${p.handCount} 张暗牌`:`${p.handCount} hidden tiles`}</p>)}{p.melds.map((m,j)=><div key={j}>{tiles(m.tiles)}</div>)}<p>{zh?'已打出的牌':'Discards'}</p>{tiles(r.rivers.filter(x=>x.seat===i&&!x.claimed).map(x=>x.tile))}</section>)}</div>
        {r.phase==='result'&&<><p className="leading-8">{reason}</p><ResultDialog key={r.events.length} locale={locale} title={zh?'胡牌结果':'Win result'} reason={reason}/>
          <p role="status" className="leading-7">{zh?`已确认 ${v.confirmed.filter(Boolean).length}/4。等待座位 ${v.confirmed.flatMap((done,i)=>done?[]:[i+1]).join('、')} 确认（包括已胡牌者）。`:`Confirmed ${v.confirmed.filter(Boolean).length}/4. Waiting for seats ${v.confirmed.flatMap((done,i)=>done?[]:[i+1]).join(', ')} to confirm (including retired winners).`}</p>
          <button className="rpg-button" disabled={locked||v.confirmed[me]} onClick={()=>act(me,{kind:'ack'})}>{v.confirmed[me]?(zh?'你已确认，等待其他座位':'You confirmed — waiting for other seats'):(zh?'我看懂了，确认继续':'I understand — confirm continuation')}</button></>}
      </>}
      {v.stage==='play'&&<details open><summary className="font-bold">{zh?'逐笔计分流水':'Point transfers'}</summary><ol className="list-decimal pl-6">{v.payments.map(p=><li key={p.id}>{zh?`座位 ${p.from+1} → 座位 ${p.to+1}：${p.amount} 分，${({'discard-win':'点炮胡牌','self-draw':'自摸','kong':'杠牌','kong-refund':'退还杠分','not-ready':'未听牌赔付','missing-suit':'缺门赔付','kong-transfer':'杠分转移'})[p.kind]}`:`Seat ${p.from+1} → seat ${p.to+1}: ${p.amount} points, ${paymentKindEnglish[p.kind]??p.kind}`}</li>)}</ol></details>}
      {v.stage==='play'&&v.wallChecks&&<section><h3 className="font-bold">{zh?'牌墙结束检查':'End-of-wall checks'}</h3>{v.wallChecks.map(c=><p key={c.seat}>{zh?`座位 ${c.seat+1}：${({'retired':'已经胡牌退出','ready':'已听牌','not-ready':'未听牌','missing-suit':'仍有缺门牌'})[c.status]}；最高听牌赔付 ${c.maximum} 分。`:`Seat ${c.seat+1}: ${wallStatusEnglish[c.status]??c.status}; maximum ready-hand payment ${c.maximum} points.`}</p>)}</section>}
      {bot!==undefined&&<button className="rpg-button" onClick={()=>{const s=current.current;if(!s)return;const action=sichuanTeachingAction(sichuanSessionView(s,bot));if(action)act(bot,action);}}>{zh?`电脑行动一步（座位 ${bot+1}）`:`One computer action (seat ${bot+1})`}</button>}
      {!remote&&<><button className="rpg-button" onClick={()=>confirm?publish(null):setConfirm(true)}>{confirm?(zh?'确认结束本次练习':'Confirm end practice'):(zh?'结束／重新开始':'End / restart')}</button>{confirm&&<button className="rpg-button" onClick={()=>setConfirm(false)}>{zh?'取消':'Cancel'}</button>}</>}
    </>}{error&&<p role="alert">{error}</p>}
  </section>;
}
