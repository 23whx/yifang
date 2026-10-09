const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),resolve=Module._resolveFilename;
Module._resolveFilename=function(request,...args){return resolve.call(this,request.startsWith('@/')?path.join(root,request.slice(2)):request,...args);};
for(const ext of ['.ts','.tsx'])require.extensions[ext]=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,f);
const React=require('react'),{renderToStaticMarkup:render}=require('react-dom/server');
const Table=require('../components/cards/SichuanPractice.tsx').default;
const {newSichuanSession,applySichuanSession:apply,sichuanSessionView:view}=require('../lib/mahjong/sichuan-session.ts');
const {sichuanTeachingAction:policy}=require('../lib/mahjong/sichuan-teaching.ts');
const markup=(v,disabled=false)=>render(React.createElement(Table,{locale:'en',remote:{view:v,disabled,onAction(){throw new Error('Render must not dispatch');}}}));
const buttons=html=>[...html.replace(/<dialog[\s\S]*?<\/dialog>/g,'').matchAll(/<button\b([^>]*)>/g)].map(m=>m[1]);
let seed=71,deck=Array.from({length:108},(_,i)=>i%27);
for(let i=107;i>0;i--){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const j=seed%(i+1);[deck[i],deck[j]]=[deck[j],deck[i]];}
let s=newSichuanSession(deck),renders=0;const phases=new Set();
while(true){
  for(let id=0;id<4;id++){
    const v=view(s,id),html=markup(v),locked=markup(v,true);renders+=2;
    assert.ok(html.includes(`You are seat ${id+1}; all four players are human.`));
    assert.ok(!html.includes('One computer action'));assert.ok(!html.includes('End / restart'));
    assert.ok(buttons(locked).every(b=>b.includes('disabled=""')),'All game actions disabled while pending/closed');
    const hand=v.stage==='setup'?v.setup.hand:v.round.players[id].hand;
    assert.equal((html.match(/aria-label="Select /g)||[]).length,hand.length,'Render this recipient’s hand, not seat zero');
    phases.add(v.stage==='setup'?v.setup.phase:v.round.phase);
    if(v.stage==='play'&&v.round.phase==='result'){
      const pending=v.confirmed.flatMap((done,i)=>done?[]:[i+1]);
      assert.ok(html.includes(`Confirmed ${v.confirmed.filter(Boolean).length}/4. Waiting for seats ${pending.join(', ')}`));
      assert.ok(html.includes('Closing the dialog is not confirmation.'));
      assert.ok(html.includes('All four seats, including retired winners'));
      assert.ok(html.includes(v.confirmed[id]?'You confirmed — waiting for other seats':'I understand — confirm continuation'));
      const zh=render(React.createElement(Table,{locale:'zh',remote:{view:v,disabled:false,onAction(){throw Error('Render cannot dispatch');}}}));
      assert.ok(zh.includes(`等待座位 ${pending.join('、')} 确认（包括已胡牌者）`));
      assert.ok(zh.includes('关闭弹窗不等于确认'));
      assert.ok(zh.includes(v.confirmed[id]?'你已确认，等待其他座位':'我看懂了，确认继续'));
    }
    if(v.stage==='play'&&v.round.phase==='ended'){
      assert.ok(html.includes('This hand has ended: no more draws or discards.'));
      assert.ok(!html.includes('On your discard turn, click a tile.'));
      const zh=render(React.createElement(Table,{locale:'zh',remote:{view:v,disabled:false,onAction(){throw Error('Render cannot dispatch');}}}));
      assert.ok(zh.includes('分数变化不一定代表有人胡牌'));
    }
  }
  if(s.game?.round.phase==='ended')break;
  const id=[0,1,2,3].find(i=>policy(view(s,i))!==null);assert.notEqual(id,undefined);
  s=apply(s,id,s.revision,policy(view(s,id)));
  assert.ok(renders<6000,'Round must finish');
}
const waiting=markup(null);assert.ok(waiting.includes('Waiting for the host to deal.'));assert.equal(buttons(waiting).length,0);
const local=render(React.createElement(Table,{locale:'en'}));assert.ok(local.includes('Start with these rules'));
for(const phase of ['exchange','missing','turn','draw','claims','result','ended'])assert.ok(phases.has(phase),phase);
console.log(`PASS: ${renders} four-seat server renders across ${[...phases].join(', ')}; recipient hand, input freeze, no remote bots/restart, waiting state and local start. Not browser/WebRTC proof.`);
