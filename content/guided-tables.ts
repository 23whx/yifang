import { exampleDeck, roundSteps, points, type Card } from "../lib/baccarat";
export type Text = { zh: string; en: string };
const t = (zh: string, en: string): Text => ({ zh, en });
export type Scene = { hand: string[]; other: string[]; shared: string[]; discarded?: string[]; balance?: number; opponentBalance?: number; committed?: number; pot?: number; selected?: Text };
export type GuidedStep = { title: Text; instruction: Text; options: Text[]; correct: number; feedback: Text; scene: Scene };
const step = (title: Text, instruction: Text, options: Text[], correct: number, feedback: Text, scene: Scene): GuidedStep => ({ title, instruction, options, correct, feedback, scene });
const cardText = (c: Card) => `${({ 1: "A", 11: "J", 12: "Q", 13: "K" } as Record<number, string>)[c.rank] ?? c.rank}${c.suit}`;
export const tileEnglish = (tile: string) => {
  const names: Record<string, string> = { 东: "East", 南: "South", 西: "West", 北: "North", 中: "Red Dragon", 发: "Green Dragon", 白: "White Dragon" };
  if (names[tile]) return names[tile];
  const rank = "一二三四五六七八九".indexOf(tile[0]) + 1;
  const suit: Record<string, string> = { 万: "Characters", 筒: "Dots", 条: "Bamboo" };
  return rank && suit[tile[1]] ? `${suit[tile[1]]} ${rank}` : tile;
};
const recognitionSteps = (scene: Scene): GuidedStep[] => [
  step(t("还没开始发牌：先认四种花色", "Before dealing: recognise the suits"), t("♠ 黑桃像尖叶，♥ 红桃像心，♣ 梅花像三片圆叶，♦ 方块像菱形。现在请亲手选出‘红桃 ♥’；花色是图案，不是数字。", "♠ spade: pointed leaf; ♥ heart: heart shape; ♣ club: three rounded leaves; ♦ diamond: diamond shape. Choose hearts ♥. A suit is a symbol, not a number."), [t("♣ 梅花", "♣ Clubs"), t("♥ 红桃", "♥ Hearts"), t("♦ 方块", "♦ Diamonds"), t("♠ 黑桃", "♠ Spades")], 1, t("红桃是心形 ♥。黑桃是尖叶 ♠，梅花 ♣ 有三个圆叶，方块 ♦ 是菱形。认错可以再试。", "Hearts use ♥. Spades use ♠, clubs ♣ and diamonds ♦. Try again."), scene),
  step(t("一张牌上有两个信息", "A card tells you two things"), t("A♠ 的 A 是点数名称，♠ 是黑桃花色。A♥ 与 A♠ 数字或字母相同，图案不同。它们相同的是什么？", "In A♠, A is the rank and ♠ is the spade suit. A♥ and A♠ have the same letter but different symbols. What do they share?"), [t("相同花色", "The same suit"), t("相同点数名称 A", "The same rank, Ace")], 1, t("两个都是 A，但一个红桃、一个黑桃，所以同点数，不同花色。", "Both are A, but one is hearts and the other spades: same rank, different suit."), scene),
];
export const baccaratCases = [t("第 1 局：选闲，学习返还与净增", "1 · Player win and net gain"), t("第 2 局：选闲，但本局和牌", "2 · Player selection, tied hands"), t("第 3 局：选庄，理解佣金", "3 · Banker win and commission"), t("第 4 局：选庄，理解损失", "4 · A losing Banker selection"), t("第 5 局：选和，理解 8:1", "5 · A Tie selection at 8:1")];
export function settleTeachingStake(selection: "player" | "banker" | "tie", p: number, b: number, stake: number) {
  if (p === b) return selection === "tie" ? stake * 9 : stake;
  if (selection === "tie") return 0;
  return selection === (p > b ? "player" : "banker") ? stake * (selection === "banker" ? 1.95 : 2) : 0;
}
export function baccaratGuide(caseIndex: number): GuidedStep[] {
  const selection = (["player", "player", "banker", "banker", "tie"] as const)[caseIndex];
  const example = [0, 1, 2, 0, 4][caseIndex];
  const label = selection === "player" ? t("闲", "Player") : selection === "banker" ? t("庄", "Banker") : t("和", "Tie");
  const frames = roundSteps(exampleDeck(example));
  const result: GuidedStep[] = [];
  const empty: Scene = { hand: [], other: [], shared: [], balance: 100, committed: 0 };
  if (caseIndex === 0) result.push(...recognitionSteps(empty));
  result.push(step(t("先选一项结果", "Select a result"), t(`本例请点击“${label.zh}”。这是安排好的教学选择，不代表它更容易赢。闲和庄是两手牌的名字，和表示同点。先选，之后才能放筹码。`, `Choose ${label.en} for this arranged example, not because it predicts a win. Player and Banker name the hands; Tie means equal totals. Select before committing chips.`), [t("闲", "Player"), t("庄", "Banker"), t("和", "Tie")], selection === "player" ? 0 : selection === "banker" ? 1 : 2, t("这里只是学习指定案例。请按提示选项；正式结果不能提前知道。", "Follow the indicated selection for this example. Real results are not known in advance."), empty));
  result.push(step(t("选择筹码数量", "Choose a stake"), t("已选好对象。现在选择 10 个教学筹码；它们没有金钱价值，余额此时仍是 100。", "Selection ready. Choose 10 teaching credits. They have no monetary value; your balance is still 100."), [t("5 筹码", "5 credits"), t("10 筹码", "10 credits"), t("20 筹码", "20 credits")], 1, t("本例按 10 计算，请选 10。选择数量还没有扣款。", "This example uses 10. Choosing the amount does not yet commit it."), { ...empty, selected: label }));
  result.push(step(t("确认后才扣出筹码", "Commit the stake"), t(`准备：${label.zh}，10 筹码。点确认后余额 100−10=90，已投入 10；发牌后不能改选。`, `Draft: ${label.en}, 10 credits. Confirming leaves 100−10=90 available and 10 committed. You cannot change after dealing.`), [t("确认模拟下注 10", "Confirm simulated stake of 10")], 0, t("确认把 10 从可用余额移到待结算投入。", "Confirmation moves 10 from available balance to the unsettled stake."), { ...empty, selected: t(`${label.zh} · 待确认 10`, `${label.en} · draft 10`) }));
  for (let i = 0; i < frames.length - 1; i++) {
    const frame = frames[i], next = frames[i + 1];
    const scene: Scene = { hand: frame.player.map(cardText), other: frame.banker.map(cardText), shared: [], balance: 90, committed: 10, selected: label };
    if (i === 4) result.push(step(t("你来计算闲的点数", "Calculate Player's total"), t("双方各有两张了。A=1，10/J/Q/K=0，其余按数字；加起来只保留个位。请算出左侧闲的点数。", "Both hands now have two cards. A=1; 10/J/Q/K=0; other cards use their rank. Add and keep the final digit. Find Player's total on the left."), Array.from({ length: 10 }, (_, n) => t(`${n} 点`, `${n} points`)), points(frame.player), t("把闲的两张牌值相加，超过 9 只看个位；不要把庄的牌加进来。", "Add only Player's card values and keep the last digit; do not include Banker's cards."), scene));
    const adding = next.player.length + next.banker.length > frame.player.length + frame.banker.length;
    result.push(step(t(adding ? "亲手发下一张" : "观察后继续判断", adding ? "Deal the next card" : "Inspect and continue"), { zh: `${frame.zh} 下一步：${adding ? "点发牌后观察新增牌的位置。" : "先读说明，再继续规则判断。"}`, en: `${frame.en} ${adding ? "Deal and observe which hand receives a card." : "Read the explanation before continuing."}` }, [t(adding ? "发下一张牌" : "继续判断", adding ? "Deal next card" : "Continue the rule check")], 0, next, scene));
  }
  const final = frames.at(-1)!;
  const p = points(final.player), b = points(final.banker);
  const base: Scene = { hand: final.player.map(cardText), other: final.banker.map(cardText), shared: [], balance: 90, committed: 10, selected: label };
  result.push(step(t("哪手点数更高？", "Compare the hands"), t(`闲 ${p} 点，庄 ${b} 点。这里问的是牌的结果，不是你下注选了什么。`, `Player ${p}, Banker ${b}. Identify the card result, regardless of your selection.`), [t("闲胜", "Player wins"), t("庄胜", "Banker wins"), t("和局", "Tie")], p === b ? 2 : p > b ? 0 : 1, t("同点就是和；不同点比较大小，9 最大。", "Equal totals tie; otherwise the larger total wins, with 9 highest."), base));
  const returned = settleTeachingStake(selection, p, b, 10), balance = 90 + returned;
  result.push(step(t("结算：本金与奖励分开看", "Settlement: stake versus winnings"), t(`你选${label.zh}，投入 10。本例应返还 ${returned}（含可退本金），所以余额 90+${returned}=${balance}，相对初始 100 变化 ${balance - 100}。庄胜奖励收 5% 佣金；庄闲遇和退本金；和选中按 8:1。请执行结算。`, `You selected ${label.en} with 10. Return ${returned}, including any returned stake: 90+${returned}=${balance}, net change ${balance - 100} from 100. Banker wins deduct 5% commission; Player/Banker stakes push on ties; Tie pays 8:1. Settle now.`), [t(`结算返还 ${returned}`, `Settle return of ${returned}`)], 0, t("返还数包含本金，净变化要用最终余额减初始 100。", "The return includes the stake; net change is final balance minus 100."), base));
  result.push(step(t("复核余额", "Check the balance"), t(`已投入清零，余额 ${balance}。请确认最终余额是多少，然后可切换下一案例；重开会恢复 100，不跨练习累计。`, `Committed stake is now zero and balance is ${balance}. Confirm the final balance. Reset restores 100; credits do not accumulate between exercises.`), [t(`${balance}`, `${balance}`), t(`${balance + 10}`, `${balance + 10}`)], 0, t("以余额栏为准，不要再把退回的本金重复加一次。", "Read the balance; do not add the returned stake twice."), { ...base, balance, committed: 0 }));
  return result;
}

