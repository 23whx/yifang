/** MCR setup only, not a legal-win or scoring engine.
 * Kinds 0..33 match shape.ts; 34..41 are eight distinct flower/season tiles.
 * The supplied wall is already shuffled and broken; its head is the next draw.
 * Reference: EMA MCR Green Book, section 3.5.6 (initial flower replacement).
 */
export type McrSetup={
  revision:number;phase:'flowers'|'ready';dealer:number;actor:number|null;
  hands:number[][];flowers:number[][];wall:number[];
  lastReplacement:{seat:number;flower:number;tile:number}|null;
};
export const mcrFlowerNames=['梅','兰','竹','菊','春','夏','秋','冬'] as const;
export function isMcrFlower(tile:number){return Number.isInteger(tile)&&tile>=34&&tile<=41;}
function seat(id:number){if(!Number.isInteger(id)||id<0||id>3)throw new Error('Invalid seat');}
export function validateMcrDeck(deck:readonly number[]){
  if(deck.length!==144)throw new Error('MCR needs 144 tiles');
  const counts=Array<number>(42).fill(0);
  for(const t of deck){if(!Number.isInteger(t)||t<0||t>41)throw new Error('Invalid MCR tile');counts[t]++;}
  if(counts.some((n,i)=>n!==(i<34?4:1)))throw new Error('Invalid MCR inventory');
}
function nextFlowerSeat(hands:readonly number[][],dealer:number){
  // Complete each player's replacements (including chains) before the next seat.
  return [0,1,2,3].map(offset=>(dealer+offset)%4).find(id=>hands[id].some(isMcrFlower))??null;
}
export function newMcrSetup(deck:readonly number[],dealer=0):McrSetup{
  seat(dealer);validateMcrDeck(deck);
  const wall=[...deck],hands:number[][]=[[],[],[],[]];
  // Three four-tile packets per player, then one each and dealer's extra tile.
  for(let packet=0;packet<3;packet++)for(let offset=0;offset<4;offset++)hands[(dealer+offset)%4].push(...wall.splice(0,4));
  for(let offset=0;offset<4;offset++)hands[(dealer+offset)%4].push(wall.shift()!);
  hands[dealer].push(wall.shift()!);
  const actor=nextFlowerSeat(hands,dealer);
  return {revision:0,phase:actor===null?'ready':'flowers',dealer,actor,hands,flowers:[[],[],[],[]],wall,lastReplacement:null};
}
/** One click reveals ONE owned flower and draws ONE tail tile. Never auto-run a
 * chain, and never pass flower kinds to shape/scoring. Only the host owns state. */
export function replaceMcrSetupFlower(s:McrSetup,id:number,revision:number,flower:number):McrSetup{
  seat(id);
  if(s.phase!=='flowers'||s.actor!==id||s.revision!==revision||!isMcrFlower(flower)||!s.hands[id].includes(flower)||!s.wall.length)throw new Error('Flower replacement unavailable');
  const next:McrSetup={...s,revision:s.revision+1,hands:s.hands.map(h=>[...h]),flowers:s.flowers.map(h=>[...h]),wall:[...s.wall]};
  const index=next.hands[id].indexOf(flower),tile=next.wall.pop()!;
  next.hands[id][index]=tile;next.flowers[id].push(flower);
  next.lastReplacement={seat:id,flower,tile};
  next.actor=nextFlowerSeat(next.hands,next.dealer);next.phase=next.actor===null?'ready':'flowers';
  return next;
}
export function mcrSetupView(s:McrSetup,id:number){
  seat(id);
  return {revision:s.revision,phase:s.phase,dealer:s.dealer,actor:s.actor,seat:id,
    hand:[...s.hands[id]],handCounts:s.hands.map(h=>h.length),flowers:s.flowers.map(h=>[...h]),wallCount:s.wall.length,
    replaceable:s.actor===id?s.hands[id].filter(isMcrFlower):[],
    // A replacement tile is private, even when it is another unexposed flower.
    lastReplacement:s.lastReplacement?{seat:s.lastReplacement.seat,flower:s.lastReplacement.flower,tile:s.lastReplacement.seat===id?s.lastReplacement.tile:null}:null};
}
