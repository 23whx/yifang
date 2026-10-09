"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FILES, parseFen, parseUci, squareName, squareToXY, type Piece, type Side, type VariantSpec } from "@/lib/board/variants";

export const HAND_NAMES: Record<string, { zh: string; en: string }> = {
  r: { zh: '飞车', en: 'Rook' }, b: { zh: '角行', en: 'Bishop' },
  g: { zh: '金将', en: 'Gold' }, s: { zh: '银将', en: 'Silver' },
  n: { zh: '桂马', en: 'Knight' }, l: { zh: '香车', en: 'Lance' },
  p: { zh: '步兵', en: 'Pawn' },
};

interface Props {
  spec: VariantSpec;
  fen: string;
  /** 底边是哪一方 */
  orientation: Side;
  /** 当前允许操作的一方；undefined 表示只看不动 */
  movable?: Side;
  legalMoves?: string[];
  lastMove?: string | null;
  /** 被将军的格子（ffish checkedPieces） */
  checked?: string[];
  onMove?: (uci: string) => void;
  className?: string;
  locale?: "zh" | "en";
}

/** 通用棋盘：8×8 / 9×9 格子或 9×10 交叉点，字形棋子，点选走子，持驹区 */
export default function Board({ spec, fen, orientation, movable, legalMoves = [], lastMove, checked = [], onMove, className, locale = "zh" }: Props) {
  const { grid, hands, turn } = useMemo(() => parseFen(fen, spec), [fen, spec]);
  // 选中状态绑定到当前 fen：局面一变自动失效，不需要 effect 清理
  const [sel, setSel] = useState<{ fen: string; sq: string | null }>({ fen, sq: null }); // sq 为格名或 "drop:p"
  const [ch, setCh] = useState<{ fen: string; c: { to: string; options: string[] } | null }>({ fen, c: null });
  const selected = sel.fen === fen ? sel.sq : null;
  const chooser = ch.fen === fen ? ch.c : null;
  const setSelected = (sq: string | null) => setSel({ fen, sq });
  const setChooser = (c: { to: string; options: string[] } | null) => setCh({ fen, c });
  const wrap = useRef<HTMLDivElement>(null);
  const [cell, setCell] = useState(48);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setCell(e.contentRect.width / spec.files));
    ro.observe(el);
    return () => ro.disconnect();
  }, [spec.files]);

  const last = lastMove ? parseUci(lastMove) : null;
  const canMove = movable !== undefined && movable === turn;

  const targets = useMemo(() => {
    if (!selected) return new Set<string>();
    const set = new Set<string>();
    for (const m of legalMoves) {
      const p = parseUci(m);
      if (selected.startsWith("drop:")) {
        if (p.drop === selected.slice(5)) set.add(p.to);
      } else if (p.from === selected) set.add(p.to);
    }
    return set;
  }, [selected, legalMoves]);

  const clickSquare = (sq: string, piece: Piece | null) => {
    if (!canMove) return;
    if (chooser) setChooser(null);
    if (selected && targets.has(sq)) {
      const options = legalMoves.filter((m) => {
        const p = parseUci(m);
        return p.to === sq && (selected.startsWith("drop:") ? p.drop === selected.slice(5) : p.from === selected);
      });
      if (options.length === 1) {
        onMove?.(options[0]);
        setSelected(null);
      } else {
        setChooser({ to: sq, options });
      }
      return;
    }
    if (piece && piece.side === turn) setSelected(selected === sq ? null : sq);
    else setSelected(null);
  };

  const clickHand = (side: Side, type: string) => {
    if (!canMove || side !== turn) return;
    const key = `drop:${type}`;
    setSelected(selected === key ? null : key);
  };

  // 渲染顺序：orientation 一方在底部
  const rankOrder = Array.from({ length: spec.ranks }, (_, i) => (orientation === "w" ? spec.ranks - 1 - i : i));
  const fileOrder = Array.from({ length: spec.files }, (_, i) => (orientation === "w" ? i : spec.files - 1 - i));

  const pieceSize = cell * (spec.game === "chess" ? 0.78 : 0.62);
  const discSize = cell * 0.84;

  const renderHand = (side: Side) => {
    if (!spec.hands) return null;
    const list = hands[side];
    const counts = new Map<string, number>();
    for (const t of list) counts.set(t, (counts.get(t) ?? 0) + 1);
    const order = ["r", "b", "g", "s", "n", "l", "p"];
    return (
      <div className={`flex min-h-[44px] flex-wrap items-center gap-2 py-2 ${side === orientation ? "" : "justify-end"}`}>
        <span className="w-full text-sm text-ink-3">{spec.sideName[side][locale]} · {locale === 'zh' ? '持驹（吃来后可放回棋盘的棋子）' : 'Pieces in hand (captured pieces you can place on the board)'}</span>
        {counts.size === 0 && <span className="text-sm text-ink-3">{locale === 'zh' ? '暂无持驹' : 'No pieces in hand'}</span>}
        {order
          .filter((t) => counts.has(t))
          .map((t) => {
            const key = `drop:${t}`;
            const active = selected === key && side === turn;
            const available = canMove && side === turn && legalMoves.some(m => parseUci(m).drop === t);
            const name = HAND_NAMES[t][locale];
            return (
              <button
                key={t}
                onClick={() => clickHand(side, t)}
                disabled={!available}
                aria-pressed={active}
                aria-label={`${spec.sideName[side][locale]} · ${name} × ${counts.get(t)}${available ? (locale === 'zh' ? '，选择后点击标出的空格打入' : ', select then choose a highlighted empty square to drop') : (locale === 'zh' ? '，当前不可打入' : ', cannot drop now')}`}
                className={`relative flex min-h-11 items-center justify-center gap-2 border-2 px-3 py-2 font-bold transition disabled:cursor-default disabled:opacity-70 ${
                  active ? "border-vermilion bg-ochre" : "border-ink bg-paper"
                }`}
              >
                <span aria-hidden="true" className={`text-xl ${side !== orientation && spec.rotateSecond ? "rotate-180" : ""}`}>
                {spec.glyph({ type: t, side, promoted: false })}
                </span>
                <span className="text-sm">{name} × {counts.get(t)}</span>
              </button>
            );
          })}
        {canMove && side === turn && counts.size > 0 && <p className="w-full text-sm leading-6">{locale === 'zh' ? '先选一枚持驹，再点棋盘上标出的空格，这叫“打入”；不是从棋盘上移动已有棋子。灰色按钮表示当前不能打入。' : 'Select a piece in hand, then a highlighted empty square: this is a drop, not moving a piece already on the board. Dimmed buttons cannot be used now.'}</p>}
      </div>
    );
  };

  return (
    <div className={`${className ?? ""} pl-6`}>
      {renderHand(orientation === "w" ? "b" : "w")}
      <div ref={wrap} className="relative select-none" style={{ aspectRatio: `${spec.files} / ${spec.ranks}` }}>
        <div className="pointer-events-none absolute -left-6 top-0 grid h-full w-5 text-center text-xs font-bold text-ink" style={{ gridTemplateRows: `repeat(${spec.ranks}, 1fr)` }} aria-label={locale === "zh" ? "行坐标" : "Rank coordinates"}>
          {rankOrder.map(r => <span key={r} className="self-center">{r + 1}</span>)}
        </div>
        {/* 底图 */}
        {spec.intersections ? (
          <XiangqiLines files={spec.files} ranks={spec.ranks} />
        ) : (
          <SquareLines files={spec.files} ranks={spec.ranks} checker={spec.game === "chess"} />
        )}

        {/* 格子层 */}
        <div
          className="absolute inset-0 grid"
          style={{ gridTemplateColumns: `repeat(${spec.files}, 1fr)`, gridTemplateRows: `repeat(${spec.ranks}, 1fr)` }}
        >
          {rankOrder.map((r) =>
            fileOrder.map((f) => {
              const sq = squareName(f, r);
              const piece = grid[r][f];
              const isSel = selected === sq;
              const isTarget = targets.has(sq);
              const isLast = last && (last.from === sq || last.to === sq);
              const isChecked = checked.includes(sq);
              const rotate = spec.rotateSecond && piece?.side === (orientation === "w" ? "b" : "w");
              return (
                <button
                  key={sq}
                  onClick={() => clickSquare(sq, piece)}
                  aria-label={sq}
                  className="relative flex items-center justify-center focus:outline-none"
                  style={{ cursor: canMove && (piece?.side === turn || isTarget) ? "pointer" : "default" }}
                >
                  {isLast && !spec.intersections && <span className="absolute inset-0 bg-ochre/50" />}
                  {isSel && <span className="absolute inset-0 bg-ochre" style={spec.intersections ? { borderRadius: "50%", inset: "8%" } : undefined} />}
                  {isChecked && <span className="absolute inset-[6%] rounded-full bg-vermilion/30" />}
                  {isLast && spec.intersections && !piece && <span className="absolute inset-[30%] border-2 border-ochre" />}
                  {piece && (
                    <span
                      className={`relative flex items-center justify-center leading-none ${rotate ? "rotate-180" : ""}`}
                      style={
                        spec.intersections
                          ? {
                              width: discSize,
                              height: discSize,
                              borderRadius: "50%",
                              background: "var(--color-paper)",
                              border: `2px solid ${piece.side === "w" ? "var(--color-vermilion)" : "var(--color-ink)"}`,
                              boxShadow: isLast ? "0 0 0 3px var(--color-ochre)" : "inset 0 0 0 2px var(--color-paper), inset 0 0 0 3px " + (piece.side === "w" ? "var(--color-vermilion)" : "var(--color-ink)"),
                              color: piece.side === "w" ? "var(--color-vermilion)" : "var(--color-ink)",
                              fontSize: pieceSize,
                              fontWeight: 700,
                              fontFamily: "var(--font-display-cjk), serif",
                            }
                          : spec.game === "shogi"
                            ? {
                                width: cell * 0.8,
                                height: cell * 0.88,
                                clipPath: "polygon(50% 0, 92% 18%, 100% 100%, 0 100%, 8% 18%)",
                                background: piece.promoted ? "var(--color-ochre)" : "var(--color-paper)",
                                outline: "2px solid var(--color-ink)",
                                outlineOffset: -2,
                                color: piece.promoted && piece.type !== "p" ? "var(--color-vermilion)" : "var(--color-ink)",
                                fontSize: pieceSize,
                                fontWeight: 700,
                                fontFamily: "var(--font-display-cjk), serif",
                                paddingTop: cell * 0.08,
                              }
                            : { fontSize: pieceSize, color: "var(--color-ink)", fontFamily: '"Segoe UI Symbol", "Apple Symbols", "Noto Sans Symbols 2", "DejaVu Sans", sans-serif' }
                      }
                    >
                      {spec.glyph(piece)}
                    </span>
                  )}
                  {isTarget && (
                    <span
                      className={`absolute ${piece ? "inset-[4%] border-[3px] border-vermilion" : "rounded-full bg-vermilion"} ${
                        piece ? (spec.intersections ? "rounded-full" : "") : ""
                      }`}
                      style={piece ? undefined : { width: cell * 0.26, height: cell * 0.26 }}
                    />
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* 升变 / 成 选择 */}
        {chooser && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-paper/70">
            <div className="flex max-w-full flex-wrap justify-center gap-2 border-2 border-ink bg-paper p-2">
              {chooser.options.map((m) => {
                const p = parseUci(m);
                const label =
                  spec.game === "chess"
                    ? spec.glyph({ type: p.suffix, side: turn, promoted: false })
                    : p.suffix === "+"
                      ? spec.glyph({ type: grid[squareToXY(p.from!).rank][squareToXY(p.from!).file]!.type, side: turn, promoted: true })
                      : spec.glyph(grid[squareToXY(p.from!).rank][squareToXY(p.from!).file]!);
                const choiceName = spec.game === "shogi"
                  ? (p.suffix === "+" ? (locale === "zh" ? "升级（成）" : "Promote") : (locale === "zh" ? "不升级（不成）" : "Do not promote"))
                  : ({ q: { zh: "升变为后", en: "Promote to queen" }, r: { zh: "升变为车", en: "Promote to rook" }, b: { zh: "升变为象", en: "Promote to bishop" }, n: { zh: "升变为马", en: "Promote to knight" } }[p.suffix]?.[locale] ?? p.suffix);
                return (
                  <button
                    key={m}
                    aria-label={choiceName}
                    onClick={() => {
                      setChooser(null);
                      setSelected(null);
                      onMove?.(m);
                    }}
                    className="grid min-h-12 min-w-12 place-items-center gap-1 border-2 border-ink px-2 py-1 text-2xl font-bold hover:bg-ochre"
                    style={{ fontFamily: spec.game === "chess" ? '"Segoe UI Symbol", "Apple Symbols", sans-serif' : "var(--font-display-cjk), serif" }}
                  >
                    <span aria-hidden="true">{label}</span>
                    <span className="text-xs">{choiceName}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
      {renderHand(orientation)}
      {/* 坐标 */}
      <div className="mt-2 grid text-xs font-bold text-ink" style={{ gridTemplateColumns: `repeat(${spec.files}, 1fr)` }}>
        {fileOrder.map((f) => (
          <span key={f} className="text-center">
            {spec.game === "shogi" ? `${9 - f}·${FILES[f]}` : FILES[f]}
          </span>
        ))}
      </div>
    </div>
  );
}

function SquareLines({ files, ranks, checker }: { files: number; ranks: number; checker: boolean }) {
  const cells = [];
  for (let r = 0; r < ranks; r++)
    for (let f = 0; f < files; f++) {
      const dark = checker && (r + f) % 2 === 1;
      cells.push(<rect key={`${r}${f}`} x={f} y={r} width={1} height={1} fill={dark ? "var(--color-paper-2)" : "var(--color-paper)"} />);
    }
  return (
    <svg viewBox={`0 0 ${files} ${ranks}`} className="absolute inset-0 h-full w-full" shapeRendering="crispEdges">
      {cells}
      {Array.from({ length: files + 1 }, (_, i) => (
        <line key={`v${i}`} x1={i} y1={0} x2={i} y2={ranks} stroke="var(--color-ink)" strokeWidth={0.03} />
      ))}
      {Array.from({ length: ranks + 1 }, (_, i) => (
        <line key={`h${i}`} x1={0} y1={i} x2={files} y2={i} stroke="var(--color-ink)" strokeWidth={0.03} />
      ))}
    </svg>
  );
}

/** 象棋棋盘线：线过格心，河界、九宫斜线 */
function XiangqiLines({ files, ranks }: { files: number; ranks: number }) {
  const L = 0.5, R = files - 0.5, T = 0.5, B = ranks - 0.5;
  const river = ranks / 2; // 4.5..5.5 之间为河
  return (
    <svg viewBox={`0 0 ${files} ${ranks}`} className="absolute inset-0 h-full w-full">
      <rect x={0} y={0} width={files} height={ranks} fill="var(--color-paper)" />
      {Array.from({ length: files }, (_, i) => (
        <g key={`v${i}`}>
          <line x1={i + 0.5} y1={T} x2={i + 0.5} y2={river - 0.5} stroke="var(--color-ink)" strokeWidth={0.035} />
          <line x1={i + 0.5} y1={river + 0.5} x2={i + 0.5} y2={B} stroke="var(--color-ink)" strokeWidth={0.035} />
        </g>
      ))}
      <line x1={L} y1={river - 0.5} x2={L} y2={river + 0.5} stroke="var(--color-ink)" strokeWidth={0.035} />
      <line x1={R} y1={river - 0.5} x2={R} y2={river + 0.5} stroke="var(--color-ink)" strokeWidth={0.035} />
      {Array.from({ length: ranks }, (_, i) => (
        <line key={`h${i}`} x1={L} y1={i + 0.5} x2={R} y2={i + 0.5} stroke="var(--color-ink)" strokeWidth={0.035} />
      ))}
      <rect x={L - 0.12} y={T - 0.12} width={R - L + 0.24} height={B - T + 0.24} fill="none" stroke="var(--color-ink)" strokeWidth={0.06} />
      {/* 九宫 */}
      <line x1={3.5} y1={0.5} x2={5.5} y2={2.5} stroke="var(--color-ink)" strokeWidth={0.035} />
      <line x1={5.5} y1={0.5} x2={3.5} y2={2.5} stroke="var(--color-ink)" strokeWidth={0.035} />
      <line x1={3.5} y1={ranks - 0.5} x2={5.5} y2={ranks - 2.5} stroke="var(--color-ink)" strokeWidth={0.035} />
      <line x1={5.5} y1={ranks - 0.5} x2={3.5} y2={ranks - 2.5} stroke="var(--color-ink)" strokeWidth={0.035} />
      <text x={2.2} y={river + 0.16} fontSize={0.5} fill="var(--color-ink-3)" fontFamily="var(--font-display-cjk), serif" textAnchor="middle">
        楚 河
      </text>
      <text x={6.8} y={river + 0.16} fontSize={0.5} fill="var(--color-ink-3)" fontFamily="var(--font-display-cjk), serif" textAnchor="middle">
        漢 界
      </text>
    </svg>
  );
}
