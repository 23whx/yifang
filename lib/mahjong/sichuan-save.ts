export const SICHUAN_SAVE_KEY='yifang:sichuan:recovery:v1';
export type SichuanSave={version:1;role:'host'|'guest';checkpoint:string};
type Store=Pick<Storage,'getItem'|'setItem'|'removeItem'>;
/** Tab-scoped sessionStorage, never localStorage shared by four test tabs.
 * No invitations/SDP are stored. Host checkpoints contain hidden information.
 */
export function readSichuanSave(store:Store):SichuanSave|null{
 const text=store.getItem(SICHUAN_SAVE_KEY);if(text===null)return null;
 if(text.length>600000)throw new Error('Oversized local recovery');
 const v=JSON.parse(text);
 if(!v||typeof v!=='object'||Array.isArray(v)||Object.keys(v).some(k=>!['version','role','checkpoint'].includes(k))||v.version!==1||!['host','guest'].includes(v.role)||typeof v.checkpoint!=='string'||v.checkpoint.length>520000)throw new Error('Invalid local recovery');
 return v;
}
export function writeSichuanSave(store:Store,role:SichuanSave['role'],checkpoint:string){
 if(!['host','guest'].includes(role)||typeof checkpoint!=='string'||checkpoint.length>520000)throw new Error('Invalid local recovery');
 const value:SichuanSave={version:1,role,checkpoint},text=JSON.stringify(value);
 if(text.length>600000)throw new Error('Oversized local recovery');
 store.setItem(SICHUAN_SAVE_KEY,text);
 // Do not display "saved" if browser storage is denied or fails to retain it.
 if(store.getItem(SICHUAN_SAVE_KEY)!==text)throw new Error('Recovery save not retained');
 return value;
}
export function clearSichuanSave(store:Store){store.removeItem(SICHUAN_SAVE_KEY);if(store.getItem(SICHUAN_SAVE_KEY)!==null)throw new Error('Recovery was not cleared');}