export function holdemGuide(): GuidedStep[] {
  const result: GuidedStep[] = [];
  let scene: Scene = { hand: ["A♠", "K♠"], other: ["?", "?"], shared: [], balance: 100, opponentBalance: 100, pot: 0 };
  result.push(...recognitionSteps({ ...scene, hand: [], other: [] }));
  const add = (title: Text, instruction: Text, options: Text[], correct: number, feedback: Text) => result.push(step(title, instruction, options, correct, feedback, { ...scene, shared: [...scene.shared] }));
  add(t("你在按钮位，先交小盲", "You are on the button: post the small blind"), t("两人练习各有 100 教学筹码。你是按钮兼小盲，需交 5；对方大盲交 10。底牌只有你自己的可见。点按钮完成双方盲注。", "Both players have 100 credits. Heads-up you are button/small blind and post 5; the opponent posts 10. Only your own hole cards are visible. Post both blinds."), [t("交小盲 5；对方交大盲 10", "Post 5; opponent posts 10")], 0, t("盲注是规定投入，和牌好坏无关。", "Blinds are compulsory, regardless of hand strength."));
  scene = { ...scene, balance: 95, opponentBalance: 90, pot: 15 };
  add(t("跟注只补差额", "Call only the difference"), t("你已交 5，对方已交 10，还差 5。现在请选择跟注 5。过牌只能在没有待补金额时使用，本例不能过牌。", "You contributed 5 and the opponent 10, so you owe 5. Call 5. Checking is only available when nothing is owed."), [t("过牌", "Check"), t("跟注 5", "Call 5"), t("跟注 10", "Call 10")], 1, t("还有 5 待补，所以不能过牌。跟注只补差额 10−5=5，不是重新交完整的 10。请选跟注 5；答错不会扣款。", "You owe 5, so checking is unavailable. Call only the difference, 10−5=5, not another 10. Choose Call 5; an incorrect answer deducts nothing."));
  scene = { ...scene, balance: 90, pot: 20 };
  add(t("翻牌前行动结束", "Finish preflop"), t("双方各投入 10，底池 20。对方仍有加注机会，本案例选择不加注。现在才能发三张公共牌。", "Both contributed 10; pot 20. The opponent still has the option to raise but checks in this example. Now deal three shared cards."), [t("对方过牌，发翻牌三张", "Opponent checks; deal the flop")], 0, t("先结束当前行动轮，再发新牌。", "Complete the betting round before dealing."));
  for (const [nameZh, nameEn, cards] of [["翻牌", "Flop", ["A♥", "7♣", "2♦"]], ["转牌", "Turn", ["A♥", "7♣", "2♦", "9♠"]], ["河牌", "River", ["A♥", "7♣", "2♦", "9♠", "3♣"]]] as const) {
    scene = { ...scene, shared: [...cards] };
    add(t(`${nameZh}：对方先行动`, `${nameEn}: opponent acts first`), t("单挑翻牌后大盲先行动。本例对方没有下注，选择过牌；轮到你时无待补金额，也可以过牌。", "Heads-up the big blind acts first after the flop. Here the opponent checks without betting; you owe nothing and may check too."), [t("跟注 10", "Call 10"), t("过牌，不扣筹码", "Check without contributing")], 1, t("没有人下注，没有金额要跟。过牌不增加底池，也不退出。", "No bet is outstanding. Checking neither adds to the pot nor folds."));
    add(t(`${nameZh}行动完成`, `${nameEn} action complete`), t("你已过牌，双方余额仍为 90，底池仍为 20。检查数值没有变化，再进入下一阶段。", "You checked. Balances remain 90 each and the pot remains 20. Verify these numbers, then continue."), [t(nameZh === "河牌" ? "双方摊牌" : "发下一阶段公共牌", nameZh === "河牌" ? "Reveal both hands" : "Deal the next community card")], 0, t("过牌不会偷偷扣除筹码。", "Checking does not deduct chips."));
  }
  scene = { ...scene, other: ["Q♥", "Q♦"] };
  add(t("从七张里找最佳五张", "Find the best five of seven"), t("你有 A♠ K♠，公共牌 A♥ 7♣ 2♦ 9♠ 3♣：最佳五张 A♠ A♥ K♠ 9♠ 7♣ 是一对 A。对方一对 Q。谁赢？花色不分大小。", "Your best five are A♠ A♥ K♠ 9♠ 7♣, a pair of aces. The opponent has a pair of queens. Who wins? Suits have no ranking."), [t("对方，因为红桃更大", "Opponent: hearts rank higher"), t("我，一对 A 大于一对 Q", "Me: aces beat queens"), t("和局，都是一对", "Tie: both have a pair")], 1, t("同牌型还要比较组成点数，A 对大于 Q 对。", "Within the same hand type compare ranks: aces beat queens."));
  add(t("把底池交给获胜者", "Award the pot"), t("底池 20 包含你的 10 和对方的 10。全部转给你后是 90+20=110，净增 10。本例不收抽水。", "The pot includes 10 from you and 10 from the opponent. Awarding it gives 90+20=110, a net gain of 10. No rake in this example."), [t("领取底池 20", "Collect the 20-chip pot")], 0, t("总返还与净赚不是一回事。", "Total received is not the same as profit."));
  scene = { ...scene, balance: 110, pot: 0 };
  add(t("检查没有多出筹码", "Check conservation of chips"), t("你 110，对方 90，底池 0，总数仍是开局 200。你没有凭空获得 20 净利润。请选择净变化。", "You have 110, opponent 90, pot 0: total 200 as at the start. You did not gain 20 net. Choose your net change."), [t("净增加 20", "Net +20"), t("净增加 10", "Net +10")], 1, t("最终 110 减最初 100 等于 10。", "Final 110 minus initial 100 equals 10."));
  return result;
}

