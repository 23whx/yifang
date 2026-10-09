'use client';
import {useState} from 'react';
import {actMcrMatch,mcrMatchView,type McrMatch} from '../../lib/mahjong/mcr-match';
import McrPractice from '../../components/cards/McrPractice';
export default function FinalMatchAcceptance({initial,moves,locale}:{initial:McrMatch;moves:number;locale:'zh'|'en'}){
 const [state,setState]=useState(initial),view=mcrMatchView(state,0);
 function act(seat:number,choice:number|'confirm'|'next'){setState(s=>actMcrMatch(s,seat,s.revision,choice));}
 return <main className="mx-auto max-w-4xl px-4"><h1>Development-only final-match acceptance</h1>
  <p>{moves} real rule actions prepared 16 hands; only final confirmations are tested natively. Not LAN or 16-hand manual play.</p>
  <p role="status">{JSON.stringify({hand:view.hand,complete:view.complete,confirmed:state.session.confirmed,balances:view.balances,history:view.history.length,revision:state.revision})}</p>
  <div className="flex flex-wrap gap-3">{[1,2,3].map(seat=><button className="rpg-button" key={seat} disabled={!mcrMatchView(state,seat).canConfirm} onClick={()=>act(seat,'confirm')}>Acceptance: confirm seat {seat+1}</button>)}</div>
  <McrPractice locale={locale} remote={{view,disabled:false,onAction:choice=>act(0,choice)}}/>
 </main>;
}
