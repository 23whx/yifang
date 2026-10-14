"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Board from "./Board";
import { loadFfish, type Ffish, type FfishBoard } from "@/lib/board/ffish";
import { Engine, LEVELS, engineAvailable } from "@/lib/board/engine";
import { boardUndoPlies } from "@/lib/board/undo";
import { VARIANTS, boardOrientation, type BoardGame as Game, type Side } from "@/lib/board/variants";
import type { Dict } from "@/lib/i18n";
import ResultDialog from "@/components/ui/ResultDialog";

interface Props {
  game: Game;
  dict: Dict;
  locale: "zh" | "en";
  compact?: boolean;
}

type Mode = "ai" | "local";
type LevelKey = keyof typeof LEVELS;

interface Snapshot {
  fen: string;
  legal: string[];
  checked: string[];
  over: boolean;
  result: string;
  inCheck: boolean;
}

function snap(b: FfishBoard): Snapshot {
  return {
    fen: b.fen(),
    legal: b.legalMoves().trim().split(" ").filter(Boolean),
    checked: b.checkedPieces().trim().split(" ").filter(Boolean),
    over: b.isGameOver(),
    result: b.result(),
    inCheck: b.isCheck(),
  };
}

export default function BoardGame({ game, dict, locale, compact }: Props) {
  const spec = VARIANTS[game];
  const ffish = useRef<Ffish | null>(null);
  const board = useRef<FfishBoard | null>(null);
  const engine = useRef<Engine | null>(null);
  const startFen = useRef("");

  const [ready, setReady] = useState(false);
  const [rulesFailed, setRulesFailed] = useState(false);
  const [rulesAttempt, setRulesAttempt] = useState(0);
  const [aiFailed, setAiFailed] = useState(false);
  const [notation, setNotation] = useState<number | undefined>(undefined);
  const [s, setS] = useState<Snapshot | null>(null);
  const [moves, setMoves] = useState<{ uci: string; san: string }[]>([]);
  const [modeChoice, setMode] = useState<Mode>("ai");
  const [human, setHuman] = useState<Side>("w");
  const [level, setLevel] = useState<LevelKey>("easy");
  const [flipped, setFlipped] = useState(false);
  const aiJob = useRef(0);
  // 服务端与首屏一致地视为不可用，挂载后按真实能力更新
  const engineOk = useSyncExternalStore(
    () => () => {},
    () => engineAvailable(),
    () => false
  );
  // Only state "no engine" once the browser has actually been checked; the prerendered page must not claim it.
  const probed = useSyncExternalStore(() => () => {}, () => true, () => false);
  const mode: Mode = engineOk ? modeChoice : "local";

  // 加载规则库
  useEffect(() => {
    let alive = true;
    loadFfish().then((f) => {
      if (!alive) return;
      ffish.current = f;
      board.current = new f.Board(game);
      startFen.current = board.current.fen();
      setNotation(f.Notation[spec.notation]);
      setS(snap(board.current));
      setReady(true);
    }).catch(() => { if (alive) { setRulesFailed(true); setReady(false); } });
    return () => {
      alive = false;
      // This is a generation counter, not a DOM ref: cleanup must invalidate the latest job.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      aiJob.current++;
      board.current?.delete();
      board.current = null;
      engine.current?.dispose();
      engine.current = null;
    };
  }, [game, spec.notation, rulesAttempt]);

  const refresh = useCallback(() => {
    if (board.current) setS(snap(board.current));
  }, []);

  const applyMove = useCallback(
    (uci: string) => {
      const b = board.current;
      if (!b) return false;
      const san = b.sanMove(uci, notation);
      if (!b.push(uci)) return false;
      setMoves((m) => [...m, { uci, san }]);
      refresh();
      return true;
    },
    [notation, refresh]
  );

  // 轮到 AI 时思考
  const turn: Side | null = s ? (s.fen.split(" ")[1] === "b" ? "b" : "w") : null;
  // 轮到电脑且棋局未结束，即处于思考状态；电脑出错后不再算思考，让玩家可以悔棋或重试
  const thinking = mode === "ai" && ready && s !== null && !s.over && turn !== null && turn !== human && !aiFailed;
  const undoPlies = boardUndoPlies(mode, human, turn, moves.length);

  useEffect(() => {
    if (!thinking || aiFailed) return;
    const job = ++aiJob.current;
    if (!engine.current) engine.current = new Engine(game);
    const played = moves.map((m) => m.uci);
    const currentEngine = engine.current;
    currentEngine.bestMove(startFen.current, played, LEVELS[level]).then((best) => {
      if (job !== aiJob.current) return;
      if (!best || best === '(none)' || !applyMove(best)) throw new Error('No valid engine move');
    }).catch(() => {
      if (job !== aiJob.current) return;
      currentEngine.dispose();
      if (engine.current === currentEngine) engine.current = null;
      setAiFailed(true);
    });
    // 以快照对象为依赖：新局/悔棋后即使 fen 相同也要重新触发搜索
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thinking, s, aiFailed]);

  const newGame = useCallback(
    (nextHuman?: Side) => {
      const b = board.current;
      if (!b) return;
      aiJob.current++;
      engine.current?.dispose(); engine.current = null; setAiFailed(false);
      b.setFen(startFen.current);
      setMoves([]);
      if (nextHuman) setHuman(nextHuman);
      refresh();
    },
    [refresh]
  );

  const undo = useCallback(() => {
    const b = board.current;
    if (!b || undoPlies === 0 || thinking) return;
    aiJob.current++;
    engine.current?.dispose(); engine.current = null; setAiFailed(false);
    // 人机模式撤回到轮到自己为止
    for (let i = 0; i < undoPlies; i++) b.pop();
    setMoves((m) => m.slice(0, m.length - undoPlies));
    refresh();
  }, [undoPlies, thinking, refresh]);

  const orientation = boardOrientation(mode, human, flipped);
  const movable: Side | undefined = !s || s.over || thinking ? undefined : mode === "local" ? turn ?? undefined : human;

  const status = useMemo(() => {
    if (rulesFailed) return locale === 'zh' ? '棋盘规则加载失败' : 'Board rules could not load';
    if (aiFailed) return locale === 'zh' ? '电脑暂时无法走棋，棋盘已保留' : 'The computer could not move; your board is retained';
    if (!s) return dict.board.loading;
    if (s.over) {
      if (s.result === "1/2-1/2") return dict.board.draw;
      const winner = s.result === "1-0" ? "w" : "b";
      return `${spec.sideName[winner][locale]} ${dict.board.wins}`;
    }
    if (thinking) return dict.board.thinking;
    const side = spec.sideName[turn!][locale];
    return `${side} ${dict.board.toMove}${s.inCheck ? " · " + dict.board.check : ""}`;
  }, [s, thinking, turn, dict, spec, locale, rulesFailed, aiFailed]);

  const pairs = useMemo(() => {
    const out: { n: number; w: string; b?: string }[] = [];
    for (let i = 0; i < moves.length; i += 2) out.push({ n: i / 2 + 1, w: moves[i].san, b: moves[i + 1]?.san });
    return out;
  }, [moves]);

  return (
    <div className={`grid gap-6 ${compact ? "" : "lg:grid-cols-[minmax(0,1fr)_300px]"}`}>
      {s?.over && <ResultDialog key={s.fen} locale={locale} title={status} reason={s.legal.length === 0 && s.inCheck ? (locale === "zh" ? "轮到走的一方的王／将正在被攻击，并且没有任何合法着法能够解除攻击，因此被将死。获胜方不需要吃光其它棋子。" : "The side to move is in check and has no legal move that removes the attack: checkmate. Capturing all other pieces is unnecessary.") : s.legal.length === 0 ? (locale === "zh" ? game === "chess" ? "轮到走的一方没有合法着法，但王没有被攻击，因此是逼和，双方平局。" : "轮到走的一方已经没有合法着法。此棋种无合法着法判负，而不是国际象棋的逼和平局。" : game === "chess" ? "No legal move, but the king is not in check: stalemate, a draw." : "The side to move has no legal move. This variant treats stalemate as a loss, not a chess draw.") : (locale === "zh" ? `规则引擎已判定终局，结果 ${s.result}。该局不是因无合法着法将死；可能涉及重复、行棋计数或其它棋种终局规则，当前接口未提供进一步的裁决原因。可关闭窗口查看棋谱。` : `The rules engine ended the game with result ${s.result}. This is not a no-legal-move checkmate; repetition, move counts or another variant rule may apply. The current interface does not provide a more specific adjudication reason. Review the move list.`)} />}
      <div className="min-w-0">
        <div className="mx-auto max-w-[640px]">
          {s ? (
            <Board
              spec={spec}
              fen={s.fen}
              orientation={orientation}
              movable={movable}
              legalMoves={s.legal}
              lastMove={moves[moves.length - 1]?.uci ?? null}
              checked={s.checked}
              onMove={applyMove}
              locale={locale}
            />
          ) : (
            <div className="grid place-items-center text-sm text-ink-3" style={{ aspectRatio: `${spec.files} / ${spec.ranks}` }}>
              {dict.board.loading}
            </div>
          )}
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-4 text-sm">
        <p className={`border-2 border-ink px-4 py-3 font-bold ${s?.over ? "bg-ochre" : ""}`}>{status}</p>
        {rulesFailed && <div role="alert" className="space-y-3 leading-7"><p>{locale==='zh'?'规则文件没有成功加载。请检查网络后重试；尚未开始新棋局。':'The rules files did not load. Check your connection and retry; no new game has started.'}</p><button className="btn-sign" onClick={()=>{setRulesFailed(false);setS(null);setReady(false);setRulesAttempt(n=>n+1);}}>{locale==='zh'?'重新加载棋盘':'Retry loading the board'}</button></div>}
        {aiFailed && <div role="alert" className="space-y-3 leading-7"><p>{locale==='zh'?'可能是引擎加载失败或响应超时。重试不会清空棋盘或棋谱；也可以悔棋，或切换同屏双人（会开始新局）。':'The engine may have failed to load or timed out. Retrying keeps the board and move list. You can also undo, or switch to local play (which starts a new game).'}</p><button className="btn-sign" onClick={()=>setAiFailed(false)}>{locale==='zh'?'保留棋盘，重试电脑走棋':'Retry computer move; keep board'}</button></div>}

        {/* 模式 */}
        <div className="grid grid-cols-2 border-2 border-ink font-bold">
          <button
            onClick={() => {
              if (engineOk) {
                setMode("ai");
                newGame();
              }
            }}
            disabled={!engineOk}
            className={`py-2.5 disabled:opacity-40 ${mode === "ai" ? "bg-ink text-paper" : "hover:bg-paper-2"}`}
          >
            {dict.board.vsAi}
          </button>
          <button
            onClick={() => {
              setMode("local");
              newGame();
            }}
            className={`border-l-2 border-ink py-2.5 ${mode === "local" ? "bg-ink text-paper" : "hover:bg-paper-2"}`}
          >
            {dict.board.local}
          </button>
        </div>
        {probed && !engineOk && <p className="text-xs leading-5 text-ink-3">{dict.board.noEngine}</p>}

        {mode === "ai" && (
          <>
            <div className="grid grid-cols-3 border-2 border-ink text-xs font-bold">
              {(Object.keys(LEVELS) as LevelKey[]).map((k, i) => (
                <button
                  key={k}
                  onClick={() => setLevel(k)}
                  className={`py-2 ${i > 0 ? "border-l-2 border-ink" : ""} ${level === k ? "bg-ochre" : "hover:bg-paper-2"}`}
                >
                  {dict.board.levels[k]}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 border-2 border-ink text-xs font-bold">
              {(["w", "b"] as Side[]).map((side, i) => (
                <button
                  key={side}
                  onClick={() => newGame(side)}
                  className={`py-2 ${i > 0 ? "border-l-2 border-ink" : ""} ${human === side ? "bg-ochre" : "hover:bg-paper-2"}`}
                >
                  {dict.board.playAs} {spec.sideName[side][locale]}
                </button>
              ))}
            </div>
          </>
        )}

        <div className="flex flex-wrap gap-2">
          <button onClick={() => newGame()} className="btn-sign">
            {dict.board.newGame}
          </button>
          <button onClick={undo} disabled={undoPlies === 0 || thinking} className="btn-sign btn-sign-outline disabled:opacity-40">
            {dict.board.undo}
          </button>
          <button onClick={() => setFlipped((v) => !v)} className="btn-sign btn-sign-outline">
            {dict.board.flip}
          </button>
        </div>

        {!compact && (
          <ol className="notation max-h-[320px] overflow-y-auto border-t-2 border-ink pt-2 text-[13px] leading-6">
            {pairs.map((p) => (
              <li key={p.n} className="grid grid-cols-[2.5em_1fr_1fr] gap-2 border-b border-rule">
                <span className="text-ink-3">{p.n}.</span>
                <span>{p.w}</span>
                <span>{p.b ?? ""}</span>
              </li>
            ))}
            {pairs.length === 0 && <li className="text-ink-3">{dict.board.noMoves}</li>}
          </ol>
        )}
      </div>
    </div>
  );
}
