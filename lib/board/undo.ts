import type {Side} from './variants';

/** Number of plies that an undo can actually return to the human player. */
export function boardUndoPlies(mode:'ai'|'local',human:Side,turn:Side|null,moveCount:number){
  if(moveCount===0)return 0;
  // When playing second, the lone opening move belongs to the computer.
  // Undoing it immediately makes the computer replay, so it is not a useful undo.
  if(mode==='ai'&&human==='b'&&moveCount===1&&turn===human)return 0;
  return mode==='ai'&&moveCount>=2&&turn===human?2:1;
}
