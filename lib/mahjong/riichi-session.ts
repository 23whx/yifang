import * as Majiang from '@kobalab/majiang-core';
import {RiichiPlayer,riichiRules,type RiichiChoice,type RiichiDecision,type RiichiSeatView} from './riichi-player';
import {riichiWallFromTiles,validateRiichiWall} from './riichi-wall';

export type RiichiSummary={scores:number[];ranks:number[]};
export type RiichiSessionOptions={
  onEvent:(event:Majiang.Event)=>void;
  onDecision:(decision:RiichiDecision)=>void;
  onFinish:(summary:RiichiSummary)=>void;
  onState?:(view:RiichiSeatView)=>void;
  thinkMs?:number;
  /** HOST PRIVATE recovery hooks. Never forward to onEvent/onState/guests.
   * A replay source must throw when exhausted, never silently randomize. */
  privateWalls?:{next?:()=>readonly string[];record?:(tiles:string[])=>void};
  /** Recovery runner only: explicit local queue, no global timer overrides.
   * Four human seats required; drain() advances to the next input boundary. */
  controlled?:boolean;
  /** Supplying this selects four human seats; transport binds IDs, not payloads. */
  multiplayer?:{
    onEvent:(id:number,event:Majiang.Event)=>void;
    onDecision:(id:number,decision:RiichiDecision)=>void;
    onState:(id:number,view:RiichiSeatView)=>void;
  };
};

/** Deliberately simple practice opponent: only its own hand is available here.
 * Prefer a legal win, then riichi, otherwise minimize tiles-away (shanten).
 * No strategic strength claim; it declines optional calls to preserve a closed hand. */
export function chooseRiichiPractice(player:RiichiPlayer,choices:readonly RiichiChoice[]):RiichiChoice {
  if(!choices.length)throw new Error('No legal decision');
  const immediate=choices.find(c=>c.kind==='ron'||c.kind==='tsumo')||choices.find(c=>c.kind==='riichi');
  if(immediate)return immediate;
  const discards=choices.filter(c=>c.kind==='discard');
  let best:RiichiChoice|undefined,bestDistance=Infinity;
  for(const choice of discards){
    const distance=Majiang.Util.xiangting(player.shoupai.clone().dapai(choice.value!));
    if(distance<bestDistance){best=choice;bestDistance=distance;}
  }
  return best||choices.find(c=>c.kind==='pass'||c.kind==='continue')||choices[0];
}

/** The library's stop() pauses at a reply boundary. A disposed React page must
 * also cancel delayed transitions and reject any next() already queued. */
class CancellableGame extends Majiang.Game {
  privateWalls?:RiichiSessionOptions['privateWalls'];
  private disposed=false;
  private timers=new Set<ReturnType<typeof setTimeout>>();
  private jobs:(()=>void)[]=[];
  private nextQueued=false;
  private draining=false;
  controlled=false;
  private queueNext(){
    if(this.disposed||this.nextQueued)return;
    this.nextQueued=true;
    this.jobs.push(()=>{this.nextQueued=false;this.next();});
  }
  call_players(type:string,messages:Majiang.Event[],timeout?:number){
    super.call_players(type,messages,timeout);
    if(this.controlled)this.queueNext();
  }
  reply(id:number,reply:Majiang.Reply){
    super.reply(id,reply);
    if(this.controlled&&this._reply.filter(Boolean).length===4)this.queueNext();
  }
  drain(){
    if(!this.controlled||this.draining)throw new Error('Invalid riichi drain');
    this.draining=true;
    try{let steps=0;while(this.jobs.length&&!this.disposed){if(++steps>60000)throw new Error('Riichi transition limit');this.jobs.shift()!();}}
    finally{this.draining=false;}
  }
  next(){if(!this.disposed)super.next();}
  qipai(wall?:Majiang.Shan){
    if(this.disposed)return;
    const source=this.privateWalls;
    const fresh=wall??(source?.next?riichiWallFromTiles(source.next(),this._rule):new Majiang.Shan(this._rule));
    source?.record?.(validateRiichiWall(fresh._pai));
    super.qipai(fresh);
  }
  delay(callback:()=>void,timeout=0){
    if(this.disposed)return;
    if(this.controlled){this.jobs.push(callback);return;}
    const timer=setTimeout(()=>{this.timers.delete(timer);if(!this.disposed)callback();},timeout);
    this.timers.add(timer);
  }
  dispose(){
    this.disposed=true;
    this.stop();
    clearTimeout(this._timeout_id);
    for(const timer of this.timers)clearTimeout(timer);
    this.timers.clear();
    this.jobs=[];
  }
}

