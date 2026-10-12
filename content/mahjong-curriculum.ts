import type { Tutorial, TutorialStep } from './tutorials';

const words = (zh: string, en: string) => ({ zh, en });
const section = (id: string, zh: string, en: string, pairs: [string,string][]): TutorialStep => ({
  id, title: words(zh,en), body: { zh: pairs.map(p=>p[0]), en: pairs.map(p=>p[1]) },
});
const take = (t: Tutorial, id: string) => {
  const s=t.steps.find(s=>s.id===id);
  if(!s)throw new Error(`Missing ${t.slug}/${id}`);
  return s;
};

export function mahjongFoundation(first: Tutorial): Tutorial {
  const names=take(first,'beginner-names'), calls=take(first,'beginner-calls');
  return {...first, title:words('麻将第一课：认牌、分组与第一次摸打','Mahjong Lesson 1: Tiles, Sets and Your First Turns'),
    description:words('所有路线共用的起点：辨认牌图、分出顺子刻子对子、完成手动摸打。之后选择一套地区规则，术语图解按需查阅。','The shared starting point: recognise tile pictures, group sets and pairs, and complete guided turns. Then choose one regional course; consult the illustrated reference as needed.'),
    steps:[take(first,'beginner-scope'),
      {...names,body:{zh:[...names.body.zh,'本课先认识完整的基础牌组：三种数字牌各 9 种、每种 4 张，共 108 张；七种字牌各 4 张，共 28 张；合计 136 张。先在图里找到一万、一筒、一条，再找到东和白板。一条上常画一只鸟，但它仍然是数字“一”的条牌，不是花牌。不同地区还会增减牌，选好地区路线后再学。'],
        en:[...names.body.en,'Our base set has three numbered suits with 9 designs and 4 copies each: 108 tiles. Seven honours with 4 copies add 28, making 136. Find one character, one dot, one bamboo, East and White Dragon in the pictures. The bird on one bamboo still means rank one, not a flower. Regional courses explain changes to this set.']}},
      take(first,'beginner-draw'),take(first,'beginner-finish'),
      {...calls,title:words('先预告：吃、碰、杠要看所选规则','Preview: calls depend on the chosen rules'),body:{
        zh:['下面的“吃牌”图用来说明日式和国标允许的动作；本网站的四川血战到底不允许吃，但自己摸齐的顺子照样有效。要分清两件事：“组成什么牌组”和“用什么动作拿到这张牌”。',...calls.body.zh],
        en:['The chow picture explains an action allowed in riichi and MCR, not our Sichuan Blood Battle course. Sichuan forbids chow calls but still allows sequences assembled through draws. Separate a valid group from the action used to obtain it.',...calls.body.en],
      }},
      section('choose-rules','学完基础，三条路线选一条','After the basics, choose one of three routes',[
        ['先自我检查：一万和一筒为什么不能配对？摸到九筒后为什么要打出一张？摸到东以后，是哪两张组成了对子？如果答不上来，就回去看认牌图和手动摸打，不用急着学新名词。','Check yourself: why do one character and one dot not form a pair? Why discard after drawing nine dots? Which tiles make the final pair after drawing East? Revisit the pictures and guided turns if unsure.'],
        ['回到麻将教程目录，选择“日式立直”“国标”或“四川血战到底”。它们是三条平行的路线，不是第一、二、三关，不需要全部学完才能开始练习。每条路线都会先讲清这套规则怎样才算合法和牌，再带你做对应的案例。','Return to the Mahjong tutorial list and choose Japanese Riichi, MCR or Sichuan Blood Battle. These are parallel branches, not levels one through three. Learn one branch and its legal winning conditions before practising it.'],
        ['“看图查术语”是可选参考，不是必修的第二课。学日式时再查立直、役、宝牌和振听；学国标时看国标的番种和八番门槛；学四川时看定缺、不能吃、和牌后退出这些规则。不要把某一条路线的规则当成所有麻将都适用。','The illustrated vocabulary is an optional reference, not compulsory Lesson 2. Consult riichi, yaku, dora and furiten for Japanese play; use MCR patterns and its eight-point threshold for MCR; follow the Sichuan course for missing suits, no chow and retiring after a win. Do not universalise a branch rule.'],
      ])],
  };
}

