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
      {...names,body:{zh:[...names.body.zh,'本课先认识完整基础牌组：三门数字牌各 9 种、每种 4 张，共 108 张；七种字牌各 4 张，共 28 张；合计 136 张。先在图里找一万、一筒、一条，再找东和白板。一条常画鸟，但它仍是数字“一”的条牌，不是花牌。不同地区会删减或增加牌，下一条路线再说明。'],
        en:[...names.body.en,'Our base set has three numbered suits with 9 designs and 4 copies each: 108 tiles. Seven honours with 4 copies add 28, making 136. Find one character, one dot, one bamboo, East and White Dragon in the pictures. The bird on one bamboo still means rank one, not a flower. Regional courses explain changes to this set.']}},
      take(first,'beginner-draw'),take(first,'beginner-finish'),
      {...calls,title:words('动作预告：吃、碰、杠要先看所选规则','Preview: calls depend on the chosen rules'),body:{
        zh:['下面的吃牌图用于理解日式和国标允许的动作，不能套到本网站的四川血战到底：四川路线不允许吃，但自己摸齐的顺子仍然有效。先分清“组成什么牌组”和“用什么动作拿到牌”。',...calls.body.zh],
        en:['The chow picture explains an action allowed in riichi and MCR, not our Sichuan Blood Battle course. Sichuan forbids chow calls but still allows sequences assembled through draws. Separate a valid group from the action used to obtain it.',...calls.body.en],
      }},
      section('choose-rules','完成基础后，三条路线选一条','After the basics, choose one of three routes',[
        ['先检查自己能否解释：一万与一筒为什么不能配对？摸九筒后为什么要打一张？摸东后是哪两张组成对子？如果答不出来，回看认牌图和手动摸打，不必抢着学新名词。','Check yourself: why do one character and one dot not form a pair? Why discard after drawing nine dots? Which tiles make the final pair after drawing East? Revisit the pictures and guided turns if unsure.'],
        ['回到麻将教程目录，选择“日式立直”“国标”或“四川血战到底”。它们是平行分支，不是第一、二、三关，不必全部学完才能开始一套练习。每篇先说明本规则的合法和牌条件，再带你做对应案例。','Return to the Mahjong tutorial list and choose Japanese Riichi, MCR or Sichuan Blood Battle. These are parallel branches, not levels one through three. Learn one branch and its legal winning conditions before practising it.'],
        ['“看图查术语”是可选参考，不是必修第二课。学日式时再查立直、役、宝牌和振听；学国标时按国标的番种和八番门槛；学四川时按该课的定缺、不能吃及和后退出。不要把一个分支的限制当成所有麻将的规则。','The illustrated vocabulary is an optional reference, not compulsory Lesson 2. Consult riichi, yaku, dora and furiten for Japanese play; use MCR patterns and its eight-point threshold for MCR; follow the Sichuan course for missing suits, no chow and retiring after a win. Do not universalise a branch rule.'],
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
      return {...s,body:{zh:['使用方法：先完成第一课。本文是可选图解，按“听牌 → 门前 → 役 → 最后一张来源 → 立直 → 宝牌 → 振听 → 流局”查阅；涉及日麻资格与计分的段落只适用于日式路线。国标和四川请以各自课程为准。',...s.body.zh],en:['Complete Lesson 1 first. This optional reference proceeds through ready hands, closed status, yaku, winning-tile source, riichi, dora, furiten and draws. Japanese eligibility and scoring passages apply only to the riichi branch; use the separate courses for MCR and Sichuan.',...s.body.en]}};
    }),
  };
}

