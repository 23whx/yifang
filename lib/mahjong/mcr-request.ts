/** Peers may name only a current legal-choice index, never tiles or scores. */
export type McrRequest={revision:number;choice:number|'confirm'|'next'};
export function validMcrRequest(value:unknown):value is McrRequest{
  if(!value||typeof value!=='object'||Array.isArray(value))return false;
  const v=value as Record<string,unknown>;
  return Object.keys(v).length===2&&Object.keys(v).every(k=>k==='revision'||k==='choice')
    &&typeof v.revision==='number'&&Number.isSafeInteger(v.revision)&&v.revision>=0&&v.revision<=1e9
    &&(v.choice==='confirm'||v.choice==='next'||typeof v.choice==='number'&&Number.isSafeInteger(v.choice)&&v.choice>=0&&v.choice<256);
}
