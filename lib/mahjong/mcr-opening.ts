import type {McrOpeningSnapshot} from './vendor/mcr-rules';
/** Reveal only this player's hand and already exposed flowers. Never serialize
 * the host transcript: later snapshots contain future replacement tiles. */
export function mcrOpeningView(snapshot:McrOpeningSnapshot,seat:number){
  if(!Number.isInteger(seat)||seat<0||seat>3)throw new Error('Invalid seat');
  const ids=['seat-1','seat-2','seat-3','seat-4'],viewer=ids[seat];
  return {seat,actor:ids.indexOf(snapshot.playerId),hand:structuredClone(snapshot.hands[viewer]),
    handCounts:ids.map(id=>snapshot.hands[id].length),flowers:ids.map(id=>structuredClone(snapshot.flowers[id])),wallCount:snapshot.wall.length,
    flower:viewer===snapshot.playerId?structuredClone(snapshot.flowerTile):null};
}
