import type {SichuanSetup} from './sichuan-setup';
import {discardSichuanTile,sichuanOwnOptions,type SichuanSeat} from './sichuan-actions';
import {answerSichuanClaim,newSichuanClaims,resolveSichuanClaims,type ClaimChoice,type ClaimWindow} from './sichuan-claims';

export type SichuanEvent={kind:'win';seats:number[];from:number;tile:number;selfDraw:boolean;robbing:boolean;afterKong:boolean}|{kind:'kong';seat:number;from:number;tile:number;form:'concealed'|'added'|'discard'};
export type SichuanRound={revision:number;phase:'turn'|'draw'|'claims'|'result'|'ended';actor:number;seats:SichuanSeat[];wall:number[];
  drawn:number|null;replacement:boolean;passed:boolean[];rivers:{seat:number;tile:number;claimed:boolean}[];
  claims:ClaimWindow|null;added:number|null;events:SichuanEvent[];end:'three-winners'|'wall-empty'|null};
export type SichuanMove={kind:'draw'|'win'|'ack'}|{kind:'discard'|'concealed-kong';tile:number}|{kind:'added-kong';meld:number}|{kind:'claim';choice:ClaimChoice};
export function startSichuanRound(s:SichuanSetup):SichuanRound{
  if(s.phase!=='ready'||s.missing.some(x=>x===null))throw new Error('Setup incomplete');
  return {revision:0,phase:'turn',actor:s.dealer,seats:s.hands.map((hand,i)=>({hand:[...hand],melds:[],missing:s.missing[i]!,retired:false})),wall:[...s.wall],drawn:null,replacement:false,passed:[false,false,false,false],rivers:[],claims:null,added:null,events:[],end:null};
}
function remove(hand:number[],tile:number,n=1){for(let k=0;k<n;k++){const i=hand.indexOf(tile);if(i<0)throw new Error('Tile absent');hand.splice(i,1);}}
function next(s:SichuanRound,after:number){
  if(s.seats.filter(p=>p.retired).length>=3){s.phase='ended';s.end='three-winners';s.actor=-1;return;}
  if(s.wall.length===0){s.phase='ended';s.end='wall-empty';s.actor=-1;return;}
  s.actor=[1,2,3,4].map(n=>(after+n)%4).find(i=>!s.seats[i].retired)!;
  s.phase='draw';s.drawn=null;s.replacement=false;
}
function kong(s:SichuanRound,id:number,from:number,tile:number,form:'concealed'|'added'|'discard'){
  s.events.push({kind:'kong',seat:id,from,tile,form});s.actor=id;s.phase='draw';s.replacement=true;s.drawn=null;
}
function resolve(s:SichuanRound){
  const w=s.claims!,r=resolveSichuanClaims(w);if(r.kind==='waiting')return;
  r.passed.forEach(id=>s.passed[id]=true);s.claims=null;
  if(r.kind==='wins'){
    if(w.robbing){remove(s.seats[w.from].hand,w.tile);s.rivers.push({seat:w.from,tile:w.tile,claimed:false});}
    r.seats.forEach(id=>s.seats[id].retired=true);
    s.events.push({kind:'win',seats:r.seats,from:w.from,tile:w.tile,selfDraw:false,robbing:w.robbing,afterKong:!w.robbing&&s.replacement});
    s.added=null;s.phase='result';return;
  }
  if(w.robbing){
    const player=s.seats[w.from],m=player.melds[s.added!];remove(player.hand,w.tile);m.kind='kong';m.tiles.push(w.tile);s.added=null;
    kong(s,w.from,w.from,w.tile,'added');return;
  }
  if(r.kind==='meld'){
    const player=s.seats[r.seat],count=r.action==='kong'?3:2;remove(player.hand,w.tile,count);
    player.melds.push({kind:r.action,tiles:Array(count+1).fill(w.tile),open:true});
    s.rivers[s.rivers.length-1].claimed=true;s.actor=r.seat;s.drawn=null;
    if(r.action==='kong')kong(s,r.seat,w.from,w.tile,'discard');else {s.phase='turn';s.replacement=false;}
    return;
  }
  next(s,w.from);
}
/** Every move is seat-bound and revision-bound. Result acknowledgement is a
 * host/session command; the future room wrapper must gather all players first.
 * Events intentionally carry NO points until the scoring layer is implemented. */
export function moveSichuanRound(state:SichuanRound,id:number,revision:number,move:SichuanMove):SichuanRound{
  if(!Number.isInteger(id)||id<0||id>3||revision!==state.revision||state.phase==='ended')throw new Error('Invalid or stale move');
  const s: SichuanRound=structuredClone(state);s.revision++;
  if(move.kind==='ack'){
    if(s.phase!=='result')throw new Error('No result to acknowledge');
    const win=s.events[s.events.length-1];if(win.kind!=='win')throw new Error('No win event');
    next(s,win.seats.length===1?win.seats[0]:win.from);return s;
  }
  if(move.kind==='claim'){
    if(s.phase!=='claims'||!s.claims)throw new Error('No claim window');
    s.claims=answerSichuanClaim(s.claims,id,move.choice);resolve(s);return s;
  }
  if(s.actor!==id||s.seats[id].retired)throw new Error('Not your turn');
  const player=s.seats[id];
  if(move.kind==='draw'){
    if(s.phase!=='draw'||!s.wall.length)throw new Error('Draw unavailable');
    const tile=s.replacement?s.wall.pop()!:s.wall.shift()!;player.hand.push(tile);s.drawn=tile;s.passed[id]=false;s.phase='turn';return s;
  }
  if(s.phase!=='turn')throw new Error('Not a discard turn');
  const legal=sichuanOwnOptions(player,{drawn:s.drawn,wallRemaining:s.wall.length,passedWin:s.passed[id],openingTurn:state.revision===0});
  if(move.kind==='win'){
    if(!legal.win)throw new Error('Not a winning hand');
    player.retired=true;s.events.push({kind:'win',seats:[id],from:id,tile:s.drawn??player.hand[player.hand.length-1],selfDraw:true,robbing:false,afterKong:s.replacement});s.phase='result';return s;
  }
  if(move.kind==='discard'){
    s.seats[id]=discardSichuanTile(player,move.tile);s.rivers.push({seat:id,tile:move.tile,claimed:false});
    s.claims=newSichuanClaims(s.seats,id,move.tile,s.wall.length,s.passed);s.phase='claims';s.drawn=null;resolve(s);return s;
  }
  if(move.kind==='concealed-kong'){
    if(!legal.concealedKongs.includes(move.tile))throw new Error('Kong unavailable');
    remove(player.hand,move.tile,4);player.melds.push({kind:'kong',tiles:Array(4).fill(move.tile),open:false});kong(s,id,id,move.tile,'concealed');return s;
  }
  if(move.kind==='added-kong'){
    if(!legal.addedKongs.includes(move.meld))throw new Error('Added kong unavailable');
    const tile=player.melds[move.meld].tiles[0];s.added=move.meld;s.claims=newSichuanClaims(s.seats,id,tile,s.wall.length,s.passed,true);s.phase='claims';resolve(s);return s;
  }
  throw new Error('Unknown action');
}
