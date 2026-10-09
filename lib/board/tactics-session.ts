import type { FfishBoard } from './ffish';
import type { TacticalLesson } from '../../content/board/tactics';

export class TacticsSession {
  mode: 'practice' | 'replay' = 'practice';
  cursor = 0;
  attempted = false;
  won = false;
  lastMove: string | null = null;
  private reply: string | null = null;
  private closed = false;
  // Ownership transfers at construction, including when initialization fails.
  constructor(private board: FfishBoard, readonly lesson: TacticalLesson) {
    try { this.reset(); }
    catch(error) { this.close(); throw error; }
  }
  snapshot() {
    return { fen: this.board.fen(), legal: this.board.legalMoves().trim().split(/\s+/).filter(Boolean),
      checked: this.board.checkedPieces().trim().split(/\s+/).filter(Boolean), turn: this.board.turn() ? 'w' as const : 'b' as const,
      mode: this.mode, cursor: this.cursor, attempted: this.attempted, won: this.won, lastMove: this.reply ?? this.lastMove,
      replyVisible: this.reply !== null,
      inCheck: this.board.isCheck() };
  }
  reset(mode: 'practice' | 'replay' = 'practice') {
    if(this.closed) return;
    this.board.setFen(this.lesson.fen); this.mode=this.lesson.replayOnly?'replay':mode; this.cursor=0;
    this.attempted=false; this.won=false; this.lastMove=null; this.reply=null;
  }
  attempt(move: string) {
    if(this.closed || this.mode!=='practice' || this.attempted || !this.snapshot().legal.includes(move)) return false;
    if(!this.board.push(move)) return false;
    this.attempted=true; this.lastMove=move;
    // A valid alternate mate is accepted, not compared against a single answer string.
    this.won=this.board.isCheck() && this.board.isGameOver() && this.board.result()===this.lesson.result;
    return true;
  }
  step(direction: -1 | 1) {
    if(this.closed || this.mode!=='replay') return false;
    if(direction===-1) {
      if(this.cursor===0) return false;
      this.board.pop(); this.cursor--;
    } else {
      const move=this.lesson.line[this.cursor]?.move;
      if(!move || !this.snapshot().legal.includes(move) || !this.board.push(move)) return false;
      this.cursor++;
    }
    this.lastMove=this.lesson.line[this.cursor-1]?.move ?? null;
    return true;
  }
  // One legal counterexample is enough to disprove mate. This is not a best-move engine.
  showReply() {
    if(this.closed || this.mode!=='practice' || !this.attempted || this.won || this.reply) return false;
    const move=this.snapshot().legal[0];
    if(!move || !this.board.push(move)) return false;
    this.reply=move;
    return true;
  }
  hideReply() {
    if(this.closed || !this.reply) return false;
    this.board.pop(); this.reply=null;
    return true;
  }
  close() { if(!this.closed) { this.closed=true; this.board.delete(); } }
}
