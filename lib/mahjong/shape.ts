/** Tile kinds: 0–8 characters, 9–17 dots, 18–26 bamboo, 27–33 honors.
 * This module checks shapes, NOT yaku/fan, furiten, turn legality or payments. */
export type MahjongVariant = 'riichi' | 'mcr' | 'sichuan';
export type Suit = 0 | 1 | 2;
export type Meld = { kind: 'chow' | 'pung' | 'kong'; tiles: number[]; open: boolean };
export type Shape =
  | { kind: 'standard'; pair: number; groups: Meld[] }
  | { kind: 'seven-pairs'; pairs: number[] }
  | { kind: 'thirteen-orphans'; pair: number }
  | { kind: 'knitted-straight'; knitted: number[]; pair: number; groups: Meld[] }
  | { kind: 'honors-knitted'; honors: number; tiles: number[] };
export type ShapeOptions = { variant: MahjongVariant; missingSuit?: Suit };
const honors = [27,28,29,30,31,32,33];
const orphans = [0,8,9,17,18,26,...honors];
const permutations = [[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]];
const knittedPatterns = permutations.map(p => p.flatMap((suit,i) => [i,i+3,i+6].map(rank => suit*9+rank)).sort((a,b)=>a-b));
export const tileNames = [...['万','筒','条'].flatMap(s=>[...'一二三四五六七八九'].map(n=>n+s)), '东','南','西','北','中','发','白'];
export function tileKind(value: string): number {
  const kind=tileNames.indexOf(value); if(kind<0)throw new Error(`Unknown tile: ${value}`);return kind;
}
export function countsOf(tiles: readonly number[]): number[] {
  const counts=Array<number>(34).fill(0);
  for(const tile of tiles) {
    if(!Number.isInteger(tile)||tile<0||tile>33)throw new Error('Invalid tile kind');
    if(++counts[tile]>4)throw new Error('More than four copies of a tile');
  }
  return counts;
}
function validate(concealed: readonly number[], melds: readonly Meld[], options: ShapeOptions) {
  if(!['riichi','mcr','sichuan'].includes(options.variant))throw new Error('Unknown ruleset');
  if(options.missingSuit!==undefined&&![0,1,2].includes(options.missingSuit))throw new Error('Invalid missing suit');
  if(melds.length>4)throw new Error('Too many melds');
  for(const m of melds) {
    if(!m||!Array.isArray(m.tiles)||typeof m.open!=='boolean')throw new Error('Malformed meld');
    countsOf(m.tiles);
    const t=[...m.tiles].sort((a,b)=>a-b);
    if(m.kind==='kong') {if(t.length!==4||t.some(n=>n!==t[0]))throw new Error('Invalid kong');}
    else if(m.kind==='pung') {if(t.length!==3||t.some(n=>n!==t[0])||!m.open)throw new Error('Invalid declared pung');}
    else if(m.kind==='chow') {
      if(t.length!==3||t[0]>=27||Math.floor(t[0]/9)!==Math.floor(t[2]/9)||t[1]!==t[0]+1||t[2]!==t[0]+2||!m.open||options.variant==='sichuan')throw new Error('Invalid declared chow');
    } else throw new Error('Unknown meld');
  }
  const all=[...concealed,...melds.flatMap(m=>m.tiles)];countsOf(all);
  if(options.variant==='sichuan'&&all.some(t=>t>=27))throw new Error('Sichuan uses only numbered suits');
  return all;
}

