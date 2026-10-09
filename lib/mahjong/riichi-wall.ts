import * as Majiang from '@kobalab/majiang-core';

/** Host-private initial wall, not a seat view. This preset has no red fives.
 * Validate all 136 tiles before constructing a fresh wall; never deserialize
 * arbitrary engine fields, counters, hidden indicators or balance claims.
 */
export function validateRiichiWall(value:unknown):string[]{
  if(!Array.isArray(value)||value.length!==136)throw new Error('Invalid riichi wall length');
  const counts=new Map<string,number>();
  for(const tile of value){
    if(typeof tile!=='string'||!/^([mps][1-9]|z[1-7])$/.test(tile))throw new Error('Invalid riichi tile');
    counts.set(tile,(counts.get(tile)??0)+1);
  }
  if(counts.size!==34||[...counts.values()].some(n=>n!==4))throw new Error('Invalid riichi tile inventory');
  return [...value];
}

/** Pinned majiang-core 1.4.1 Shan constructor layout. Retain its draw/kong
 * methods, but initialize from a verified original order without randomizing.
 * Indicators derive from that order, exactly as in the upstream constructor.
 * Engine upgrades must re-verify this adapter and version recovery archives.
 */
export function riichiWallFromTiles(value:unknown,rule:Record<string,unknown>):Majiang.Shan{
  const tiles=validateRiichiWall(value);
  const wall=Object.create(Majiang.Shan.prototype) as Majiang.Shan;
  wall._rule=rule;wall._pai=tiles;wall._baopai=[tiles[4]];
  wall._fubaopai=rule['裏ドラあり']?[tiles[9]]:null;
  wall._weikaigang=false;wall._closed=false;
  return wall;
}
