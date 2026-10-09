// Exhaust physically possible two-Chow/two-Pung structures (including honors).
// Independently derive the only association candidates possible with 2+2 sets.
// This tests group-family coexistence, not a complete hand or 81-fan scoring.
const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
const js=require.extensions['.js'];require.extensions['.js']=(module,file)=>file.replaceAll('\\','/').includes('/mahjong/vendor/')?module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file):js(module,file);
const {selectMcrAssociatedStructureFans}=require('../lib/mahjong/vendor/analysis/associated-fan-research.js');
const suits=['m','p','s'],honors=['E','S','W','N','C','F','P'];
const chows=suits.flatMap((suit,s)=>Array.from({length:7},(_,start)=>({suit:s,start:start+1,tiles:[start,start+1,start+2].map(rank=>s*9+rank),meld:{kind:'sequence',tiles:[start+1,start+2,start+3].map(rank=>`${rank}${suit}`)}})));
const pungs=Array.from({length:34},(_,tile)=>({tile,suit:tile<27?Math.floor(tile/9):null,rank:tile<27?tile%9+1:null,meld:{kind:'triplet',tile:tile<27?`${tile%9+1}${suits[Math.floor(tile/9)]}`:honors[tile-27]}}));
function chowFan(a,b){
 if(a.suit!==b.suit)return a.start===b.start?'mcr-70':null;
 if(a.start===b.start)return 'mcr-69';
 if(Math.abs(a.start-b.start)===3)return 'mcr-71';
 if(Math.min(a.start,b.start)===1&&Math.max(a.start,b.start)===7)return 'mcr-72';
 return null;
}
const observed=new Map(),counts=new Array(34).fill(0);let structures=0,withBoth=0,skipped=0;
for(let a=0;a<chows.length;a++)for(let b=a;b<chows.length;b++)for(let c=0;c<pungs.length;c++)for(let d=c+1;d<pungs.length;d++){
 counts.fill(0);for(const tile of [...chows[a].tiles,...chows[b].tiles])counts[tile]++;
 counts[c]+=3;counts[d]+=3;if(counts.some(n=>n>4)){skipped++;continue;}
 const chow=chowFan(chows[a],chows[b]);
 const pung=c<27&&d<27&&pungs[c].rank===pungs[d].rank&&pungs[c].suit!==pungs[d].suit?'mcr-65':null;
 const expected=[chow,pung].filter(Boolean),decomposition={concealedMelds:[chows[a].meld,chows[b].meld,pungs[c].meld,pungs[d].meld],declaredMelds:[]};
 const actual=selectMcrAssociatedStructureFans(decomposition),label=`chow ${a},${b}; pung ${c},${d}`;
 assert.deepEqual([...actual.fanCodes].sort(),[...expected].sort(),label);
 assert.equal(actual.points,(chow?1:0)+(pung?2:0),label);
 assert.ok(actual.candidates.every(item=>item.matchedGroups.every(index=>index<2)===(item.fanCode!=='mcr-65')),label);
 for(const code of expected)observed.set(code,(observed.get(code)??0)+1);
 if(chow&&pung)withBoth++;structures++;
}
assert.ok(structures>120000&&withBoth>0&&skipped>0);
assert.deepEqual([...observed.keys()].sort(),['mcr-65','mcr-69','mcr-70','mcr-71','mcr-72'].sort());
console.log(`PASS: ${structures} physical 2-Chow/2-Pung structures (${skipped} impossible excluded), ${withBoth} score both sequence and set associations; honor Pungs included, five fan codes independently checked.`);
