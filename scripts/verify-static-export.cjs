// Inspect the actual export, not .next server output. No server is started.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../.next-static');
assert.ok(fs.existsSync(path.join(root,'index.html')),'Run npm run build:static first');
function files(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(dir,e.name)):[path.join(dir,e.name)]);}
const htmlFiles=files(root).filter(f=>f.endsWith('.html'));
// This project currently exports 152 HTML documents (including six bilingual information pages). A loose >100 check can
// incorrectly pass while Next is still copying the last routes into the export.
// Update this inventory deliberately whenever the route set changes.
assert.equal(htmlFiles.length,152,'Incomplete or changed route export; wait for build completion and audit the route inventory');
let assets=0;
for(const file of htmlFiles){
 const html=fs.readFileSync(file,'utf8');
 for(const match of html.matchAll(/(?:src|href)="(\/[^"?#]*\.(?:js|css|png|jpg|jpeg|webp|svg|ico|woff2?))(?:[?#][^"]*)?"/g)){
  const target=path.resolve(root,'.'+decodeURIComponent(match[1]));
  assert.ok(target.startsWith(root+path.sep),'Asset escaped export root');
  assert.ok(fs.existsSync(target),`${path.relative(root,file)} missing ${match[1]}`);assets++;
 }
}
for(const locale of ['zh','en']){
 for(const page of ['about','contact','privacy']){
  const info=fs.readFileSync(path.join(root,locale,page,'index.html'),'utf8');
  assert.ok(info.includes('mailto:wyh93829@gmail.com'));
  assert.ok(info.includes('href="https://oumashu.top/"'));
  assert.ok(!info.includes('oumasho.com'));
  for(const target of ['about','contact','privacy'])assert.ok(info.includes(`href="/${locale}/${target}/"`));
 }
 const privacy=fs.readFileSync(path.join(root,locale,'privacy/index.html'),'utf8');
 assert.ok(privacy.includes('PeerJS')&&privacy.includes('STUN')&&privacy.includes('localStorage'));
 assert.ok(privacy.includes('TURN')&&privacy.includes(locale==='zh'?'中继传输对局数据':'relay match data'),'Privacy export must disclose possible TURN relay');
 const xiangqiIndex=fs.readFileSync(path.join(root,locale,'xiangqi/learn/index.html'),'utf8');
 for(const slug of ['xiangqi-first-lesson','xiangqi-basics','xiangqi-captures','xiangqi-defense']){
  assert.ok(xiangqiIndex.includes(`/${locale}/xiangqi/learn/${slug}`),'Missing Xiangqi course link: '+slug);
  assert.ok(fs.existsSync(path.join(root,locale,'xiangqi/learn',slug,'index.html')),'Missing Xiangqi lesson export: '+slug);
 }
 assert.ok(!xiangqiIndex.includes(locale==='zh'?'中国象棋入门：从楚河汉界到中炮':'Xiangqi Basics: From the River'),'Old duplicate introductory title remains in course list');
 const terms=fs.readFileSync(path.join(root,locale,'mahjong/learn/mahjong-terms/index.html'),'utf8');
 assert.ok(terms.includes(locale==='zh'?'随机日式练习在麻将实战页':'Random riichi practice is on the Mahjong play page'),'Terminology page must distinguish diagrams from actual play');
 assert.ok(terms.includes(locale==='zh'?'不保证跨网络成功':'not guaranteed across networks'),'Terminology page must retain connectivity limitations');
 assert.ok(!terms.includes(locale==='zh'?'不表示本站已提供完整日麻对战':'not a claim that a full riichi game engine is available'),'Stale capability disclaimer');
 const edges=fs.readFileSync(path.join(root,locale,'cube/learn/cfop-2look-ll/index.html'),'utf8');
 for(const marker of locale==='zh'?['独立案例：黄色 L 形变十字','独立案例：点形分两段变十字','第七次点击 U2','最后停在第十三步']:['Separate case: yellow L to cross','Separate case: dot to cross in two stages','Click seven is U2','Stop after step thirteen'])assert.ok(edges.includes(marker),`Missing exported edge case instruction: ${marker}`);
 const notation=fs.readFileSync(path.join(root,locale,'cube/learn/notation/index.html'),'utf8');
 assert.ok(notation.includes(locale==='zh'?'演示一组四步':'One four-move group'),'notation must distinguish displayed case from six repetitions');
 assert.ok(notation.includes(locale==='zh'?'不是通用的还原方法':'not a general solve'),'notation must explain return-to-start versus solving');
 assert.ok(!notation.includes(locale==='zh'?'读任何三阶公式':'read any 3x3 algorithm'),'stale notation mastery claim');
 const pll=fs.readFileSync(path.join(root,locale,'cube/learn/cfop-2look-ll/index.html'),'utf8');
 assert.ok(pll.includes(locale==='zh'?'Z，两对相邻的棱块互换':'Z, adjacent edge pairs'),'missing independent Z case');
 assert.ok(pll.includes(locale==='zh'?'第 24 步做 U':'step 24, U'),'Z must explain the final alignment');
 const f2l=fs.readFileSync(path.join(root,locale,'cube/learn/cfop-f2l/index.html'),'utf8');
 assert.ok(f2l.includes(locale==='zh'?'同一对换了位置':'The same pair in a new position'),'F2L title must describe the actual single case');
 assert.ok(f2l.includes(locale==='zh'?'看不清就停下来':'Pause whenever you lose track'),'F2L must allow beginners to pause');
 assert.ok(f2l.includes(locale==='zh'?'把最后一个白棱放回底面':'place its last edge'),'missing guided cross case');
 assert.ok(f2l.includes(locale==='zh'?'不是说任何打乱都能用 F2 解决':'not an F2 solution for every scramble'),'cross case needs explicit applicability limits');
 assert.ok(!f2l.includes(locale==='zh'?'步数直接减半':'half the moves'),'F2L must not promise a fixed move reduction');
 assert.ok(pll.includes(locale==='zh'?'四个侧面都有车灯':'Headlights on all four sides'),'missing corner-skip recognition');
 assert.ok(pll.includes(locale==='zh'?'跳过换角':'Skip corner swapping'),'missing instruction to leave solved corners alone');
 for(const game of ['mahjong','holdem','baccarat']){
  const hub=fs.readFileSync(path.join(root,locale,game,'index.html'),'utf8');
  assert.ok(new RegExp(`href="/${locale}/${game}/play/?"`).test(hub),`${locale}/${game}: missing actual play entry`);
  assert.ok(!hub.includes('no playable matches'),`${locale}/${game}: stale unavailable notice`);
  assert.ok(!hub.includes('No bets, balances or chips.'),`${locale}/${game}: stale teaching-chip description`);
  if(game==='holdem')assert.ok(hub.includes(locale==='zh'?'模拟筹码':'simulated chips'),`${locale}/${game}: teaching chips not explained`);
 }
 for(const game of ['chess','xiangqi','shogi','go']){
  const puzzle=fs.readFileSync(path.join(root,locale,game,'puzzles/index.html'),'utf8');
  const expected=game==='go'?(locale==='zh'?'在小棋盘上练习围棋的数气':'Practise counting liberties'):(locale==='zh'?'先看目标，亲手走出答案':'read the goal, play your answer');
  assert.ok(puzzle.includes(expected),`${locale}/${game}: missing game-specific puzzle introduction`);
  const description=puzzle.match(/<meta name="description" content="([^"]*)"/);
  assert.ok(description&&description[1].includes(expected),`${locale}/${game}: stale puzzle metadata`);
  assert.ok(!puzzle.includes('将棋打入请先点'),`${locale}/${game}: stale unexplained shogi instruction`);
  const handDefinition=locale==='zh'?'自己保管的棋子（持驹）':'pieces in hand below the board';
  assert.equal(puzzle.includes(handDefinition),game==='shogi',`${locale}/${game}: shogi drop instruction must be game-specific`);
 }
 const html=fs.readFileSync(path.join(root,locale,'mahjong/learn/mahjong-mcr/index.html'),'utf8');
 assert.ok(html.includes(locale==='zh'?'课后图解：花牌与容易混淆的番种':'After the lesson: flowers and easily confused patterns'),'Stale MCR lesson export');
 assert.ok(html.includes(locale==='zh'?'不是你本局的手牌':'not your actual tiles'),'Missing example disclaimer');
 for(const term of locale==='zh'?['平和（国标）','双同刻：']:['All Chows (MCR):','Double Pung:'])assert.ok(html.includes(term),`Missing new novice explanation ${term}`);
 for(const term of locale==='zh'?['已经有：','还缺这一张：','独立牌例一：']:['Already holding:','Missing tile:','Separate example 1:'])assert.ok(html.includes(term),`Missing wait practice/diagram ${term}`);
 for(const term of locale==='zh'?['七对：用十四张牌','十三幺：“幺九牌”']:['Seven Pairs uses fourteen tiles','Thirteen Orphans needs each 1 and 9'])assert.ok(html.includes(term),`Missing special-shape teaching content ${term}`);
 for(const term of locale==='zh'?['绿一色：整副和牌只能用','把发发换成白白']:['All Green: every tile in the completed hand','replace the Green pair with a White pair'])assert.ok(html.includes(term),`Missing All Green novice example ${term}`);
 assert.ok(html.includes(locale==='zh'?'上文说明展示的是完整牌例还是局部形状':'the explanation above identifies a complete hand or a partial shape'),'Stale illustration scope disclaimer');
 for(const game of ['chess','xiangqi','shogi','go','mahjong','holdem'])assert.ok(fs.existsSync(path.join(root,locale,game,'remote/index.html')),`Missing ${locale}/${game}/remote`);
 for(const game of ['chess','xiangqi','shogi','go']){
  const remote=fs.readFileSync(path.join(root,locale,game,'remote/index.html'),'utf8');
  assert.ok(remote.includes(locale==='zh'?'当前为邀请链接方式':'Link mode:'),'Stale default-mode explanation');
  assert.ok(!remote.includes(locale==='zh'?'当前为邀请码方式':'Code mode:'),'Wrong default-mode explanation');
 }
}
assert.ok(files(path.join(root,'_next')).filter(f=>f.endsWith('.js')).some(f=>fs.readFileSync(f,'utf8').includes('Negotiation already in progress')),'Static bundle lacks shared negotiation guard');
// Only the first exercise is initially rendered. Later manual steps live in JS.
for(const marker of ['识别练习一：','识别练习二：','Recognition exercise 1:','Recognition exercise 2:'])assert.ok(files(path.join(root,'_next')).filter(f=>f.endsWith('.js')).some(f=>fs.readFileSync(f,'utf8').includes(marker)),`Static practice bundle lacks ${marker}`);
for(const marker of ['特殊牌例一：','特殊牌例二：','Special example 1:','Special example 2:'])assert.ok(files(path.join(root,'_next')).filter(f=>f.endsWith('.js')).some(f=>fs.readFileSync(f,'utf8').includes(marker)),`Static practice bundle lacks ${marker}`);
for(const marker of ['Search superseded','Engine response timed out','当前金额不会提交','This amount will not be submitted'])assert.ok(files(path.join(root,'_next')).filter(f=>f.endsWith('.js')).some(f=>fs.readFileSync(f,'utf8').includes(marker)),`Static bundle lacks ${marker}`);
// The match summary is mounted only after all final confirmations, so it lives
// in client JS rather than the initial HTML. These guards verify delivery, not
// cumulative scoring or native modal behavior (covered separately).
const clientScripts=files(path.join(root,'_next')).filter(f=>f.endsWith('.js')).map(f=>fs.readFileSync(f,'utf8'));
for(const marker of ['All 16 hands are finished and all four players have confirmed.','tie for first place','十六手已经结束，四位都已确认结果。','并列获胜'])assert.ok(clientScripts.some(code=>code.includes(marker)),`Static MCR match summary lacks ${marker}`);
assert.ok(!clientScripts.some(code=>code.includes('Acceptance replay exceeded bound')),'Temporary acceptance replay must not ship');
assert.ok(!clientScripts.some(code=>code.includes('native same-page transport boundary acceptance')),'Development-only native RTC fixture must not ship');
assert.ok(!clientScripts.some(code=>code.includes('Development-only final-match acceptance')),'Development-only final-match fixture must not ship');
// Delivery guards for the corrected catalog row and manual RTC frame checks.
// These deliberately inspect the compiled expressions, not a generic encoder
// from an unrelated library. They do not replace rule/transport execution tests.
assert.ok(clientScripts.some(code=>/\["一色四节高",48,\[25\],\[23,49\]\]/.test(code)),'Export lacks corrected Four Pure Shifted Pungs exclusions');
const sixFaceBundle=clientScripts.find(code=>code.includes('["mcr-03","mcr-08"]'));
assert.ok(sixFaceBundle,'Export lacks six-face Seven Pairs exclusion');
const sixFaceAt=sixFaceBundle.indexOf('["mcr-03","mcr-08"]');
const sixFaceRule=sixFaceBundle.slice(Math.max(0,sixFaceAt-100),sixFaceAt+400);
assert.ok(sixFaceRule.includes('"mcr-19"')&&sixFaceRule.includes('fanCode:"mcr-64"')&&sixFaceRule.includes(',"mcr-19"]')&&sixFaceRule.includes('occurrenceKeys:'),'Export lacks conjunctive Tile Hog exclusion and attribution');
assert.ok(!clientScripts.some(code=>/\["一色四节高",48,\[25\],\[23,49,73\]\]/.test(code)),'Export still excludes the independently payable terminal pung');
const rtcBundle=clientScripts.find(code=>code.includes('Negotiation already in progress')&&code.includes('Message limit exceeded'));
assert.ok(rtcBundle,'Export lacks the manual RTC transport');
assert.ok(rtcBundle.includes('new TextEncoder'),'Manual RTC export lacks the UTF-8 encoder');
assert.ok(/encode\([^)]*\.data\)\.byteLength>65536/.test(rtcBundle),'Manual RTC export lacks the receive byte cap');
assert.ok(/encode\([^)]*\)\.byteLength>\w+/.test(rtcBundle)&&rtcBundle.includes('Math.min(65536,'),'Manual RTC export lacks the negotiated send byte cap');
assert.ok(rtcBundle.includes('this.pc.sctp?.maxMessageSize'),'Manual RTC export ignores the SCTP limit');
assert.ok(rtcBundle.includes('onconnectionstatechange=()=>{!this.stopped&&'),'Manual RTC export lacks closed-room state callback isolation');
assert.ok(/\.channel\.ordered[^;]{0,120}\.channel\.maxRetransmits[^;]{0,120}\.channel\.maxPacketLifeTime/.test(rtcBundle),'Manual RTC export lacks ordered/reliable incoming-channel guards');
for(const name of ['ffish.js','ffish.wasm','stockfish.js','stockfish.wasm','stockfish.worker.js','Copying.txt']){
 const exported=path.join(root,'engine',name),original=path.resolve(__dirname,'../public/engine',name);
 assert.ok(fs.existsSync(exported),`Missing engine asset ${name}`);
 assert.ok(fs.readFileSync(exported).equals(fs.readFileSync(original)),`Stale or damaged engine asset ${name}`);
}
for(const name of ['robots.txt','sitemap.xml'])assert.ok(fs.existsSync(path.join(root,name)));
// Mahjong illustrations use CSS backgrounds and are not covered by src/href above.
for(const name of ['tiles-generated-v1.png','flowers-generated-v1.png']){
 const original=path.resolve(__dirname,'../public/mahjong',name),exported=path.join(root,'mahjong',name);
 assert.ok(fs.existsSync(exported),`Missing illustrated tile atlas ${name}`);
 assert.ok(fs.readFileSync(exported).equals(fs.readFileSync(original)),`Stale or damaged tile atlas ${name}`);
}
console.log(`PASS: ${htmlFiles.length} exported HTML files, ${assets} referenced local assets, bilingual current lesson, six remote routes per locale, WASM and metadata. Not HTTP headers, browser or network acceptance.`);
