const fs = require("node:fs");
const ts = require("typescript");
const assert = require("node:assert/strict");
const path = require("node:path");
require.extensions[".ts"] = (mod, file) =>
  mod._compile(
    ts.transpileModule(fs.readFileSync(file, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText,
    file,
  );
async function main() {
  const { boardOrientation } = require("../lib/board/variants.ts");
  for (const mode of ["ai", "local"]) {
    for (const human of ["w", "b"]) {
      const base = mode === "ai" ? human : "w";
      assert.equal(boardOrientation(mode, human, false), base);
      assert.equal(boardOrientation(mode, human, true), base === "w" ? "b" : "w");
    }
  }
  console.log("PASS: 8 board orientation cases, including AI black to local flip.");
  const { tutorials } = require("../content/tutorials.ts");
  const { default: create } =
    await import("../node_modules/ffish-es6/ffish.js");
  const f = await create({
    wasmBinary: fs.readFileSync(
      path.join(__dirname, "../node_modules/ffish-es6/ffish.wasm"),
    ),
  });
  let positions = 0,
    moves = 0;
  for (const t of tutorials) {
    if (!["chess", "xiangqi", "shogi"].includes(t.game)) continue;
    for (const s of t.steps) {
      if (!s.position) continue;
      const b = new f.Board(t.game, s.position.fen);
      for (const move of s.position.moves ?? []) {
        assert(
          b.legalMoves().split(" ").includes(move),
          `${t.slug}/${s.id}: illegal ${move} at ${b.fen()}`,
        );
        assert(b.push(move));
        moves++;
      }
      b.delete();
      positions++;
    }
  }
  const {
    newGo,
    playGo,
    group,
    scoreGo,
    chooseGoMove,
  } = require("../lib/go/rules.ts");
  let s = newGo(9);
  const { goExercises, setupGoExercise, pointAt, pointName } = require("../content/go-exercises.ts");
  for (const example of goExercises) {
    const start = setupGoExercise(example), point = pointAt(example.target);
    assert.equal(pointName(point), example.target);
    if(example.category === "liberties") assert.equal(group(start.board,point,9).liberties.size, example.expected, example.id);
    else {
      const result = playGo(start,point);
      if(example.expected === "suicide") assert.equal(result.error,"suicide",example.id);
      else { assert(result.state,example.id); assert.equal(result.state.captures[0],example.expected,example.id); }
    }
  }
  const cubeFirst = tutorials.find(t=>t.slug === "cube-first-lesson");
  assert(!cubeFirst.title.zh.includes("棋子"));
  assert(cubeFirst.steps.filter(s=>s.alg).length >= 3);
  console.log(`PASS: ${goExercises.length} guided Go cases and game-specific lesson titles.`);
  assert.equal(group(s.board, 0, 9).stones.size, 0);
  s = playGo(s, 0).state;
  assert.equal(group(s.board, 0, 9).liberties.size, 2);
  assert.equal(playGo(s, 0).error, "occupied");
  let capture = newGo(9);
  capture.board[0] = 2;
  capture.board[1] = 1;
  capture.history = [capture.board.join("")];
  const taken = playGo(capture, 9).state;
  assert.equal(taken.board[0], 0);
  assert.equal(taken.captures[0], 1);
  let suicide = newGo(9);
  suicide.board[1] = 2;
  suicide.board[9] = 2;
  assert.equal(playGo(suicide, 0).error, "suicide");
  let ko = newGo(9);
  for (const p of [11, 19, 29]) ko.board[p] = 1;
  for (const p of [12, 20, 22, 30]) ko.board[p] = 2;
  ko.history = [ko.board.join("")];
  const after = playGo(ko, 21).state;
  assert(after);
  assert.equal(after.board[20], 0);
  assert.equal(playGo(after, 20).error, "ko");
  let end = playGo(playGo(newGo(), null).state, null).state;
  assert.equal(end.passes, 2);
  assert.equal(playGo(end, 0).error, "finished");
  assert.deepEqual(scoreGo(end), { black: 0, white: 7.5 });
  let area = newGo(3);
  area.board = [1, 1, 1, 1, 0, 1, 1, 1, 1];
  assert.deepEqual(scoreGo(area), { black: 9, white: 7.5 });
  for (const n of [9, 13, 19]) {
    let ai = newGo(n);
    for (let i = 0; i < 20; i++) {
      const move = chooseGoMove(ai);
      const result = playGo(ai, move);
      assert(result.state);
      ai = result.state;
      if (ai.passes >= 2) break;
    }
  }
  console.log(
    `PASS: ${positions} tutorial positions, ${moves} legal demonstration moves; Go capture, suicide, superko, passing, scoring and AI tests.`,
  );
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
