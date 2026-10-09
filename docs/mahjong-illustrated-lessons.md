# Illustrated beginner mahjong lessons

- First lesson: seven written sections now have inline generated-tile figures, adjacent to the relevant explanation rather than only a gallery above the exercise.
- Second lesson: `mahjong-terms`, twelve bilingual sections, progressing from physical table vocabulary to sets, tenpai, tsumo, ron, calls, closed hands, riichi, yaku/han/fu, dora, furiten and draws.
- Picture dictionary: `/zh/mahjong/glossary` and `/en/mahjong/glossary`, with links to full explanations.
- Artwork reuses `public/mahjong/tiles-generated-v1.png`. Tile counts and captions are real HTML, images have accessible names, and groups wrap on narrow screens.
- The course distinguishes a completed structure from legal winning eligibility. Japanese-only terms are identified; it does not claim a complete riichi engine is implemented.
- Rules cross-check: [WRC Rules 2025](https://www.worldriichi.org/wrc-rules), especially sections 3, 8.9–8.11 and 11.4–11.5. Teaching examples and explanatory prose are original; rulebook illustrations are not reproduced.
- Design preserves current RPG parchment/bronze tokens; awesome-design-md's Notion reference was consulted only for compatible reading hierarchy. Inspora was consulted but did not expose detailed examples through the available page.

## Verification

`node scripts/verify-guided-lessons.cjs` checks every first-lesson and terminology section has a figure, all tile names exist, no panel contains more than four of a tile, and the selected ready/draw/riichi examples have the stated 13/14 tile counts. Existing guided-table tests remain in place.

Do not run `next start` against the same `.next` directory while replacing it with `next build`; stop the local production preview before rebuilding and start it again only after the build finishes. Verify the emitted `.meta` status as well as the route manifest: presence in the manifest alone does not prove that a page is not a prerendered 404.
