// Pinned local copy: miaoda-game-mcr-mahjong-analysis-core 0.3.1 (MIT metadata); see docs/mcr-dependencies.md.
const REVERSIBLE_TILES = new Set([
    '1p', '2p', '3p', '4p', '5p', '8p', '9p',
    '2s', '4s', '5s', '6s', '8s', '9s',
    'P',
]);
/** Every tile has no distinct top and bottom in the authorized MCR tile design. */
export function isMcrPushNotDown(faces) {
    // Callers validate the complete hand structure. A kong contributes four
    // physical tiles, so a winning hand may contain 14 through 18 faces.
    return faces.length >= 14 && faces.length <= 18 && faces.every((face) => REVERSIBLE_TILES.has(face));
}
