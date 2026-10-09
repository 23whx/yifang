import type { Tutorial, TutorialStep } from './tutorials';

/** One explanation per concept; the existing guided tables remain separate practice. */
export function cardCurriculum(first: Tutorial): Tutorial {
  const take = (id: string): TutorialStep => {
    const step = first.steps.find(s => s.id === id);
    if (!step) throw new Error(`Missing ${first.slug}/${id}`);
    return step;
  };
  if (first.game === 'holdem') {
    const ranks = take('beginner-ranks');
    const streets = take('beginner-streets');
    return { ...first, title: { zh: '德州扑克第一课：认牌、行动与比牌', en: "Texas Hold’em Lesson 1: Cards, Actions and Showdown" }, minutes: 45,
      description: { zh: '先认牌张与牌型，再理解筹码和行动；跟做一手固定案例，最后核对胜负与余额。', en: 'Recognise cards and hands, learn chips and actions, then follow a fixed hand and verify its result and balance.' }, steps: [
      take('beginner-welcome'), take('beginner-playing-cards'),
      { ...ranks, body: {
        zh: [...ranks.body.zh,
          '先用五张具体牌检验：A♠、A♥、K♣、9♦、7♠ 是一对 A；把第二张换成 Q♥ 后不再有对子，要按 A、K、Q、9、7 依次比较高牌。同花顺的最高一种是同花色的 10、J、Q、K、A，称皇家同花顺，不是额外一类牌型。',
          '两人都是一对 A 时，先比较余下三张中的最高张，再比次高张，最后比最小张。例如 A、A、K、9、7 胜 A、A、Q、J、10，因为先比较的 K 大于 Q；不能把后三张相加。若桌面已有 A♠ K♠ Q♠ J♠ 10♠，双方都可以不用底牌，最佳五张完全相同，平分底池。'],
        en: [...ranks.body.en,
          'Inspect five cards: A♠ A♥ K♣ 9♦ 7♠ form a pair of aces. Replacing A♥ with Q♥ removes the pair; compare high cards in the order A, K, Q, 9, 7. The highest straight flush is suited 10-J-Q-K-A, called a royal flush, not an additional hand category.',
          'When both have a pair of aces, compare their three remaining cards from highest to lowest. A-A-K-9-7 beats A-A-Q-J-10 because K beats Q at the first difference; do not add the kickers. With A♠ K♠ Q♠ J♠ 10♠ on the board, both can use no hole cards and share the same best five, splitting the pot.'],
      }},
      take('beginner-chips'), take('beginner-actions'),
      { ...streets, body: {
        zh: [...streets.body.zh,
          '上面是两人的行动顺序。三人或更多人时，翻牌前从大盲左侧开始，之后每轮从按钮左侧仍未弃牌的人开始，按座位顺时针行动，跳过已弃牌或已全下的人。每手结束按钮通常顺时针移到下一位；不要把单挑“小盲先动”的口诀套到多人翻牌后。'],
        en: [...streets.body.en,
          'The example is heads-up. With three or more players, preflop action starts left of the big blind; later rounds start with the active player left of the button. Act clockwise, skipping folded or all-in players. The button normally moves clockwise for the next hand. Do not apply the heads-up small-blind-first rule to multiplayer postflop action.'],
      }}, take('beginner-showdown'),
      { id: 'practice-check', title: { zh: '做完案例后，检查你真正会了什么', en: 'After the example: check what you learned' }, body: {
        zh: ['点击页首“跟着操作练习”，把本课串成一手：认花色 → 交盲注 → 补 5 跟注 → 三次公共牌与过牌 → 比一对 → 核对余额 110。每步说明自己为什么按这个按钮，不要只记按钮位置。', '本课不是完整比赛训练：你还没有练习自由加注、多方全下、边池分配或复杂摊牌。边池是部分玩家额外投入、只有相应出资者有资格争夺的筹码池。先会解释本例，再到练习页学习其他牌型与底池资格；不会这些时不要把本课完成当成已掌握全部规则。'],
        en: ['Use “Guided hands-on practice” at the top to connect the lesson: identify suits, post blinds, call the extra 5, follow three board reveals and checks, compare pairs, and verify balance 110. Explain each action rather than memorising button positions.', 'This is not complete match training: free raises, multiway all-ins, side-pot distribution and complex showdowns are not practised here. A side pot holds additional contributions contested only by eligible contributors. Explain this example first, then practise other hands and pot eligibility; completing the lesson does not mean mastering every rule.'],
      }},
    ] };
  }
  if (first.game !== 'baccarat') throw new Error(`Not a card course: ${first.game}`);
  const welcome = take('beginner-welcome');
  const draw = take('beginner-draw');
  return { ...first, title: { zh: '百家乐第一课：认牌、算点与模拟结算', en: 'Baccarat Lesson 1: Cards, Totals and Simulated Settlement' }, minutes: 40,
    description: { zh: '从认牌和个位计分开始，按固定流程放模拟筹码、发牌与结算，再跟着第二例学习补牌表。', en: 'Start with cards and single-digit totals, then follow a simulated stake, deal and settlement before the second drawing example.' }, steps: [
    { ...welcome, body: {
      zh: ['本课只教 Punto Banco 这一种固定补牌规则：两手牌最后比点数，较高的一手胜，9 点最高，同点为和；你选择的结果是否命中，再决定模拟筹码如何结算。', ...welcome.body.zh],
      en: ['This course teaches Punto Banco with fixed drawing rules. Compare the final totals: higher wins, 9 is highest, and equal totals tie. Whether your earlier selection matches that result determines the teaching-credit settlement.', ...welcome.body.en],
    }}, take('beginner-playing-cards'), take('beginner-values'), take('beginner-wallet'),
    take('beginner-natural'), take('beginner-settlement'),
    { ...draw, title: { zh: '第二个案例：没有天然牌时怎样补牌', en: 'Second example: drawing without a natural' } },
    { id: 'drawing-reference', title: { zh: '按顺序查表，而不是猜下一张', en: 'Use the table in order, not a prediction' }, body: {
      zh: ['先检查天然牌，再决定闲是否补牌；闲停牌时用上一节的简单规则。只有闲已补第三张时，才查下面的庄家表。“补”只补一张，“停”不再发。', take('draw').body.zh[1],
        '练习查两次：庄 4、闲第三张 2，2 落在 2–7，所以庄补；庄 4、闲第三张 8，不在范围，所以庄停。第二个案例庄 3、闲第三张 8 也停：这里查的是那张 8，不是闲补后总点数 3。',
        '补牌由规则决定，不存在选择加牌或挑牌的策略。过去出现“庄、庄、闲”的顺序不保证下一手是什么。本课只训练读牌、查表和核对虚拟结算；不同免佣版本的结算不能混用。'],
      en: ['Check naturals first, then whether Player draws. If Player stands, use the simpler rule in the previous section. Consult this Banker table only after Player draws a third card. Draw means one extra card; stand means none.', take('draw').body.en[1],
        'Try two lookups: Banker 4 with Player third-card 2 draws because 2 lies in 2–7. Banker 4 with Player third-card 8 stands because 8 does not. In the second example, Banker 3 against third-card 8 also stands: use that 8, not Player’s new total of 3.',
        'Drawing follows rules, not a hit/stand or card-selection strategy. A previous sequence of Banker, Banker, Player does not guarantee the next result. Practise reading cards, looking up draws and checking virtual settlement; do not mix payouts from other no-commission variants.'],
    }},
  ] };
}
