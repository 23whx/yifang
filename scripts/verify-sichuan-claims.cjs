const fs=require('node:fs'),ts=require('typescript'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const {newSichuanClaims,answerSichuanClaim,resolveSichuanClaims,sichuanClaimView}=require('../lib/mahjong/sichuan-claims.ts');
// Arbitration fixture: options already derived by host. No deck-validity claim.
const base={from:0,tile:8,robbing:false,options:[{win:false,pung:false,kong:false},{win:true,pung:false,kong:false},{win:false,pung:true,kong:true},{win:true,pung:false,kong:false}],replies:['pass',null,null,null]};
for(const order of [[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]){
 let w=structuredClone(base);
 for(let i=0;i<3;i++){
  const id=order[i];w=answerSichuanClaim(w,id,id===2?'kong':'win');
  if(i<2)assert.deepEqual(resolveSichuanClaims(w),{kind:'waiting'});
 }
 assert.deepEqual(resolveSichuanClaims(w),{kind:'wins',seats:[1,3],passed:[]});
 assert.throws(()=>answerSichuanClaim(w,1,'win'));
}
let w=answerSichuanClaim(base,2,'pung');w=answerSichuanClaim(w,1,'pass');w=answerSichuanClaim(w,3,'pass');
assert.deepEqual(resolveSichuanClaims(w),{kind:'meld',seat:2,action:'pung',passed:[1,3]});
assert.deepEqual(base.replies,['pass',null,null,null]);
const v=sichuanClaimView(w,1);assert.equal('replies' in v,false);v.options.win=false;assert.equal(w.options[1].win,true);
assert.throws(()=>answerSichuanClaim(base,1,'kong'));assert.throws(()=>answerSichuanClaim(base,0,'pass'));
const waiting={hand:[0,1,2,3,4,5,9,10,11,12,13,14,8],melds:[],missing:2,retired:false};
const retired={...waiting,retired:true};
const actual=newSichuanClaims([waiting,waiting,retired,retired],0,8,20,[false,false,false,false],true);
assert.deepEqual(actual.options[1],{win:true,pung:false,kong:false});
assert.deepEqual(actual.replies,['pass',null,'pass','pass']);
assert.deepEqual(resolveSichuanClaims(answerSichuanClaim(actual,1,'pass')),{kind:'unclaimed',passed:[1]});
const blocked=newSichuanClaims([waiting,waiting,retired,retired],0,8,20,[false,true,false,false],true);
assert.deepEqual(resolveSichuanClaims(blocked),{kind:'unclaimed',passed:[]});
console.log('PASS: all six response orders preserve double wins over kong; pass tracking, immutable/private responses, duplicate rejection and rob-kong eligibility. Arbitration only.');
