import type { GameSlug } from "./games";
type Pair = { zh: string; en: string };
export const winConditions: Record<GameSlug, { rule: Pair; example: Pair; practice: Pair }> = {
  go: {
    rule: { zh: "结束时，谁的总分高谁赢，不是看谁提走的棋子多。本站采用面积计分：确认死子并移除后，数自己的活棋子＋只被自己围住的空交叉点。白方另外加 7.5 分贴目，补偿黑方先走的优势。双方都不能独占的空点不计分，提掉的子不能再重复加分。", en: "The higher final score wins, not the larger capture count. Here we use area scoring: after agreeing and removing dead stones, count surviving stones plus empty intersections exclusively enclosed by your side. White adds 7.5 komi to compensate for moving second. Neutral points score for neither; do not add captures again." },
    example: { zh: "例：黑有 25 枚活子，围住 20 个空点，总分 45。白有 22 枚活子，围住 18 个空点，再加 7.5，总分 47.5。白以 2.5 分获胜。双方连续停一手只是进入死子与计分确认，并不是立刻判谁赢。", en: "Example: Black has 25 surviving stones and 20 enclosed points = 45. White has 22 stones and 18 points + 7.5 = 47.5. White wins by 2.5. Two consecutive passes start dead-stone review and scoring, not an automatic win." },
    practice: { zh: "本页的小练习只要求完成指定的数气、提子或判断禁入任务；完成一题不等于赢下一整盘。", en: "The exercises here ask you to count liberties, capture or recognise an illegal move. Solving one is not winning a full game." },
  },
  chess: {
    rule: { zh: "让对方的王被攻击，并且对方没有任何合法办法解除攻击，叫‘将死’，你就赢了。王不会被真的吃掉。不需要吃光对方所有棋子。对方认输也会结束对局。", en: "You win by checkmate: the opposing king is attacked and no legal move removes the attack. Kings are not actually captured; you need not capture everything. Resignation also ends a game." },
    example: { zh: "王被攻击但能逃到安全格，只是将军，尚未获胜。王没有被攻击却没有任何合法走法，叫逼和，是平局，不是你赢。", en: "If the attacked king can escape, it is only check, not victory. No legal move without check is stalemate, a draw rather than a win." },
    practice: { zh: "跟做开局时，完成规定的几步代表‘练习完成’；只有形成将死的局面才会解释将死获胜。", en: "Completing an opening sequence means exercise complete; only a mating position is a checkmate win." },
  },
  xiangqi: {
    rule: { zh: "让对方的将／帅受到攻击且没有合法办法解除，叫将死，攻击方获胜。中国象棋中，对方轮到走棋却完全没有合法走法，叫困毙，也判对方负；这一点与国际象棋不同。", en: "Checkmate wins: the opposing general is attacked with no legal escape. Having no legal move also loses in xiangqi even without check (stalemate), unlike chess." },
    example: { zh: "吃到对方一个车、炮，或者将军一次，都不代表已经赢。先确认对方是否还能移将、挡住攻击或吃掉攻击子。", en: "Capturing a rook or cannon, or giving one check, does not itself win. Check whether the opponent can move the general, block or capture the attacker." },
    practice: { zh: "跟做练习以理解指定着法为目标。是否将死，要检查最后局面的合法应对，不能只看练习进度条是否走完。", en: "Guided practice teaches the assigned moves. Decide whether the final position is mate by checking legal replies, not by the completion of a progress bar." },
  },
  shogi: {
    rule: { zh: "目标是将死对方的王：王正在被攻击，而且无论移动、吃子、挡住攻击，还是打入手里的持驹，都不能合法解围。不是比谁先把棋子升级，也不是比手里吃到的棋子多。", en: "The goal is checkmate: the opposing king is attacked and cannot legally escape by moving, capturing, blocking or dropping a piece in hand. Promoting first or capturing more pieces does not itself win." },
    example: { zh: "王被飞车攻击，但能在中间打入一枚持驹挡住，就还没将死。必须把这种防守可能也检查完。", en: "If a rook attacks the king but a piece can be dropped between them to block it, there is no mate yet. Drops must be considered when checking for an escape." },
    practice: { zh: "完成指定开局着法只代表练习完成；升变与打入是实现目标的手段。", en: "Finishing the assigned opening is exercise completion; promotion and drops are tools toward the goal." },
  },
  cube: {
    rule: { zh: "魔方没有对手，目标叫‘还原’：六个面各自全部同色，每个小块的位置和方向都与相邻中心色相配。只拼出一面，不算整个魔方完成。", en: "There is no opponent. The goal is a solved cube: all six faces each have one colour and every piece matches the adjacent centres in position and orientation. Solving one face is not solving the cube." },
    example: { zh: "白面拼齐后，如果侧面仍是杂色，只完成了局部。第一课的转动与逆转则只要求回到练习开始的还原态。", en: "A white face with mixed side colours is only partial progress. The first turning exercise simply asks you to return to its solved starting state." },
    practice: { zh: "每个分步练习只检查该步目标，不把播放一次公式当成完成任意打乱。", en: "Each exercise has a limited goal; playing an algorithm does not solve every scramble." },
  },
  mahjong: {
    rule: { zh: "先分清两件事：完成一手牌，和赢下整场。普通完成形是四组牌＋一对相同牌：同一花色连续三张叫顺子，三张相同叫刻子，两张相同叫一对。合法声明的杠是四张相同，也算一组，所以有杠时不能只数十四张。七对等特殊完成形另有规则。能否宣布胡牌／和牌，以及何时结束整场，必须看你选择的日式、国标或四川牌桌说明，不能混用。", en: "Separate winning a hand from winning a whole match. An ordinary completed hand has four sets and an identical pair: three consecutive tiles in one suit form a chow, three identical tiles a pung, and two identical tiles a pair. A legally declared kong has four identical tiles but counts as one set, so a hand with kongs is not simply fourteen tiles. Special shapes such as seven pairs have separate rules. Your selected Japanese, Chinese Official or Sichuan table determines whether you may declare a win and when play ends; do not mix their rules." },
    example: { zh: "一二三万／四五六万／二三四筒／六七八条／东东＝四个顺子＋一对，结构完成。国标番数、日麻役种不能省略后直接宣布通用胜利。", en: "Characters 123 / characters 456 / dots 234 / bamboo 678 / East-East gives four sequences and a pair. Do not ignore Chinese Official scoring or riichi yaku and claim a universal win." },
    practice: { zh: "固定的‘手把手操作课’暂不含杠，只教四组加一对；它的弹窗只表示‘牌型结构完成’，不等于赢下地区对局。随机自由练习和好友对战则按所选牌桌判定，结果弹窗解释实际胡牌与计分。四川血战中一人胡牌后，其余人还可能继续，这不代表整手已结束。", en: "The fixed guided exercise omits kongs and teaches only four sets and a pair. Its popup means structure complete, not a regional game won. Random free play and friend matches use the selected table's rules and explain actual wins and scoring. In Sichuan blood-battle play, others may continue after one player wins; that does not necessarily end the hand." },
  },
  holdem: {
    rule: { zh: "一手牌有两种赢法：其他人都弃牌、只剩你；或者最后摊牌时，你选出的最佳五张牌大于对方。不是把七张牌的数字加起来。若最佳五张完全相同，就平分底池。", en: "Win a hand when everyone else folds, or when your best five-card hand beats the opponent at showdown. Do not add the values of seven cards. Identical best-five hands split the pot." },
    example: { zh: "本例你有一对 A，对方有一对 Q；同是一对，先比较这一对的点数，A 大于 Q，所以你赢得底池。底池包含自己的投入，不全是净赚。", en: "Here your pair of aces beats the opponent's pair of queens, so you receive the pot. The pot includes your own contributions and is not all profit." },
    practice: { zh: "先按指引完成固定教学牌，再到实战页选择随机单挑或多人练习。每次都核对底池、返还和余额；多人全下时可能分出多个底池，每个底池只在有资格参与的人之间比较，不能把所有筹码一概给最大牌。所有筹码仅用于教学，不是实盘预测或收益保证。", en: "Complete the guided hand first, then choose random heads-up or multi-player practice on the play page. Check pot awards, refunds and balances. Multi-player all-ins can create separate pots, each compared only among eligible players; the best overall hand does not automatically receive every chip. All chips are for learning, not predictions or profit guarantees." },
  },
  baccarat: {
    rule: { zh: "先比较两手牌的最终点数：闲高则闲胜，庄高则庄胜，同点为和，9 点最大。你是否赢得教学筹码，还取决于事先选中了哪一种结果。选闲却开庄胜，这一笔就输了，即使你正确完成了练习。", en: "Compare the final hand totals: higher Player wins, higher Banker wins, equal totals tie; 9 is highest. Your teaching stake wins only if it matches your prior selection. Completing the exercise correctly does not turn a losing stake into a win." },
    example: { zh: "闲 8、庄 5，闲胜；事先选闲 10，返还本金 10＋奖励 10。若选庄则投入不退。庄或闲下注遇到和局退本金；选和且开和，本课按 8:1 计算奖励。", en: "Player 8 versus Banker 5 means Player wins. A Player stake of 10 returns 10 stake plus 10 winnings; a Banker stake loses. Player/Banker stakes push on tied hands; a successful Tie selection pays 8:1 here." },
    practice: { zh: "弹窗会分别说明牌的结果、你选的对象和教学余额，输局不会显示‘你赢了’。", en: "The popup distinguishes the card result, your selection and the teaching balance. Losing examples will not say you won." },
  },
};