export function mahjongReference(old: Tutorial): Tutorial {
  // Keep picture IDs and the glossary source, but do not publish a second full
  // explanation of the table, sets or basic calls already taught in Lesson 1.
  const ids=['tenpai','closed','yaku','tsumo','ron','riichi','dora','furiten','draw-end'];
  return {...old,title:words('可选参考：看图查麻将术语与日麻专用规则','Optional Reference: Mahjong Terms and Riichi-Specific Rules'),
    description:words('先完成共通第一课，再按需要查阅。这里不重讲认牌和摸打；门前、役、立直、宝牌与振听按日式语境解释，不能套到国标或四川。','After the shared first lesson, consult as needed. This reference does not repeat tile recognition and ordinary turns. Closed hands, yaku, riichi, dora and furiten are explained in the riichi context, not imported into MCR or Sichuan.'),
    steps:ids.map(id=>{
      const s=take(old,id);
      if(id!=='tenpai')return s;
      return {...s,body:{zh:['使用方法：先学完第一课。这篇是可选的图解，按“听牌 → 门前 → 役 → 最后一张的来源 → 立直 → 宝牌 → 振听 → 流局”的顺序查阅；讲日麻和牌资格和计分的段落只适用于日式路线，国标和四川请看各自的课程。',...s.body.zh],en:['Complete Lesson 1 first. This optional reference proceeds through ready hands, closed status, yaku, winning-tile source, riichi, dora, furiten and draws. Japanese eligibility and scoring passages apply only to the riichi branch; use the separate courses for MCR and Sichuan.',...s.body.en]}};
    }),
  };
}

