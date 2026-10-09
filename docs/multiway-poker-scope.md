# Multi-seat Hold'em implementation status

No backend, accounts, money, rake or persistent chip wallet. The player's browser will coordinate the table. This does not provide adversarial host fairness.

## Implemented foundation

`lib/holdem-pots.ts` splits integer contributions by distinct caps, keeps folded contributions in pots but excludes folded winners, returns a sole unmatched upper contribution, ranks each contested pot separately, and distributes any odd chips clockwise from the button among tied winners separately per pot. Seats are numbered clockwise. The latter is the explicit house convention for the educational table, not a suit tie-breaker.

The function expects normalized legal betting history. It rejects unmatched folded money and orphan side pots rather than silently assigning them. It consumes hand-rank vectors from the existing evaluator; it does not own a deck or leak anyone's hole cards. Live scores are required even if only one player can win a pot.

Tests cover concrete unequal-stack examples, folded best hand, unmatched refunds, odd chips with different button positions, side-pot ties, invalid inputs, and 2,000 seeded conservation cases for 2–9 seats. This is NOT a complete multi-seat game.

## Still required

- Receive-side payload validation now exists in `holdem-multi-wire.ts` and passes real view/room-frame plus malformed-input tests. This enforces schema bounds and basic consistency, not independent shuffle or host fairness. Actual channel adapter, welcome identity binding, sequence checks, acknowledgement timeout and UI remain to wire.
- `holdem-multi-room.ts` now coordinates four bound senders, waits for all seats, tags recipient/sequence/match, guards requests, distributes only seat projections and closes without synthetic fold on departure or sender failure. Integration test completes 16 betting decisions, full showdown, all-four next-hand confirmation, replay rejection and disconnect retention. This is an in-memory coordinator test, not real WebRTC. Manual channel adapter, receive-side wire validation and connection UI remain to implement.
- `lib/holdem-multi.ts` now implements a 2–9-seat immutable betting state machine, blinds (5/10), clockwise turns, dead-seat skipping, street transitions, burned cards, all-in runout, uncalled refunds, fold/showdown settlement and next-hand rotation/stack continuity. Six hundred deterministic full hands pass inventory/conservation/termination checks; targeted tests cover big-blind option, short raises, cumulative reopening and heads-up short blinds. It is not yet connected to UI or rooms. More edge fixtures (especially below-minimum opening all-ins, zero-stack seats across consecutive hands and semantic privacy tests) remain before treating rules acceptance as complete.
- Seat-specific allowlisted snapshots and revision/hand/connection-seat action guards now exist in `holdem-multi-session.ts`. Before showdown, only the recipient's hand is included; at showdown live hands are revealed while folded hands stay private to their owner. No deck/burned cards or private ranks are included. All funded players must consent to the next hand. Tests cover 25,144 serialized views across 150 hands, detached arrays, hidden-card noninterference, stale/duplicate/invalid actor rejection and next-hand consent. Actual manual WebRTC room workflow, wire validation and disconnect handling are still required.
- Beginner local four-seat interface now exists: manual computer steps, projected private cards, virtual balances/street totals, calls/raises/all-in, per-pot eligibility/awards and best-five/tie-break explanations. Next hand retains stacks; exit confirms. One hundred full teaching-opponent hands pass. This UI has not yet had a production-build/browser acceptance pass. Four-human room integration remains separate work.
- Integrated rules tests, real browser local play/room acceptance, responsive checks. Real physical LAN and cross-NAT remain unverified.

## Rule reference

PokerStars' provider-authored explanation of side pots and short raises: https://www.pokerstars.com/help/articles/poker-rules-master/229154/ . The site is a rules reference only, not an integration or real-money service for this project.

TDA rule 47 describes cumulative short-all-in reopening while retaining the last full raise size: https://www.pokertda.com/view-poker-tda-rules/ . No claim of full TDA tournament-policy implementation.
