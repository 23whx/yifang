import {createMcrRoundWithOpening,applyMcrRoundAction,createMcrRoundPlayerView,type McrOpeningSnapshot} from './vendor/mcr-rules';
import {mcrOpeningView} from './mcr-opening';
import type {McrRoundState,McrRoundAction,McrRoundPlayerView} from 'miaoda-game-mcr-mahjong-rules';

export type McrSession={revision:number;closed:boolean;round:McrRoundState;confirmed:boolean[];opening:McrOpeningSnapshot[]};
const ids=['seat-1','seat-2','seat-3','seat-4'] as const;
function checkSeat(id:number){if(!Number.isInteger(id)||id<0||id>3)throw new Error('Invalid MCR seat');}
/** Turn choices are recomputed on the host. A peer sends only revision + index,
 * never a player id, winning analysis, hand, source flag or claim object. */
function choices(v:McrRoundPlayerView):McrRoundAction[]{
  const a=v.legalActions,playerId=v.viewerId,result:McrRoundAction[]=[];
  if(a.selfDrawAnalysis)result.push({type:'declare-self-draw',playerId});
  if(a.canReplaceFlower)result.push({type:'replace-flower',playerId});
  if(a.canDiscardFlower)result.push({type:'discard-flower',playerId});
  if(a.canDraw)result.push({type:'draw',playerId});
  if(a.canDrawReplacement)result.push({type:'draw-replacement',playerId});
  for(const option of a.claimOptions){
    if(v.claimWindow?.kind==='added-kong'){if(option.kind==='win')result.push({type:'claim-added-kong-win',playerId,option});}
    else result.push({type:'claim-discard',playerId,option});
  }
  if(a.canPassClaim)result.push({type:'pass-claim',playerId});
  for(const o of a.concealedKongOptions)result.push({type:'declare-concealed-kong',playerId,tileIds:o.tileIds});
  for(const o of a.addedKongOptions)result.push({type:'declare-added-kong',playerId,...o});
  for(const tileId of a.discardTileIds)result.push({type:'discard',playerId,tileId});
  return result;
}
export function newMcrSession(seed:number,dealer=0,roundWind:'E'|'S'|'W'|'N'='E'):McrSession{
  if(!Number.isSafeInteger(seed)||seed<0||seed>0xffffffff)throw new Error('Invalid MCR seed');
  checkSeat(dealer);
  const {round,opening}=createMcrRoundWithOpening({playerIds:ids,seed,dealerId:ids[dealer],roundWind});
  return {revision:0,closed:false,round,opening,confirmed:[false,false,false,false]};
}
export function mcrSessionView(s:McrSession,id:number){
  checkSeat(id);const engineView=createMcrRoundPlayerView(s.round,ids[id]);
  const {legalActions,...baseTable}=engineView;
  // Flowers already exposed on the table are public, unlike concealed hands.
  // Copy them so a renderer cannot mutate the host's authoritative round.
  const table={...baseTable,publicFlowers:Object.fromEntries(ids.map(p=>[p,s.round.flowers[p].map(t=>({...t}))]))};
  void legalActions; // Engine-only command candidates never cross the room boundary.
  const snapshot=s.opening[0];
  if(snapshot){
    const o=mcrOpeningView(snapshot,id);
    // Never expose the already computed post-opening hand or draw to a guest.
    table.activePlayerId=ids[o.actor];table.phase='flower';table.turnSource='deal';
    table.lastDrawnTileId=null;table.pendingFlowerTileId=o.flower?.id??null;table.drewThisTurn=false;
    table.ownHand=o.hand;table.ownFlowers=o.flowers[id];table.wallCount=o.wallCount;
    // Opening snapshots precede the engine's completed replacement sequence.
    // Do not reveal flowers that have not actually been exposed yet.
    table.publicFlowers=Object.fromEntries(ids.map((p,i)=>[p,o.flowers[i].map(t=>({...t}))]));
    table.otherHandCounts=Object.fromEntries(ids.filter(p=>p!==ids[id]).map(p=>[p,o.handCounts[ids.indexOf(p)]]));
    table.otherFlowerCounts=Object.fromEntries(ids.filter(p=>p!==ids[id]).map(p=>[p,o.flowers[ids.indexOf(p)].length]));
    return {revision:s.revision,closed:s.closed,seat:id,table,confirmed:[...s.confirmed],
      choices:!s.closed&&o.flower?[{index:0,type:'replace-flower' as const,tileIds:[o.flower.id],claim:null}]:[],canConfirm:false};
  }
  return {revision:s.revision,closed:s.closed,seat:id,table,confirmed:[...s.confirmed],
    // Explicit display metadata, no host seed or opponent concealed state.
    choices:s.closed?[]:choices(engineView).map((a,index)=>({index,type:a.type,
      tileIds:'tileIds' in a?[...a.tileIds]:'tileId' in a?[a.tileId]:'option' in a?[...a.option.handTileIds]:[],
      claim:'option' in a?a.option.kind:null})),
    canConfirm:!s.closed&&s.round.phase==='finished'&&!s.confirmed[id]};
}
export function actMcrSession(s:McrSession,id:number,revision:number,choice:number|'confirm'):McrSession{
  checkSeat(id);if(s.closed||revision!==s.revision)throw new Error('Closed or stale MCR action');
  if(s.opening.length){
    if(s.opening[0].playerId!==ids[id]||choice!==0)throw new Error('Resolve this opening flower first');
    return {...s,revision:s.revision+1,opening:s.opening.slice(1)};
  }
  if(choice==='confirm'){
    if(s.round.phase!=='finished'||s.confirmed[id])throw new Error('No unconfirmed result');
    const confirmed=[...s.confirmed];confirmed[id]=true;return {...s,revision:s.revision+1,confirmed};
  }
  if(!Number.isInteger(choice)||choice<0)throw new Error('Invalid MCR choice');
  const action=choices(createMcrRoundPlayerView(s.round,ids[id]))[choice];
  if(!action)throw new Error('Unavailable MCR choice');
  const result=applyMcrRoundAction(s.round,action);
  if(!result.ok)throw new Error(result.rejection.code);
  return {...s,revision:s.revision+1,round:result.state};
}
export function closeMcrSession(s:McrSession):McrSession{return s.closed?s:{...s,revision:s.revision+1,closed:true};}
