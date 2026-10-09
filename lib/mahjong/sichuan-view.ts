import type {SichuanRound} from './sichuan-round';
import {sichuanOwnOptions} from './sichuan-actions';
import {sichuanClaimView} from './sichuan-claims';

/** The only round payload intended for a player. Never serialize the host round.
 * A retired winner reveals their hand, but another active player never does. */
export function sichuanRoundView(s:SichuanRound,id:number){
  if(!Number.isInteger(id)||id<0||id>3)throw new Error('Invalid recipient');
  return {
    revision:s.revision,seat:id,phase:s.phase,actor:s.actor,end:s.end,wallCount:s.wall.length,
    players:s.seats.map((p,i)=>({hand:i===id||p.retired?[...p.hand]:[],handCount:p.hand.length,
      missing:p.missing,retired:p.retired,melds:p.melds.map(m=>({kind:m.kind,open:m.open,tiles:[...m.tiles]}))})),
    drawn:s.phase==='turn'&&s.actor===id?s.drawn:null,
    legal:s.phase==='turn'&&s.actor===id?sichuanOwnOptions(s.seats[id],{drawn:s.drawn,wallRemaining:s.wall.length,passedWin:s.passed[id],openingTurn:s.revision===0}):null,
    canDraw:s.phase==='draw'&&s.actor===id,
    claim:s.phase==='claims'&&s.claims?sichuanClaimView(s.claims,id):null,
    rivers:s.rivers.map(r=>({seat:r.seat,tile:r.tile,claimed:r.claimed})),
    events:s.events.map(e=>e.kind==='win'?{kind:e.kind,seats:[...e.seats],from:e.from,tile:e.tile,selfDraw:e.selfDraw,robbing:e.robbing,afterKong:e.afterKong}:{kind:e.kind,seat:e.seat,from:e.from,tile:e.tile,form:e.form}),
  };
}
