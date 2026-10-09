import type { GameSlug } from "@/content/games";

interface Props {
  game: GameSlug;
  className?: string;
  /** 线条与主色：默认墨黑；在朱红底上用纸白 */
  ink?: string;
  accent?: string;
}

/**
 * 五种棋具的平涂示意图，同一套印刷语法：单色线、实心块。
 * viewBox 统一 0 0 100 100。
 */
export default function GameDiagram({ game, className, ink = "currentColor", accent = "#d8321a" }: Props) {
  const common = { className, viewBox: "0 0 100 100", fill: "none", role: "img" as const, "aria-hidden": true };

  switch (game) {
    case "cube": {
      // 等轴测魔方：把 3D 点 (x,y,z) 投影到平面，顶面 y=3、右面 x=3、左面 z=3
      const s = 14;
      const ax = s * Math.cos(Math.PI / 6), ay = s * Math.sin(Math.PI / 6);
      const P = (x: number, y: number, z: number) => `${50 + (x - z) * ax},${50 + (x + z) * ay - y * s}`;
      const quad = (a: string, b: string, c: string, d: string) => `${a} ${b} ${c} ${d}`;
      const top: string[] = [], left: string[] = [], right: string[] = [];
      for (let i = 0; i < 3; i++)
        for (let j = 0; j < 3; j++) {
          top.push(quad(P(i, 3, j), P(i + 1, 3, j), P(i + 1, 3, j + 1), P(i, 3, j + 1)));
          right.push(quad(P(3, i, j), P(3, i, j + 1), P(3, i + 1, j + 1), P(3, i + 1, j)));
          left.push(quad(P(i, j, 3), P(i + 1, j, 3), P(i + 1, j + 1, 3), P(i, j + 1, 3)));
        }
      const filled = new Set([0, 4, 8]);
      return (
        <svg {...common}>
          {top.map((p, i) => (
            <polygon key={`t${i}`} points={p} stroke={ink} strokeWidth="1.4" fill={filled.has(i) ? accent : "none"} />
          ))}
          {left.map((p, i) => (
            <polygon key={`l${i}`} points={p} stroke={ink} strokeWidth="1.4" fill={i === 4 ? ink : "none"} />
          ))}
          {right.map((p, i) => (
            <polygon key={`r${i}`} points={p} stroke={ink} strokeWidth="1.4" fill={i === 2 || i === 6 ? accent : "none"} />
          ))}
        </svg>
      );
    }
    case "chess": {
      const cells: React.ReactNode[] = [];
      const o = 10, c = 10;
      for (let r = 0; r < 8; r++)
        for (let f = 0; f < 8; f++)
          if ((r + f) % 2 === 1)
            cells.push(<rect key={`${r}${f}`} x={o + f * c} y={o + r * c} width={c} height={c} fill={ink} />);
      return (
        <svg {...common}>
          <rect x={o} y={o} width={80} height={80} stroke={ink} strokeWidth="1.6" />
          {cells}
          {/* 两个朱红子：e4、d5 */}
          <circle cx={o + 4.5 * c} cy={o + 4.5 * c} r={3.6} fill={accent} />
          <circle cx={o + 3.5 * c} cy={o + 3.5 * c} r={3.6} fill={accent} />
        </svg>
      );
    }
    case "xiangqi": {
      const o = 14, c = 9; // 9 列 10 行
      const lines: React.ReactNode[] = [];
      for (let i = 0; i < 9; i++) {
        // 竖线：河界处断开
        lines.push(<line key={`v${i}a`} x1={o + i * c} y1={o} x2={o + i * c} y2={o + 4 * c} stroke={ink} strokeWidth="1.1" />);
        lines.push(<line key={`v${i}b`} x1={o + i * c} y1={o + 5 * c} x2={o + i * c} y2={o + 9 * c} stroke={ink} strokeWidth="1.1" />);
      }
      for (let j = 0; j < 10; j++)
        lines.push(<line key={`h${j}`} x1={o} y1={o + j * c} x2={o + 8 * c} y2={o + j * c} stroke={ink} strokeWidth="1.1" />);
      return (
        <svg {...common}>
          {lines}
          <line x1={o} y1={o + 4 * c} x2={o} y2={o + 5 * c} stroke={ink} strokeWidth="1.1" />
          <line x1={o + 8 * c} y1={o + 4 * c} x2={o + 8 * c} y2={o + 5 * c} stroke={ink} strokeWidth="1.1" />
          {/* 九宫 */}
          <path d={`M${o + 3 * c},${o} L${o + 5 * c},${o + 2 * c} M${o + 5 * c},${o} L${o + 3 * c},${o + 2 * c}`} stroke={ink} strokeWidth="1.1" />
          <path d={`M${o + 3 * c},${o + 9 * c} L${o + 5 * c},${o + 7 * c} M${o + 5 * c},${o + 9 * c} L${o + 3 * c},${o + 7 * c}`} stroke={ink} strokeWidth="1.1" />
          {/* 棋子 */}
          <circle cx={o + 4 * c} cy={o + 9 * c} r={4.2} fill={accent} />
          <circle cx={o + 4 * c} cy={o} r={4.2} fill={ink} />
          <circle cx={o + 1 * c} cy={o + 7 * c} r={4.2} fill={accent} />
          <circle cx={o + 7 * c} cy={o + 2 * c} r={4.2} fill={ink} />
        </svg>
      );
    }
    case "shogi": {
      const o = 14, c = 8; // 9×9
      const lines: React.ReactNode[] = [];
      for (let i = 0; i <= 9; i++) {
        lines.push(<line key={`v${i}`} x1={o + i * c} y1={o} x2={o + i * c} y2={o + 9 * c} stroke={ink} strokeWidth="1.1" />);
        lines.push(<line key={`h${i}`} x1={o} y1={o + i * c} x2={o + 9 * c} y2={o + i * c} stroke={ink} strokeWidth="1.1" />);
      }
      const pent = (x: number, y: number, fill: string, flip = false) => {
        const w = 5.6, h = 6.4;
        const pts = flip
          ? `${x},${y + h / 2} ${x - w / 2},${y + h / 6} ${x - w / 2 + 0.6},${y - h / 2} ${x + w / 2 - 0.6},${y - h / 2} ${x + w / 2},${y + h / 6}`
          : `${x},${y - h / 2} ${x + w / 2},${y - h / 6} ${x + w / 2 - 0.6},${y + h / 2} ${x - w / 2 + 0.6},${y + h / 2} ${x - w / 2},${y - h / 6}`;
        return <polygon points={pts} fill={fill} stroke={ink} strokeWidth="0.8" />;
      };
      return (
        <svg {...common}>
          {lines}
          {[3, 6].flatMap((a) => [3, 6].map((b) => <circle key={`${a}${b}`} cx={o + a * c} cy={o + b * c} r={1.1} fill={ink} />))}
          {pent(o + 4.5 * c, o + 8.5 * c, accent)}
          {pent(o + 2.5 * c, o + 6.5 * c, accent)}
          {pent(o + 4.5 * c, o + 0.5 * c, ink, true)}
          {pent(o + 6.5 * c, o + 2.5 * c, ink, true)}
        </svg>
      );
    }
    case "go": {
      const o = 10, c = 80 / 18;
      const lines: React.ReactNode[] = [];
      for (let i = 0; i < 19; i++) {
        lines.push(<line key={`v${i}`} x1={o + i * c} y1={o} x2={o + i * c} y2={o + 18 * c} stroke={ink} strokeWidth="0.7" />);
        lines.push(<line key={`h${i}`} x1={o} y1={o + i * c} x2={o + 18 * c} y2={o + i * c} stroke={ink} strokeWidth="0.7" />);
      }
      const stones = [
        [3, 3, ink], [15, 15, ink], [3, 15, accent], [15, 3, accent], [9, 9, ink], [10, 8, accent], [8, 10, accent],
      ] as const;
      return (
        <svg {...common}>
          {lines}
          {[3, 9, 15].flatMap((a) => [3, 9, 15].map((b) => <circle key={`${a}${b}`} cx={o + a * c} cy={o + b * c} r={0.9} fill={ink} />))}
          {stones.map(([x, y, f], i) => (
            <circle key={i} cx={o + x * c} cy={o + y * c} r={2.1} fill={f} />
          ))}
        </svg>
      );
    }
    case "mahjong": {
      // 一手 13 张立牌 + 1 张摸牌：两排竖立的长方牌
      const w = 11, h = 16, gap = 1.6;
      const row = (y: number, n: number, x0: number, fills: (string | null)[]) =>
        Array.from({ length: n }, (_, i) => (
          <g key={`${y}${i}`}>
            <rect x={x0 + i * (w + gap)} y={y} width={w} height={h} rx={1.2} stroke={ink} strokeWidth="1.2" fill={fills[i] ?? "none"} />
            {fills[i] && <circle cx={x0 + i * (w + gap) + w / 2} cy={y + h / 2} r={2.2} fill={ink === "currentColor" ? "#fff" : ink} />}
          </g>
        ));
      return (
        <svg {...common}>
          {row(30, 7, 6, [null, null, accent, null, null, null, accent])}
          {row(54, 7, 6, [null, accent, null, null, null, null, null])}
          <rect x={80} y={42} width={w} height={h} rx={1.2} stroke={ink} strokeWidth="1.2" fill={ink} />
        </svg>
      );
    }
    case "holdem": {
      // 五张公共牌一排，两张底牌斜放在下方
      const w = 14, h = 20;
      return (
        <svg {...common}>
          {Array.from({ length: 5 }, (_, i) => (
            <rect key={i} x={8 + i * 17} y={22} width={w} height={h} rx={1.5} stroke={ink} strokeWidth="1.3" fill={i === 2 ? accent : "none"} />
          ))}
          <g transform="rotate(-8 46 66)">
            <rect x={39} y={56} width={w} height={h} rx={1.5} stroke={ink} strokeWidth="1.3" fill={ink} />
          </g>
          <g transform="rotate(8 58 66)">
            <rect x={51} y={56} width={w} height={h} rx={1.5} stroke={ink} strokeWidth="1.3" fill={accent} />
          </g>
        </svg>
      );
    }
    case "baccarat": {
      // 半圆桌沿 + 庄/闲两组牌
      const w = 12, h = 17;
      return (
        <svg {...common}>
          <path d="M8 72 A42 42 0 0 1 92 72" stroke={ink} strokeWidth="1.4" />
          <path d="M20 72 A30 30 0 0 1 80 72" stroke={ink} strokeWidth="0.9" />
          <line x1={8} y1={72} x2={92} y2={72} stroke={ink} strokeWidth="1.4" />
          <rect x={26} y={36} width={w} height={h} rx={1.3} stroke={ink} strokeWidth="1.2" fill="none" />
          <rect x={40} y={36} width={w} height={h} rx={1.3} stroke={ink} strokeWidth="1.2" fill={ink} />
          <rect x={58} y={36} width={w} height={h} rx={1.3} stroke={ink} strokeWidth="1.2" fill={accent} />
          <rect x={72} y={36} width={w} height={h} rx={1.3} stroke={ink} strokeWidth="1.2" fill="none" />
          <circle cx={50} cy={84} r={4} fill={accent} />
        </svg>
      );
    }
  }
}
