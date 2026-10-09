import type { GameSlug } from "./games";
import { cubeGlossary, type GlossaryEntry } from "./cube/glossary";
import { cubeHistory, type HistoryEntry } from "./cube/history";
import { cubePuzzles, type CubePuzzle } from "./cube/puzzles";
import { boardGlossaries, boardHistories, boardPuzzles } from "./board/library";
import { mahjongGlossary } from "./mahjong-lessons";

/** 各项目除教程 / 实战外的栏目内容。没有条目的项目不生成对应页面 */
export const glossaries: Partial<Record<GameSlug, GlossaryEntry[]>> = { cube: cubeGlossary, ...boardGlossaries, mahjong: mahjongGlossary };
export const histories: Partial<Record<GameSlug, HistoryEntry[]>> = { cube: cubeHistory, ...boardHistories };
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
