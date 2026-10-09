import { group, type GoState } from './rules';
export type Review = { revision:number; dead:number[]; approved:[boolean,boolean]; resumed:boolean };
export type ReviewAction = {kind:'toggle';point:number}|{kind:'confirm'}|{kind:'resume'};
export const newReview=():Review=>({revision:0,dead:[],approved:[false,false],resumed:false});
export const reviewDone=(r:Review)=>r.approved.every(Boolean)&&!r.resumed;
/** Host serializes proposals. Any changed dead-group proposal invalidates both approvals. */
export function changeReview(board:GoState,current:Review,actor:0|1,action:ReviewAction,expected:number):Review {
  if(board.passes<2||current.resumed||reviewDone(current)||expected!==current.revision)throw new Error('Stale or closed review');
  const r:Review={...current,dead:[...current.dead],approved:[...current.approved],revision:current.revision+1};
  if(action.kind==='confirm')r.approved[actor]=true;
  else if(action.kind==='resume'){r.resumed=true;r.approved=[false,false];r.dead=[];}
  else if(action.kind==='toggle'){
    const p=action.point;if(!Number.isInteger(p)||p<0||p>=board.board.length||board.board[p]===0)throw new Error('Select an occupied intersection');
    const stones=[...group(board.board,p,board.size).stones];r.dead=r.dead.includes(p)?r.dead.filter(i=>!stones.includes(i)):[...r.dead,...stones];r.dead.sort((a,b)=>a-b);r.approved=[false,false];
  }else throw new Error('Unknown review action');
  return r;
}
export function validReview(raw:unknown,board:GoState):raw is Review {
  if(!raw||typeof raw!=='object')return false;const r=raw as Review;
  if(!Number.isInteger(r.revision)||r.revision<0||typeof r.resumed!=='boolean'||!Array.isArray(r.approved)||r.approved.length!==2||r.approved.some(x=>typeof x!=='boolean')||!Array.isArray(r.dead)||r.dead.length>board.board.length||new Set(r.dead).size!==r.dead.length)return false;
  return r.dead.every(p=>Number.isInteger(p)&&p>=0&&p<board.board.length&&board.board[p]!==0&&[...group(board.board,p,board.size).stones].every(i=>r.dead.includes(i)));
}
