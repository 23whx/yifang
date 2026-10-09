import { points, roundSteps, type Card, type Step } from "./baccarat";

export type BaccaratSelection = "player" | "banker" | "tie";
export type BaccaratPractice = {
  balanceCents: number;
  selection: BaccaratSelection;
  stakeCents: number;
  committedCents: number;
  phase: "choose" | "deal" | "settled";
  steps: Step[];
  stepIndex: number;
  returnedCents: number;
  round: number;
};

export const initialBaccaratPractice = (): BaccaratPractice => ({
  balanceCents: 10000,
  selection: "player",
  stakeCents: 1000,
  committedCents: 0,
  phase: "choose",
  steps: [],
  stepIndex: 0,
  returnedCents: 0,
  round: 0,
});

// Amounts are hundredths of a teaching credit. This avoids rounding 5% Banker commission.
export function baccaratReturnCents(selection: BaccaratSelection, player: number, banker: number, stakeCents: number): number {
  if (!Number.isInteger(stakeCents) || stakeCents <= 0) throw new Error("Invalid stake");
  if (player === banker) return selection === "tie" ? stakeCents * 9 : stakeCents;
  if (selection === "tie") return 0;
  if (selection !== (player > banker ? "player" : "banker")) return 0;
  return selection === "banker" ? stakeCents + Math.round(stakeCents * 0.95) : stakeCents * 2;
}

export function commitBaccaratPractice(state: BaccaratPractice, deck: Card[]): BaccaratPractice {
  if (state.phase !== "choose") throw new Error("Round already started");
  if (!Number.isInteger(state.stakeCents) || state.stakeCents <= 0 || state.stakeCents > state.balanceCents) throw new Error("Insufficient teaching credits");
  const steps = roundSteps(deck);
  return {
    ...state,
    balanceCents: state.balanceCents - state.stakeCents,
    committedCents: state.stakeCents,
    phase: "deal",
    steps,
    stepIndex: 0,
    returnedCents: 0,
    round: state.round + 1,
  };
}

export function advanceBaccaratPractice(state: BaccaratPractice): BaccaratPractice {
  if (state.phase !== "deal" || state.stepIndex >= state.steps.length - 1) throw new Error("No next deal step");
  return { ...state, stepIndex: state.stepIndex + 1 };
}

export function settleBaccaratPractice(state: BaccaratPractice): BaccaratPractice {
  if (state.phase !== "deal" || state.stepIndex !== state.steps.length - 1 || state.committedCents <= 0) throw new Error("Finish dealing before settlement");
  const final = state.steps.at(-1)!;
  const returnedCents = baccaratReturnCents(state.selection, points(final.player), points(final.banker), state.committedCents);
  return {
    ...state,
    balanceCents: state.balanceCents + returnedCents,
    committedCents: 0,
    returnedCents,
    phase: "settled",
  };
}

export function nextBaccaratPractice(state: BaccaratPractice): BaccaratPractice {
  if (state.phase !== "settled") throw new Error("Settle the current round first");
  return { ...state, phase: "choose", steps: [], stepIndex: 0, returnedCents: 0 };
}
