import { actMulti, multiLegal, newMultiTable, nextMultiHand, type MultiTable } from './holdem-multi';
import { validPokerRequest, type PokerRequest } from './holdem-remote';

/** Host-browser memory only: never send the table itself to another peer. */
export type MultiSession = {hand:number;revision:number;table:MultiTable;next:boolean[]};
export function newMultiSession(stacks:number[]=[200,200,200,200],button=0,deck?:number[]):MultiSession {
  return {hand:1,revision:0,table:newMultiTable(stacks,button,deck),next:stacks.map(()=>false)};
}
function seatValid(s:MultiSession,seat:number) {
  return Number.isInteger(seat)&&seat>=0&&seat<s.table.stacks.length;
}
/** Seat is pinned by the connection, never taken from request content. */
export function applyMultiRequest(s:MultiSession,seat:number,raw:unknown,deck?:number[]):MultiSession {
  if(!seatValid(s,seat)||!validPokerRequest(raw))throw new Error('Invalid seat or request');
  const r:PokerRequest=raw;
  if(r.hand!==s.hand||r.revision!==s.revision)throw new Error('Stale hand or revision');
  if(r.action.kind==='next') {
    if(!s.table.over||s.table.stacks[seat]===0||s.table.stacks.filter(v=>v>0).length<2)throw new Error('Next hand unavailable');
    if(s.next[seat])return s;
    const consent=[...s.next];consent[seat]=true;
    if(consent.every((yes,i)=>yes||s.table.stacks[i]===0))return {
      hand:s.hand+1,revision:s.revision+1,table:nextMultiHand(s.table,deck),next:consent.map(()=>false),
    };
    return {...s,revision:s.revision+1,next:consent};
  }
  return {...s,revision:s.revision+1,table:actMulti(s.table,seat,r.action)};
}
/** Explicit field projection, with no deck, burn cards, hidden hand ranks or future fields. */
export function multiView(s:MultiSession,seat:number) {
  if(!seatValid(s,seat))throw new Error('Invalid recipient');
  const t=s.table;
  return {
    hand:s.hand,revision:s.revision,seat,button:t.button,actor:t.actor,street:t.street,price:t.price,
    over:t.over,showdown:t.showdown,community:[...t.community],
    cards:t.hole.map((cards,i)=>i===seat||(t.showdown&&!t.folded[i])?[...cards]:[]),
    cardCounts:t.hole.map(cards=>cards.length),
    stacks:[...t.stacks],start:[...t.start],committed:[...t.committed],bets:[...t.bets],folded:[...t.folded],
    awards:[...t.awards],refunds:[...t.refunds],next:[...s.next],
    legal:!t.over&&t.actor===seat?multiLegal(t):null,
    pots:t.pots.map(p=>({amount:p.amount,cap:p.cap,contributors:[...p.contributors],eligible:[...p.eligible],winners:[...p.winners],shares:[...p.shares]})),
    actions:t.actions.map(a=>({seat:a.seat,kind:a.kind,paid:a.paid,to:a.to,street:a.street})),
  };
}
export type MultiView=ReturnType<typeof multiView>;
export function multiRemotePhase(view: Pick<MultiView,'over'|'stacks'>): 'playing'|'finished' {
  return view.over && view.stacks.filter(n=>n>0).length<2 ? 'finished' : 'playing';
}
