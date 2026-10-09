import {isRecoveryGame,type RecoveryGame} from './recovery-replay';
import {validRecoveryKey} from '../recovery-auth';
export type BoardRecoverySave={version:1;game:RecoveryGame;role:'host'|'guest';secret:string;checkpoint:string};
type Store=Pick<Storage,'getItem'|'setItem'|'removeItem'>;
export function boardSaveKey(game:RecoveryGame){if(!isRecoveryGame(game))throw new Error('Invalid saved game');return `yifang:board:${game}:recovery:v1`;}
/** Envelope validation only. Replay and peer agreement are still mandatory.
 * Use sessionStorage: no cross-tab copies, SDP, export, or account storage.
 */
export function parseBoardSave(text:string,game:RecoveryGame):BoardRecoverySave{
 if(typeof text!=='string'||text.length>4000000)throw new Error('Oversized board save');
 const v=JSON.parse(text);
 if(!v||typeof v!=='object'||Array.isArray(v)||Object.keys(v).length!==5||Object.keys(v).some(k=>!['version','game','role','secret','checkpoint'].includes(k))||v.version!==1||v.game!==game||!isRecoveryGame(v.game)||!['host','guest'].includes(v.role)||!validRecoveryKey(v.secret)||typeof v.checkpoint!=='string'||v.checkpoint.length>1500000)throw new Error('Invalid board save');
 return v;
}
export function readBoardSave(store:Store,game:RecoveryGame){const text=store.getItem(boardSaveKey(game));return text===null?null:parseBoardSave(text,game);}
export function writeBoardSave(store:Store,value:BoardRecoverySave){
 const text=JSON.stringify(value),copy=parseBoardSave(text,value.game),key=boardSaveKey(value.game);
 store.setItem(key,text);if(store.getItem(key)!==text)throw new Error('Board save not retained');return copy;
}
export function clearBoardSave(store:Store,game:RecoveryGame){const key=boardSaveKey(game);store.removeItem(key);if(store.getItem(key)!==null)throw new Error('Board save not cleared');}
