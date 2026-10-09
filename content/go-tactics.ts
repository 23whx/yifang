import { goExercises, pointAt } from './go-exercises';
import { newGo, playGo, type GoState } from '../lib/go/rules';
export interface GoTactic {
  id: string; title: [string,string]; black: string[]; white: string[];
  replayOnly?: boolean;
  line: {point:string; explanation:[string,string]}[];
  captures: number;
}
export const goTactics: GoTactic[] = [
  ...goExercises.filter(e=>e.category==='capture').map(e=>({id:e.id,title:e.title,black:e.black,white:e.white,line:[{point:e.target,explanation:e.explanation}],captures:Number(e.expected)})),
  {
    id:'atari-then-capture',title:['三步回放：叫吃后，对方没有救子','Three steps: atari, an ignored threat, capture'],
    black:['D5','E6'],white:['E5'],replayOnly:true,captures:1,
    line:[
      {point:'F5',explanation:['黑下 F5 后，白 E5 只剩 E4 一口气。“叫吃”就是一块棋只剩一口气，不是已经被提走。下一手轮白方，可以考虑救子。','Black F5 leaves White E5 with only E4. Atari means a string has one liberty, not that it is already captured. White moves next and can consider saving it.']},
      {point:'A9',explanation:['白方选择在远处 A9 落子，没有救 E5。这是本教学回放选定的一种合法应对，不是白方被迫这样走。E5 仍只有 E4 一口气；现在又轮到黑方。','White chooses A9 far away instead of saving E5. This is one chosen legal response, not a forced move. E5 still has only E4; it is now Black’s turn.']},
      {point:'E4',explanation:['黑占据 E4，白 E5 的最后一口气消失，提走 E5。黑方提子计数增加 1。这里仅完成局部提子目标，不能因此宣布整局获胜；整局仍需按约定规则比较得分。','Black fills E4, removes White E5’s last liberty and captures it. Black’s capture count increases by one. This achieves a local capture goal, not victory in the entire game; whole-game scoring is still separate.']},
    ],
  },
];
export function setupGoTactic(t:GoTactic):GoState {
  const state=newGo(9);
  for(const p of t.black) state.board[pointAt(p)]=1;
  for(const p of t.white) state.board[pointAt(p)]=2;
  state.history=[state.board.join('')];
  return state;
}
export function goReplay(t:GoTactic, cursor:number):GoState {
  if(!Number.isInteger(cursor)||cursor<0||cursor>t.line.length) throw new Error('Invalid replay step');
  let state=setupGoTactic(t);
  for(const step of t.line.slice(0,cursor)) {
    const next=playGo(state,pointAt(step.point));
    if(!next.state) throw new Error('Illegal authored replay');
    state=next.state;
  }
  return state;
}
