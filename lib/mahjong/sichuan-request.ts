import type {SichuanSessionAction} from './sichuan-session';
export type SichuanRequest={revision:number;action:SichuanSessionAction};
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const uint=(v:unknown,max:number)=>typeof v==='number'&&Number.isSafeInteger(v)&&v>=0&&v<=max;
/** Strict action allowlist before any message reaches the rule engine. */
export function validSichuanRequest(value:unknown):value is SichuanRequest{
  if(!object(value)||Object.keys(value).some(k=>!['revision','action'].includes(k))||!uint(value.revision,1e9)||!object(value.action))return false;
  const a=value.action;
  const only=(keys:string[])=>Object.keys(a).every(k=>['kind',...keys].includes(k));
  switch(a.kind){
    case 'draw':case 'win':case 'ack':return only([]);
    case 'discard':case 'concealed-kong':return only(['tile'])&&uint(a.tile,26);
    case 'added-kong':return only(['meld'])&&uint(a.meld,3);
    case 'claim':return only(['choice'])&&['pass','win','pung','kong'].includes(String(a.choice));
    case 'missing':return only(['suit'])&&uint(a.suit,2);
    case 'exchange':return only(['tiles'])&&Array.isArray(a.tiles)&&a.tiles.length===3&&a.tiles.every(t=>uint(t,26));
    default:return false;
  }
}
