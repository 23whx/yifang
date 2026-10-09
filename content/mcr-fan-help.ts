/** Beginner explanations, not scoring logic. MCR rules 3, 7, 19, 58, 60, 61, 63, 65, 77–79.
 * https://mahjong-europe.org/portal/images/docs/mcr_EN.pdf
 * Wait definitions: https://ooyamaneko.net/download/mahjong/mcr/MCR_2014_en.pdf */
export const mcrFanHelp: Record<string, {zh:string;en:string;tiles:string[];completingTile?:string}> = {
  'mcr-03': {
    zh:'绿一色：整副和牌只能用二条、三条、四条、六条、八条和发，不是任意条子都可以，也不能凭屏幕颜色猜。先认识“发”：它是中、发、白三种字牌中的一种，不是花牌。下图是一副完整十四张示例牌：二三四条、二三四条是两组顺子（同花色连续三张）；六六六条、八八八条是两组刻子（三张相同）；发发是对子（两张相同）。四组加一对，每张又都在允许名单内，所以构成绿一色，单独这一项是八十八番。即使没有发，只要整副合法和牌仍全部使用允许的条子，也可以成立；并非必须碰出四组。反例：把发发换成白白，仍是四组加一对，但白不在名单内，不能算绿一色。一条、五条、七条、九条也不允许。最终总分还要检查其它兼容番种和和牌方式，不能把示例牌的分数直接当成本局总分。',
    en:'All Green: every tile in the completed hand must be 2, 3, 4, 6 or 8 bamboo, or Green Dragon. Not every bamboo tile is allowed; use the names, not the screen colors. Green Dragon is one of the three dragons (Red, Green, White), not a flower. This complete fourteen-tile example has two 234-bamboo sequences (three consecutive numbers in one suit), two triplets (666 and 888 bamboo), and a Green Dragon pair (two identical tiles). That is four sets plus one pair, all on the allowed list: All Green contributes 88 MCR points. Green Dragon is optional if a legal hand uses only the allowed bamboo tiles; four exposed triplets are not required. Counterexample: replace the Green pair with a White pair. It is still four sets and a pair, but White is outside the list, so it is not All Green. Bamboo 1, 5, 7 and 9 are also excluded. Final points depend on other compatible features and the winning circumstances; the example is not your current score.',
    tiles:['二条','三条','四条','二条','三条','四条','六条','六条','六条','八条','八条','八条','发','发'],
  },
  'mcr-19': {
    zh:'七对：用十四张牌组成七个对子，不用找四个三张组。对子就是两张完全相同的牌。图中一万、三万、五筒、七筒、二条、九条各两张，已有六对；单独的东再配一个东才是第七对。不要把东和南凑在一起，它们不是同一种牌。本例没有吃、碰、杠；补齐后的七对是国标二十四番，但完整结算还要检查其他计分条件。',
    en:'Seven Pairs uses fourteen tiles in seven pairs, not four sets of three. A pair means two identical tiles. Below, 1 and 3 characters, 5 and 7 dots, and 2 and 9 bamboo already form six pairs. The lone East needs another East, not South. This example has no declared chow, pung or kong. Completed Seven Pairs is worth 24 MCR points; final settlement still needs all scoring checks.',
    tiles:['一万','一万','三万','三万','五筒','五筒','七筒','七筒','二条','二条','九条','九条','东'],completingTile:'东',
  },
  'mcr-07': {
    zh:'十三幺：“幺九牌”是三种花色的一和九；“字牌”是东南西北中发白。把这六种数字牌和七种字牌各收一张，再让其中一种多一张成对子，共十四张，不需要顺子或刻子。图中一万已有两张，但十三种必需的牌还缺白，所以要补白，不是再补一万。二到八的数字牌不能替代白。本例没有吃、碰、杠；补齐后的十三幺是国标八十八番。',
    en:'Thirteen Orphans needs each 1 and 9 in all three suits (six terminal kinds), plus East, South, West, North and all three dragons (seven honour kinds). Add one duplicate of any of those thirteen kinds for fourteen tiles. No sequences or triplets are needed. Below, 1 characters is already paired, but White Dragon is missing. Add White, not another 1 characters; a numbered 2 through 8 cannot replace it. This example has no declared sets. The completed pattern is worth 88 MCR points.',
    tiles:['一万','一万','九万','一筒','九筒','一条','九条','东','南','西','北','中','发'],completingTile:'白',
  },
  'mcr-77': {
    zh:'边张：一二等三，或八九等七，用缺的那张补成顺子。图中一万、二万还缺三万；二三等一或四则是两面，不是边张。国标计这一番还要求整副牌只等这一种牌，不能只看这个局部。',
    en:'Edge Wait: 12 needs 3, or 89 needs 7, to finish a sequence. Below, 1-2 characters need 3. A 2-3 shape can take 1 or 4: that is two-sided, not an edge. MCR also requires the whole hand to wait on only this tile kind.',
    tiles:['一万','二万'],completingTile:'三万',
  },
  'mcr-78': {
    zh:'嵌张：顺子中间缺一张。二筒和四筒之间缺三筒，补上才连续；二筒加五筒不是这个形状。国标计分还要检查整副牌没有其他种类的和牌张，不是看到两张隔一个数就自动加分。',
    en:'Closed Wait: the middle of a sequence is missing. Two and four dots need three dots; two and five do not make this shape. For MCR points, the whole hand must have no other winning tile kind. A local gap alone does not prove eligibility.',
    tiles:['二筒','四筒'],completingTile:'三筒',
  },
  'mcr-79': {
    zh:'单钓将（规则书也写作“单调将”）：其他四组已齐，只缺一张与单牌配成对子。例：留下一个南，等另一个南配对。这里“将”就是对子，不是中国象棋的将。国标计这一番要求整副牌只等这一种牌；本图只展示缺对子的部分。',
    en:'Single Wait: four sets are ready and a lone tile needs its matching partner. One South waits for another South to form the pair. MCR requires only this winning tile kind. This picture shows the pair portion, not the other four sets.',
    tiles:['南'],completingTile:'南',
  },
  'mcr-63': {
    zh:'平和（国标）：四组都是顺子，对子也是数字牌，整副牌没有东南西北中发白。顺子是同一种花色连续三个数，如图中的二三四万。只有一组顺子还不够；若对子是东东，也不符合。此项两番本身不能满足八番门槛，不能直接照搬日式平和的条件。',
    en:'All Chows (MCR): all four sets are sequences and the pair is numbered; there are no winds or dragons. A sequence has three consecutive numbers in one suit, like 234 characters below. One sequence is not enough; an East pair fails. Its two points alone do not meet the eight-point minimum. Do not import riichi pinfu rules.',
    tiles:['二万','三万','四万'],
  },
  'mcr-65': {
    zh:'双同刻：两种不同花色里，各有一组相同数字的刻子或杠。例：三三三万与三三三筒，数字都是三、花色不同，符合；三三三万与四四四筒不符合。图示只是整副牌中的两组，不是完整和牌。',
    en:'Double Pung: two triplets or kongs have the same number in different suits. Three 3-characters and three 3-dots qualify; 3-characters with 4-dots do not. The picture shows only two sets, not a complete winning hand.',
    tiles:['三万','三万','三万','三筒','三筒','三筒'],
  },
  'mcr-58': {
    zh:'和绝张：和牌用的是某种牌的第四张，另外三张已公开。例：桌上公开了三张三万，你用第四张三万和牌。别人手里的暗牌不算公开；也不是说牌墙只剩一张。',
    en:'Last Tile: win on the fourth copy when the other three are public. Example: three 3-characters are exposed; you win on the fourth. Hidden copies do not count. This does not mean the wall has one tile left.',
    tiles:['三万','三万','三万'],
  },
  'mcr-60': {
    zh:'圈风刻：本圈对应的风牌凑成刻子（三张相同）或杠（四张相同）。例：东风圈的东东东符合；只有一张东不符合。圈风看桌面提示，不是看你坐在哪边。',
    en:'Prevalent Wind: a triplet (three identical tiles) or kong (four) of the round wind. In an East round, East-East-East qualifies; one East does not. Read the round indicator, not your seat.',
    tiles:['东','东','东'],
  },
  'mcr-61': {
    zh:'门风刻：你本局座位对应的风牌凑成刻子或杠。例：你的门风是南，南南南符合。门风与圈风可能不同；先看自己的座位提示，再看牌。',
    en:'Seat Wind: a triplet or kong of your seat wind. If your seat is South, South-South-South qualifies. Your seat wind can differ from the round wind; check your seat indicator first.',
    tiles:['南','南','南'],
  },
};
