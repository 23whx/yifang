import type {Ffish} from './ffish';
import {isBoardGame,type BoardGame} from './variants';
import {BoardRecoverySession} from './recovery-session';
import {GoRecoverySession} from '../go/recovery-session';

export type RecoveryGame=BoardGame|'go';
export const isRecoveryGame=(game:unknown):game is RecoveryGame=>typeof game==='string'&&(game==='go'||isBoardGame(game));
/** Common public transcript only; variant-specific views remain in their rules
 * modules. Go must not load a WASM chess engine merely to validate its save. */
export function replayRecovery(rules:Ffish|null,game:RecoveryGame,text:string){
 if(game==='go'){
  const session=GoRecoverySession.restore(text),view=session.view();
  return {identity:view.identity,revision:view.revision,checkpoint:session.checkpoint()};
 }
 if(!rules||!isBoardGame(game))throw new Error('Missing board recovery rules');
 const session=BoardRecoverySession.restore(rules,text,game);
 try{const view=session.view();return {identity:view.identity,revision:view.revision,checkpoint:session.checkpoint()};}
 finally{session.dispose();}
}
