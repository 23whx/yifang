const fs=require('node:fs'),ts=require('typescript'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const {validMultiPayload}=require('../lib/holdem-multi-wire.ts');
const {newMultiSession,multiView,applyMultiRequest}=require('../lib/holdem-multi-session.ts');
let s=newMultiSession();let frames=0;
for(let hand=0;hand<5;hand++) {
  while(true) {
    for(let seat=0;seat<4;seat++){assert.equal(validMultiPayload({kind:'view',view:multiView(s,seat)},seat),true);frames++;}
    if(s.table.over)break;
    const seat=s.table.actor,a=multiView(s,seat).legal;
    s=applyMultiRequest(s,seat,{hand:s.hand,revision:s.revision,action:a.canCheck?{kind:'check'}:{kind:'call'}});
  }
  const funded=s.table.stacks.flatMap((n,i)=>n>0?[i]:[]);if(funded.length<2)break;
  for(const seat of funded)s=applyMultiRequest(s,seat,{hand:s.hand,revision:s.revision,action:{kind:'next'}});
}
const initial=newMultiSession(),base=multiView(initial,initial.table.actor);
for(const mutate of [
  v=>v.stacks[0]=-1,v=>v.cards[0]=[99,98],v=>v.cards[1]=[1,2],v=>v.seat=99,
  v=>v.community=[1,1,2],v=>v.deck=[0,1],v=>v.legal.call=NaN,v=>v.legal.canCheck=true,
  v=>v.stacks.push(200),v=>v.pots=[{}],v=>v.actions=[{kind:'unknown'}],v=>v.folded[0]='false',
  v=>v.over=true,v=>v.showdown=true,v=>v.awards[0]=500,
]){const v=structuredClone(base);mutate(v);assert.equal(validMultiPayload({kind:'view',view:v},base.seat),false);}
for(const value of [null,[],{}, {kind:'lobby',connected:[true]}, {kind:'ack',request:0,accepted:true},{kind:'closed',player:4}])assert.equal(validMultiPayload(value,0),false);
console.log(`PASS: ${frames} real four-seat views accepted; malformed cards, shapes, amounts, legality, privacy extras and result consistency rejected.`);
