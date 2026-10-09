import type {Ffish} from './ffish';
import {isRecoveryGame,replayRecovery,type RecoveryGame} from './recovery-replay';
import {validRecoveryKey} from '../recovery-auth';

export type BoardRecoveryChallenge={game:RecoveryGame;identity:string;epoch:string;hostNonce:string;guestNonce:string;hostDigest:string;guestDigest:string;agreedDigest:string};
const identity=(v:unknown):v is string=>typeof v==='string'&&/^[a-zA-Z0-9-]{12,80}$/.test(v);
export function validBoardRecoveryChallenge(value:unknown):value is BoardRecoveryChallenge{
 if(!value||typeof value!=='object'||Array.isArray(value))return false;
 const v=value as Record<string,unknown>;
 return Object.keys(v).length===8&&isRecoveryGame(v.game)&&identity(v.identity)&&identity(v.epoch)&&v.epoch!==v.identity&&
  validRecoveryKey(v.hostNonce)&&validRecoveryKey(v.guestNonce)&&v.hostNonce!==v.guestNonce&&validRecoveryKey(v.hostDigest)&&validRecoveryKey(v.guestDigest)&&validRecoveryKey(v.agreedDigest);
}
export const newBoardRecoverySecret=()=>Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');
async function digest(text:string){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text))),b=>b.toString(16).padStart(2,'0')).join('');}

/** Both full public-information histories are replayed. A missing final delivery
 * may leave either side ahead. Accept only an exact canonical prefix, never a
 * divergent history, different game, or different original match. This returns
 * a proposal, not permission to resume: BOTH peers must authenticate this exact
 * digest tuple using fresh locally-owned nonces before accepting it.
 * Trusted-peer play, not protection from a credential-holding opponent who
 * fabricates an unseen but legal suffix; do not advertise server anti-cheat.
 */
export async function proposeBoardRecovery(rules:Ffish|null,game:RecoveryGame,hostText:string,guestText:string){
  const h=replayRecovery(rules,game,hostText),g=replayRecovery(rules,game,guestText);
  if(h.identity!==g.identity)throw new Error('Different original board match');
  const hostArchive=h.checkpoint,guestArchive=g.checkpoint;
  const he=JSON.parse(hostArchive).events as unknown[],ge=JSON.parse(guestArchive).events as unknown[];
  for(let i=0;i<Math.min(he.length,ge.length);i++)if(JSON.stringify(he[i])!==JSON.stringify(ge[i]))throw new Error('Divergent board histories');
  const checkpoint=he.length>=ge.length?hostArchive:guestArchive;
  const [hostDigest,guestDigest,agreedDigest]=await Promise.all([digest(hostArchive),digest(guestArchive),digest(checkpoint)]);
  return {game,identity:h.identity,hostRevision:h.revision,guestRevision:g.revision,checkpoint,hostDigest,guestDigest,agreedDigest};
}
function transcript(challenge:BoardRecoveryChallenge,role:'host'|'guest'){
 if(!validBoardRecoveryChallenge(challenge)||(role!=='host'&&role!=='guest'))throw new Error('Invalid board recovery proof context');
 return new TextEncoder().encode(JSON.stringify(['yifang-board-recovery-v1',role,challenge.game,challenge.identity,challenge.epoch,challenge.hostNonce,challenge.guestNonce,challenge.hostDigest,challenge.guestDigest,challenge.agreedDigest]));
}
async function importSecret(secret:string){
 if(!validRecoveryKey(secret))throw new Error('Invalid board recovery secret');
 return crypto.subtle.importKey('raw',Uint8Array.from(secret.match(/../g)!,b=>parseInt(b,16)),{name:'HMAC',hash:'SHA-256'},false,['sign','verify']);
}
export async function boardRecoveryProof(secret:string,challenge:BoardRecoveryChallenge,role:'host'|'guest'){
 const proof=await crypto.subtle.sign('HMAC',await importSecret(secret),transcript(challenge,role));
 return Array.from(new Uint8Array(proof),b=>b.toString(16).padStart(2,'0')).join('');
}
export async function verifyBoardRecoveryProof(secret:string,challenge:BoardRecoveryChallenge,role:'host'|'guest',proof:unknown){
 if(!validRecoveryKey(proof)||!validBoardRecoveryChallenge(challenge))return false;
 return crypto.subtle.verify('HMAC',await importSecret(secret),Uint8Array.from(proof.match(/../g)!,b=>parseInt(b,16)),transcript(challenge,role));
}

/** One instance per fresh transport attempt. Neither a valid proof from an old
 * attempt nor two copies racing the verifier can authorize this instance.
 * The epoch is assigned by that new transport, not read from an old save.
 */
export class BoardRecoveryAgreement {
 readonly nonce=newBoardRecoverySecret();
 private preparing=false;
 private challenge?:BoardRecoveryChallenge;
 private checkpoint?:string;
 private issued=false;
 private signed=false;
 private received=false;
 private verified=false;
 private failed=false;
 constructor(private secret:string,private role:'host'|'guest',private game:RecoveryGame,private originalIdentity:string,private epoch:string){
  if(!validRecoveryKey(secret)||(role!=='host'&&role!=='guest')||!isRecoveryGame(game)||!identity(originalIdentity)||!identity(epoch)||epoch===originalIdentity)throw new Error('Invalid recovery attempt');
 }
 async prepare(rules:Ffish|null,challenge:BoardRecoveryChallenge,hostText:string,guestText:string){
  if(this.preparing||this.failed)throw new Error('Recovery proposal already consumed');
  this.preparing=true;
  try{
   if(!validBoardRecoveryChallenge(challenge)||challenge.game!==this.game||challenge.identity!==this.originalIdentity||challenge.epoch!==this.epoch||challenge[this.role==='host'?'hostNonce':'guestNonce']!==this.nonce)throw new Error('Recovery attempt mismatch');
   const copy={...challenge};
   const proposal=await proposeBoardRecovery(rules,this.game,hostText,guestText);
   if(proposal.identity!==this.originalIdentity||proposal.hostDigest!==copy.hostDigest||proposal.guestDigest!==copy.guestDigest||proposal.agreedDigest!==copy.agreedDigest)throw new Error('Recovery digest mismatch');
   this.checkpoint=proposal.checkpoint;this.challenge=copy;
  }catch(error){this.failed=true;throw error;}
 }
 async proof(){
  if(this.failed||!this.challenge||this.issued)throw new Error('Recovery proof unavailable');
  this.issued=true;
  try{const proof=await boardRecoveryProof(this.secret,this.challenge,this.role);this.signed=true;return proof;}catch(error){this.failed=true;throw error;}
 }
 async acceptPeer(proof:unknown){
  if(this.failed||!this.challenge||this.received)return false;
  this.received=true;
  try{this.verified=await verifyBoardRecoveryProof(this.secret,this.challenge,this.role==='host'?'guest':'host',proof);}
  catch{this.verified=false;}
  if(!this.verified)this.failed=true;
  return this.verified;
 }
 confirmedCheckpoint(){
  if(this.failed||!this.signed||!this.verified||!this.checkpoint)throw new Error('Both recovery proofs required');
  return this.checkpoint;
 }
}
