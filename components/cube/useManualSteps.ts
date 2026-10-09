"use client";

import { useRef, useState } from "react";
import type { RubiksCubeHandle } from "./RubiksCube";

/** Queue exactly one move; publish progress only after its animation finishes. */
export function useManualSteps() {
  const cube = useRef<RubiksCubeHandle>(null);
  const pending = useRef<number | null>(null);
  const [cursor, setCursor] = useState(0);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  function onBusyChange(value: boolean) {
    setBusy(value);
    if (!value && pending.current !== null) {
      setCursor(pending.current);
      pending.current = null;
    }
  }
  function prepare(setup = "") {
    if (pending.current !== null || cube.current?.isBusy()) return false;
    cube.current?.reset();
    if (setup) cube.current?.applyInstant(setup);
    setCursor(0);
    return true;
  }
  function move(token: string, target: number) {
    if (!ready || !token || pending.current !== null || cube.current?.isBusy()) return;
    pending.current = target;
    setBusy(true);
    cube.current?.play(token);
  }
  return { cube, cursor, busy, ready, onBusyChange, prepare, move, onReady: () => setReady(true) };
}

export function describeTurn(token: string, zh: boolean) {
  if (!token) return "";
  const faces: Record<string, [string, string]> = { R: ["右面", "right face"], L: ["左面", "left face"], U: ["上面", "top face"], D: ["底面", "bottom face"], F: ["前面", "front face"], B: ["后面", "back face"] };
  const face = faces[token[0]];
  const turn = token.includes("2") ? (zh ? "转半圈（180°）" : "turn halfway (180°)") : token.includes("'") ? (zh ? "逆时针转四分之一圈（90°）" : "turn counterclockwise 90°") : (zh ? "顺时针转四分之一圈（90°）" : "turn clockwise 90°");
  return zh ? `${token}：正对${face[0]}看，${turn}。` : `${token}: looking straight at the ${face[1]}, ${turn}.`;
}
