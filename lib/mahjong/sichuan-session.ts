import {sichuanTableId,sichuanTableRules} from '../../content/sichuan-table';
import {newSichuanSetup,chooseSichuanExchange,chooseSichuanMissing,sichuanSetupView,type SichuanSetup} from './sichuan-setup';
import {newScoredSichuan,moveScoredSichuan,type ScoredSichuan} from './sichuan-scored';
import {sichuanRoundView} from './sichuan-view';
import type {SichuanMove} from './sichuan-round';
import type {Suit} from './shape';

export type SichuanSession={revision:number;closed:boolean;setup:SichuanSetup;game:ScoredSichuan|null;confirmed:boolean[]};
export type SichuanSessionAction=SichuanMove|{kind:'exchange';tiles:number[]}|{kind:'missing';suit:Suit};
export function newSichuanSession(deck:readonly number[],dealer=0):SichuanSession{
  return {revision:0,closed:false,setup:newSichuanSetup(deck,dealer,1,true),game:null,confirmed:[false,false,false,false]};
}
/** Local UI and future peer adapter use the same seat-bound/revision-bound entry.
 * A peer cannot provide a rule override or send an engine state. */
export function applySichuanSession(s:SichuanSession,id:number,revision:number,action:SichuanSessionAction):SichuanSession{
  if(s.closed||!Number.isInteger(id)||id<0||id>3||revision!==s.revision||!action||typeof action!=='object')throw new Error('Invalid session action');
  const next={...s,revision:s.revision+1,confirmed:[...s.confirmed]};
  if(!s.game){
    if(action.kind==='exchange')next.setup=chooseSichuanExchange(s.setup,id,action.tiles);
    else if(action.kind==='missing')next.setup=chooseSichuanMissing(s.setup,id,action.suit);
    else throw new Error('Complete setup first');
    if(next.setup.phase==='ready')next.game=newScoredSichuan(next.setup,sichuanTableRules);
    return next;
  }
  if(action.kind==='exchange'||action.kind==='missing')throw new Error('Setup is locked');
  if(action.kind==='ack'){
    if(s.game.round.phase!=='result'||s.confirmed[id])throw new Error('No unconfirmed result');
    next.confirmed[id]=true;
    if(next.confirmed.every(Boolean)){
      next.game=moveScoredSichuan(s.game,0,s.game.round.revision,{kind:'ack'});next.confirmed=[false,false,false,false];
    }
  }else{
    next.game=moveScoredSichuan(s.game,id,s.game.round.revision,action);
  }
  return next;
}
export function closeSichuanSession(s:SichuanSession):SichuanSession{
  return s.closed?s:{...s,revision:s.revision+1,closed:true};
}
export function sichuanSessionView(s:SichuanSession,id:number){
  // No spread of host state, including setup's old hands or scoring configuration.
  const common={revision:s.revision,closed:s.closed,preset:sichuanTableId,confirmed:[...s.confirmed]};
  if(!s.game)return {...common,stage:'setup' as const,setup:sichuanSetupView(s.setup,id)};
  return {...common,stage:'play' as const,round:sichuanRoundView(s.game.round,id),
    balances:[...s.game.ledger.balances],payments:s.game.ledger.entries.map(e=>({...e})),
    wallChecks:s.game.wallChecks?.map(c=>({...c,waits:c.waits.map(w=>({...w}))}))??null};
}
export function sichuanRemotePhase(view: ReturnType<typeof sichuanSessionView>): 'playing'|'finished' {
  return view.stage==='play' && view.round.phase==='ended' ? 'finished' : 'playing';
}
