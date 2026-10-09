// Development acceptance only: real deterministic match transitions, no
// edited scores, fake terminal state or production save mutation.
import {newMcrMatch,mcrMatchView,actMcrMatch} from '../../lib/mahjong/mcr-match';
export function prepareFinalMcrMatch(){
 let state=newMcrMatch(42),moves=0;
 for(let hand=0;hand<16;hand++){
  let steps=0;
  while(state.session.round.phase!=='finished'){
   let selected:{seat:number;index:number}|undefined;
   for(let seat=0;seat<4&&!selected;seat++){
    const view=mcrMatchView(state,seat);
    if(view.choices.length){
     const choice=view.choices.find(c=>c.claim==='win'||c.type==='declare-self-draw')??view.choices.find(c=>c.type==='replace-flower')??view.choices.find(c=>['kong','pung','chow'].includes(c.claim??''))??view.choices[0];
     selected={seat,index:choice.index};
    }
   }
   if(!selected||++steps>=1000)throw new Error('Final-match fixture cannot progress');
   state=actMcrMatch(state,selected.seat,state.revision,selected.index);moves++;
  }
  if(hand<15){for(let seat=0;seat<4;seat++)state=actMcrMatch(state,seat,state.revision,'confirm');state=actMcrMatch(state,0,state.revision,'next');}
 }
 if(state.ledger.hands.length!==16||state.session.confirmed.some(Boolean)||mcrMatchView(state,0).complete)throw new Error('Invalid final acceptance checkpoint');
 return {state,moves};
}