/** Enumerate every decomposition; choosing only the first can mis-score ambiguous hands. */
function groupsOf(counts: number[], needed: number): Meld[][] {
  const i=counts.findIndex(n=>n>0);
  if(i<0)return needed===0?[[]]:[];
  if(needed<=0)return [];
  const result:Meld[][]=[];
  if(counts[i]>=3) {
    counts[i]-=3;
    for(const tail of groupsOf(counts,needed-1))result.push([{kind:'pung',tiles:[i,i,i],open:false},...tail]);
    counts[i]+=3;
  }
  if(i<27&&i%9<=6&&counts[i+1]>0&&counts[i+2]>0) {
    counts[i]--;counts[i+1]--;counts[i+2]--;
    for(const tail of groupsOf(counts,needed-1))result.push([{kind:'chow',tiles:[i,i+1,i+2],open:false},...tail]);
    counts[i]++;counts[i+1]++;counts[i+2]++;
  }
  return result;
}
function standards(counts: number[], needed: number): {pair:number;groups:Meld[]}[] {
  const result:{pair:number;groups:Meld[]}[]=[];
  for(let i=0;i<34;i++)if(counts[i]>=2) {
    counts[i]-=2;
    for(const groups of groupsOf(counts,needed))result.push({pair:i,groups});
    counts[i]+=2;
  }
  return result;
}
export function decomposeHand(concealed: readonly number[], melds: readonly Meld[] = [], options: ShapeOptions = {variant:'riichi'}): Shape[] {
  const all=validate(concealed,melds,options);
  // A declared kong counts as one group but has four physical tiles.
  if(concealed.length!==14-melds.length*3)return [];
  if(options.variant==='sichuan') {
    if(new Set(all.map(t=>Math.floor(t/9))).size>2)return [];
    if(options.missingSuit!==undefined&&all.some(t=>Math.floor(t/9)===options.missingSuit))return [];
  }
  const counts=countsOf(concealed), result:Shape[]=[];
  const declared=()=>melds.map(m=>({...m,tiles:[...m.tiles]}));
  for(const s of standards(counts,4-melds.length))result.push({kind:'standard',pair:s.pair,groups:[...s.groups,...declared()]});
  if(melds.length===0) {
    const pairs:number[]=[];
    counts.forEach((n,i)=>{for(let p=0;p<n/2;p++)pairs.push(i);});
    if(counts.every(n=>n%2===0)&&(options.variant!=='riichi'||counts.every(n=>n===0||n===2)))result.push({kind:'seven-pairs',pairs});
    if(options.variant!=='sichuan'&&orphans.every(t=>counts[t]>=1)&&counts.every((n,i)=>n===0||orphans.includes(i)))result.push({kind:'thirteen-orphans',pair:counts.findIndex(n=>n===2)});
  }
  if(options.variant==='mcr')for(const pattern of knittedPatterns) {
    if(melds.length<=1&&pattern.every(t=>counts[t]>0)) {
      const rest=[...counts];pattern.forEach(t=>rest[t]--);
      for(const s of standards(rest,1-melds.length))result.push({kind:'knitted-straight',knitted:[...pattern],pair:s.pair,groups:[...s.groups,...declared()]});
    }
    if(melds.length===0&&counts.every((n,i)=>n===0||(n===1&&(i>=27||pattern.includes(i)))))result.push({kind:'honors-knitted',honors:concealed.filter(t=>t>=27).length,tiles:[...concealed].sort((a,b)=>a-b)});
  }
  const unique=new Map(result.map(s=>[JSON.stringify(s),s]));
  return [...unique.values()];
}

/** Structural waits only. A listed tile may still be barred by scoring or furiten. */
export function structuralWaits(concealed: readonly number[], melds: readonly Meld[] = [], options: ShapeOptions = {variant:'riichi'}): number[] {
  const all=validate(concealed,melds,options);
  if(concealed.length!==13-melds.length*3)return [];
  const owned=countsOf(all),waits:number[]=[];
  for(let tile=0;tile<(options.variant==='sichuan'?27:34);tile++)if(owned[tile]<4&&decomposeHand([...concealed,tile],melds,options).length)waits.push(tile);
  return waits;
}

/** No private opponents' tiles: publicSeen is exposed/river information only,
 * excluding this player's concealed tiles AND declared melds already provided. */
export function readyDiscards(concealed: readonly number[], melds: readonly Meld[] = [], options: ShapeOptions = {variant:'riichi'}, publicSeen: readonly number[] = []) {
  const all=validate(concealed,melds,options);
  const known=countsOf([...all,...publicSeen]);
  if(concealed.length!==14-melds.length*3)return [];
  const hasMissing=options.variant==='sichuan'&&options.missingSuit!==undefined&&concealed.some(t=>Math.floor(t/9)===options.missingSuit);
  return [...new Set(concealed)].sort((a,b)=>a-b).flatMap(discard=>{
    if(hasMissing&&Math.floor(discard/9)!==options.missingSuit)return [];
    const rest=[...concealed];rest.splice(rest.indexOf(discard),1);
    const waits=structuralWaits(rest,melds,options);
    return waits.length?[{discard,waits,unseen:waits.reduce((n,t)=>n+4-known[t],0)}]:[];
  });
}
