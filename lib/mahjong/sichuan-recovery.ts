import {sichuanTableId} from '../../content/sichuan-table';
import {newSichuanSession,applySichuanSession,type SichuanSession} from './sichuan-session';
import {validSichuanRequest,type SichuanRequest} from './sichuan-request';

/** HOST PRIVATE: contains the original wall, hence every player's hidden cards.
 * Never put this in a player view, invite, URL, guest message or public export.
 * Replay validates legality, not authorship: the host remains trusted.
 */
export type SichuanRecovery={version:1;game:'sichuan-four';preset:typeof sichuanTableId;
 dealer:number;deck:number[];actions:{seat:number;move:SichuanRequest}[]};
const MAX_ACTIONS=2000;
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const seat=(v:unknown):v is number=>typeof v==='number'&&Number.isInteger(v)&&v>=0&&v<4;
export function newSichuanRecovery(deck:readonly number[],dealer=0):SichuanRecovery{
 newSichuanSession(deck,dealer); // Validate deck multiplicities and dealer now.
 return {version:1,game:'sichuan-four',preset:sichuanTableId,dealer,deck:[...deck],actions:[]};
}
/** Called only after the host engine accepts an action; rejects missing order. */
export function appendSichuanRecovery(log:SichuanRecovery,id:number,move:SichuanRequest):SichuanRecovery{
 if(!seat(id)||!validSichuanRequest(move)||move.revision!==log.actions.length||log.actions.length>=MAX_ACTIONS)throw new Error('Invalid recovery action');
 return {...log,actions:[...log.actions,{seat:id,move:structuredClone(move)}]};
}
export function restoreSichuanRecovery(text:string):{archive:SichuanRecovery;session:SichuanSession}{
 if(typeof text!=='string'||text.length>512_000)throw new Error('Recovery archive too large');
 const raw:unknown=JSON.parse(text);
 if(!object(raw)||Object.keys(raw).some(k=>!['version','game','preset','dealer','deck','actions'].includes(k))||
  raw.version!==1||raw.game!=='sichuan-four'||raw.preset!==sichuanTableId||!seat(raw.dealer)||
  !Array.isArray(raw.deck)||raw.deck.length!==108||!raw.deck.every(t=>typeof t==='number'&&Number.isInteger(t)&&t>=0&&t<27)||
  !Array.isArray(raw.actions)||raw.actions.length>MAX_ACTIONS)throw new Error('Invalid recovery archive');
 let session=newSichuanSession(raw.deck,raw.dealer);
 const actions:SichuanRecovery['actions']=[];
 for(const entry of raw.actions){
  if(!object(entry)||Object.keys(entry).some(k=>!['seat','move'].includes(k))||!seat(entry.seat)||!validSichuanRequest(entry.move))throw new Error('Invalid recovery entry');
  session=applySichuanSession(session,entry.seat,entry.move.revision,entry.move.action);
  actions.push({seat:entry.seat,move:structuredClone(entry.move)});
 }
 // Balances, winners and confirmations are all recomputed, never imported.
 return {archive:{version:1,game:'sichuan-four',preset:sichuanTableId,dealer:raw.dealer,deck:[...raw.deck],actions},session};
}
