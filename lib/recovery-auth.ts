/** Domain-separated challenge proofs. The recovery secret itself is never sent
 * during reconnection. Initial delivery belongs to the trusted invite channel. */
export type RecoveryChallenge={game:'sichuan-four'|'holdem-four'|'holdem-two'|'mcr-four'|'riichi';previousMatch:string;match:string;seat:number;nonce:string};
export const validRecoveryKey=(value:unknown):value is string=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);
export function validRecoveryChallenge(value:unknown):value is RecoveryChallenge{
 if(!value||typeof value!=='object'||Array.isArray(value))return false;
 const v=value as Record<string,unknown>,identity=(s:unknown)=>typeof s==='string'&&/^[a-zA-Z0-9-]{12,80}$/.test(s);
 return Object.keys(v).length===5&&(v.game==='sichuan-four'||v.game==='holdem-four'||v.game==='holdem-two'||v.game==='mcr-four'||v.game==='riichi')&&identity(v.previousMatch)&&identity(v.match)&&v.previousMatch!==v.match&&
  Number.isInteger(v.seat)&&Number(v.seat)>=1&&Number(v.seat)<=(v.game==='holdem-two'?1:3)&&validRecoveryKey(v.nonce);
}
async function key(secret:string){
 if(!validRecoveryKey(secret))throw new Error('Invalid recovery secret');
 return crypto.subtle.importKey('raw',Uint8Array.from(secret.match(/../g)!,b=>parseInt(b,16)),{name:'HMAC',hash:'SHA-256'},false,['sign','verify']);
}
function message(challenge:RecoveryChallenge,role:'host'|'guest',lastView:string){
 if(!validRecoveryChallenge(challenge)||typeof lastView!=='string'||lastView.length>60000||(role==='host'&&lastView!==''))throw new Error('Invalid recovery proof context');
 return new TextEncoder().encode(JSON.stringify(['yifang-recovery-v1',role,challenge.game,challenge.previousMatch,challenge.match,challenge.seat,challenge.nonce,lastView]));
}
export async function recoveryProof(secret:string,challenge:RecoveryChallenge,role:'host'|'guest',lastView=''){
 const proof=await crypto.subtle.sign('HMAC',await key(secret),message(challenge,role,lastView));
 return Array.from(new Uint8Array(proof),b=>b.toString(16).padStart(2,'0')).join('');
}
export async function verifyRecoveryProof(secret:string,challenge:RecoveryChallenge,role:'host'|'guest',proof:unknown,lastView=''){
 if(!validRecoveryKey(proof))return false;
 return crypto.subtle.verify('HMAC',await key(secret),Uint8Array.from(proof.match(/../g)!,b=>parseInt(b,16)),message(challenge,role,lastView));
}
