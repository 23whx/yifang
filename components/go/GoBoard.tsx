"use client";
import type { GoState } from "@/lib/go/rules";
export default function GoBoard({
  state,
  onPoint,
  locale,
  disabled = false,
  dead = [],
  marks = [],
  target,
}: {
  state: GoState;
  onPoint: (p: number) => void;
  locale: "zh" | "en";
  disabled?: boolean;
  dead?: number[];
  marks?: number[];
  target?: number;
}) {
  const n = state.size;
  return (
    <div className="go-board-shell">
    <div
      className="go-board-viewport"
      role="region"
      tabIndex={0}
      aria-label={locale === "zh" ? `${n} 路围棋棋盘，可滚动查看` : `${n} by ${n} Go board, scroll to explore`}
      style={{ "--go-mobile-board-size": `${n * 44 + 40 + 16}px` } as React.CSSProperties}
    >
    <div
      className="go-board"
      role="group"
      aria-label={locale === "zh" ? `${n} 路围棋` : `${n} × ${n} Go`}
      style={{
        gridTemplateColumns: `20px repeat(${n},minmax(0,1fr)) 20px`,
        gridTemplateRows: `20px repeat(${n},minmax(0,1fr)) 20px`,
      }}
    >
      {Array.from({ length: n }, (_, i) => [
        <span
          key={`top-${i}`}
          className="go-coordinate"
          style={{ gridColumn: i + 2, gridRow: 1 }}
        >
          {"ABCDEFGHJKLMNOPQRST"[i]}
        </span>,
        <span
          key={`bottom-${i}`}
          className="go-coordinate"
          style={{ gridColumn: i + 2, gridRow: n + 2 }}
        >
          {"ABCDEFGHJKLMNOPQRST"[i]}
        </span>,
        <span
          key={`left-${i}`}
          className="go-coordinate"
          style={{ gridColumn: 1, gridRow: i + 2 }}
        >
          {n - i}
        </span>,
        <span
          key={`right-${i}`}
          className="go-coordinate"
          style={{ gridColumn: n + 2, gridRow: i + 2 }}
        >
          {n - i}
        </span>,
      ])}
      {state.board.map((v, i) => (
        <button
          key={i}
          style={{ gridColumn: (i % n) + 2, gridRow: Math.floor(i / n) + 2 }}
          disabled={disabled}
          onClick={() => onPoint(i)}
          aria-label={`${"ABCDEFGHJKLMNOPQRST"[i % n]}${n - Math.floor(i / n)} ${locale === "zh" ? (v === 1 ? "黑棋" : v === 2 ? "白棋" : "空点") : (v === 1 ? "Black" : v === 2 ? "White" : "Empty")}`}
          className={`go-point ${v === 1 ? "black" : v === 2 ? "white" : ""} ${dead.includes(i) ? "dead" : ""} ${target === i ? "go-target" : ""}`}
        >
          <svg
            className="go-grid-line"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              d={`M${i % n === 0 ? 50 : 0} 50H${i % n === n - 1 ? 50 : 100} M50 ${Math.floor(i / n) === 0 ? 50 : 0}V${Math.floor(i / n) === n - 1 ? 50 : 100}`}
              fill="none"
              stroke="#50391f"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          {v !== 0 && (
            <span className="go-stone">{state.last === i && <i />}</span>
          )}
          {v === 0 && marks.includes(i) && (
            <span className="go-liberty-mark">{marks.indexOf(i) + 1}</span>
          )}
        </button>
      ))}
    </div>
    </div>
    <p className="go-board-pan-hint">
      {locale === "zh"
        ? "单指拖动查看棋盘，轻点交点落子；也可聚焦棋盘后用方向键滚动。"
        : "Drag with one finger to explore; tap an intersection to play. Arrow keys also scroll the focused board."}
    </p>
    </div>
  );
}
