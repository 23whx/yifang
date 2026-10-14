import type { GameSlug } from "./games";
import { cubeGlossary, type GlossaryEntry } from "./cube/glossary";
import { cubeHistory, type HistoryEntry } from "./cube/history";
import { cubePuzzles, type CubePuzzle } from "./cube/puzzles";
import { boardGlossaries, boardHistories, boardPuzzles } from "./board/library";
import { moreBoardGlossaries, moreBoardHistories } from "./board/reference-more";

// Era labels that are not plain years, placed on the same timeline as numeric years.
const ERA: Record<string, number> = { 古代: -500, 平安: 794, 宋: 960, 明清: 1400, 持驹: 1500, 江户: 1603, 布局: 9999 };
const when = (year: string) => ERA[year] ?? Number(year.replace(/[^\d]/g, ""));
const merged = <T,>(base: Partial<Record<GameSlug, T[]>>, more: Partial<Record<GameSlug, T[]>>) =>
  Object.fromEntries(Object.entries(base).map(([game, list]) => [game, [...(list as T[]), ...(more[game as GameSlug] ?? [])]])) as Partial<Record<GameSlug, T[]>>;
const boardTerms = merged(boardGlossaries, moreBoardGlossaries);
const boardTimeline = Object.fromEntries(Object.entries(merged(boardHistories, moreBoardHistories))
  .map(([game, list]) => [game, [...list!].sort((a, b) => when(a.year) - when(b.year))])) as Partial<Record<GameSlug, HistoryEntry[]>>;
import { mahjongGlossary } from "./mahjong-lessons";

/** 各项目除教程 / 实战外的栏目内容。没有条目的项目不生成对应页面 */
export const glossaries: Partial<Record<GameSlug, GlossaryEntry[]>> = { cube: cubeGlossary, ...boardTerms, mahjong: mahjongGlossary };
export const histories: Partial<Record<GameSlug, HistoryEntry[]>> = { cube: cubeHistory, ...boardTimeline };
export const puzzleSets: Partial<Record<GameSlug, CubePuzzle[]>> = { cube: cubePuzzles };

export type SectionKey = "puzzles" | "glossary" | "history";

export function sectionsFor(game: GameSlug): SectionKey[] {
  const out: SectionKey[] = [];
  if (puzzleSets[game] || boardPuzzles[game]) out.push("puzzles");
  if (glossaries[game]) out.push("glossary");
  if (histories[game]) out.push("history");
  return out;
}

export function gamesWith(section: SectionKey): GameSlug[] {
  const src = section === "puzzles" ? {...puzzleSets,...boardPuzzles} : section === "glossary" ? glossaries : histories;
  return Object.keys(src) as GameSlug[];
}