/** One local human (id 0), three client-side opponents. No storage/network/API.
 * Construct a new session for each new match; never reuse revision ids across
 * sessions in UI closures. stop() makes old closures harmless. */
export class RiichiSession {
  private game:CancellableGame;
  private players:RiichiPlayer[]=[];
  private timers=new Set<ReturnType<typeof setTimeout>>();
  private phase:'idle'|'playing'|'finished'|'closed'='idle';
  constructor(private options:RiichiSessionOptions){
    if(options.controlled&&!options.multiplayer)throw new Error('Controlled riichi requires four humans');
    const thinkMs=options.thinkMs??350;
    if(!Number.isFinite(thinkMs)||thinkMs<0||thinkMs>10000)throw new Error('Invalid thinking delay');
    for(let id=0;id<4;id++){
      const player=new RiichiPlayer(decision=>{
        if(this.phase!=='playing')return;
        if(options.multiplayer){options.multiplayer.onDecision(id,decision);return;}
        if(id===0){options.onDecision(decision);return;}
        const timer=setTimeout(()=>{
          this.timers.delete(timer);
          if(this.phase!=='playing')return;
          player.submit(decision.revision,chooseRiichiPractice(player,decision.choices).id);
        },thinkMs);
        this.timers.add(timer);
      },event=>{if(this.phase==='playing'){if(options.multiplayer)options.multiplayer.onEvent(id,event);else if(id===0)options.onEvent(event);}},view=>{if(this.phase==='playing'){if(options.multiplayer)options.multiplayer.onState(id,view);else if(id===0)options.onState?.(view);}});
      this.players.push(player);
    }
    this.game=new CancellableGame(this.players,record=>{
      if(this.phase!=='playing')return;
      this.phase='finished';
      this.clear();
      options.onFinish({scores:[...record.defen as number[]],ranks:[...record.rank as number[]]});
    },{...riichiRules(),'場数':1,'延長戦方式':0},'Riichi practice');
    this.game.speed=0;
    this.game.privateWalls=options.privateWalls;
    this.game.controlled=!!options.controlled;
    if(options.controlled)this.game._sync=true;
  }
  get status(){return this.phase;}
  drain(){this.game.drain();}
  /** Recovery replay has consumed all recorded walls; only FUTURE hands may
   * shuffle. Keep the host-private record callback for those new walls. */
  useFreshWalls(){
    if(!this.options.controlled)throw new Error('Not a recovery session');
    if(this.game.privateWalls)this.game.privateWalls={record:this.game.privateWalls.record};
  }
  start(){
    if(this.phase!=='idle')return false;
    this.phase='playing';this.game.kaiju(0);return true;
  }
  submit(revision:number,id:string){return this.phase==='playing'&&this.players[0].submit(revision,id);}
  submitFor(playerId:number,revision:number,choice:string){
    return Number.isInteger(playerId)&&playerId>=0&&playerId<4&&(!!this.options.multiplayer||playerId===0)&&this.phase==='playing'&&this.players[playerId].submit(revision,choice);
  }
  stop(){if(this.phase==='closed')return;this.phase='closed';this.clear();}
  private clear(){
    this.players.forEach(p=>p.close());
    for(const timer of this.timers)clearTimeout(timer);
    this.timers.clear();this.game.dispose();
  }
}
