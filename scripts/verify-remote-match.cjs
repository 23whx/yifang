const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,f);
const {newMatch,changeMatch,validMatch,roomCode}=require('../lib/board/remote-match.ts');
let m=newMatch();
assert.deepEqual(changeMatch(m,0,'rematch',false),m,'no mid-game restart');
m=changeMatch(m,1,'resign',false);assert.equal(m.resigned,1);
assert.equal(changeMatch(m,0,'resign',true).resigned,1,'first serialized resignation wins');
m=changeMatch(m,0,'rematch',true);assert.equal(m.round,1);assert.deepEqual(m.rematch,[true,false]);
m=changeMatch(m,0,'rematch',true);assert.equal(m.round,1,'duplicate approval cannot restart');
m=changeMatch(m,1,'rematch',true);assert.deepEqual(m,newMatch(2));
assert.equal(changeMatch(m,1,'rematch',false).round,2,'stale request cannot restart live round');
for(const invalid of [null,{}, {round:1,resigned:2,rematch:[false,false]}, {round:1,resigned:null,rematch:[1,false]}, {round:Infinity,resigned:null,rematch:[false,false]}]) assert.equal(validMatch(invalid),false);
assert.equal(validMatch(newMatch()),true);
for(const game of ['chess','xiangqi','shogi','go']) {
 const code=`yf-${game}-012345abcdef`;
 assert.equal(roomCode(code,game),code);
 assert.equal(roomCode(`https://example.com/zh/${game}/remote?room=${code}`,game),code);
 assert.equal(roomCode(code+'extra',game),'');
 assert.equal(roomCode('javascript:alert(1)',game),'');
}
assert.equal(roomCode('yf-go-012345abcdef','chess'),'');
console.log('PASS: bilateral rematch consent, host-serialized resignation, round reset, invalid state rejection and four-game invitation parsing.');
