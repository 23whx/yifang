import {sichuanClaimOptions,type SichuanSeat} from './sichuan-actions';

export type ClaimChoice='pass'|'win'|'pung'|'kong';
type Options={win:boolean;pung:boolean;kong:boolean};
export type ClaimWindow={from:number;tile:number;robbing:boolean;options:Options[];replies:(ClaimChoice|null)[]};
export type ClaimResult={kind:'waiting'}|{kind:'wins';seats:number[];passed:number[]}|{kind:'meld';seat:number;action:'pung'|'kong';passed:number[]}|{kind:'unclaimed';passed:number[]};
function validSeat(id:number){if(!Number.isInteger(id)||id<0||id>3)throw new Error('Invalid seat');}
/** Host-only snapshot. A pending added kong is NOT committed before this resolves. */
export function newSichuanClaims(seats:readonly SichuanSeat[],from:number,tile:number,wallRemaining:number,passed:readonly boolean[],robbing=false):ClaimWindow{
  validSeat(from);
  if(seats.length!==4||passed.length!==4||passed.some(x=>typeof x!=='boolean')||seats[from].retired||!Number.isInteger(tile)||tile<0||tile>=27)throw new Error('Invalid claim context');
  const options=seats.map((s,id)=>{
    if(id===from)return {win:false,pung:false,kong:false};
    const o=sichuanClaimOptions(s,tile,{drawn:null,wallRemaining,passedWin:passed[id]});
    return robbing?{win:o.win,pung:false,kong:false}:o;
  });
  return {from,tile,robbing,options,replies:options.map(o=>o.win||o.pung||o.kong?null:'pass')};
}
/** The connection supplies id; a guest cannot supply legality or another seat. */
export function answerSichuanClaim(w:ClaimWindow,id:number,choice:ClaimChoice):ClaimWindow{
  validSeat(id);
  if(w.replies[id]!==null||!['pass','win','pung','kong'].includes(choice)||(choice!=='pass'&&!w.options[id][choice]))throw new Error('Illegal or duplicate response');
  const replies=[...w.replies];replies[id]=choice;
  return {...w,options:w.options.map(o=>({...o})),replies};
}
/** Wait for every eligible response, irrespective of arrival order. Never let
 * an early pung suppress a later win, or an early win suppress another winner. */
export function resolveSichuanClaims(w:ClaimWindow):ClaimResult{
  if(w.replies.some(x=>x===null))return {kind:'waiting'};
  const order=[1,2,3].map(n=>(w.from+n)%4);
  const passed=order.filter(id=>w.options[id].win&&w.replies[id]!=='win');
  const winners=order.filter(id=>w.replies[id]==='win');
  if(winners.length)return {kind:'wins',seats:winners,passed};
  const claimant=order.find(id=>w.replies[id]==='pung'||w.replies[id]==='kong');
  if(claimant!==undefined)return {kind:'meld',seat:claimant,action:w.replies[claimant] as 'pung'|'kong',passed};
  return {kind:'unclaimed',passed};
}
export function sichuanClaimView(w:ClaimWindow,id:number){
  validSeat(id);return {from:w.from,tile:w.tile,robbing:w.robbing,options:{...w.options[id]},reply:w.replies[id],responded:w.replies.map(x=>x!==null)};
}
