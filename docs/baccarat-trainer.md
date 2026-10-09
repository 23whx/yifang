# Baccarat rules trainer — 2026-09-12

Implemented bilingual `/zh/baccarat/play` and `/en/baccarat/play`, linked through the existing playable catalogue and game hub. Reuses parchment, ink and existing sign-button styles. The compatible Notion reference from awesome-design-md informs reading hierarchy only; the project's RPG design system remains authoritative.

The play page now separates three modes: guided fixed lessons (including basic suit recognition and five settlement cases), a free educational practice round, and the original drawing-rule reference. Free practice starts with 100 teaching credits. The learner chooses Player/Banker/Tie and 5/10/20 credits, confirms the stake, advances the random deal one step at a time, then settles. Available and committed credits are separate; a new round keeps the previous result, while a page reload or explicit reset restores 100. Credits cannot be purchased, withdrawn or redeemed. This is a rules exercise, not a real-money product or a continuous shoe simulator.

Free practice keeps all amounts as integer hundredths of a teaching credit to calculate Banker commission exactly. A Player win returns 2× the stake, a Banker win returns 1.95×, a winning Tie returns 9× including the original stake, and a Player/Banker selection on a tie returns only its original stake. The rule trainer remains explicitly bet-free, so its purpose is not confused with this complete-round exercise.

`node scripts/verify-baccarat-practice.cjs` checks all three selections across five fixed decks, settlement formulas, locking/duplicate guards and insufficient balance. In a 390×844 native browser, Chinese and English free practice each completed a real random round with a settlement explanation dialog and no document-wide horizontal overflow; Chinese also retained its 95-credit balance for the next round. These checks do not assert any real-money functionality.

Features: individual initial-card reveals, natural check, Player and Banker draw explanations, final modulo-ten calculations, previous/next/replay, five deterministic examples, fresh eight-deck random rounds, accessible draw reference table. No bets, balances, chip settlement, continuous shoe, or outcome-based rewards.

Rule reference: Pennsylvania Code Chapter 631a, sections 6 and 11:
https://www.pacodeandbulletin.gov/Display/pacode?d=&file=/secure/pacode/data/058/chapter631a/chap631atoc.html

Verification: `node scripts/verify-baccarat.cjs` checks all 80 third-card combinations, eight Player-stand decisions, face-card scoring, natural stops, examples, immutable step snapshots, deck uniqueness and 100 random rounds. ESLint and production build passed. In-app browser interaction verified natural 8 result, replay, example selection, Player third-card 8 / Banker 3 stand, and backwards navigation. The existing production server needed a restart after rebuilding to load current scripts. `localhost` failed in the embedded browser during testing; `127.0.0.1` worked.

Remaining project scope: Mahjong and Hold'em interactive training, Go remote agreed dead-stone scoring, tactical puzzle collections and historical game replay, cross-network multiplayer and real-device validation. This addition does not complete those items.
