/** Remove call/draw markers before parsing; m1-23 still contains THREE tiles. */
export function riichiTileCodes(text:string){return [...text.replace(/[+\-=*_]/g,'').matchAll(/([mpsz])([1-9]+)/g)].flatMap(m=>[...m[2]].map(n=>m[1]+n));}

const explanations:Record<string,[string,string]>={
  '立直':['立直：门清听牌后支付 1,000 点并宣布立直。','Riichi: declared a ready closed hand with a 1,000-point deposit.'],
  'ダブル立直':['双立直：第一巡、无人鸣牌前就宣布立直。','Double riichi: declared on the first turn before any call.'],
  '一発':['一发：立直后、未被鸣牌打断的一巡内和牌。','Ippatsu: won within the uninterrupted turn after riichi.'],
  '門前清自摸和':['门前清自摸和：没有吃碰明杠，自己摸到和牌。','Closed self draw: no open calls; drew the winning tile.'],
  '平和':['平和：门清，四个顺子、非役牌对子，并以两面等待和牌。','Pinfu: closed hand, four sequences, a non-value pair and a two-sided wait.'],
  '断幺九':['断幺九：全部是 2—8 的数字牌，没有 1、9 或字牌。','All simples: only numbered tiles 2–8; no terminals or honors.'],
  '一盃口':['一杯口：门清，有两组完全相同的顺子。','Identical sequences: two matching sequences in a closed hand.'],
  '二盃口':['二杯口：门清，有两对完全相同的顺子。','Twice-identical sequences: two matching sequence pairs in a closed hand.'],
  '三色同順':['三色同顺：万、筒、条各有一组数字相同的顺子。','Mixed triple sequence: the same sequence in all three suits.'],
  '一気通貫':['一气通贯：同一花色的 123、456、789 三组顺子。','Pure straight: 123, 456 and 789 sequences in one suit.'],
  '混全帯幺九':['混全带幺九：每组和对子都含 1、9 或字牌，并含顺子和字牌。','Mixed outside hand: every group/pair includes a terminal or honor, with sequences and honors.'],
  '純全帯幺九':['纯全带幺九：每组和对子都含 1 或 9，含顺子而没有字牌。','Pure outside hand: every group/pair includes 1 or 9, with sequences and no honors.'],
  '七対子':['七对子：七种不同牌各两张，不是四组加一对。','Seven pairs: seven distinct pairs, instead of four groups and a pair.'],
  '対々和':['对对和：四组都是刻子或杠，不含顺子。','All triplets: all four groups are triplets or kongs.'],
  '三暗刻':['三暗刻：有三组未靠吃碰组成的暗刻或暗杠。','Three concealed triplets/kongs, completed without calling them.'],
  '三槓子':['三杠子：和牌中有三组杠。','Three kongs in the winning hand.'],
  '三色同刻':['三色同刻：万、筒、条各有一个数字相同的刻子。','Triple triplets: the same-number triplet in each suit.'],
  '混老頭':['混老头：全部是 1、9 和字牌。','All terminals and honors: no numbered tiles 2–8.'],
  '小三元':['小三元：两组龙牌刻子，加第三种龙牌作对子。','Little three dragons: two dragon triplets and the third dragon as the pair.'],
  '混一色':['混一色：只有一种数字花色，另有字牌。','Half flush: one numbered suit plus honors.'],
  '清一色':['清一色：全部是同一种数字花色，没有字牌。','Full flush: one numbered suit, no honors.'],
  '海底摸月':['海底摸月：摸到牌墙最后一张可摸牌时自摸。','Last live tile: won by drawing the final live-wall tile.'],
  '河底撈魚':['河底捞鱼：用最后一张弃牌荣和。','Last discard: won on the final discard.'],
  '嶺上開花':['岭上开花：开杠后的补牌正好完成手牌。','Replacement draw: the tile drawn after a kong completed the hand.'],
  '槍槓':['抢杠：别人加杠时，该牌正好能让你荣和。','Robbing a kong: won on another player’s added-kong tile.'],
  '天和':['天和：庄家最初发到的手牌就已和牌。','Heavenly hand: dealer wins with the initial hand.'],
  '地和':['地和：闲家在无人鸣牌前第一次摸牌就自摸。','Earthly hand: non-dealer wins on the first draw before calls.'],
  '国士無双':['国士无双：十三种 1、9 和字牌齐全，其中一种有一对。','Thirteen orphans: all thirteen terminal/honor types plus a duplicate.'],
  '国士無双十三面':['国士无双十三面：原本十三种各一张，任意一种都能完成对子。','Thirteen-sided orphans wait: any of the thirteen types completed the pair.'],
  '四暗刻':['四暗刻：四组暗刻或暗杠，另有一对。','Four concealed triplets/kongs and a pair.'],
  '四暗刻単騎':['四暗刻单骑：四组暗刻已齐，最后等对子。','Four concealed triplets on a single-pair wait.'],
  '大三元':['大三元：白、发、中都有刻子或杠。','Big three dragons: triplets/kongs of all three dragons.'],
  '大四喜':['大四喜：东南西北都有刻子或杠。','Big four winds: triplets/kongs of all four winds.'],
  '小四喜':['小四喜：三种风牌作刻子，第四种作对子。','Little four winds: three wind triplets and the fourth wind as the pair.'],
  '字一色':['字一色：全部由风牌和龙牌组成。','All honors: only winds and dragons.'],
  '緑一色':['绿一色：只用二、三、四、六、八条和发等绿色牌。','All green: only bamboo 2, 3, 4, 6, 8 and green dragons.'],
  '清老頭':['清老头：全部是数字牌的 1 和 9。','All terminals: only numbered tiles 1 and 9.'],
  '四槓子':['四杠子：四组杠加一对。','Four kongs and a pair.'],
  '九蓮宝燈':['九莲宝灯：门清同花色 1112345678999，再加该花色任一张。','Nine gates: closed 1112345678999 in one suit plus one extra tile of that suit.'],
  '純正九蓮宝燈':['纯正九莲宝灯：原本 1112345678999，九种牌均能完成。','Pure nine gates: all nine tiles could complete the base 1112345678999.'],
  'ドラ':['宝牌：额外加番；单靠宝牌不能获得和牌资格。','Dora: bonus han, not a qualifying yaku by itself.'],
  '裏ドラ':['里宝牌：立直和牌后的额外宝牌；不是独立的役。','Ura dora: hidden-indicator bonuses after riichi; not a qualifying yaku.'],
  '赤ドラ':['赤宝牌：红五的额外加番（本桌未启用红五）。','Red dora: red-five bonus (red fives are disabled at this table).'],
};
export function explainRiichiYaku(name:string,locale:'zh'|'en'){
  if(explanations[name])return explanations[name][locale==='zh'?0:1];
  const match=name.match(/^(場風|自風|翻牌) (.+)$/);
  if(match){const names:Record<string,string>={'東':'East','南':'South','西':'West','北':'North','白':'White dragon','發':'Green dragon','中':'Red dragon'};
    return locale==='zh'?`${match[1]==='場風'?'场风':match[1]==='自風'?'自风':'龙牌'} ${match[2]}：这种役牌组成了刻子或杠。`:`${match[1]==='場風'?'Round wind':match[1]==='自風'?'Seat wind':'Dragon'} ${names[match[2]]??match[2]}: a value-tile triplet or kong.`;}
  return locale==='zh'?`规则引擎确认的役：${name}（详细解释待补充）。`:`Engine-confirmed yaku: ${name} (detailed explanation not yet available).`;
}
const draws:Record<string,[string,string]>={
  '荒牌平局':['荒牌流局：可摸的牌已用完，没有人和牌。听牌是只差一张即可完成；本桌按听牌情况分配未听牌罚分。','Exhaustive draw: the live wall is empty. Ready hands need one tile to complete; payments depend on which players are ready.'],
  '流し満貫':['流局满贯：牌墙摸完，一位玩家只打出过 1、9 或字牌，而且没有被吃碰，按本桌规则获得满贯支付。','Nagashi mangan: at wall exhaustion, a player discarded only terminals/honors and none were claimed; the table awards mangan payments.'],
  '九種九牌':['九种九牌：最初摸牌时有至少九种不同的 1、9 或字牌，玩家选择中止重开。','Nine terminals/honors: at least nine distinct terminal/honor types on the first draw; the player chose to abort.'],
  '三家和':['三家和：同一张弃牌被三家同时宣布荣和，本桌判为中止流局。','Triple ron: three players claimed the same discard; this table aborts the hand.'],
  '四家立直':['四家立直：四位玩家都已立直，本桌中止本局。','Four riichi declarations: all four players declared; the table aborts the hand.'],
  '四風連打':['四风连打：无人鸣牌，四家第一张都打出同一种风牌，本桌中止本局。','Four identical winds: all four first discards were the same wind, with no calls; the hand aborts.'],
  '四開槓':['四杠中止：多人合计开了四杠，按本桌规则中止本局。','Four-kong abort: four kongs split across players end the hand under this preset.'],
};
export function explainRiichiDraw(name:string,locale:'zh'|'en'){return draws[name]?.[locale==='zh'?0:1]??(locale==='zh'?`中止原因：${name}`:`Hand ended: ${name}`);}

/** Use the awarded values, not a lookup: open hands and bonuses vary per win. */
export function explainRiichiAwards(awards:readonly {name:string;fanshu:number|string}[],locale:'zh'|'en'){
  const zh=locale==='zh';
  return awards.map(award=>{
    const bonus=['ドラ','裏ドラ','赤ドラ'].includes(award.name);
    const yakuman=typeof award.fanshu==='string'&&/^\*+$/.test(award.fanshu);
    const value=yakuman
      ? `${award.fanshu.toString().length} ${zh?'倍役满（特殊上限，不加入普通番数）':'yakuman (special limit, not added to ordinary han)'}`
      : `${award.fanshu} ${zh?'番':'han'}${bonus?(zh?'奖励；不能单独取得和牌资格':' bonus; cannot qualify a hand on its own'):(zh?'；属于和牌资格的役':'; qualifying yaku')}`;
    return `${explainRiichiYaku(award.name,locale)}\n${zh?'本次计入':'Awarded this hand'}：${value}`;
  }).join('\n');
}
