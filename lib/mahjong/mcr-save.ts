export const MCR_SAVE_KEY='yifang:mcr-four:recovery:v1';
export type McrSave={version:1;role:'host'|'guest';checkpoint:string};
type Store=Pick<Storage,'getItem'|'setItem'|'removeItem'>;
/** Envelope validation only: the room/guest adapter still validates/replays
 * the checkpoint before use. Host payload includes the shuffle seed and all hidden cards; do not
 * export it, put it in URLs, or share it through localStorage/other tabs. */
export function parseMcrSave(text:string):McrSave{
 if(typeof text!=='string'||text.length>2300000)throw new Error('Oversized MCR save');
 const v=JSON.parse(text);
 if(!v||typeof v!=='object'||Array.isArray(v)||Object.keys(v).length!==3||Object.keys(v).some(k=>!['version','role','checkpoint'].includes(k))||v.version!==1||(v.role!=='host'&&v.role!=='guest')||typeof v.checkpoint!=='string'||!v.checkpoint.length||v.checkpoint.length>(v.role==='host'?2020000:62000))throw new Error('Invalid MCR save');
 return v;
}
export function readMcrSave(store:Store){const text=store.getItem(MCR_SAVE_KEY);return text===null?null:parseMcrSave(text);}
export function writeMcrSave(store:Store,role:McrSave['role'],checkpoint:string){
 const text=JSON.stringify({version:1,role,checkpoint}),value=parseMcrSave(text);
 store.setItem(MCR_SAVE_KEY,text);if(store.getItem(MCR_SAVE_KEY)!==text)throw new Error('MCR save not retained');return value;
}
export function clearMcrSave(store:Store){store.removeItem(MCR_SAVE_KEY);if(store.getItem(MCR_SAVE_KEY)!==null)throw new Error('MCR save not cleared');}
