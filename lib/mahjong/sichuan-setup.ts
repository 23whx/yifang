import {countsOf,type Suit} from './shape';

export type SichuanSetup={
  phase:'exchange'|'missing'|'ready';dealer:number;direction:1|2|3;
  hands:number[][];wall:number[];exchange:(number[]|null)[];missing:(Suit|null)[];
};
function seat(id:number){if(!Number.isInteger(id)||id<0||id>3)throw new Error('Invalid seat');}
/** Host-browser state only. Direction is fixed BEFORE dealing, never chosen from hands.
 * Each deck entry is a tile kind; exactly four of each of the 27 numbered tiles. */
export function newSichuanSetup(deck:readonly number[],dealer=0,direction:1|2|3=1,exchange=true):SichuanSetup{
  seat(dealer);if(![1,2,3].includes(direction))throw new Error('Invalid exchange direction');
  const counts=countsOf(deck);
  if(deck.length!==108||counts.slice(0,27).some(n=>n!==4)||counts.slice(27).some(Boolean))throw new Error('Invalid Sichuan wall');
  const wall=[...deck],hands:number[][]=[[],[],[],[]];
  for(let round=0;round<13;round++)for(let offset=0;offset<4;offset++)hands[(dealer+offset)%4].push(wall.shift()!);
  hands[dealer].push(wall.shift()!);
  return {phase:exchange?'exchange':'missing',dealer,direction,hands,wall,exchange:[null,null,null,null],missing:[null,null,null,null]};
}
function copy(s:SichuanSetup):SichuanSetup{return {...s,hands:s.hands.map(h=>[...h]),wall:[...s.wall],exchange:s.exchange.map(h=>h&&[...h]),missing:[...s.missing]};}
/** Selection is committed once and kept private until all four players choose. */
export function chooseSichuanExchange(s:SichuanSetup,id:number,tiles:readonly number[]):SichuanSetup{
  seat(id);
  if(s.phase!=='exchange'||s.exchange[id]!==null||tiles.length!==3)throw new Error('Exchange unavailable');
  countsOf(tiles);
  if(tiles.some(t=>t>=27||Math.floor(t/9)!==Math.floor(tiles[0]/9)))throw new Error('Choose three of one suit');
  const owned=[...s.hands[id]];
  for(const t of tiles){const i=owned.indexOf(t);if(i<0)throw new Error('Tile not owned');owned.splice(i,1);}
  const next=copy(s);next.exchange[id]=[...tiles];
  if(next.exchange.every(Boolean)){
    // Remove ALL outgoing tiles before delivering ANY incoming tiles.
    for(let from=0;from<4;from++)for(const t of next.exchange[from]!){const i=next.hands[from].indexOf(t);next.hands[from].splice(i,1);}
    for(let from=0;from<4;from++)next.hands[(from+s.direction)%4].push(...next.exchange[from]!);
    next.phase='missing';
  }
  return next;
}
export function chooseSichuanMissing(s:SichuanSetup,id:number,suit:Suit):SichuanSetup{
  seat(id);
  if(s.phase!=='missing'||s.missing[id]!==null||![0,1,2].includes(suit))throw new Error('Missing suit unavailable');
  const next=copy(s);next.missing[id]=suit;
  if(next.missing.every(x=>x!==null))next.phase='ready';
  return next;
}
/** Allowlist: never expose wall, other hands, or uncommitted opponents' choices. */
export function sichuanSetupView(s:SichuanSetup,id:number){
  seat(id);return {phase:s.phase,seat:id,dealer:s.dealer,direction:s.direction,hand:[...s.hands[id]],
    handCounts:s.hands.map(h=>h.length),wallCount:s.wall.length,
    exchangeChosen:s.exchange.map(x=>x!==null),ownExchange:s.exchange[id]?[...s.exchange[id]!]:null,
    missingChosen:s.missing.map(x=>x!==null),missing:s.missing.map((x,i)=>s.phase==='ready'||i===id?x:null)};
}
