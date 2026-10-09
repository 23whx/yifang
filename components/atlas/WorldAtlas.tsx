"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { atlasSites, atlasPins, type AtlasSite } from "@/content/atlas";
import { games } from "@/content/games";
import type { Locale } from "@/lib/i18n";
type View = { x: number; y: number; scale: number };
const initial: View = { x: 0, y: 0, scale: 1 };
export function Building({
  index,
  className = "",
}: {
  index: number;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={`atlas-building ${className}`}
      style={{
        backgroundPosition: `${((index % 4) * 100) / 3}% ${index < 4 ? 0 : 100}%`,
      }}
    />
  );
}
export default function WorldAtlas({ locale }: { locale: Locale }) {
  const zh = locale === "zh",
    lang = zh ? 0 : 1;
  const viewport = useRef<HTMLDivElement>(null),
    dialog = useRef<HTMLDialogElement>(null),
    opener = useRef<HTMLElement | null>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>()),
    dragged = useRef(false),
    dragDistance = useRef(0);
  const [view, setView] = useState(initial),
    current = useRef(view);
  const [gesturing, setGesturing] = useState(false);
  const [selected, setSelected] = useState<AtlasSite | null>(null),
    [filter, setFilter] = useState("all"),
    [query, setQuery] = useState("");
  function update(v: View) {
    const el = viewport.current,
      r = el?.getBoundingClientRect();
    if (!el || !r) return;
    const plane = el.querySelector<HTMLElement>(".atlas-plane");
    const scale = Math.max(1, Math.min(3, v.scale));
    const maxX = Math.max(
        0,
        ((plane?.offsetWidth ?? r.width) * scale - el.clientWidth) / 2,
      ),
      maxY = Math.max(
        0,
        ((plane?.offsetHeight ?? r.height) * scale - el.clientHeight) / 2,
      );
    const x = Math.max(-maxX, Math.min(maxX, v.x)),
      y = Math.max(-maxY, Math.min(maxY, v.y));
    current.current = { scale, x, y };
    setView(current.current);
  }
  function zoom(factor: number, cx = 0, cy = 0) {
    const v = current.current,
      scale = Math.max(1, Math.min(3, v.scale * factor));
    update({
      scale,
      x: cx - ((cx - v.x) * scale) / v.scale,
      y: cy - ((cy - v.y) * scale) / v.scale,
    });
  }
  function showAsia() {
    const el = viewport.current;
    const plane = el?.querySelector<HTMLElement>(".atlas-plane");
    if (!el || !plane) return;
    const scale = el.clientWidth < 600 ? 1 : 1.2;
    update({
      scale,
      x: -(plane.offsetWidth * scale - el.clientWidth) / 2,
      y: 0,
    });
  }
  useEffect(() => {
    const el = viewport.current;
    if (!el) return;
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      zoom(
        Math.exp(-Math.max(-100, Math.min(100, e.deltaY)) * 0.003),
        e.clientX - r.left - r.width / 2,
        e.clientY - r.top - r.height / 2,
      );
    };
    let positioned = false;
    const ro = new ResizeObserver(() => {
      if (!positioned) {
        showAsia();
        positioned = true;
      } else update(current.current);
    });
    ro.observe(el);
    el.addEventListener("wheel", wheel, { passive: false });
    return () => {
      ro.disconnect();
      el.removeEventListener("wheel", wheel);
    };
    // Gesture callbacks read current state through a ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  function open(s: AtlasSite) {
    opener.current = document.activeElement as HTMLElement;
    setSelected(s);
    dialog.current?.showModal();
  }
  function close() {
    dialog.current?.close();
    opener.current?.focus();
  }
  const visible = atlasSites.filter(
    (s) =>
      (filter === "all" ||
        (filter === "play"
          ? games.find((g) => g.slug === s.game)?.playable
          : ["mahjong", "holdem", "baccarat"].includes(s.game))) &&
      `${s.title[lang]} ${games.find((g) => g.slug === s.game)?.name[locale]} ${s.origin[lang]}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const game = games.find((g) => g.slug === selected?.game);
  return (
    <section
      className="atlas-shell"
      aria-label={zh ? "弈方冒险地图" : "Yifang adventure atlas"}
    >
      <div className="atlas-masthead">
        <span className="atlas-crown" aria-hidden="true">
          ♛
        </span>
        <span className="atlas-eyebrow">THE STRATEGIST’S ATLAS</span>
        <h1>{zh ? "棋类与魔方，从零入门" : "Learn chess, Go & more"}</h1>
        <p>
          {zh
            ? "魔方、国际象棋、象棋、将棋、围棋与牌桌：八条入门学习路线。"
            : "Chess, Go, Shogi, Mahjong, the Rubik’s Cube and more: eight beginner learning paths."}
        </p>
        <span className="atlas-ornament" aria-hidden="true">
          ✦ ───── ◆ ───── ✦
        </span>
      </div>
      <aside
        className="atlas-sidebar"
        aria-label={zh ? "羊皮卷轴导航" : "Parchment navigation"}
      >
        <Link className="active" href={`/${locale}`}>
          ⌖　{zh ? "世界地图" : "World map"}
        </Link>
        <Link href={`/${locale}/collection`}>
          ♜　{zh ? "游戏图鉴" : "Collection"}
        </Link>
        <Link href={`/${locale}/academy`}>
          ▤　{zh ? "规则学堂" : "Academy"}
        </Link>
        <p className="atlas-sidebar-note">
          {zh
            ? "每一盘棋，都是一段新的旅程。"
            : "Every game is a journey worth taking."}
        </p>
        <small>0° — 90° N</small>
      </aside>
      <div className="atlas-toolbar">
        <div className="atlas-filters">
          {[
            ["all", zh ? "全部据点" : "All places"],
            ["play", zh ? "可游玩" : "Playable"],
            ["cards", zh ? "牌桌之旅" : "Card games"],
          ].map(([id, label]) => (
            <button
              key={id}
              aria-pressed={filter === id}
              onClick={() => setFilter(id)}
            >
              {label}
            </button>
          ))}
        </div>
        <label className="atlas-search">
          <span aria-hidden="true">⌕</span>
          <input
            aria-label={zh ? "搜索游戏或地区" : "Search games or regions"}
            placeholder={zh ? "寻找一处目的地…" : "Find a destination…"}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      </div>
      <div
        ref={viewport}
        className="atlas-viewport"
        data-gesturing={gesturing}
        tabIndex={0}
        aria-label={
          zh
            ? "地图，方向键移动，加减号缩放，Home复位"
            : "Map. Arrow keys pan, plus and minus zoom, Home resets"
        }
        onKeyDown={(e) => {
          if (e.target !== e.currentTarget) return;
          const v = current.current;
          if (
            [
              "ArrowLeft",
              "ArrowRight",
              "ArrowUp",
              "ArrowDown",
              "+",
              "=",
              "-",
              "Home",
            ].includes(e.key)
          )
            e.preventDefault();
          if (e.key === "+" || e.key === "=") zoom(1.2);
          if (e.key === "-") zoom(1 / 1.2);
          if (e.key === "Home") showAsia();
          if (e.key.startsWith("Arrow"))
            update({
              ...v,
              x:
                v.x +
                (e.key === "ArrowLeft" ? 50 : e.key === "ArrowRight" ? -50 : 0),
              y:
                v.y +
                (e.key === "ArrowUp" ? 50 : e.key === "ArrowDown" ? -50 : 0),
            });
        }}
        onPointerDown={(e) => {
          if (e.button !== 0 && e.button !== 1) return;
          if (pointers.current.size === 0) {
            // Freeze an in-flight CSS zoom at its visible position before direct manipulation.
            const plane =
              e.currentTarget.querySelector<HTMLElement>(".atlas-plane");
            if (plane) {
              const matrix = new DOMMatrixReadOnly(
                getComputedStyle(plane).transform,
              );
              update({ x: matrix.m41, y: matrix.m42, scale: matrix.a });
            }
            setGesturing(true);
            dragged.current = e.button === 1;
            dragDistance.current = 0;
          } else dragged.current = true;
          pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          const old = pointers.current.get(e.pointerId);
          if (!old) return;
          const next = { x: e.clientX, y: e.clientY },
            other = [...pointers.current.entries()].find(
              ([id]) => id !== e.pointerId,
            )?.[1];
          const dx = next.x - old.x,
            dy = next.y - old.y;
          dragDistance.current += Math.hypot(dx, dy);
          if (dragDistance.current > 5) dragged.current = true;
          if (other) {
            const before = Math.hypot(old.x - other.x, old.y - other.y),
              after = Math.hypot(next.x - other.x, next.y - other.y),
              r = e.currentTarget.getBoundingClientRect();
            if (before > 0)
              zoom(
                after / before,
                (next.x + other.x) / 2 - r.left - r.width / 2,
                (next.y + other.y) / 2 - r.top - r.height / 2,
              );
          } else
            update({
              ...current.current,
              x: current.current.x + dx,
              y: current.current.y + dy,
            });
          pointers.current.set(e.pointerId, next);
        }}
        onPointerUp={(e) => {
          pointers.current.delete(e.pointerId);
          if (pointers.current.size === 0) setGesturing(false);
          e.currentTarget.releasePointerCapture(e.pointerId);
          if (!dragged.current) {
            const target = document
                .elementFromPoint(e.clientX, e.clientY)
                ?.closest<HTMLElement>("[data-site]"),
              site = atlasSites.find((s) => s.game === target?.dataset.site);
            if (site) open(site);
          }
        }}
        onPointerCancel={(e) => {
          dragged.current = true;
          pointers.current.delete(e.pointerId);
          if (pointers.current.size === 0) setGesturing(false);
        }}
      >
        <div
          className="atlas-plane"
          style={{
            transform: `translate(${view.x}px,${view.y}px) scale(${view.scale})`,
          }}
        >
          <svg
            className="atlas-routes"
            viewBox="0 0 1000 500"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              d="M250 305 Q380 470 440 295 T550 160 Q590 340 670 370 T840 390"
              fill="none"
              stroke="#792e20"
              strokeWidth="1.5"
              strokeDasharray="5 6"
            />
            {visible.map((s) => (
              <g key={s.game}>
                <line
                  x1={atlasPins[s.game][0] * 10}
                  y1={atlasPins[s.game][1] * 5}
                  x2={s.x * 10}
                  y2={s.y * 5}
                  stroke="#624826"
                  strokeWidth=".8"
                  strokeDasharray="2 3"
                />
                <circle
                  cx={atlasPins[s.game][0] * 10}
                  cy={atlasPins[s.game][1] * 5}
                  r="3"
                  fill="#8a3423"
                  stroke="#edd5a2"
                />
              </g>
            ))}
          </svg>
          <span className="ocean-label atlantic">ATLANTIC OCEAN</span>
          <span className="ocean-label pacific">PACIFIC OCEAN</span>
          {visible.map((s) => (
            <button
              key={s.game}
              data-site={s.game}
              className="atlas-site"
              style={{ left: `${s.x}%`, top: `${s.y}%` }}
              onClick={(e) => {
                if (e.detail === 0) open(s);
              }}
            >
              <Building index={s.sprite} />
              <span className="atlas-site-name">{s.title[lang]}</span>
              <small>{s.origin[lang]}</small>
            </button>
          ))}
        </div>
        {visible.length === 0 && (
          <p className="atlas-empty" role="status">
            {zh
              ? "没有找到这处目的地，试试游戏名称。"
              : "No destinations found. Try a game name."}
          </p>
        )}
      </div>
      <div className="atlas-desk-motto" aria-hidden="true">
        {zh ? "以棋会友 · 以智启程" : "GREAT GAMES · BRIGHTER MINDS"}
      </div>
      <div className="atlas-bottom">
        <p>
          ✧　
          {zh
            ? "拖动探索 · 滚轮缩放 · 点击据点启程"
            : "Drag to explore · Scroll to zoom · Choose a destination"}
        </p>
        <div className="atlas-controls">
          <button
            aria-label={zh ? "缩小" : "Zoom out"}
            disabled={view.scale <= 1}
            onClick={() => zoom(1 / 1.2)}
          >
            −
          </button>
          <output aria-live="polite">{Math.round(view.scale * 100)}%</output>
          <button
            aria-label={zh ? "放大" : "Zoom in"}
            disabled={view.scale >= 3}
            onClick={() => zoom(1.2)}
          >
            ＋
          </button>
          <button aria-label={zh ? "复位地图" : "Reset map"} onClick={showAsia}>
            ⌖
          </button>
        </div>
      </div>
      <div
        className="atlas-mobile-destinations"
        aria-label={zh ? "目的地快捷入口" : "Destination shortcuts"}
      >
        {visible.map((s) => (
          <button key={s.game} onClick={() => open(s)}>
            {games.find((g) => g.slug === s.game)?.name[locale]}
          </button>
        ))}
      </div>
      <dialog
        ref={dialog}
        className="atlas-dialog"
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
        onClose={() => opener.current?.focus()}
        aria-labelledby="destination-title"
      >
        {selected && game && (
          <>
            <button
              autoFocus
              className="atlas-close"
              onClick={close}
              aria-label={zh ? "关闭介绍" : "Close introduction"}
            >
              ×
            </button>
            <div className="atlas-dialog-art">
              <Building index={selected.sprite} />
            </div>
            <div className="atlas-dialog-copy">
              <span className="atlas-eyebrow">{selected.origin[lang]}</span>
              <h2 id="destination-title">{selected.title[lang]}</h2>
              <p className="atlas-game-name">
                {game.name[locale]} · {game.tagline[locale]}
              </p>
              <p>{selected.note[lang]}</p>
              <dl>
                {game.facts.map((f) => (
                  <div key={f.label.en}>
                    <dt>{f.label[locale]}</dt>
                    <dd>{f.value[locale]}</dd>
                  </div>
                ))}
              </dl>
              <div className="atlas-dialog-actions">
                <Link
                  className="rpg-button"
                  href={`/${locale}/${game.slug}/learn`}
                >
                  {zh ? "学习规则" : "Learn the rules"} →
                </Link>
                {game.playable ? (
                  <Link
                    className="rpg-button secondary"
                    href={`/${locale}/${game.slug}/play`}
                  >
                    {zh ? "开始游玩" : "Start playing"}
                  </Link>
                ) : (
                  <span>{zh ? "实战尚未开放" : "Play coming later"}</span>
                )}
              </div>
              <Link className="atlas-more" href={`/${locale}/${game.slug}`}>
                {zh ? "打开完整游戏图鉴" : "Open full game guide"} ↗
              </Link>
            </div>
          </>
        )}
      </dialog>
    </section>
  );
}
