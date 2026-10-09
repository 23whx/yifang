import * as Majiang from '@kobalab/majiang-core';

export type RiichiChoice={id:string;kind:'discard'|'riichi'|'chi'|'pon'|'kan'|'tsumo'|'ron'|'abort'|'pass'|'continue';value?:string};
export type RiichiDecision={revision:number;choices:RiichiChoice[]};
export type RiichiSeatView={seat:number;roundWind:number;handNumber:number;honba:number;pot:number;scores:number[];ids:number[];turn:number;remaining:number;indicators:string[];hands:string[];rivers:string[][]};

/** A seat-local input adapter, never a source of the host's concealed opponents/wall.
 * Rule-library callbacks run before its missed-ron flag changes: derive options
 * inside those callbacks, not after Player.action returns. */
export class RiichiPlayer extends Majiang.Player {
  private revision=0;
  private pending?:{revision:number;choices:RiichiChoice[];reply:(reply:Majiang.Reply)=>void};
  private closed=false;
  constructor(private decide:(decision:RiichiDecision)=>void,private observe:(event:Majiang.Event)=>void=()=>{},private changed:(view:RiichiSeatView)=>void=()=>{}){super();}

  action(event:Majiang.Event,callback?:(reply:Majiang.Reply)=>void){
    if(this.closed)return;
    // Full final paipu contains everyone's starting hands. Do not send it to
    // opponents/AI as a normal event; only final scores and ranks are needed.
    const final=event.jieju as {defen:number[];rank:number[];point:string[]}|undefined;
    const visible=final?{jieju:{defen:final.defen,rank:final.rank,point:final.point}}:event;
    this.observe(JSON.parse(JSON.stringify(visible)));
    super.action(event,callback);
    const m=this.model;
    if(!this.closed&&m.shan)this.changed({seat:this._menfeng,roundWind:m.zhuangfeng,handNumber:m.jushu,honba:m.changbang,pot:m.lizhibang,scores:[...m.defen],ids:[...m.player_id],turn:m.lunban,remaining:m.shan.paishu,indicators:[...m.shan.baopai],hands:m.shoupai.map(h=>h.toString()),rivers:m.he.map(h=>[...h._pai])});
  }
  close(){this.closed=true;this.pending=undefined;this.revision++;}
  submit(revision:number,id:string):boolean {
    const pending=this.pending;
    if(this.closed||!pending||pending.revision!==revision)return false;
    const choice=pending.choices.find(c=>c.id===id);
    if(!choice)return false;
    this.pending=undefined;
    const reply:Majiang.Reply={};
    if(choice.kind==='discard')reply.dapai=choice.value;
    if(choice.kind==='riichi')reply.dapai=choice.value+'*';
    if(choice.kind==='chi'||choice.kind==='pon')reply.fulou=choice.value;
    if(choice.kind==='kan'){
      if(choice.id.startsWith('call:'))reply.fulou=choice.value;
      else reply.gang=choice.value;
    }
    if(choice.kind==='ron'||choice.kind==='tsumo')reply.hule='-';
    if(choice.kind==='abort')reply.daopai='-';
    pending.reply(reply);
    return true;
  }
  private ask(choices:RiichiChoice[]){
    if(!this._callback)return;
    const revision=++this.revision;
    this.pending={revision,choices:choices.map(c=>({...c})),reply:this._callback};
    this.decide({revision,choices:choices.map(c=>({...c}))});
  }
  private acknowledge(){this._callback?.({});}
  action_kaiju(){this.acknowledge();}
  action_qipai(){this.acknowledge();}
  action_jieju(){this.acknowledge();}
  action_hule(){this.ask([{id:'continue',kind:'continue'}]);}
  action_pingju(){this.ask([{id:'continue',kind:'continue'}]);}
  private discards():RiichiChoice[]{return this.get_dapai(this.shoupai).map(value=>({id:'discard:'+value,kind:'discard',value}));}
  action_zimo(event:{l:number},replacement=false){
    if(event.l!==this._menfeng)return this.acknowledge();
    const choices=this.discards();
    if(this.allow_hule(this.shoupai,null,replacement))choices.push({id:'tsumo',kind:'tsumo'});
    if(this.allow_pingju(this.shoupai))choices.push({id:'abort',kind:'abort'});
    for(const value of this.get_gang_mianzi(this.shoupai))choices.push({id:'kan:'+value,kind:'kan',value});
    const riichi=this.allow_lizhi(this.shoupai);
    if(Array.isArray(riichi))for(const value of riichi)choices.push({id:'riichi:'+value,kind:'riichi',value});
    this.ask(choices);
  }
  action_dapai(event:{l:number;p:string}){
    if(event.l===this._menfeng)return this.acknowledge();
    const tile=event.p.slice(0,2)+['','+','=','-'][(event.l-this._menfeng+4)%4];
    const choices:RiichiChoice[]=[{id:'pass',kind:'pass'}];
    if(this.allow_hule(this.shoupai,tile))choices.push({id:'ron',kind:'ron'});
    for(const [kind,values] of [
      ['chi',this.get_chi_mianzi(this.shoupai,tile)],
      ['pon',this.get_peng_mianzi(this.shoupai,tile)],
      ['kan',this.get_gang_mianzi(this.shoupai,tile)],
    ] as const)for(const value of values)choices.push({id:'call:'+value,kind,value});
    if(choices.length===1)return this.acknowledge();
    this.ask(choices);
  }
  action_fulou(event:{l:number;m:string}){
    // Open kong gets a replacement draw; chi/pon require a legal discard first.
    if(event.l!==this._menfeng||/^[mpsz]\d{4}/.test(event.m))return this.acknowledge();
    this.ask(this.discards());
  }
  action_gang(event:{l:number;m:string}){
    if(event.l===this._menfeng||/^[mpsz]\d{4}$/.test(event.m))return this.acknowledge();
    const tile=event.m[0]+event.m.slice(-1)+['','+','=','-'][(event.l-this._menfeng+4)%4];
    if(!this.allow_hule(this.shoupai,tile,true))return this.acknowledge();
    this.ask([{id:'pass',kind:'pass'},{id:'ron',kind:'ron'}]);
  }
}

/** Shared settings: keep the scoring adapter and round engine on one preset. */
export function riichiRules(){return Majiang.rule({
  '赤牌':{m:0,p:0,s:0},'ダブル役満あり':false,'数え役満あり':false,'切り上げ満貫あり':false,
});}