export function mahjongGuide(): GuidedStep[] {
  const initial = ["一万", "二万", "三万", "四万", "五万", "二筒", "三筒", "四筒", "六条", "七条", "八条", "东", "白"];
  const scene = (hand: string[], discarded: string[] = []): Scene => ({ hand, discarded, other: [], shared: [] });
  const discard = (hand: string[], name: string) => hand.filter(tile => tile !== name);
  const afterFirst = discard([...initial, "九筒"], "白"), afterSecond = discard([...afterFirst, "六万"], "九筒");
  return [
    step(t("先数手牌", "Count your tiles"), t("这是没有花牌、暂不吃碰杠的结构练习，不是国标或日麻完整计分局。轮到你摸牌前有十三张。点摸牌，得到九筒。", "This is a no-flower structural exercise without calls or kongs, not a complete scoring variant. You have thirteen tiles before your draw. Draw dot 9."), [t("摸一张：九筒", "Draw: dot 9")], 0, t("正常摸牌只增加一张。", "An ordinary draw adds one tile."), scene(initial)),
    step(t("十四张中亲手打掉白板", "Discard White Dragon from fourteen"), t("现在十四张。本案例保留已成的三张组和还差一张的组合，按提示打出孤立白板。下方每个按钮是一张手牌，请点“白”；不是点文字‘下一步’代替打牌。", "You now have fourteen. Preserve complete and nearly complete groups and discard the isolated White Dragon. Each button is a tile: choose White Dragon."), [...initial, "九筒"].map(x => t(x, tileEnglish(x))), initial.indexOf("白"), t("本案例需要保留东作为未来对子，按提示打白板。其他选择不一定在所有局面都坏，只是不走本教学路线。", "Keep East for this example's future pair and discard White Dragon. Other choices are not universally bad; they are outside this guided line."), scene([...initial, "九筒"])),
    step(t("弃牌后轮到其他三家", "The other three players take turns"), t("手牌回到十三张，白板进入弃牌区。其他三家依次摸打，案例不涉及吃碰。等他们完成后再摸六万，不是连续给自己摸两次。", "Your hand returns to thirteen and White Dragon enters the discard area. The other three players take draw-discard turns without calls. Only then do you draw character 6."), [t("其他三家完成；我摸六万", "Other turns complete; draw character 6")], 0, t("每次打牌后交出回合。", "Discarding passes the turn."), scene(afterFirst, ["白"])),
    step(t("四五六万成组，打出九筒", "Complete 4-5-6 characters; discard dot 9"), t("六万与四五万组成同花连续三张，叫顺子。此时仍有十四张，选择打九筒，不能因为成组就忘记打一张。", "Character 6 joins 4-5 to make a sequence in the same suit. You still have fourteen, so discard dot 9."), [...afterFirst, "六万"].map(x => t(x, tileEnglish(x))), afterFirst.indexOf("九筒"), t("这次保留刚组成的四五六万，按提示打九筒。", "Keep the completed 4-5-6 sequence and discard dot 9."), scene([...afterFirst, "六万"], ["白"])),
    step(t("再次等一轮，摸到东", "Wait another round, then draw East"), t("你有四组顺子和单独一张东，共十三张。其他三家行动后再摸到东，这两个东可以组成对子。", "You hold four sequences and one East, thirteen tiles. After the other turns, draw another East to form a pair."), [t("其他三家完成；我摸东", "Other turns complete; draw East")], 0, t("不是从弃牌区随便拿牌，这里是自己摸到。", "This is a draw, not taking an arbitrary discard."), scene(afterSecond, ["白", "九筒"])),
    step(t("拆成四组加一对", "Identify four sets and a pair"), t("请核对：一二三万／四五六万／二三四筒／六七八条／东东。最后两张东叫什么？这是结构完成，自摸；地区规则的起和条件需另查。", "Check characters 1-2-3 / 4-5-6 / dots 2-3-4 / bamboo 6-7-8 / East-East. What are the two East tiles? This self-drawn shape is complete; regional winning requirements still apply."), [t("顺子", "Sequence"), t("对子", "Pair"), t("刻子", "Triplet")], 1, t("两张相同是对子；三张相同才叫刻子。", "Two identical tiles form a pair; three form a triplet."), scene([...afterSecond, "东"], ["白", "九筒"])),
  ];
}
