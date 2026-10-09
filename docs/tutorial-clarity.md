# Tutorial and map clarity revision

- Map destination labels: 14px bold dark text; removed text shadow, filter and permanent map layer promotion. Geography captions use 10px text and opaque contrast backing. Existing RPG design retained.
- First lesson names distinguish cube parts, cards/tiles and chess pieces. Cube first lesson now has five sections, including three reproducible turn exercises.
- Cube demos reset to a known state and support stepping forward/back. Notation examples start solved; algorithm examples explicitly describe inverse-generated setups, not universal solving instructions.
- Board demos default to 1.8 seconds per move, offer three speeds and describe current moves; selected examples wait for their own frames before autoplay. Mobile demo panels no longer stick over the lesson.
- Go boards label all four edges. Fourteen guided cases cover corner/edge/centre liberties, shared liberties, diagonal non-connection, single/group captures, suicide and capture exceptions. Each has a designated target, explanation and reset.

Validation: lint and production build; verify-rules.cjs covers 14 Go fixtures, game-specific first-lesson titles, 34 tutorial positions and 60 legal demonstration moves. Browser checked Go group capture, central suicide and capture exception; cube R then R' returns visibly solved; initial desktop map labels reviewed.

Scope: this improves first lessons and shared playback. Legal-move tests do not certify the pedagogical completeness of every advanced lesson or cube solving algorithm; those need a separate content audit.
