// Pinned local copy: miaoda-game-mcr-mahjong-analysis-core 0.3.1 (MIT metadata); see docs/mcr-dependencies.md.
/** Canonical numbered-suit order used by parsers, sorting, and deterministic results. */
export const MCR_NUMBER_SUITS = ['m', 'p', 's'];
/** Canonical wind-then-dragon order. */
export const MCR_HONOR_TILES = ['E', 'S', 'W', 'N', 'C', 'F', 'P'];
/** The eight unique MCR flower faces. */
export const MCR_FLOWER_TILES = [
    'spring',
    'summer',
    'autumn',
    'winter',
    'plum',
    'orchid',
    'chrysanthemum',
    'bamboo',
];
/** All 34 non-flower faces in canonical order. */
export const MCR_STRUCTURE_TILES = [
    ...MCR_NUMBER_SUITS.flatMap((suit) => Array.from({ length: 9 }, (_, index) => `${index + 1}${suit}`)),
    ...MCR_HONOR_TILES,
];
const STRUCTURE_TILE_SET = new Set(MCR_STRUCTURE_TILES);
const FLOWER_TILE_SET = new Set(MCR_FLOWER_TILES);
/** Runtime type guard for one of the 34 structure-tile face strings. */
export function isMcrStructureTile(value) {
    return typeof value === 'string' && STRUCTURE_TILE_SET.has(value);
}
/** Runtime type guard for one of the eight unique flower face strings. */
export function isMcrFlowerTile(value) {
    return typeof value === 'string' && FLOWER_TILE_SET.has(value);
}
export function isMcrSuitedTile(tile) {
    return tile.length === 2 && MCR_NUMBER_SUITS.includes(tile[1]);
}
export function mcrTileRank(tile) {
    return Number(tile[0]);
}
export function mcrTileSuit(tile) {
    return tile[1];
}
/** Build the fixed 144-tile MCR set with stable physical ids. */
export function createMcrTileSet() {
    const tiles = [];
    for (const face of MCR_STRUCTURE_TILES) {
        for (const copy of [0, 1, 2, 3]) {
            tiles.push({ id: `${face}:${copy}`, face, copy });
        }
    }
    for (const face of MCR_FLOWER_TILES) {
        tiles.push({ id: `${face}:0`, face, copy: 0 });
    }
    return tiles;
}
/** Compare two faces in canonical suited, honor, then flower order. */
export function compareMcrTileFaces(left, right) {
    return tileFaceIndex(left) - tileFaceIndex(right);
}
/** Return a canonically ordered copy of tile faces without modifying the input array. */
export function sortMcrTileFaces(tiles) {
    return [...tiles].sort(compareMcrTileFaces);
}
/** Compare physical tiles by face, then copy number for deterministic duplicate ordering. */
export function compareMcrPhysicalTiles(left, right) {
    return compareMcrTileFaces(left.face, right.face) || left.copy - right.copy;
}
/** Return a canonically ordered copy of physical tiles without modifying the input array. */
export function sortMcrPhysicalTiles(tiles) {
    return [...tiles].sort(compareMcrPhysicalTiles);
}
function tileFaceIndex(face) {
    const structureIndex = MCR_STRUCTURE_TILES.indexOf(face);
    if (structureIndex >= 0)
        return structureIndex;
    return MCR_STRUCTURE_TILES.length + MCR_FLOWER_TILES.indexOf(face);
}
