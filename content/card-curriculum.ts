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
          '用五张具体的牌试试：A♠、A♥、K♣、9♦、7♠ 是“一对 A”。把 A♥ 换成 Q♥，就没有对子了，这时按 A、K、Q、9、7 的顺序依次比高牌。同花顺里最大的是同一花色的 10、J、Q、K、A，叫“皇家同花顺”，它只是最大的同花顺，不是另一种牌型。',
          '如果两个人都是一对 A，就比剩下三张：先比最大的一张，一样再比第二张，再比最小的一张。例如 A、A、K、9、7 赢 A、A、Q、J、10，因为第一处不同是 K 大于 Q；不是把剩下三张加起来比。如果桌上公共牌已经是 A♠ K♠ Q♠ J♠ 10♠，两人都可以一张底牌不用，最强五张一模一样，就平分底池。'],
        en: [...ranks.body.en,
          'Try five real cards: A♠ A♥ K♣ 9♦ 7♠ is a pair of aces. Swap A♥ for Q♥ and the pair is gone, so you compare high cards in the order A, K, Q, 9, 7. The best straight flush is 10-J-Q-K-A of one suit, called a royal flush; it is simply the highest straight flush, not a separate hand type.',
          'If both players have a pair of aces, compare the other three cards: the highest first, then the next, then the lowest. A-A-K-9-7 beats A-A-Q-J-10 because the first difference is K over Q; you never add the kickers together. If the board already shows A♠ K♠ Q♠ J♠ 10♠, both players can use no hole cards at all, their best five are identical, and they split the pot.'],
      }},
      take('beginner-chips'), take('beginner-actions'),
      { ...streets, body: {
        zh: [...streets.body.zh,
          '上面是两人对局的顺序。三人或更多人时：翻牌前从大盲左边的人开始；之后每一轮从按钮左边第一个还没弃牌的人开始，按顺时针轮流，跳过已经弃牌或全下的人。每手结束后，按钮通常顺时针移给下一位。不要把两人对局“小盲先动”的规则套到多人的翻牌后。'],
        en: [...streets.body.en,
          'That is the two-player order. With three or more players: preflop starts with the player left of the big blind; every later round starts with the first player left of the button who is still in, going clockwise and skipping anyone who has folded or is all-in. After each hand the button usually moves one seat clockwise. Don\'t carry the two-player "small blind acts first" rule over to multiplayer rounds after the flop.'],
      }}, take('beginner-showdown'),
      { id: 'practice-check', title: { zh: '做完案例后，检查自己学会了什么', en: 'After the example: check what you learned' }, body: {
        zh: ['点页面顶部的“跟着操作练习”，把这一课串成完整的一手：认花色 → 交盲注 → 补 5 跟注 → 三次发公共牌并过牌 → 比一对 → 核对余额 110。每一步都说出自己为什么按这个按钮，而不是只记按钮位置。', '这一课还不是完整的比赛训练：自由加注、多人全下、边池分配和复杂的摊牌都还没练。“边池”是部分玩家额外放进去、只有出过这部分筹码的人才有资格争夺的那份筹码。先能讲清楚本例，再去练习页学别的牌型和底池资格。'],
        en: ['Use "Guided hands-on practice" at the top of the page to play the whole lesson as one hand: identify suits → post blinds → call the extra 5 → three community-card reveals with checks → compare the pairs → confirm the balance of 110. At each step, say why you chose that button rather than memorising where it is.', 'This lesson is not full match training yet: free raises, multiway all-ins, side-pot distribution and complicated showdowns are not covered. A side pot is the extra money put in by some players, which only those players are eligible to win. Be able to explain this example first, then move on to other hands and pot eligibility on the practice page.'],
      }},
    ] };
  }
  if (first.game !== 'baccarat') throw new Error(`Not a card course: ${first.game}`);
  const welcome = take('beginner-welcome');
  const draw = take('beginner-draw');
  return { ...first, title: { zh: '百家乐第一课：认牌、算点与模拟结算', en: 'Baccarat Lesson 1: Cards, Totals and Simulated Settlement' }, minutes: 40,
    description: { zh: '从认牌和个位计分开始，按固定流程放模拟筹码、发牌与结算，再跟着第二例学习补牌表。', en: 'Start with cards and single-digit totals, then follow a simulated stake, deal and settlement before the second drawing example.' }, steps: [
    { ...welcome, body: {
      zh: ['本课只教 Punto Banco 这一种固定补牌的百家乐：桌上两手牌最后比点数，点数高的赢，9 点最大，点数相同就是“和”。你之前选的结果有没有猜中，决定你的模拟筹码怎么结算。', ...welcome.body.zh],
      en: ['This lesson teaches only Punto Banco, which has fixed drawing rules. Two hands on the table compare their final totals: the higher total wins, 9 is the best, and equal totals are a tie. Whether your earlier pick matched that result decides how your practice chips are settled.', ...welcome.body.en],
    }}, take('beginner-playing-cards'), take('beginner-values'), take('beginner-wallet'),
    take('beginner-natural'), take('beginner-settlement'),
    { ...draw, title: { zh: '第二个案例：没有天然牌时怎样补牌', en: 'Second example: drawing without a natural' } },
    { id: 'drawing-reference', title: { zh: '补牌表：按顺序查，不是猜下一张', en: 'The drawing table: look it up in order' }, body: {
      zh: ['查表顺序：先看有没有天然牌，再看闲补不补；闲停牌时用上一节的简单规则。只有闲补了第三张，才查下面的庄家表。“补”只补一张，“停”就不再发。', take('draw').body.zh[1],
        '练习查两次：庄 4 点、闲第三张 2，2 在 2–7 之间，所以庄补；庄 4 点、闲第三张 8，不在范围内，所以庄停。第二个案例里庄 3 点、闲第三张 8，也是停：这里看的是那张 8，不是闲补牌后的总点数 3。',
        '补不补牌完全由规则决定，没有“要不要牌”或挑牌的策略。之前连续出现“庄、庄、闲”，也不能保证下一手是什么。本课只练读牌、查表和核对模拟结算；不要把其他免佣版本的赔率混进来。'],
      en: ['Look things up in this order: check for a natural, then whether Player draws; if Player stands, use the simple rule from the previous section. Only when Player has drawn a third card do you use the Banker table below. "Draw" means one more card; "stand" means no more.', take('draw').body.en[1],
        'Try two lookups: Banker 4 and Player\'s third card 2 — 2 is within 2–7, so Banker draws. Banker 4 and a third card of 8 — not in range, so Banker stands. In the second example, Banker 3 against a third card of 8 also stands: you look at that 8, not at Player\'s new total of 3.',
        'Drawing is decided entirely by the rules; there is no hit-or-stand choice and no picking cards. A run like Banker, Banker, Player says nothing about the next hand. This lesson only practises reading cards, looking up draws and checking the practice settlement; don\'t mix in payouts from no-commission versions.'],
    }},
  ] };
}