export function mahjongBranch(old: Tutorial): Tutorial {
  const prerequisites=section('branch-prerequisites','开始前：确认已学会共通基础','Before starting: check the shared basics',[
    ['请先学完“麻将第一课：认牌、分组与第一次摸打”：会区分三种数字牌和字牌、顺子和刻子、手牌和弃牌，也能跟着做 13 → 14 → 13。只看过术语表还不够，一定要亲手练过。','Complete Mahjong Lesson 1 first: distinguish suits and honours, sequences and triplets, hand and discards, and perform a 13 → 14 → 13 turn. Reading a glossary does not replace that practice.'],
    ['这是一条独立的地区路线，不需要先学另外两套麻将。下面用你熟悉的牌图，讲这套规则的和牌资格、动作和结算，不再重新教认牌。各节的案例可能会重新摆牌，请先看清每节的起始手牌，不要当成同一局连续发生的事。','This is a separate regional branch; the other two branches are not prerequisites. Familiar pictures now test this branch’s winning eligibility, actions and settlement rather than reteaching every tile. Examples may reset between sections: inspect each starting hand rather than treating them as one continuous game.'],
  ]);
  const orderedSteps=old.slug==='mahjong-riichi'
    ? ['jp-goal','jp-tiles','jp-riichi','jp-score','jp-source','jp-end'].map(id=>take(old,id))
    : old.steps;
  return {...old,steps:[prerequisites,...orderedSteps.map(s=>{
    if(s.id==='jp-goal')return {...s,body:{zh:['先用第一课的分组方法看图中这十三张：四组三张已经齐了，只有东还单着，所以再来一张东就能拼成完成形。这张图只说明你在“等哪张牌”，还没说明日式规则允许你和牌。七对子、国士无双是另外两种合法牌型，不能硬拆成四组；本例不用它们。','先认识本节要用的“门前”：没有通过吃、碰、明杠拿别人的牌来公开组成牌组。明杠包括两种：手里有三张一样的、再拿别人打出的第四张；或者给已经碰出来的刻子再加上第四张。暗杠则是四张都是自己摸到的再宣告，暗杠不会破坏门前。“门前”说的是牌组是怎么来的，不是你坐在门口；后面的立直一节会用到它。',s.body.zh[1]],en:['Apply Lesson 1 to the thirteen pictured tiles: four sets are complete and East is alone, so another East completes the standard shape. This shows the wait, not yet permission to win under riichi rules. Seven pairs and thirteen orphans are other legal shapes; this example does not use them.','First define closed: you have not claimed another player’s tile to expose a chow, pung or open kong. Open kongs include claiming a fourth matching tile onto three in hand or adding a fourth to an exposed pung. A concealed kong declares four matching tiles already in your hand and preserves closed status. This tracks how groups were obtained, not where you sit; the riichi section applies it.',s.body.en[1]]}};
    if(s.id==='jp-riichi')return {...s,body:{
      zh:['把前面“门前”的定义用到当前牌：本例没有吃、碰或明杠，所以可以检查能不能立直。如果你已经吃过或碰过，就不能立直，也拿不到“门前清自摸和”这个役；但这不代表永远不能和牌，还要看有没有其他的役。',s.body.zh[1]],
      en:['Apply the earlier definition of closed to this hand: no chow, pung or open kong has been made, so riichi eligibility can still be checked. After chow or pung you cannot declare riichi or claim closed self-draw, but another yaku may still allow a win.',s.body.en[1]],
    }};
    if(s.id==='jp-source')return {...s,body:{
      zh:['上一节分清了役、番、符和宝牌，现在把它们用到“最后一张从哪里来”和“谁来付”上。先认识两个身份：“庄家”是这一局有特殊先手和支付规则的玩家，“闲家”是其余三人。同样的一手牌，来源不同、庄闲不同，支付方式也可能不同。',...s.body.zh],
      en:['Apply the previous section’s distinction between yaku, han, fu and dora to winning source and payment. Two roles matter: the dealer has special opening and payment rules; the other three players are non-dealers. Source and dealer status can change the payment for the same tiles.',...s.body.en],
    }};
    if(s.id==='jp-end')return {...s,body:{
      zh:['先把结束时的几个新词翻成白话：“连庄”是下一局还由同一个人当庄家；“本场”是用来计算后续结算加点的局数，不是你的牌数，也不是连赢次数。回想立直那一步：玩家从 25000 变成 24000，桌上多了 1000；一局结束时，这根供托点棒也要按规则处理，不能忘掉。本课不要求你现在背结算表。',...s.body.zh],
      en:['Translate the new end-of-hand terms first: dealer continuation means the same player deals the next hand; repeat counters (honba) track a settlement bonus, not a tile count or winning streak. Recall the riichi step: 25,000 became 24,000 with 1,000 on the table. That deposit must now be handled under the rules, not forgotten. You need not memorise payment tables yet.',...s.body.en],
    }};
    if(s.id==='jp-tiles')return {...s,title:words('日式用牌，以及保留等待的选择','Riichi tiles and keeping your wait'),body:{
      zh:['沿用第一课的 136 张基础牌，本课不加花牌，也不用赤五。“赤五”是部分日式规则把普通的五换成红色的五，并不是多出来的第五张五；万字牌上本来就印着红字，那不代表它是赤宝牌。','现在用上摸打的流程：图中四组已经齐了，在等东；摸到南以后有十四张。南不能和东配成对子，所以本例打掉南，保留等东的十三张。下一节会在这个选择上加上“立直”的条件和宣告动作；这一节先不要宣告。'],
      en:['Use the 136-tile base set from Lesson 1, without flowers or red fives here. Some riichi rules replace an ordinary five with a red five; this is not a fifth copy. Ordinary red printing on character tiles does not make them red dora.','Apply the turn process: four sets are ready and East is waiting. Drawing South gives fourteen. South cannot pair East, so choose to discard South and preserve the thirteen-tile East wait. The next section adds riichi eligibility and declaration to this decision; do not declare yet.'],
    }};
    if(s.id==='mcr-tiles')return {...s,title:words('国标多出的八张花牌：补花与起和门槛','The eight MCR flowers: replacements and the minimum'),body:{
      zh:['在第一课 136 张基础牌的基础上，国标再加八张花牌，共 144 张。新增的是春、夏、秋、冬和梅、兰、竹、菊，各一张，不是把每种基础牌多加一张。花牌不能组成顺子、刻子或对子：摸到后通常要亮出来放在自己的花牌区，再从牌墙补摸一张；补到的还是花，就继续补，直到补到能用的牌。别把一条上的鸟当成花牌。',s.body.zh[1],s.body.zh[2]],
      en:['Add eight flowers to Lesson 1’s 136-tile base set for 144 tiles: one each of the four seasons and plum, orchid, bamboo and chrysanthemum. These are not extra copies of ordinary tiles. A flower cannot form a set or pair: normally expose it in your flower area and take a replacement, repeating if another flower arrives. The bird on one bamboo is not a flower.',s.body.en[1],s.body.en[2]],
    }};
    if(s.id==='sc-tiles')return {...s,title:words('四川去掉了哪些牌：用两门牌保留等待','What Sichuan removes: keeping a two-suit wait'),body:{
      zh:['从第一课的 136 张基础牌里拿掉全部 28 张字牌（东南西北、中发白），只剩 108 张万、筒、条；这条路线也不加花牌。这里不再重新认牌，而是要知道哪些牌根本不会出现：比如不能打算等一张东来配对子，要用数字牌来组成整副牌。','看本课第一张完成形：万牌有一二三、四五六，筒牌有二三四、六七八，另外两张五万组成对子。从对子里拿走一张五万，就回到十三张等待的状态：再来一张合适的牌就能完成，这叫“听牌”。后面还有定缺的要求，听牌不等于已经和了。'],
      en:['Remove all 28 honours (winds and dragons) from Lesson 1’s 136-tile base set, leaving 108 suited tiles. No flowers are added. Apply the inventory change instead of relearning pictures: you cannot plan an East-pair wait when East is absent from this ruleset.','Inspect the complete hand in this course’s first illustration: characters 123 and 456, dots 234 and 678, plus a pair of five-characters. Remove one tile from that pair to leave thirteen needing a suitable final tile. This ready state is called tenpai. The later missing-suit conditions still apply: ready is not already won.'],
    }};
    if(s.id==='sc-end')return {...s,body:{
      zh:[s.body.zh[0],'牌墙摸完、还有人没和牌时，进入结束检查。“查花猪”是检查有没有人还留着桌规不允许的花色；“查大叫”是检查没和牌的人有没有听牌，可能要赔付。用本例来判断：只等五万的十三张是听牌；但如果手里还留着定缺的条，就算看起来只差一张，也不能算可以合法和牌。','开局前还要约定计分表。“封顶”是计分的最高上限；“根”通常是指同一种牌凑齐四张、满足加分条件，不一定是已经宣告的杠；“杠分”是杠这个动作另外产生的积分。根怎么认定、杠分要不要退、查叫怎么赔，都按所选的桌规来定。本课只演示缺条、自摸和退出的流程，不擅自给这副牌定一个统一的倍数，也不涉及真钱。'],
      en:[s.body.en[0],'When the wall runs out with players still unwon, begin the final checks. A forbidden-suit check examines disallowed suit retention; a ready-hand check examines whether non-winners are ready and may create transfers. Apply it here: thirteen waiting on five-characters are ready, but retaining the declared bamboo suit prevents a legal win even if the shape looks one tile short.','Agree on the scoring table before starting. A cap limits the scoring value; a root commonly means four copies of one tile meeting a bonus condition, not necessarily a declared kong; kong points are a separate score from a kong action. Root eligibility, kong refunds and ready-hand payments depend on the chosen table rules. This course demonstrates the missing-bamboo, self-draw and retirement flow without inventing a universal multiplier or using money.'],
    }};
    if(s.id==='mcr-turn')return {...s,title:words('国标案例：吃牌后要重新检查','MCR example: recheck eligibility after a call'),body:{
      zh:['第一课已经介绍过吃、碰、杠，这里练一次判断：你有二筒、三筒，上家刚打出四筒，按图示可以吃成二三四筒。吃完要从剩下的手牌里打出一张，这次不再正常摸牌。这组三张仍然算在整副牌里，不能既摊在面前又在手牌里重复计算。','吃成一个顺子，只说明这一组合法，不代表整副牌就能和。动作之后要重新检查剩下的牌组、等的是哪张牌，以及不算花牌时能不能凑够八番。有些番种取决于牌组是否公开，所以不能沿用吃牌之前的判断。',s.body.zh[1]],
      en:['Lesson 1 introduced chow, pung and kong. Apply them here: with two and three dots, you may chow the previous player’s fresh four dots. Discard from the remaining hand without an ordinary draw. The exposed three still belong to the hand; do not also count them as concealed tiles.','A legal sequence does not automatically make a legal winning hand. Recheck the remaining groups, wait and eight-point minimum excluding flowers. Some scoring conditions depend on whether groups are exposed, so reassess rather than reusing your pre-call result.',s.body.en[1]],
    }};
    return s;
  })]};
}
