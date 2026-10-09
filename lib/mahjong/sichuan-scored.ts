import type {SichuanSetup} from './sichuan-setup';
import {startSichuanRound,moveSichuanRound,type SichuanMove,type SichuanRound} from './sichuan-round';
import {newSichuanLedger,postSichuanPayments,sichuanWinPayments,type SichuanLedger} from './sichuan-ledger';
import {sichuanPatternValue} from './sichuan-patterns';
import {settleSichuanWall,type SichuanWallRules} from './sichuan-wall-settlement';

export type SichuanScoreRules=SichuanWallRules&{selfDrawExtra:number;afterKongDoublings:number;robbingDoublings:number;concealedKong:number;addedKong:number;discardKong:number};
export type ScoredSichuan={round:SichuanRound;ledger:SichuanLedger;rules:SichuanScoreRules;wallChecks:ReturnType<typeof settleSichuanWall>['checks']|null};
export function newScoredSichuan(setup:SichuanSetup,rules:SichuanScoreRules):ScoredSichuan{
  for(const key of ['base','capMultiplier','missingSuitPenalty','concealedKong','addedKong','discardKong'] as const)if(!Number.isSafeInteger(rules[key])||rules[key]<1)throw new Error('Invalid scoring rule');
  for(const key of ['selfDrawExtra','afterKongDoublings','robbingDoublings'] as const)if(!Number.isSafeInteger(rules[key])||rules[key]<0||rules[key]>10)throw new Error('Invalid bonus');
  if(typeof rules.retiredReceiveMissingPenalty!=='boolean'||!Number.isSafeInteger(rules.base*rules.capMultiplier+rules.selfDrawExtra))throw new Error('Invalid score range');
  return {round:startSichuanRound(setup),ledger:newSichuanLedger(),rules:{...rules},wallChecks:null};
}
/** One immutable rule action plus its points: failure returns neither partial
 * move nor partial settlement. Configuration must be fixed before the hand.
 * No heavenly/earthly bonus, kong-transfer or liability override is inferred. */
export function moveScoredSichuan(s:ScoredSichuan,id:number,revision:number,move:SichuanMove):ScoredSichuan{
  const round=moveSichuanRound(s.round,id,revision,move),rules=s.rules;
  let ledger=s.ledger,wallChecks=s.wallChecks;
  const event=round.events[s.round.events.length];
  if(event){
    const key=`event:${s.round.events.length}`,active=s.round.seats.flatMap((p,i)=>p.retired?[]:[i]);
    if(event.kind==='kong'){
      const payers=event.form==='discard'?[event.from]:active.filter(i=>i!==event.seat);
      const amount=event.form==='concealed'?rules.concealedKong:event.form==='added'?rules.addedKong:rules.discardKong;
      ledger=postSichuanPayments(ledger,key,payers.map(from=>({from,to:event.seat,amount,kind:'kong'})));
    }else{
      const winners=event.seats.map(seat=>{
        const p=round.seats[seat],hand=event.selfDraw?p.hand:[...p.hand,event.tile];
        const pattern=sichuanPatternValue(hand,p.melds,p.missing);if(!pattern)throw new Error('Unscorable winning hand');
        const bonus=event.robbing?rules.robbingDoublings:event.afterKong?rules.afterKongDoublings:0;
        const amount=rules.base*Math.min(rules.capMultiplier,pattern.multiplier*2**bonus)+(event.selfDraw?rules.selfDrawExtra:0);
        return {seat,amount};
      });
      ledger=postSichuanPayments(ledger,key,sichuanWinPayments(active,winners,event.from,event.selfDraw));
    }
  }
  if(round.phase==='ended'&&round.end==='wall-empty'){
    const settled=settleSichuanWall(round,ledger,'wall-end',rules);ledger=settled.ledger;wallChecks=settled.checks;
  }
  return {round,ledger,rules:{...rules},wallChecks};
}
