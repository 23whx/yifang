import type {Event} from '@kobalab/majiang-core';
import {RiichiSession,type RiichiSummary} from './riichi-session';
import type {RiichiDecision,RiichiSeatView} from './riichi-player';
import {validateRiichiWall} from './riichi-wall';

type Action={seat:number;revision:number;choice:string};
type Archive={version:1;game:'riichi-four';preset:'east-no-red-core-1.4.1-v1';identity:string;walls:string[][];actions:Action[]};
export type RiichiRecoveryView={revision:number;view:RiichiSeatView|null;decision:RiichiDecision|null;event:Event|null;summary:RiichiSummary|null};
export type RiichiReplayMessage={seat:number;payload:{kind:'event';event:Event}|{kind:'state';view:RiichiSeatView}|{kind:'decision';decision:RiichiDecision}|{kind:'finished';summary:RiichiSummary}};
const MAX_ACTIONS=20000,MAX_WALLS=128,MAX_TEXT=2000000;
const object=(v:unknown,keys:string[]):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).length===keys.length&&Object.keys(v).every(k=>keys.includes(k));
const seat=(v:unknown):v is number=>Number.isInteger(v)&&Number(v)>=0&&Number(v)<4;
function action(v:unknown):v is Action{return object(v,['seat','revision','choice'])&&seat(v.seat)&&Number.isSafeInteger(v.revision)&&Number(v.revision)>0&&typeof v.choice==='string'&&v.choice.length>0&&v.choice.length<=40;}

/** HOST PRIVATE. Every wall reveals concealed tiles: never send checkpoints to
 * guests. Only view(id) is seat-projected. Restore recomputes all payments,
 * missed-ron state, riichi sticks and confirmations through the pinned engine.
 * This validates legal history, not the honesty of the trusted host.
 */
export class RiichiRecoverySession {
  private session:RiichiSession;
  private archive:Archive;
  private views:(RiichiSeatView|null)[]=[null,null,null,null];
  private decisions:(RiichiDecision|null)[]=[null,null,null,null];
  private events:(Event|null)[]=[null,null,null,null];
  private summary:RiichiSummary|null=null;
  private replayWalls:string[][]|null;
  private wallIndex=0;
  private messages:RiichiReplayMessage[]=[];
  constructor(identity:string,walls?:string[][]){
    if(typeof identity!=='string'||!/^[a-zA-Z0-9-]{12,80}$/.test(identity))throw new Error('Invalid riichi identity');
    this.archive={version:1,game:'riichi-four',preset:'east-no-red-core-1.4.1-v1',identity,walls:[],actions:[]};
    this.replayWalls=walls??null;
    this.session=new RiichiSession({controlled:true,onEvent:()=>{},onDecision:()=>{},onFinish:s=>{this.summary=structuredClone(s);this.decisions.fill(null);for(let seat=0;seat<4;seat++)this.messages.push({seat,payload:{kind:'finished',summary:structuredClone(s)}});},
      privateWalls:{...(walls?{next:()=>{
        if(!this.replayWalls||this.wallIndex>=this.replayWalls.length)throw new Error('Missing replay wall');
        return this.replayWalls[this.wallIndex++];
      }}:{}),record:tiles=>{
        if(this.archive.walls.length>=MAX_WALLS)throw new Error('Riichi wall limit');
        this.archive.walls.push([...tiles]);
      }},
      multiplayer:{onEvent:(id,e)=>{this.events[id]=structuredClone(e);this.messages.push({seat:id,payload:{kind:'event',event:structuredClone(e)}});},onState:(id,v)=>{this.views[id]=structuredClone(v);this.messages.push({seat:id,payload:{kind:'state',view:structuredClone(v)}});},onDecision:(id,d)=>{this.decisions[id]=structuredClone(d);this.messages.push({seat:id,payload:{kind:'decision',decision:structuredClone(d)}});}}
    });
    try{this.session.start();this.session.drain();}catch(e){this.session.stop();throw e;}
  }
  get identity(){return this.archive.identity;}
  get status(){return this.session.status;}
  get revision(){return this.archive.actions.length;}
  takeMessages(){const messages=this.messages;this.messages=[];return messages;}
  view(id:number):RiichiRecoveryView{
    if(!seat(id))throw new Error('Invalid riichi seat');
    return structuredClone({revision:this.revision,view:this.views[id],decision:this.decisions[id],event:this.events[id],summary:this.summary});
  }
  apply(id:number,revision:number,choice:string){
    const entry={seat:id,revision,choice},pending=this.decisions[id];
    if(!action(entry)||this.status!=='playing'||this.revision>=MAX_ACTIONS||!pending||pending.revision!==revision||!pending.choices.some(c=>c.id===choice))throw new Error('Invalid riichi recovery action');
    this.messages=[];
    // Reject duplicates before draining. No callbacks escape this transaction.
    if(!this.session.submitFor(id,revision,choice))throw new Error('Rejected riichi action');
    this.decisions[id]=null;
    this.archive.actions.push(entry);
    try{this.session.drain();}catch(e){this.session.stop();throw e;}
  }
  checkpoint(){if(this.status==='closed')throw new Error('Closed recovery runner');return JSON.stringify(this.archive);}
  stop(){this.session.stop();}
  viewAt(id:number,revision:number){
    if(!seat(id)||!Number.isSafeInteger(revision)||revision<0||revision>this.revision)throw new Error('Invalid history revision');
    const copy=RiichiRecoverySession.replay(this.archive,revision);
    try{return copy.view(id);}finally{copy.stop();}
  }
  private static replay(v:Archive,count:number){
    const runner=new RiichiRecoverySession(v.identity,v.walls);
    try{
      for(const a of v.actions.slice(0,count))runner.apply(a.seat,a.revision,a.choice);
      return runner;
    }catch(e){runner.stop();throw e;}
  }
  static restore(text:string){
    if(typeof text!=='string'||text.length>MAX_TEXT)throw new Error('Oversized riichi archive');
    const v:unknown=JSON.parse(text);
    if(!object(v,['version','game','preset','identity','walls','actions'])||v.version!==1||v.game!=='riichi-four'||v.preset!=='east-no-red-core-1.4.1-v1'||typeof v.identity!=='string'||!Array.isArray(v.walls)||!v.walls.length||v.walls.length>MAX_WALLS||!Array.isArray(v.actions)||v.actions.length>MAX_ACTIONS)throw new Error('Invalid riichi archive');
    const walls=v.walls.map(validateRiichiWall);
    if(!v.actions.every(action))throw new Error('Invalid riichi actions');
    const archive={...v,walls} as Archive;
    const runner=RiichiRecoverySession.replay(archive,archive.actions.length);
    if(runner.wallIndex!==walls.length){runner.stop();throw new Error('Unused riichi replay walls');}
    // The next hand of a resumed match needs a new wall. Retain original walls
    // for all recorded hands; switch only future qipai calls back to randomness.
    runner.session.useFreshWalls();runner.replayWalls=null;
    return runner;
  }
}