export function mahjongBranch(old: Tutorial): Tutorial {
  const prerequisites=section('branch-prerequisites','开始前：确认已会共通基础','Before starting: check the shared basics',[
    ['先完成“麻将第一课：认牌、分组与第一次摸打”，能区分三门数字牌与字牌、顺子与刻子、手牌与弃牌，并能跟做 13 → 14 → 13。若只看过术语表，还不能代替动手练习。','Complete Mahjong Lesson 1 first: distinguish suits and honours, sequences and triplets, hand and discards, and perform a 13 → 14 → 13 turn. Reading a glossary does not replace that practice.'],
    ['本篇是独立地区分支，不要求先学其他两套麻将。相似牌图用来比较本分支的和牌资格、动作与结算，不重新教授整套认牌规则。固定案例之间可能重新摆牌，读清每节起点，不要把它们误当作同一局连续发生。','This is a separate regional branch; the other two branches are not prerequisites. Familiar pictures now test this branch’s winning eligibility, actions and settlement rather than reteaching every tile. Examples may reset between sections: inspect each starting hand rather than treating them as one continuous game.'],
  ]);
  const orderedSteps=old.slug==='mahjong-riichi'
    ? ['jp-goal','jp-tiles','jp-riichi','jp-score','jp-source','jp-end'].map(id=>take(old,id))
    : old.steps;
  return {...old,steps:[prerequisites,...orderedSteps.map(s=>{
    if(s.id==='jp-goal')return {...s,body:{zh:['先用第一课的分组方法检查图中十三张：四组三张已经齐了，东还单着，因此再来一个东能完成普通形。这个图只证明“缺哪张”，还没有证明日式规则允许和牌。七对子、国士无双是其他合法结构，不能强拆成四组；本例不用它们。','先认识本节要用的“门前”：没有通过吃、碰、明杠取别人的牌来公开组成牌组。明杠包括手里三个相同牌取别人第四张，以及给已经碰出的刻子添加第四张；暗杠则是四张都由自己持有再声明。暗杠不破坏门前。这是在判断取得牌组的方式，不是人坐在门口；后面的立直章节会用到它。',s.body.zh[1]],en:['Apply Lesson 1 to the thirteen pictured tiles: four sets are complete and East is alone, so another East completes the standard shape. This shows the wait, not yet permission to win under riichi rules. Seven pairs and thirteen orphans are other legal shapes; this example does not use them.','First define closed: you have not claimed another player’s tile to expose a chow, pung or open kong. Open kongs include claiming a fourth matching tile onto three in hand or adding a fourth to an exposed pung. A concealed kong declares four matching tiles already in your hand and preserves closed status. This tracks how groups were obtained, not where you sit; the riichi section applies it.',s.body.en[1]]}};
    if(s.id==='jp-riichi')return {...s,body:{
      zh:['把前面“门前”的定义用到当前牌：本例没有吃、碰或明杠，所以仍可检查立直资格。若你已经吃或碰，就不能立直，也不能拿“门前清自摸和”这个役；但不能因此断言永远不能和牌，还要看是否有其他役。',s.body.zh[1]],
      en:['Apply the earlier definition of closed to this hand: no chow, pung or open kong has been made, so riichi eligibility can still be checked. After chow or pung you cannot declare riichi or claim closed self-draw, but another yaku may still allow a win.',s.body.en[1]],
    }};
    if(s.id==='jp-source')return {...s,body:{
      zh:['上一节已经区分役、番、符和宝牌，现在把它们用于和牌来源与支付。先补两个身份：“庄家”是本局承担特殊先手与支付规则的玩家，“闲家”是其余三人。同样的牌，来源和庄闲不同，支付方式也可能不同。',...s.body.zh],
      en:['Apply the previous section’s distinction between yaku, han, fu and dora to winning source and payment. Two roles matter: the dealer has special opening and payment rules; the other three players are non-dealers. Source and dealer status can change the payment for the same tiles.',...s.body.en],
    }};
    if(s.id==='jp-end')return {...s,body:{
      zh:['先把结束后新增的名词翻成白话：“连庄”是下一局仍由同一个人做庄家；“本场”是用于后续结算加算的局数计数，不是你的牌数，也不是连赢次数。回想立直那一步：玩家从25000变24000、桌上增加1000；结束时还须按规则处理这根供托点棒，不能把它遗忘。本课不要求现在背结算表。',...s.body.zh],
      en:['Translate the new end-of-hand terms first: dealer continuation means the same player deals the next hand; repeat counters (honba) track a settlement bonus, not a tile count or winning streak. Recall the riichi step: 25,000 became 24,000 with 1,000 on the table. That deposit must now be handled under the rules, not forgotten. You need not memorise payment tables yet.',...s.body.en],
    }};
    if(s.id==='jp-tiles')return {...s,title:words('日式牌组差异与保留等待的选择','Riichi set differences and preserving a wait'),body:{
      zh:['沿用第一课的 136 张基础牌，本课不加入花牌或赤五。赤五是部分日式规则用红色五替换普通五，并不是额外增加第五张五；牌面汉字本来印红色，不等于那张是赤宝牌。','现在运用摸打而不是再背一次流程：图中四组已好、缺东，摸到南后有十四张。南不能给东配对，因此本例选择打南，保留等东的十三张。下一节会在这个选择上增加“立直”的条件和声明动作；本节不要提前宣告。'],
      en:['Use the 136-tile base set from Lesson 1, without flowers or red fives here. Some riichi rules replace an ordinary five with a red five; this is not a fifth copy. Ordinary red printing on character tiles does not make them red dora.','Apply the turn process: four sets are ready and East is waiting. Drawing South gives fourteen. South cannot pair East, so choose to discard South and preserve the thirteen-tile East wait. The next section adds riichi eligibility and declaration to this decision; do not declare yet.'],
    }};
    if(s.id==='mcr-tiles')return {...s,title:words('国标增加的八张花牌：补花与起和门槛','The eight MCR flowers: replacements and the minimum'),body:{
      zh:['沿用第一课的136张基础牌，国标另加八张花牌，合计144张。新增的是春夏秋冬和梅兰竹菊，各一张，不是把每种基础牌再加一张。花牌不能参与顺子、刻子或对子；通常摸到后亮出放在自己的花牌区，再按规则补摸一张，直到补到可参与手牌的牌。不要把一条上的鸟当作花。',s.body.zh[1],s.body.zh[2]],
      en:['Add eight flowers to Lesson 1’s 136-tile base set for 144 tiles: one each of the four seasons and plum, orchid, bamboo and chrysanthemum. These are not extra copies of ordinary tiles. A flower cannot form a set or pair: normally expose it in your flower area and take a replacement, repeating if another flower arrives. The bird on one bamboo is not a flower.',s.body.en[1],s.body.en[2]],
    }};
    if(s.id==='sc-tiles')return {...s,title:words('四川删去哪些牌：用两门牌保留等待','What Sichuan removes: preserve a two-suit wait'),body:{
      zh:['从第一课的136张基础牌中拿走全部28张字牌（东南西北、中发白），只剩108张万筒条；本路线也不加入花牌。这里不重新认图案，而是检查哪些牌根本不会出现：比如不能计划等东配对子，应改用数字牌来组成整副牌。','对照本课第一张完成形：万牌有一二三、四五六，筒牌有二三四、六七八，另外两张五万成对。拿走对子中的一张五万，就回到十三张等待状态——再来一张合适的牌才能完成形状，这叫“听牌”。还要满足后面的定缺要求，听牌并不等于已经和牌。'],
      en:['Remove all 28 honours (winds and dragons) from Lesson 1’s 136-tile base set, leaving 108 suited tiles. No flowers are added. Apply the inventory change instead of relearning pictures: you cannot plan an East-pair wait when East is absent from this ruleset.','Inspect the complete hand in this course’s first illustration: characters 123 and 456, dots 234 and 678, plus a pair of five-characters. Remove one tile from that pair to leave thirteen needing a suitable final tile. This ready state is called tenpai. The later missing-suit conditions still apply: ready is not already won.'],
    }};
    if(s.id==='sc-end')return {...s,body:{
      zh:[s.body.zh[0],'牌墙耗尽、仍有人未和时，进入结束检查。“查花猪”检查是否仍有桌规不允许的花色保留情况；“查大叫”检查未和者是否听牌，可能引起赔付。先用本例判断：只等五万的十三张是听牌；如果仍留定缺的条，就不能仅凭看起来差一张来认定可合法和牌。','开局还要约定计分表。“封顶”是最高计分上限；“根”常指同一种牌凑齐四张形成的加分条件，不必然等于已声明杠；“杠分”是杠动作产生的另项积分。根怎样认定、杠分是否退还及查叫怎样赔付，都随所选桌规确定。本课只演示缺条、自摸和退出的流程，不擅自给这副牌指定统一倍率，也不涉及现实货币。'],
      en:[s.body.en[0],'When the wall runs out with players still unwon, begin the final checks. A forbidden-suit check examines disallowed suit retention; a ready-hand check examines whether non-winners are ready and may create transfers. Apply it here: thirteen waiting on five-characters are ready, but retaining the declared bamboo suit prevents a legal win even if the shape looks one tile short.','Agree on the scoring table before starting. A cap limits the scoring value; a root commonly means four copies of one tile meeting a bonus condition, not necessarily a declared kong; kong points are a separate score from a kong action. Root eligibility, kong refunds and ready-hand payments depend on the chosen table rules. This course demonstrates the missing-bamboo, self-draw and retirement flow without inventing a universal multiplier or using money.'],
    }};
    if(s.id==='mcr-turn')return {...s,title:words('国标案例：吃牌后还要检查起和条件','MCR example: recheck eligibility after a call'),body:{
      zh:['第一课已经介绍吃、碰、杠。本节只做一次判断：你有二筒三筒，上家刚打四筒，图示允许吃成二三四筒。吃完要从剩余手牌打一张，不再进行普通摸牌；这组三张仍算在整副牌里，不能既放在公开区又重复留在手牌中。','吃成一个顺子，只说明这组合法，不自动说明整副牌可以和。动作后重新检查其余牌组、等待的牌，以及不含花牌能否达到八番。某些计分条件取决于牌是否公开，所以不能沿用吃牌前的判断而不复核。',s.body.zh[1]],
      en:['Lesson 1 introduced chow, pung and kong. Apply them here: with two and three dots, you may chow the previous player’s fresh four dots. Discard from the remaining hand without an ordinary draw. The exposed three still belong to the hand; do not also count them as concealed tiles.','A legal sequence does not automatically make a legal winning hand. Recheck the remaining groups, wait and eight-point minimum excluding flowers. Some scoring conditions depend on whether groups are exposed, so reassess rather than reusing your pre-call result.',s.body.en[1]],
    }};
    return s;
  })]};
}
