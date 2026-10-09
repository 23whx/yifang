import type {McrRoundPlayerView,McrWinResult} from 'miaoda-game-mcr-mahjong-rules';

/** Final match outcome uses cumulative scores, never only the final hand's winner. */
export function mcrMatchResultReason(balances:readonly number[],locale:'zh'|'en'){
  const highest=Math.max(...balances);
  const seats=balances.flatMap((score,index)=>score===highest?[index+1]:[]);
  const names=seats.map(seat=>locale==='zh'?`座位 ${seat}`:`Seat ${seat}`).join(locale==='zh'?'、':', ');
  return locale==='zh'
    ?`十六手已经结束，四位都已确认结果。${names}${seats.length>1?'并列获胜':'获胜'}：累计 ${highest} 分，是全桌最高分。比较的是十六手累计分数，不是最后一手谁胡牌；这些只是游戏分数，不是真钱。`
    :`All 16 hands are finished and all four players have confirmed. ${names} ${seats.length>1?'tie for first place':'wins'} with ${highest} cumulative points, the highest score at the table. The match compares totals across all 16 hands, not who won the final hand. These are game points, not money.`;
}

/** Explain the actual winning route before the detailed fan and payment breakdown. */
export function mcrResultReason(win:McrWinResult|null,turnSource:McrRoundPlayerView['turnSource'],locale:'zh'|'en'){
  const zh=locale==='zh';
  if(!win)return zh?'牌墙已用完，没有人胡牌，本手为流局，四位都不加减分。':'The wall is exhausted without a winner. This hand is a draw; nobody gains or loses points.';
  const seat=win.winnerId.slice(-1),codes=win.analysis.fanCodes;
  let route:string;
  if(codes.includes('mcr-47'))route=zh?`座位 ${seat} 用别人正要加到明碰上的那张牌胡牌，这是“抢杠和”，不是胡普通弃牌。`:`Seat ${seat} won with the tile another player tried to add to an exposed pung. This is Robbing the Kong, not an ordinary discard win.`;
  else if(codes.includes('mcr-44'))route=zh?`座位 ${seat} 摸到牌墙最后一张普通牌并胡牌，这是“妙手回春”。`:`Seat ${seat} won by drawing the last ordinary tile from the wall (Last Tile Draw).`;
  else if(codes.includes('mcr-45'))route=zh?`别人摸出牌墙最后一张普通牌后将它打出，座位 ${seat} 用这张弃牌胡牌，这是“海底捞月”。`:`Another player discarded the last ordinary wall tile, and Seat ${seat} won on that discard (Last Tile Claim).`;
  else if(codes.includes('mcr-46'))route=zh?`座位 ${seat} 开杠后从牌墙补摸一张，并立即胡牌，这是“杠上开花”。`:`Seat ${seat} declared a kong, drew its replacement tile and immediately won (Out with Replacement Tile).`;
  else if(win.winMethod==='self-draw'&&turnSource==='flower-replacement')route=zh?`座位 ${seat} 亮出花牌并补摸一张，补来的牌完成胡牌；补花不算“杠上开花”。`:`Seat ${seat} exposed a flower and won on its replacement draw. Replacing a flower is not a kong-replacement win.`;
  else if(win.winMethod==='self-draw')route=zh?`座位 ${seat} 自己摸到完成牌型的牌并胡牌。`:`Seat ${seat} drew the tile that completed a winning hand.`;
  else route=zh?`座位 ${seat} 用别人刚打出的牌完成牌型并胡牌。`:`Seat ${seat} won with a tile another player just discarded.`;
  return route+(zh?'':' ')+(zh?`不含花牌的番数为 ${win.analysis.nonFlowerTotal} 分，达到八分起和门槛；已亮出的花牌另加 ${win.analysis.flowerPoints} 分。`:`The hand has ${win.analysis.nonFlowerTotal} non-flower points, meeting the eight-point minimum. Exposed flowers add ${win.analysis.flowerPoints} more.`);
}

/** Explain who pays the hand value without mislabeling a robbed added kong as a discard. */
export function mcrPaymentSourceReason(win:McrWinResult,locale:'zh'|'en'){
  const zh=locale==='zh';
  if(win.winMethod==='self-draw')return zh?'本手是自摸：赢家自己摸到完成牌型的牌。其余三人各自再支付整份牌值。':'This is self-draw: the winner drew the tile that completed the hand. Each of the other three players also pays the full hand value.';
  const from=win.discarderId?.slice(-1);
  if(win.analysis.fanCodes.includes('mcr-47'))return zh?`座位 ${from} 正要把一张牌加到已亮出的碰牌上组成杠，赢家抢这张牌胡牌。座位 ${from} 再支付整份牌值，另外两人只付基础 8 分；这不是普通弃牌。`:`Seat ${from} tried to add a tile to an exposed pung to make a kong, and the winner claimed that tile. Seat ${from} pays the full hand value; the other two pay only the base 8 points. This was not an ordinary discard.`;
  return zh?`座位 ${from} 打出完成赢家牌型的弃牌。只有座位 ${from} 再支付整份牌值，另外两人只付基础 8 分。`:`Seat ${from} discarded the tile that completed the winner’s hand. Only Seat ${from} pays the full hand value; the other two pay just the base 8 points.`;
}
