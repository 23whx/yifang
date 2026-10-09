export const RIICHI_SAVE_KEY='yifang:riichi-four:recovery:v1';
export type RiichiSave={version:1;role:'host'|'guest';checkpoint:string};
type Store=Pick<Storage,'getItem'|'setItem'|'removeItem'>;
/** Envelope validation only: the room/guest adapter still validates/replays
 * the checkpoint before use. Host payload includes all original walls and seat credentials; do not
 * export it, put it in URLs, or share it through localStorage/other tabs. */
export function parseRiichiSave(text:string):RiichiSave{
 if(typeof text!=='string'||text.length>2300000)throw new Error('Oversized RIICHI save');
 const v=JSON.parse(text);
 if(!v||typeof v!=='object'||Array.isArray(v)||Object.keys(v).length!==3||Object.keys(v).some(k=>!['version','role','checkpoint'].includes(k))||v.version!==1||(v.role!=='host'&&v.role!=='guest')||typeof v.checkpoint!=='string'||!v.checkpoint.length||v.checkpoint.length>(v.role==='host'?2020000:62000))throw new Error('Invalid RIICHI save');
 return v;
}
export function readRiichiSave(store:Store){const text=store.getItem(RIICHI_SAVE_KEY);return text===null?null:parseRiichiSave(text);}
export function writeRiichiSave(store:Store,role:RiichiSave['role'],checkpoint:string){
 const text=JSON.stringify({version:1,role,checkpoint}),value=parseRiichiSave(text);
 store.setItem(RIICHI_SAVE_KEY,text);if(store.getItem(RIICHI_SAVE_KEY)!==text)throw new Error('RIICHI save not retained');return value;
}
export function clearRiichiSave(store:Store){store.removeItem(RIICHI_SAVE_KEY);if(store.getItem(RIICHI_SAVE_KEY)!==null)throw new Error('RIICHI save not cleared');}
