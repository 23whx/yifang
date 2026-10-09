const fs=require('node:fs'),ts=require('typescript'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const {GoRecoverySession:S}=require('../lib/go/recovery-session.ts');
const {newGo,playGo,chooseGoMove}=require('../lib/go/rules.ts');
let checks=0;
const make=()=>new S('go-recovery-test-identity');
function event(s,seat,action){const v=s.view();return {seat,round:v.match.round,revision:v.revision,action};}
function apply(s,seat,action){const e=event(s,seat,action),r=S.restore(s.checkpoint());s.apply(e);r.apply(e);assert.deepEqual(r.view(),s.view());assert.equal(r.checkpoint(),s.checkpoint());checks++;}
function bad(s,e){const before=s.checkpoint(),view=s.view();assert.throws(()=>s.apply(e));assert.equal(s.checkpoint(),before);assert.deepEqual(s.view(),view);checks++;}
function move(s,p){apply(s,s.view().board.turn-1,{kind:'move',point:p});}
function review(s,seat,action){apply(s,seat,{kind:'review',proposal:s.view().review.revision,action});}
const capture=make();move(capture,1);move(capture,0);move(capture,9);
assert.equal(capture.view().board.board[0],0);assert.deepEqual(capture.view().board.captures,[1,0]);
bad(capture,event(capture,1,{kind:'move',point:0})); // suicide remains illegal after replay
move(capture,null);move(capture,null);
review(capture,0,{kind:'toggle',point:1});assert.deepEqual(capture.view().review.dead,[1]);
review(capture,0,{kind:'confirm'});assert.deepEqual(S.restore(capture.checkpoint()).view().review.approved,[true,false]);
bad(capture,event(capture,1,{kind:'review',proposal:0,action:{kind:'confirm'}}));
review(capture,1,{kind:'toggle',point:9});assert.deepEqual(capture.view().review.approved,[false,false]);
review(capture,1,{kind:'resume'});assert.equal(capture.view().board.passes,0);assert.deepEqual(capture.view().review.dead,[]);
move(capture,80);move(capture,null);move(capture,null);assert.equal(capture.view().review.revision,0);
review(capture,0,{kind:'confirm'});review(capture,1,{kind:'confirm'});assert.equal(capture.view().ended,true);
bad(capture,event(capture,capture.view().board.turn-1,{kind:'move',point:40}));
bad(capture,event(capture,0,{kind:'review',proposal:capture.view().review.revision,action:{kind:'resume'}}));
apply(capture,1,{kind:'rematch'});assert.deepEqual(S.restore(capture.checkpoint()).view().match.rematch,[false,true]);
bad(capture,event(capture,1,{kind:'rematch'}));apply(capture,0,{kind:'rematch'});
assert.equal(capture.view().match.round,2);assert.deepEqual(capture.view().board,newGo());
apply(capture,1,{kind:'resign'});assert.equal(capture.view().result,'1-0');
const ko=make();for(const p of [31,32,39,42,49,50,80,40,41])move(ko,p);
assert.equal(ko.view().board.board[40],0);assert.equal(ko.view().board.captures[0],1);
bad(ko,event(ko,1,{kind:'move',point:40}));
const empty=make();move(empty,null);move(empty,null);review(empty,0,{kind:'confirm'});review(empty,1,{kind:'confirm'});
assert.deepEqual(empty.view().score,{black:0,white:7.5});assert.equal(empty.view().result,'0-1');
// Compare each restored position with independently driven existing rules.
const long=make();let board=newGo();for(let i=0;i<120&&board.passes<2;i++){
 const p=chooseGoMove(board);board=playGo(board,p).state;move(long,p);assert.deepEqual(S.restore(long.checkpoint()).view().board,board);
}
const fresh=make();for(const e of [event(fresh,1,{kind:'move',point:0}),{...event(fresh,0,{kind:'move',point:0}),round:2},{...event(fresh,0,{kind:'move',point:0}),revision:1},event(fresh,0,{kind:'move',point:81}),event(fresh,0,{kind:'move',point:0.5}),event(fresh,0,{kind:'review',proposal:0,action:{kind:'confirm'}}),event(fresh,0,{kind:'rematch'}),{...event(fresh,0,{kind:'resign'}),score:99}])bad(fresh,e);
const raw=JSON.parse(capture.checkpoint());for(const value of [{...raw,game:'chess'},{...raw,version:2},{...raw,board:[]},{...raw,identity:'bad'},{...raw,events:[...raw.events,{seat:0,round:1,revision:0,action:{kind:'resign'}}]}])assert.throws(()=>S.restore(JSON.stringify(value)));
assert.throws(()=>S.restore('x'.repeat(1500001)));assert.throws(()=>S.restore('{'));
const exposed=ko.view();exposed.board.history.length=0;exposed.board.board.fill(0);assert.notDeepEqual(ko.view().board,exposed.board);
const reordered=JSON.parse(ko.checkpoint());reordered.events=reordered.events.map(e=>({action:{point:e.action.point,kind:e.action.kind},revision:e.revision,round:e.round,seat:e.seat}));assert.equal(S.restore(JSON.stringify(reordered)).checkpoint(),ko.checkpoint());
console.log(`PASS Go recovery: ${checks} replay/continuation or atomic rejection checks; capture, suicide, ko, scoring proposal/approval/resume, terminal result, bilateral rematch, standard-board replay and bounded strict archives. No transport/storage/UI recovery claim.`);
