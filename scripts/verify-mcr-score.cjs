const fs=require('node:fs'),ts=require('typescript'),Module=require('node:module'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
(async()=>{
 const core=await import('miaoda-game-mcr-mahjong-analysis-core'),load=Module._load;
 const js=require.extensions['.js'];require.extensions['.js']=(m,f)=>f.replaceAll('\\','/').includes('/mahjong/vendor/')?require.extensions['.ts'](m,f):js(m,f);
 Module._load=function(request,...args){return request==='miaoda-game-mcr-mahjong-analysis-core'?core:load.call(this,request,...args);};
 const {scoreMcrHand:score,mcrTileFace:face}=require('../lib/mahjong/mcr-score.ts');
 assert.deepEqual([0,8,9,17,18,26,27,28,29,30,31,32,33].map(face),['1m','9m','1p','9p','1s','9s','E','S','W','N','C','F','P']);
 const input={concealedBeforeWin:[0,8,9,17,18,26,27,28,29,30,31,32,33],melds:[],winningTile:0,winner:0,from:1,roundWind:0,seatWind:1,source:'discard',flowers:[],lastWallEvent:false,lastCopy:false};
 // Independent rule fixtures: WMO Competition Rules, Appendix 1, fans 1/2/9/10.
 // https://www.mahjong-ca.org/wp-content/uploads/2019/07/Mahjong_Rule_2013.pdf
 // These are actual complete hands, not calls to the scorer's exclusion helper.
 // Change the honor used as the pair, both winds, and each pung into a kong.
 const pung=t=>({kind:'pung',tiles:[t,t,t],open:true});
 const chow=t=>({kind:'chow',tiles:[t,t+1,t+2],open:true});
 const winds=[27,28,29,30],dragons=[31,32,33];
 const families=[
  {name:'big four winds',pair:13,melds:winds.map(pung),required:['mcr-01'],excluded:['mcr-09','mcr-38','mcr-49','mcr-60','mcr-61','mcr-73']},
  {name:'big three dragons',pair:13,melds:[...dragons.map(pung),chow(1)],required:['mcr-02'],excluded:['mcr-10','mcr-54','mcr-59']},
  ...winds.map(pair=>({name:`little four winds pair ${pair}`,pair,melds:[...winds.filter(t=>t!==pair).map(pung),chow(10)],required:['mcr-09'],excluded:['mcr-01','mcr-38','mcr-73']})),
  ...dragons.map(pair=>({name:`little three dragons pair ${pair}`,pair,melds:[...dragons.filter(t=>t!==pair).map(pung),chow(1),chow(10)],required:['mcr-10'],excluded:['mcr-02','mcr-54','mcr-59']})),
 ];
 let honorFixtures=0;
 for(const f of families)for(let roundWind=0;roundWind<4;roundWind++)for(let seatWind=0;seatWind<4;seatWind++){
  for(const kongAt of [-1,...f.melds.flatMap((m,i)=>m.kind==='pung'?[i]:[])]){
   const melds=f.melds.map((m,i)=>i===kongAt?{kind:'kong',tiles:[...m.tiles,m.tiles[0]],open:true}:m);
   const hand={...input,concealedBeforeWin:[f.pair],winningTile:f.pair,melds,roundWind,seatWind,source:'wall',from:0};
   const frozen=JSON.stringify(hand),r=score(hand),label=JSON.stringify({name:f.name,roundWind,seatWind,kongAt});
   assert.ok(r.ok,label);
   for(const code of f.required)assert.ok(r.analysis.fanCodes.includes(code),`${label}: missing ${code}`);
   for(const code of f.excluded)assert.ok(!r.analysis.fanCodes.includes(code),`${label}: duplicate ${code}`);
   if(f.required.includes('mcr-09')){
    assert.equal(r.analysis.fanCodes.includes('mcr-60'),27+roundWind!==f.pair,`${label}: prevailing wind needs a pung, not the pair`);
    assert.equal(r.analysis.fanCodes.includes('mcr-61'),27+seatWind!==f.pair,`${label}: seat wind needs a pung, not the pair`);
   }
   // Four exposed groups, self-drawn pair: single wait + self draw; one
   // melded kong adds one. One suit + honors adds half flush (6), whereas
   // our two-suit dragon fixtures add one voided suit (1). The little-three
   // fixture's 234m + 234p additionally supplies mixed double chow (1).
   const base=f.required.includes('mcr-01')?96:f.required.includes('mcr-02')?91:
    f.required.includes('mcr-09')?72+2*Number(27+roundWind!==f.pair)+2*Number(27+seatWind!==f.pair):68;
   const total=base+Number(kongAt!==-1);
   assert.equal(r.analysis.nonFlowerTotal,total,`${label}: independent full score`);
   assert.deepEqual(r.settlement.delta,[3*(total+8),-(total+8),-(total+8),-(total+8)],`${label}: independent self-draw payment`);
   assert.equal(JSON.stringify(hand),frozen,'Scoring must not change caller tiles');
   assert.equal(r.settlement.delta.reduce((a,b)=>a+b,0),0,label);
   honorFixtures++;
  }
 }
 console.log(`PASS: ${honorFixtures} independent wind/dragon family hands, all seat/round winds, pung/kong substitutions and lower-fan exclusions.`);
 // EMA MCR Green Book, fan 3: only 2/3/4/6/8 bamboo and Green Dragon;
 // Green Dragon is allowed, not required. Do not import the detector's set.
 // https://mahjong-europe.org/portal/images/docs/mcr_EN.pdf
 const green=[19,20,21,23,25,32];
 let greenPositive=0,greenNegative=0;
 for(let a=0;a<3;a++)for(let b=a+1;b<4;b++)for(let c=b+1;c<5;c++)for(let d=c+1;d<6;d++) {
   const groups=[green[a],green[b],green[c],green[d]];
   for(const pair of green.filter(t=>!groups.includes(t)))for(const kongAt of [-1,0,1,2,3]) {
     const melds=groups.map((t,i)=>i===kongAt?{kind:'kong',tiles:[t,t,t,t],open:true}:pung(t));
     const r=score({...input,concealedBeforeWin:[pair],winningTile:pair,melds,source:'wall',from:0});
     assert.ok(r.ok);assert.ok(r.analysis.fanCodes.includes('mcr-03'),`All Green ${groups}/${pair}/${kongAt}`);
     assert.equal(r.analysis.occurrences.filter(o=>o.fanCode==='mcr-03').reduce((n,o)=>n+o.points,0),88,'All Green contributes exactly 88');
     greenPositive++;
   }
   for(let pair=0;pair<34;pair++)if(!green.includes(pair)) {
     const r=score({...input,concealedBeforeWin:[pair],winningTile:pair,melds:groups.map(pung),source:'wall',from:0});
     assert.ok(r.ok,'negative All Green fixture remains a valid qualifying hand');
     assert.ok(!r.analysis.fanCodes.includes('mcr-03'),`non-green pair ${pair} must disqualify All Green`);
     greenNegative++;
   }
 }
 // A sequence is allowed: 234 bamboo twice, 666 and 888, Green Dragon pair.
 const greenChows={...input,concealedBeforeWin:[32],winningTile:32,melds:[chow(19),chow(19),pung(23),pung(25)],source:'wall',from:0};
 assert.ok(score(greenChows).analysis.fanCodes.includes('mcr-03'));
 const {mcrFanHelp}=require('../content/mcr-fan-help.ts');
 const {tileNames:helpTileNames}=require('../lib/mahjong/shape.ts');
 const illustratedGreen=mcrFanHelp['mcr-03'].tiles.map(t=>helpTileNames.indexOf(t));
 assert.equal(illustratedGreen.length,14);
 const illustratedScore=score({...input,concealedBeforeWin:illustratedGreen.slice(0,-1),winningTile:illustratedGreen.at(-1)});
 assert.ok(illustratedScore.ok);assert.ok(illustratedScore.analysis.fanCodes.includes('mcr-03'),'actual tutorial picture must qualify');
 const illustratedCounter=illustratedGreen.map(t=>t===32?33:t);
 const counterScore=score({...input,concealedBeforeWin:illustratedCounter.slice(0,-1),winningTile:illustratedCounter.at(-1)});
 assert.ok(counterScore.ok);assert.ok(!counterScore.analysis.fanCodes.includes('mcr-03'),'actual textual White-pair counterexample must remain a win but lose All Green');
 for(const badChow of [18,20,21,22,23,24]) {
   const r=score({...greenChows,melds:[chow(badChow),chow(19),pung(23),pung(25)]});
   assert.ok(r.ok);assert.ok(!r.analysis.fanCodes.includes('mcr-03'),'a non-green bamboo in a sequence disqualifies All Green');greenNegative++;
 }
 console.log(`PASS: ${greenPositive+1} full-hand All Green positives, ${greenNegative} qualifying non-green negatives, no-dragon and chow/kong coverage. Not all fan-combination exclusions.`);
 for(const f of families.filter(f=>f.required.includes('mcr-09')||f.required.includes('mcr-10'))){
  // Replace the defining honor pair while keeping a physically valid hand.
  // A third wind pung is still big-three-winds; two dragon pungs still score
  // two-dragon-pungs. Neither may inherit the little-four/three award.
  const wind=f.required.includes('mcr-09'),pair=wind?13:27;
  const r=score({...input,concealedBeforeWin:[pair],winningTile:pair,melds:f.melds,source:'wall',from:0});
  assert.ok(r.ok,f.name);
  assert.ok(!r.analysis.fanCodes.includes(f.required[0]),`${f.name}: wrong pair must remove high fan`);
  assert.ok(r.analysis.fanCodes.includes(wind?'mcr-38':'mcr-54'),`${f.name}: retain the lower valid family`);
 }
 const {mcrSpecialExercises}=require('../content/mcr-special-exercises.ts');
 const {tileNames}=require('../lib/mahjong/shape.ts');
 for(const [i,e] of mcrSpecialExercises.entries()){
  const result=score({...input,concealedBeforeWin:e.hand.map(t=>tileNames.indexOf(t)),winningTile:tileNames.indexOf(e.after.at(-1))});
  assert.ok(result.ok,'Special tutorial completion must actually qualify');
  assert.ok(result.analysis.fanCodes.includes(i===0?'mcr-19':'mcr-07'));
  const wrong=score({...input,concealedBeforeWin:e.hand.map(t=>tileNames.indexOf(t)),winningTile:i===0?28:0});
  assert.equal(wrong.ok,false,'Wrong offered tile cannot complete the example');
 }
 // Three open dot-suit sequences supply a Pure Straight. The remaining four
 // concealed tiles independently isolate the wait, with no eight-point ambiguity.
 const waitMelds=[[9,10,11],[12,13,14],[15,16,17]].map(tiles=>({kind:'chow',tiles,open:true}));
 const waitCodes=['mcr-77','mcr-78','mcr-79'];
 for(const [held,winning,expected] of [
  [[0,1,27,27],2,'mcr-77'],
  [[1,3,27,27],2,'mcr-78'],
  [[0,1,2,28],28,'mcr-79'],
  [[1,2,27,27],0,null],
  [[1,2,27,27],3,null],
  [[0,1,2,3],0,null],
  [[0,1,2,3],3,null],
 ]){
  const scored=score({...input,concealedBeforeWin:held,winningTile:winning,melds:waitMelds});
  assert.ok(scored.ok,JSON.stringify({held,winning}));
  assert.deepEqual(scored.analysis.fanCodes.filter(c=>waitCodes.includes(c)),expected?[expected]:[],JSON.stringify({held,winning}));
 }
 console.log('PASS: full-hand edge/closed/single waits and both completions of two-sided/multiple-pair waits; no local-shape-only wait points.');
 const before=JSON.stringify(input),ron=score(input);assert.ok(ron.ok);assert.equal(ron.analysis.nonFlowerTotal,88);assert.deepEqual(ron.settlement.delta,[112,-96,-8,-8]);assert.equal(JSON.stringify(input),before);
 const windHand={...input,concealedBeforeWin:[32],winningTile:32,from:0,source:'flower-replacement',roundWind:2,seatWind:0,flowers:[35],melds:[14,23,27,29].map(t=>({kind:'pung',tiles:[t,t,t],open:true}))};
 const windScore=score(windHand);assert.ok(windScore.ok);assert.equal(windScore.analysis.nonFlowerTotal,15);assert.equal(windScore.analysis.total,16);assert.deepEqual(windScore.settlement.delta,[72,-24,-24,-24]);assert.ok(!windScore.analysis.fanCodes.includes('mcr-73'));
 assert.ok(windScore.analysis.exclusions.some(e=>e.fanCode==='mcr-73'));
 const borderline={...input,concealedBeforeWin:[0,1,2,13],winningTile:13,melds:[{kind:'chow',tiles:[3,4,5],open:true},{kind:'pung',tiles:[27,27,27],open:true},{kind:'pung',tiles:[31,31,31],open:true}]};
 const under=score(borderline);assert.equal(under.ok,false,'Seven real points cannot win using a duplicate wind point');assert.equal(under.reason,'below-minimum');
 // FFMJ MCR guide: flowers are added only AFTER eight non-flower points.
 // Actual hand: dragon2 + round-wind2 + short-straight1 + voided-suit1
 // + single-wait1 = 7 on discard; self draw adds the eighth point.
 // Exhaust every legal subset of eight distinct flowers and every payer seat.
 // This exercises full scoring -> exclusions -> eligibility -> settlement,
 // rather than supplying a fabricated total directly to the settlement helper.
 let thresholdCases=0;
 for(let mask=0;mask<256;mask++){
  const flowers=Array.from({length:8},(_,i)=>34+i).filter((_,i)=>mask&(1<<i));
  for(let winner=0;winner<4;winner++){
   for(let from=0;from<4;from++)if(from!==winner){
    const rejected=score({...borderline,winner,from,flowers});
    assert.equal(rejected.ok,false,`7 non-flower points plus ${flowers.length} flowers must not permit ron`);
    assert.equal(rejected.reason,'below-minimum');thresholdCases++;
   }
   for(const source of ['wall',...(flowers.length?['flower-replacement']:[])]){
    const accepted=score({...borderline,winner,from:winner,source,flowers});
    assert.ok(accepted.ok,`self draw supplies the eighth non-flower point: ${mask}/${winner}/${source}`);
    assert.equal(accepted.analysis.nonFlowerTotal,8);
    assert.equal(accepted.analysis.total,8+flowers.length);
    assert.ok(accepted.analysis.fanCodes.includes('mcr-80'));
    assert.ok(!accepted.analysis.fanCodes.includes('mcr-46'),'flower replacement is not a kong bonus');
    const perPayer=16+flowers.length;
    assert.deepEqual(accepted.settlement.delta,[0,1,2,3].map(i=>i===winner?3*perPayer:-perPayer));
    assert.equal(accepted.settlement.flowerPoints,flowers.length);
    thresholdCases++;
   }
  }
 }
 console.log(`PASS: ${thresholdCases} actual-hand seven/eight-point threshold and flower/payment cases, all 256 flower subsets and all payer seats.`);
 const originalBorder=core.analyzeMcrHand({concealedTilesBeforeWin:['1m','2m','3m','5p'],winningTile:'5p',declaredMelds:[{kind:'sequence',tiles:['4m','5m','6m']},{kind:'triplet',tile:'E'},{kind:'triplet',tile:'C'}],roundWind:'E',seatWind:'S',event:{source:'discard',flowerCount:0}});
 assert.ok(originalBorder.ok);assert.equal(originalBorder.analysis.nonFlowerTotal,8,'Pinned upstream reproduces the false eligibility');
 const {createMcrResearchFanOccurrence:occ,resolveMcrFanOccurrenceExclusions:resolve}=require('../lib/mahjong/vendor/analysis/fan-occurrence-research.js');
 const scoped=resolve([occ('mcr-60','context',{matchedGroups:[0],matchedTiles:['E']}),occ('mcr-61','context',{matchedGroups:[0],matchedTiles:['E']}),occ('mcr-73','simple',{key:'east',matchedGroups:[0],matchedTiles:['E']}),occ('mcr-73','simple',{key:'north',matchedGroups:[1],matchedTiles:['N']})]);
 assert.ok(!scoped.occurrences.some(o=>o.key==='east'));assert.ok(scoped.occurrences.some(o=>o.key==='north'));assert.ok(scoped.occurrences.some(o=>o.fanCode==='mcr-60')&&scoped.occurrences.some(o=>o.fanCode==='mcr-61'));
 // 2014 MCR rule 7 expressly permits Fully Concealed Hand on self draw: 88+4.
 const draw=score({...input,source:'wall',from:0});assert.ok(draw.ok);assert.equal(draw.analysis.nonFlowerTotal,92);assert.deepEqual(draw.settlement.delta,[300,-100,-100,-100]);
 const flower=score({...input,flowers:[34,35]});assert.ok(flower.ok);assert.equal(flower.analysis.nonFlowerTotal,88);assert.equal(flower.analysis.total,90);assert.deepEqual(flower.settlement.delta,[114,-98,-8,-8]);
 const seven=score({...input,concealedBeforeWin:[0,0,1,1,2,2,3,3,4,4,5,5,6],winningTile:6});assert.ok(seven.ok);assert.equal(seven.analysis.nonFlowerTotal,88,'Seven shifted pairs exclude ordinary seven pairs and flush');
 // WMO Appendix 1 fan 20: all seven distinct honors plus seven singles
 // from a suit-permuted knitted straight. No pair or ordinary meld is needed.
 // Exhaust every omitted suited pair and every possible final winning tile.
 let greaterCases=0;
 for(const suits of [[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]]){
  const knitted=suits.flatMap((s,i)=>[i,i+3,i+6].map(r=>s*9+r));
  for(let a=0;a<9;a++)for(let b=a+1;b<9;b++){
   const complete=[...knitted.filter((_,i)=>i!==a&&i!==b),27,28,29,30,31,32,33];
   for(let finish=0;finish<14;finish++)for(const selfDraw of [false,true]){
    const r=score({...input,concealedBeforeWin:complete.filter((_,i)=>i!==finish),winningTile:complete[finish],source:selfDraw?'wall':'discard',from:selfDraw?0:1});
    const label=JSON.stringify({suits,a,b,finish,selfDraw});assert.ok(r.ok,label);
    assert.equal(r.analysis.nonFlowerTotal,selfDraw?28:24,label);
    assert.ok(r.analysis.fanCodes.includes('mcr-20'),label);
    for(const excluded of ['mcr-34','mcr-52','mcr-62','mcr-77','mcr-78','mcr-79'])assert.ok(!r.analysis.fanCodes.includes(excluded),`${label}: duplicate ${excluded}`);
    assert.deepEqual(r.settlement.delta,selfDraw?[108,-36,-36,-36]:[48,-32,-8,-8],label);
    greaterCases++;
   }
   const duplicate=[...complete];duplicate[0]=duplicate[1];
   assert.equal(score({...input,concealedBeforeWin:duplicate.slice(0,-1),winningTile:duplicate.at(-1)}).ok,false,'A duplicate cannot replace a required distinct knitted single');
  }
 }
 const pairs=[0,4,10,16,20,27,31].flatMap(t=>[t,t]);
 for(let finish=0;finish<14;finish++){
  const r=score({...input,concealedBeforeWin:pairs.filter((_,i)=>i!==finish),winningTile:pairs[finish]});
  assert.ok(r.ok);assert.equal(r.analysis.nonFlowerTotal,30,'Seven pairs24 plus all types6');
  assert.ok(r.analysis.fanCodes.includes('mcr-19'));assert.ok(!r.analysis.fanCodes.includes('mcr-62'));assert.ok(!r.analysis.fanCodes.includes('mcr-79'));
 }
 console.log(`PASS: ${greaterCases} greater-honors knitted completions, 216 duplicate-single rejections, and 14 ordinary seven-pair completions.`);
 assert.equal(score({...input,winningTile:1}).ok,false);
 // MCR Nine Gates needs the concealed 1112345678999 pre-win pattern.
 // FFMJ illustrated fan4: https://www.ffmahjong.fr/FFMJ-site/documents/mcr_combis_4pages.pdf
 // Do not apply the Japanese final-shape-only rule to this separate engine.
 for(let suit=0;suit<3;suit++)for(let extra=0;extra<9;extra++){
  const start=[0,0,0,1,2,3,4,5,6,7,8,8,8].map(t=>t+suit*9),winningTile=extra+suit*9;
  const r=score({...input,concealedBeforeWin:start,winningTile});assert.ok(r.ok);assert.ok(r.analysis.fanCodes.includes('mcr-04'));
  for(let removed=0;removed<9;removed++)if(removed!==extra){
   const wrongStart=[...start,winningTile];wrongStart.splice(wrongStart.indexOf(removed+suit*9),1);
   const other=score({...input,concealedBeforeWin:wrongStart,winningTile:removed+suit*9});
   assert.ok(other.ok,'The identical final hand remains an ordinary full-flush win');
   assert.ok(!other.analysis.fanCodes.includes('mcr-04'),`Nine Gates incorrectly awarded: suit${suit}, extra${extra}, final${removed}`);
  }
 }
 // Known upstream gap: an exposed fourth group with a knitted straight.
 // Preserve as unsupported, never tell a learner this valid structure is invalid.
 const openKnitted=score({...input,concealedBeforeWin:[0,3,6,10,13,16,20,23,26,27],winningTile:27,melds:[{kind:'pung',tiles:[31,31,31],open:true}]});
 assert.ok(openKnitted.ok);assert.equal(openKnitted.analysis.nonFlowerTotal,21); // 12 knitted + 6 all types + 2 dragon + 1 pair wait
 for(const suits of [[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]]){
  const knitted=suits.flatMap((s,i)=>[i,i+3,i+6].map(r=>s*9+r));
  const hand={...input,concealedBeforeWin:[...knitted,27],winningTile:27,melds:[{kind:'pung',tiles:[31,31,31],open:true}]};
  const r=score(hand);assert.ok(r.ok);assert.equal(r.analysis.nonFlowerTotal,21);
  const self=score({...hand,from:0,source:'flower-replacement',flowers:[34]});assert.ok(self.ok);assert.equal(self.analysis.nonFlowerTotal,22);assert.equal(self.analysis.total,23);assert.ok(!self.analysis.fanCodes.includes('mcr-46'));
  const chow=score({...hand,concealedBeforeWin:[...knitted,4],winningTile:4,melds:[{kind:'chow',tiles:[0,1,2],open:true}]});assert.ok(chow.ok);assert.equal(chow.analysis.nonFlowerTotal,15);assert.ok(chow.analysis.fanCodes.includes('mcr-63'));assert.ok(!chow.analysis.fanCodes.includes('mcr-76'));
  const twoFlowers=score({...hand,flowers:[34,35]});assert.ok(twoFlowers.ok);
  assert.equal(new Set(twoFlowers.analysis.fanCodes).size,twoFlowers.analysis.fanCodes.length,'Fan code summary is distinct; repetition belongs in occurrences');
  assert.equal(twoFlowers.analysis.occurrences.filter(o=>o.fanCode==='mcr-81').length,2);
  assert.ok(twoFlowers.analysis.occurrences.filter(o=>o.fanCode==='mcr-81').every(o=>o.source==='flower'));
 }
 assert.throws(()=>score({...input,flowers:[34,34]}));assert.throws(()=>score({...input,from:0}));assert.throws(()=>score({...input,winningTile:34}));
 // Same valid declared-knitted structure; isolate event attribution/exclusions.
 const eventBase={...input,concealedBeforeWin:[0,3,6,10,13,16,20,23,26,27],winningTile:27,melds:[{kind:'kong',tiles:[31,31,31,31],open:true}]};
 const has=(r,code)=>r.analysis.fanCodes.includes(code);
 const flowerDraw=score({...eventBase,source:'flower-replacement',from:0,flowers:[34]});assert.ok(flowerDraw.ok);assert.ok(has(flowerDraw,'mcr-80'));assert.ok(!has(flowerDraw,'mcr-46'));
 const kongDraw=score({...eventBase,source:'kong-replacement',from:0});assert.ok(kongDraw.ok);assert.ok(has(kongDraw,'mcr-46'));assert.ok(!has(kongDraw,'mcr-80'));assert.equal(kongDraw.analysis.nonFlowerTotal-flowerDraw.analysis.nonFlowerTotal,7);
 const robbed=score({...eventBase,source:'robbed-kong',lastCopy:true});assert.ok(robbed.ok);assert.ok(has(robbed,'mcr-47'));assert.ok(!has(robbed,'mcr-58'));
 const lastDraw=score({...eventBase,source:'wall',from:0,lastWallEvent:true});assert.ok(lastDraw.ok);assert.ok(has(lastDraw,'mcr-44'));assert.ok(!has(lastDraw,'mcr-80'));
 const lastDiscard=score({...eventBase,lastWallEvent:true});assert.ok(lastDiscard.ok);assert.ok(has(lastDiscard,'mcr-45'));assert.ok(!has(lastDiscard,'mcr-44'));
 assert.throws(()=>score({...eventBase,source:'flower-replacement',from:0,lastWallEvent:true}));
 assert.throws(()=>score({...eventBase,source:'kong-replacement',from:0,lastWallEvent:true}));
 // Metamorphic integration coverage: change physical payer/winner indexes,
 // not the Mahjong seat wind. A different table index must not change fans.
 // Expected transfers are constructed here, not by the settlement helper.
 let eventPayments=0;
 for(const event of [
   {source:'wall',self:true,lastWallEvent:false,lastCopy:false},
   {source:'wall',self:true,lastWallEvent:true,lastCopy:false},
   {source:'discard',self:false,lastWallEvent:true,lastCopy:false},
   {source:'discard',self:false,lastWallEvent:false,lastCopy:true},
   {source:'kong-replacement',self:true,lastWallEvent:false,lastCopy:false},
   {source:'flower-replacement',self:true,lastWallEvent:false,lastCopy:false},
   {source:'robbed-kong',self:false,lastWallEvent:false,lastCopy:true},
 ])for(const flowers of [[],[34],[34,41]]) {
   if(event.source==='flower-replacement'&&!flowers.length)continue;
   const {self,...flags}=event;
   const reference=score({...eventBase,...flags,winner:0,from:self?0:1,flowers});
   assert.ok(reference.ok);
   for(let winner=0;winner<4;winner++)for(let from=0;from<4;from++) {
     const hand={...eventBase,...flags,winner,from,flowers};
     if(self?(winner!==from):(winner===from)){
       assert.throws(()=>score(hand),undefined,'contradictory source must be rejected');
       continue;
     }
     const before=JSON.stringify(hand),r=score(hand);assert.ok(r.ok);
     assert.deepEqual(r.analysis,reference.analysis,'physical seat index cannot alter fan evaluation');
     const points=r.analysis.nonFlowerTotal+flowers.length;
     assert.equal(r.analysis.total,points);
     const expected=Array.from({length:4},(_,seat)=>seat===winner?0:-(8+(self||seat===from?points:0)));
     expected[winner]=-expected.reduce((a,b)=>a+b,0);
     assert.deepEqual(r.settlement.delta,expected,'actual scoring result reaches correct payer seats');
     assert.deepEqual(r.settlement.transfers.map(t=>[t.from,t.to,t.amount]),[0,1,2,3].filter(s=>s!==winner).map(s=>[s,winner,-expected[s]]));
     assert.equal(JSON.stringify(hand),before,'event settlement must not mutate source hand');
     eventPayments++;
   }
 }
 console.log(`PASS: ${eventPayments} actual-hand special-event settlements across winner/payer seats and flower counts, plus invalid source guards. Seat permutation evidence, not independent proof of all fan values.`);
 assert.throws(()=>score({...input,concealedBeforeWin:[0,0,0,0,0,1,2,3,4,5,6,7,8]}));
 console.log('PASS: pinned MCR scorer mapping, exact thirteen-orphans/shifted-pairs exclusions, self-draw/flowers and independent payments; malformed/illegal inputs. Not all 81 fans or full-round proof.');
})().catch(e=>{console.error(e);process.exitCode=1;});
