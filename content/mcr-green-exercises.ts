import type {VariantExercise} from './mahjong-variants';
import {mcrFanHelp} from './mcr-fan-help';
const w=(zh:string,en:string)=>({zh,en});
const green=[...mcrFanHelp['mcr-03'].tiles];
const white=green.map(t=>t==='发'?'白':t);

export const mcrGreenExercises:VariantExercise[]=[
  {
    prompt:w('识别练习一：先把下方十四张分成二三四条、二三四条、六六六条、八八八条和发发。再逐张对照允许名单：二、三、四、六、八条和发。它符合绿一色吗？','Recognition exercise 1: group the fourteen tiles below as 234 bamboo, 234 bamboo, 666 bamboo, 888 bamboo and Green-Green. Check every tile against the allowed list: 2, 3, 4, 6, 8 bamboo and Green Dragon. Does it qualify as All Green?'),
    hand:green,after:[...green],choices:[w('不符合，因为顺子不能算','No: sequences are not allowed'),w('符合，分组完整且每张都在名单内','Yes: complete groups and every tile is allowed')],correct:1,
    hint:w('绿一色不要求全部都是刻子。先检查这两组顺子里的二、三、四条是否都在允许名单内。','All Green does not require all triplets. Check whether 2, 3 and 4 bamboo in each sequence are all allowed.'),
    explanation:w('符合。两组顺子、两组刻子和一个对子组成完整和牌，每张也都在绿一色名单内。这项计八十八番。这里只做牌型识别，没有下注、扣分或真实对局结算。点击下一步才进入反例，当前牌保留供你核对。','Yes. Two sequences, two triplets and a pair form a complete hand, and every tile is allowed for All Green. This feature is worth 88 points. This is recognition practice, not a bet, score deduction or actual game settlement. The hand stays visible; only Next step opens the counterexample.'),
  },
  {
    prompt:w('识别练习二：这次对子变成了白白，其余十二张不变。先检查是否还是四组加一对，再判断能否继续算绿一色。','Recognition exercise 2: the pair is now White-White; the other twelve tiles are unchanged. Check whether four sets and a pair remain, then decide whether All Green still applies.'),
    hand:white,after:[...white],choices:[w('仍是完整和牌形，但不能算绿一色','Still a complete hand shape, but not All Green'),w('所有字牌都允许，所以仍是绿一色','All honors are allowed, so still All Green')],correct:0,
    hint:w('发和白是不同的字牌。绿一色的允许名单里只有发，不是所有字牌；牌型完整与某项番种成立是两个问题。','Green and White are different dragons. Only Green is on this list, not every honor. A complete hand shape and a particular scoring feature are separate questions.'),
    explanation:w('四组加一对没有被破坏，但白不在允许名单内，因此不能算绿一色。不能把“不符合绿一色”误认为“一定不能和牌”；实际能否和还要检查本局规则与其它番种。本练习保留白白这副反例，不会偷偷换回发发。','The four sets and pair remain, but White is not allowed for All Green. Losing this feature does not automatically mean the hand cannot win: the actual rules and other scoring features still matter. This exercise retains the White-pair counterexample; it does not silently replace it with Green.'),
  },
];
