import type {RiichiRoomPayload} from './riichi-room';
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const integer=(v:unknown,min=0,max=1e9):v is number=>typeof v==='number'&&Number.isSafeInteger(v)&&v>=min&&v<=max;
const text=(v:unknown,max=128):v is string=>typeof v==='string'&&v.length<=max;
const four=(v:unknown,test:(n:unknown)=>boolean):v is unknown[]=>Array.isArray(v)&&v.length===4&&v.every(test);
const scores=(v:unknown)=>four(v,n=>integer(n,-1e9));
const hand=(v:unknown)=>text(v)&&/^[mpsz1-9_,*+=-]*$/.test(v)&&[...v.replace(/[+\-=*_]/g,'').matchAll(/z([1-9]+)/g)].every(m=>!/[89]/.test(m[1]));
const tile=(v:unknown)=>text(v,8)&&/^(?:[mps][1-9]|z[1-7])[_*+=-]*$/.test(v);
const summary=(v:unknown)=>object(v)&&scores(v.scores)&&four(v.ranks,n=>integer(n,1,4))&&new Set(v.ranks).size===4;

/** Runtime shape/size checks before React consumes network data. This is not
 * proof that a trusted host played fairly or chose the right Mahjong result. */
export function validRiichiPayload(p:unknown,recipient:number):p is RiichiRoomPayload {
  if(!object(p))return false;
  if(p.kind==='checkpoint'){
    const s=p.snapshot;
    return Object.keys(p).length===2&&object(s)&&Object.keys(s).length===5&&Object.keys(s).every(k=>['revision','view','decision','event','summary'].includes(k))&&integer(s.revision,0,20000)
      &&validRiichiPayload({kind:'state',view:s.view},recipient)
      &&(s.decision===null||validRiichiPayload({kind:'decision',decision:s.decision},recipient))
      &&(s.event===null||validRiichiPayload({kind:'event',event:s.event},recipient))
      &&(s.summary===null||validRiichiPayload({kind:'finished',summary:s.summary},recipient));
  }
  if(p.kind==='lobby')return four(p.connected,n=>typeof n==='boolean');
  if(p.kind==='ack')return integer(p.request,1,Number.MAX_SAFE_INTEGER)&&typeof p.accepted==='boolean';
  if(p.kind==='closed')return ['player-left','host-left'].includes(String(p.reason))&&integer(p.player,0,3);
  if(p.kind==='finished')return summary(p.summary);
  if(p.kind==='decision'){
    const d=p.decision;if(!object(d)||!integer(d.revision,1,Number.MAX_SAFE_INTEGER)||!Array.isArray(d.choices)||d.choices.length<1||d.choices.length>64)return false;
    return new Set(d.choices.map(c=>object(c)?c.id:undefined)).size===d.choices.length&&d.choices.every(c=>object(c)&&text(c.id,40)&&c.id.length>0&&['discard','riichi','chi','pon','kan','tsumo','ron','abort','pass','continue'].includes(String(c.kind))&&(['discard','riichi','chi','pon','kan'].includes(String(c.kind))?text(c.value)&&c.value.length>0&&hand(c.value):c.value===undefined));
  }
  if(p.kind==='state'){
    const s=p.view;
    return object(s)&&integer(s.seat,0,3)&&integer(s.roundWind,0,3)&&integer(s.handNumber,0,3)&&integer(s.honba)&&integer(s.pot)&&scores(s.scores)&&four(s.ids,n=>integer(n,0,3))&&new Set(s.ids).size===4&&s.ids[s.seat]===recipient&&integer(s.turn,-1,3)&&integer(s.remaining,0,70)&&Array.isArray(s.indicators)&&s.indicators.length<=5&&s.indicators.every(tile)&&four(s.hands,hand)&&four(s.rivers,r=>Array.isArray(r)&&r.length<=136&&r.every(tile));
  }
  if(p.kind!=='event'||!object(p.event)||Object.keys(p.event).length!==1)return false;
  const [kind]=Object.keys(p.event),e=p.event[kind];if(!object(e))return false;
  if(kind==='kaiju')return integer(e.id,0,3)&&e.id===recipient&&integer(e.qijia,0,3)&&four(e.player,n=>text(n,100))&&object(e.rule)&&text(e.title,1000);
  if(kind==='qipai')return integer(e.zhuangfeng,0,3)&&integer(e.jushu,0,3)&&integer(e.changbang)&&integer(e.lizhibang)&&scores(e.defen)&&tile(e.baopai)&&four(e.shoupai,hand);
  if(kind==='zimo'||kind==='gangzimo')return integer(e.l,0,3)&&(e.p===''||tile(e.p));
  if(kind==='dapai')return integer(e.l,0,3)&&tile(e.p);
  if(kind==='fulou'||kind==='gang')return integer(e.l,0,3)&&hand(e.m);
  if(kind==='kaigang')return tile(e.baopai);
  if(kind==='hule')return integer(e.l,0,3)&&(e.baojia===null||integer(e.baojia,0,3))&&hand(e.shoupai)&&integer(e.defen)&&scores(e.fenpei)&&Array.isArray(e.hupai)&&e.hupai.length>0&&e.hupai.length<=64&&e.hupai.every(y=>object(y)&&text(y.name,80)&&(integer(y.fanshu,1,100)||y.fanshu==='*'||y.fanshu==='**'))&&(e.fu===undefined||integer(e.fu,0,200))&&(e.fanshu===undefined||integer(e.fanshu,0,100));
  if(kind==='pingju')return text(e.name,80)&&scores(e.fenpei)&&four(e.shoupai,hand);
  if(kind==='jieju')return scores(e.defen)&&four(e.rank,n=>integer(n,1,4))&&Array.isArray(e.point)&&e.point.length===4&&e.point.every(n=>text(n,30))&&!('log' in e);
  return false;
}
