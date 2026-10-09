export const MULTI_POKER_SAVE_KEY='yifang:holdem-four:recovery:v1';
export type MultiPokerSave={version:1;role:'host'|'guest';checkpoint:string};
type Store=Pick<Storage,'getItem'|'setItem'|'removeItem'>;
/** Envelope validation only: the room/guest adapter still validates/replays
 * the checkpoint before use. Host payload includes all hidden cards; do not
 * export it, put it in URLs, or share it through localStorage/other tabs. */
export function parseMultiPokerSave(text:string):MultiPokerSave{
 if(typeof text!=='string'||text.length>2300000)throw new Error('Oversized poker save');
 const v=JSON.parse(text);
 if(!v||typeof v!=='object'||Array.isArray(v)||Object.keys(v).length!==3||Object.keys(v).some(k=>!['version','role','checkpoint'].includes(k))||v.version!==1||(v.role!=='host'&&v.role!=='guest')||typeof v.checkpoint!=='string'||!v.checkpoint.length||v.checkpoint.length>(v.role==='host'?2020000:62000))throw new Error('Invalid poker save');
 return v;
}
export function readMultiPokerSave(store:Store){const text=store.getItem(MULTI_POKER_SAVE_KEY);return text===null?null:parseMultiPokerSave(text);}
export function writeMultiPokerSave(store:Store,role:MultiPokerSave['role'],checkpoint:string){
 const text=JSON.stringify({version:1,role,checkpoint}),value=parseMultiPokerSave(text);
 store.setItem(MULTI_POKER_SAVE_KEY,text);if(store.getItem(MULTI_POKER_SAVE_KEY)!==text)throw new Error('Poker save not retained');return value;
}
export function clearMultiPokerSave(store:Store){store.removeItem(MULTI_POKER_SAVE_KEY);if(store.getItem(MULTI_POKER_SAVE_KEY)!==null)throw new Error('Poker save not cleared');}
