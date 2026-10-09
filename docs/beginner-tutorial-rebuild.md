# Zero-experience tutorial pass — 2026-09-12

## Implemented

- Eight first lessons now start with original bilingual beginner chapters: equipment, terms explained at first use, turn order, worked examples, mistakes and results. Existing detailed rules remain after these chapters as reference. The text is server-rendered, linked from each learning index, and remains in the existing sitemap/HowTo structure.
- Playing-card lessons start with spades/hearts/clubs/diamonds, rank versus suit, A/J/Q/K, the 52-card deck and exclusion of jokers. Recognition exercises require an answer and explain incorrect choices.
- Baccarat: five fixed guided cases covering Player win, a pushed Player stake, Banker win with 5% winnings commission, a losing Banker stake, and Tie at 8:1. Select the named hand, choose 10 credits, confirm, reveal cards, calculate points, compare, settle, then inspect the balance. The old draw-table/random trainer is a collapsed advanced reference on the play page.
- Hold'em: arranged heads-up hand, blinds 5/10 from stacks of 100, call only the missing 5, opponent check, flop/turn/river checks, private cards hidden until showdown, best-five comparison, pot return and net-change check. No rake in this specific example. It is not a full free-play engine or side-pot simulator.
- Mahjong: an explicitly limited 136-tile structural exercise, drawing/discarding across three turns and identifying four sequences plus a pair. The learner chooses actual discard tiles; wrong choices retain the snapshot. Regional scoring is not fabricated, and poker/baccarat wagering is not imposed on Mahjong.
- Chess, xiangqi, shogi: every existing move demonstration supports learner-operated moves, not only playback. All three first lessons have an opening sequence. Legal but off-script moves explain and retain the position. Prompts separate origin/destination and explain promotion choices. Illegal targets remain unhighlighted.
- Cube: actual 3D R / R′ / U2 / U2 exercise, incorrect-choice feedback, animation gating and restart, followed by the existing detailed parts/notation demonstrations.
- Go: expanded beginner prose introduces coordinates, groups, liberties, capture, suicide and scoring before the existing 14 interactive cases.
- Updated PRODUCT.md: simulated educational balances/settlement are permitted by the user's new request. Credits cannot be purchased, redeemed or withdrawn and reset with the exercise.

## Bugs found during the pass

- Fixed UCI parsing when a xiangqi origin is on rank 10, such as h10g8; origin and destination now both support two-digit ranks.
- Added visible rank numbers to Board and aligned file labels to square centres. Shogi also displays teaching letter coordinates alongside traditional file numbers, so textual directions are actually locatable.

## Verification

- `node scripts/verify-guided-lessons.cjs`: eight bilingual lesson coverage checks, seven table scenarios, 300 Baccarat settlement combinations, poker chip conservation and hidden hole cards, Mahjong hand counts, and rank-10 parsing regressions.
- `node scripts/verify-rules.cjs`: 37 tutorial positions / 72 legal moves, 14 Go cases and existing board/Go rule checks.
- `npm run lint` and `npm run build` passed. Existing Big Shoulders fallback-font metadata warning remains nonfatal.
- In-app browser: completed Chinese Baccarat case 1 through 110 balance, Chinese Mahjong to the four-sets/pair shape, English Hold'em through 110/90/pot 0, all four opening moves for chess/xiangqi/shogi, cube inverse exercise (screenshots before/after), and Go corner-liberty counting. Deliberately exercised wrong suit, wrong discard, wrong call/check and wrong cube turn choices.

## Boundaries and remaining work

This is the zero-experience layer across all eight games, not a claim that every advanced article has been rewritten or independently verified. Advanced cube case orientations/formula descriptions still need a dedicated audit. Full Mahjong and Hold'em engines, Go remote scoring, historical replays and tactical archives are separate unfinished features. Real-device mobile validation and exhaustive browser walkthroughs of every advanced exercise remain outstanding. Do not infer AdSense approval from content quantity.

Visual design retains the project's parchment/bronze system. Inspora was consulted without inventing inaccessible examples; the compatible Notion reference from awesome-design-md informs readable hierarchy and spacing only.

## Rule references used for checking

- FIDE: https://handbook.fide.com/chapter/e012023
- World Xiangqi Federation: https://www.wxf-xiangqi.org/images/wxf-rules/2018_World_XiangQi_Rules_English2018.pdf
- Japan Shogi Association: https://www.shogi.or.jp/match/taikyoku_rules/
- Rubik's: https://www.rubiks.com/solution-guides
- Hold'em rules: https://www.pokerstars.com/poker/games/texas-holdem/
- Baccarat point/draw/settlement reference: https://www.pacodeandbulletin.gov/Display/pacode?d=&file=/secure/pacode/data/058/chapter631a/chap631atoc.html

Worked examples and explanations are authored for this project, not copied rulebook passages.
