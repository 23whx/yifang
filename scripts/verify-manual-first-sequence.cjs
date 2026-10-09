const fs=require('node:fs'),ts=require('typescript'),Module=require('node:module'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
(async()=>{
 const core=await import('miaoda-game-mcr-mahjong-rules'),analysis=await import('miaoda-game-mcr-mahjong-analysis-core'),load=Module._load;
 Module._load=function(request,...args){return request==='miaoda-game-mcr-mahjong-rules'?core:request==='miaoda-game-mcr-mahjong-analysis-core'?analysis:load.call(this,request,...args);};
 const js=require.extensions['.js'];require.extensions['.js']=(m,f)=>f.replaceAll('\\','/').includes('/mahjong/vendor/')?require.extensions['.ts'](m,f):js(m,f);
 const cases=[
  [require('../lib/mahjong/mcr-manual.ts').ManualMcrGuest,'mcr-four','mcr-four-welcome'],
  [require('../lib/mahjong/riichi-manual.ts').ManualRiichiGuest,'riichi','riichi-welcome'],
  [require('../lib/mahjong/sichuan-manual.ts').ManualSichuanGuest,'sichuan-four','sichuan-four-welcome'],
  [require('../lib/holdem-multi-manual.ts').ManualPokerGuest,'holdem-four','holdem-four-welcome'],
  [require('../lib/holdem-headsup-manual.ts').ManualHeadsUpPokerGuest,'holdem-two','holdem-two-welcome'],
 ];
 for(const [Guest,game,kind] of cases){
  let channel,closed=0,delivered=0;
  const guest=new Guest(()=>delivered++,()=>closed++,()=>channel={open:true,close(){this.open=false;},answer:async()=>'',send(){}});
  const match=`sequence-${game}-123`;
  channel.ondata({kind,v:1,match,seat:1,recoveryKey:'a'.repeat(64),recoveryMatch:match});
  assert.deepEqual(guest.identity,{match,seat:1},`${game}: valid welcome`);
  channel.ondata({v:1,game,match,recipient:1,sequence:2,payload:{kind:'lobby',connected:[true,true,false,false]}});
  assert.equal(closed,1,`${game}: first frame cannot skip sequence 1`);
  assert.equal(delivered,0,`${game}: skipped frame never reaches UI`);
  assert.equal(channel.open,false,`${game}: channel is closed`);
 }
 console.log(`PASS ${cases.length} manual game protocols reject a skipped first room frame before any UI delivery.`);
})().catch(e=>{console.error(e);process.exitCode=1;});
