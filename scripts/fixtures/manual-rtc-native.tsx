'use client';
// Development-only, mounted through a temporary acceptance route, never a
// production page. Exercise the actual browser channel, not patched RTC APIs.
import {useState} from 'react';
import {ManualRTC,readManualSignal} from '../../lib/manual-rtc';
const check=(ok:unknown,message:string)=>{if(!ok)throw new Error(message);};
async function until(test:()=>boolean,message:string){
 const end=Date.now()+10000;
 while(!test()){if(Date.now()>end)throw new Error(message);await new Promise(r=>setTimeout(r,50));}
}
const byteSize=(text:string)=>new Blob([text]).size;
export default function NativeRtcAcceptance(){
 const [busy,setBusy]=useState(false),[lines,setLines]=useState<string[]>([]);
 async function run(){
  setBusy(true);setLines([]);
  const report=(line:string)=>setLines(previous=>[...previous,line]);
  try{
   const host=new ManualRTC('rtc-acceptance',true),guest=new ManualRTC('rtc-acceptance',false);
   let hostClosed=0,guestClosed=0,errors=0;
   host.onclose=()=>hostClosed++;guest.onclose=()=>guestClosed++;
   host.onerror=guest.onerror=()=>errors++;
   try{
    await host.finish(await guest.answer(await host.offer()));
    await until(()=>!!host.open&&!!guest.open,'Native manual peers failed to open');
    report('PASS: two production ManualRTC peers opened with native data channels (iceServers: []).');
    const payloads=[['CJK','棋'.repeat(21844)+'ab'],['emoji','😀'.repeat(16383)+'ab'],['escaped surrogate','\ud800'.repeat(10922)+'ab']];
    let received=0;
    for(const [name,value] of payloads)for(const [sender,receiver,direction] of [[host,guest,'host→guest'],[guest,host,'guest→host']] as const){
     check(byteSize(JSON.stringify(value))===65536,`${name}: fixture byte size`);
     let data:unknown;receiver.ondata=v=>{data=v;received++;};
     const previous=received;sender.send(value);
     await until(()=>received===previous+1,`${name}/${direction}: no delivery`);
     check(data===value,`${name}/${direction}: payload changed`);
     report(`PASS: ${name} ${direction}, exact 65536 UTF-8 bytes received unchanged.`);
    }
    for(const value of ['棋'.repeat(21845),'😀'.repeat(16384),'\ud800'.repeat(10923)])for(const sender of [host,guest]){
     check(byteSize(JSON.stringify(value))>65536,'Oversize fixture not oversize');
     let message='';try{sender.send(value);}catch(e){message=e instanceof Error?e.message:String(e);}
     check(message==='Message limit exceeded','Oversize native send not rejected');
    }
    // Reliable ordered channels: a received sentinel follows any earlier frame.
    let sentinels=0;
    guest.ondata=v=>{check(v==='after rejection','Oversize frame reached guest');sentinels++;};
    host.ondata=v=>{check(v==='after rejection','Oversize frame reached host');sentinels++;};
    host.send('after rejection');guest.send('after rejection');
    await until(()=>sentinels===2,'Connections unusable after local rejection');
    check(errors===0&&host.open&&guest.open,'Local rejection closed native peers');
    report('PASS: six over-limit sends rejected before transmission; bidirectional ordered sentinels received; peers remain open.');
    host.close();host.close();guest.close();guest.close();
    check(hostClosed===1&&guestClosed===1&&!host.open&&!guest.open,'Close not idempotent');
    report('PASS: both peers close once, repeated close is harmless.');
   }finally{host.close();guest.close();}
   const invalidFrames: [string,string|ArrayBuffer|Blob][]=[['CJK overflow',JSON.stringify('棋'.repeat(21845))],['emoji overflow',JSON.stringify('😀'.repeat(16384))],['malformed JSON','{broken'],['binary ArrayBuffer',new Uint8Array([123,125]).buffer],['binary Blob',new Blob(['{}'])]];
   for(const [name,wire] of invalidFrames){
    const raw=new RTCPeerConnection({iceServers:[]}),channel=raw.createDataChannel('yifang',{ordered:true}),receiver=new ManualRTC('rtc-acceptance',false);
    let rejected=0,closed=0,delivered=0;
    receiver.onerror=()=>rejected++;receiver.onclose=()=>closed++;receiver.ondata=()=>delivered++;
    try{
     await raw.setLocalDescription(await raw.createOffer());
     await until(()=>raw.iceGatheringState==='complete','Raw ICE gathering timeout');
     const offer=JSON.stringify({v:1,game:'rtc-acceptance',id:'0123456789abcdef01234567',type:'offer',sdp:raw.localDescription?.sdp});
     const answer=readManualSignal(await receiver.answer(offer),'rtc-acceptance','answer');
     await raw.setRemoteDescription({type:'answer',sdp:answer.sdp});
     await until(()=>channel.readyState==='open'&&!!receiver.open,'Raw sender did not connect');
     check(typeof wire!=='string'||name==='malformed JSON'||byteSize(wire)>65536,'Raw oversized fixture');
     // Overloads intentionally preserve the actual wire type.
     if(typeof wire==='string')channel.send(wire);
     else if(wire instanceof Blob)channel.send(wire);
     else channel.send(wire);
     await until(()=>closed===1,`${name}: bad frame failed to close receiver`);
     check(rejected===1&&delivered===0&&!receiver.open,`${name}: bad frame delivered or not rejected`);
     receiver.close();check(closed===1,`${name}: duplicate close`);
     report(`PASS: native raw ${name} rejected, no data delivered, error/close each once.`);
    }finally{receiver.close();channel.close();raw.close();}
   }
   // A real remote SDP advertises a smaller receive limit. Do not substitute
   // pc.sctp or access the wrapper's private channel to manufacture the result.
   {
    const raw=new RTCPeerConnection({iceServers:[]}),wrong=raw.createDataChannel('not-yifang'),receiver=new ManualRTC('rtc-acceptance',false);
    let errors=0,closed=0,opens=0;
    const channels:RTCDataChannel[]=[wrong];
    receiver.onerror=()=>errors++;receiver.onclose=()=>closed++;receiver.onopen=()=>opens++;
    try{
     await raw.setLocalDescription(await raw.createOffer());
     await until(()=>raw.iceGatheringState==='complete','Small-limit ICE gathering timeout');
     const original=raw.localDescription?.sdp||'';
     check(/^a=max-message-size:\d+\r?$/m.test(original),'Browser SDP omitted max-message-size');
     const sdp=original.replace(/^a=max-message-size:\d+\r?$/m,'a=max-message-size:32768\r');
     const offer=JSON.stringify({v:1,game:'rtc-acceptance',id:'0123456789abcdef01234567',type:'offer',sdp});
     const answer=readManualSignal(await receiver.answer(offer),'rtc-acceptance','answer');
     await raw.setRemoteDescription({type:'answer',sdp:answer.sdp});
     await until(()=>wrong.readyState==='closed','Wrong-label channel not closed');
     check(!receiver.open&&opens===0&&errors===0&&closed===0,'Wrong-label channel affected peer');
     report('PASS: wrong-label native channel rejected without opening or closing the formal peer.');
     const incompatible:RTCDataChannelInit[]=[{ordered:false},{maxRetransmits:0},{maxRetransmits:5},{maxPacketLifeTime:0},{maxPacketLifeTime:20}];
     for(const options of incompatible){
      const unreliable=raw.createDataChannel('yifang',options);channels.push(unreliable);
      await until(()=>unreliable.readyState==='closed',`Incompatible native channel accepted: ${JSON.stringify(options)}`);
      check(!receiver.open&&opens===0&&errors===0&&closed===0,'Incompatible channel affected formal peer');
      report(`PASS: incompatible native yifang ${JSON.stringify(options)} rejected before formal open.`);
     }
     const valid=raw.createDataChannel('yifang',{ordered:true});channels.push(valid);
     await until(()=>valid.readyState==='open'&&!!receiver.open,'Valid channel after wrong label failed');
     check(opens===1,'Formal channel opened more than once');
     const duplicate=raw.createDataChannel('yifang',{ordered:true});channels.push(duplicate);
     await until(()=>duplicate.readyState==='closed','Duplicate native channel not closed');
     check(receiver.open&&opens===1&&errors===0&&closed===0,'Duplicate replaced or closed accepted channel');
     let delivered=0,last:unknown;
     valid.onmessage=e=>{last=JSON.parse(e.data);delivered++;};
     const exact='棋'.repeat(10922); // 32766 payload bytes + two JSON quotes.
     check(byteSize(JSON.stringify(exact))===32768,'Small-limit fixture not exact');
     receiver.send(exact);
     await until(()=>delivered===1,'Small-limit boundary not received');
     check(last===exact,'Small-limit payload changed');
     let rejected='';try{receiver.send(exact+'a');}catch(e){rejected=e instanceof Error?e.message:String(e);}
     check(rejected==='Message limit exceeded','Negotiated 32768-byte limit not enforced');
     receiver.send('after small rejection');
     await until(()=>delivered===2,'Small-limit ordered sentinel not received');
     check(last==='after small rejection'&&receiver.open&&errors===0,'Small-limit rejection damaged channel');
     let incoming:unknown;receiver.ondata=v=>{incoming=v;};valid.send(JSON.stringify('valid survives'));
     await until(()=>incoming==='valid survives','Accepted channel no longer receives');
     report('PASS: duplicate native channel rejected; original channel works both ways; open notification remains once.');
     report('PASS: remote SDP 32768-byte limit: exact CJK frame delivered, 32769 rejected, ordered sentinel received.');
    }finally{receiver.close();for(const channel of channels)channel.close();raw.close();}
    check(closed===1&&!receiver.open,'Small-limit cleanup not idempotent');
   }
   report('COMPLETE: native same-page transport boundary acceptance. NOT LAN, tab refresh, jitter or game recovery proof.');
  }catch(e){report(`FAIL: ${e instanceof Error?e.message:String(e)}`);}finally{setBusy(false);}
 }
 return <main className="mx-auto max-w-4xl p-6"><h1 className="text-2xl">Native ManualRTC acceptance</h1><p>No server, accounts, STUN/TURN, fetch or saved games. Same browser only.</p><button className="rpg-button my-4" disabled={busy} onClick={run}>{busy?'Running native checks…':'Run native checks'}</button><pre className="whitespace-pre-wrap break-words text-sm" role="status">{lines.join('\n')}</pre></main>;
}
