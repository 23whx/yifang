const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const M=require('@kobalab/majiang-core');
const {RiichiPlayer,riichiRules}=require('../lib/mahjong/riichi-player.ts');
const {validRiichiPayload}=require('../lib/mahjong/riichi-wire.ts');
// Human-delayed response: options must be captured BEFORE the library marks a
// missed winning discard as furiten, not recomputed at submit time.
{
  const prompts=[];
  const seat=new RiichiPlayer(p=>prompts.push(p));
  seat.action({kaiju:{id:1,rule:riichiRules(),title:'fixture',player:['A','B','C','D'],qijia:0}},()=>{});
  seat.action({qipai:{zhuangfeng:0,jushu:0,changbang:0,lizhibang:0,defen:[25000,25000,25000,25000],baopai:'z1',shoupai:['','m123456p23455s67','','']}},()=>{});
  seat.action({dapai:{l:2,p:'s8'}},()=>{});
  assert.ok(prompts.at(-1).choices.some(c=>c.kind==='ron'));
  assert.ok(seat.submit(prompts.at(-1).revision,'pass'));
  const before=prompts.length;
  seat.action({dapai:{l:3,p:'s5'}},()=>{});
  assert.ok(prompts.length===before||!prompts.at(-1).choices.some(c=>c.kind==='ron'),'missed ron prohibits subsequent ron before own draw/discard');
  if(prompts.length>before)seat.submit(prompts.at(-1).revision,'pass');
  seat.action({zimo:{l:1,p:'s8'}},()=>{});
  assert.ok(prompts.at(-1).choices.some(c=>c.kind==='tsumo'),'furiten player may self draw');
  seat.close();
  assert.equal(seat.submit(prompts.at(-1).revision,'tsumo'),false,'close cancels pending input');
}
let decisions=0,rounds=0,wins=0,draws=0,calls=0,finished=0;
let seed=82171;
const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};
// Seed only this isolated test process, never the application RNG.
const originalRandom=Math.random;Math.random=random;
try{
  for(let match=0;match<8;match++){
    const players=[];
    for(let id=0;id<4;id++){
      const player=new RiichiPlayer(({revision,choices})=>{
        assert.ok(++decisions<40000,'game must make bounded progress');
        assert.ok(choices.length);
        assert.equal(player.submit(revision-1,choices[0].id),false);
        assert.equal(player.submit(revision,'forged'),false);
        // Caller mutation cannot add a legal action to the private allowlist.
        choices.push({id:'forged',kind:'tsumo'});
        assert.equal(player.submit(revision,'forged'),false);choices.pop();
        let selected=choices.find(c=>c.kind==='tsumo'||c.kind==='ron')
          ||choices.find(c=>c.kind==='riichi')
          ||choices.find(c=>c.kind==='kan');
        if(!selected&&random()<0.4)selected=choices.find(c=>c.kind==='pon'||c.kind==='chi');
        if(!selected){
          const discards=choices.filter(c=>c.kind==='discard');
          // This fixture policy sees only its own Player hand, never Game.model.
          const scored=discards.map(c=>({c,n:M.Util.xiangting(player.shoupai.clone().dapai(c.value))}));
          const best=Math.min(...scored.map(x=>x.n));
          const options=scored.filter(x=>x.n===best);
          selected=options.length?options[Math.floor(random()*options.length)].c:choices[0];
        }
        if(['chi','pon','kan'].includes(selected.kind))calls++;
        assert.equal(player.submit(revision,selected.id),true);
        assert.equal(player.submit(revision,selected.id),false,'duplicate reply must not advance twice');
      },event=>{
        assert.ok(validRiichiPayload({kind:'event',event},id),'real engine event must pass wire validation: '+JSON.stringify(event));
        if(event.qipai){rounds++;assert.equal(event.qipai.shoupai.filter(Boolean).length,1,'seat receives only its own starting hand');}
        if(event.hule)wins++;
        if(event.pingju)draws++;
        if(event.jieju){assert.deepEqual(Object.keys(event.jieju).sort(),['defen','point','rank']);assert.equal(event.jieju.log,undefined);}
      });
      players.push(player);
    }
    const game=new M.Game(players,record=>{
      finished++;
      assert.equal(record.defen.reduce((a,b)=>a+b,0),100000,'final points conserve all deposits');
      assert.deepEqual([...record.rank].sort(),[1,2,3,4]);
      assert.ok(record.log.length);
    },{...riichiRules(),'場数':1,'延長戦方式':0},'test');
    game.do_sync();
    for(const player of players){player.close();assert.equal(player.submit(1,'continue'),false);}
  }
}finally{Math.random=originalRandom;}
assert.equal(finished,8);assert.ok(wins>0);assert.ok(draws>0);assert.ok(calls>0);
console.log(`Riichi player PASS: ${finished} full seeded matches, ${rounds/4} rounds, ${wins/4} wins, ${draws/4} draws, ${calls} call choices, ${decisions} guarded decisions. Headless integration only, not UI/network acceptance.`);
