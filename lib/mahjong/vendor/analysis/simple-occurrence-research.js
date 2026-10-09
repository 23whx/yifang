// Pinned local copy: miaoda-game-mcr-mahjong-analysis-core 0.3.1 (MIT metadata); see docs/mcr-dependencies.md.
import { isMcrSuitedTile, mcrTileRank } from './tiles.js';
/** Generate repeatable tile-hog and terminal/wind-set occurrences. */
export function detectMcrSimpleFanOccurrences(decomposition) {
    const groups = [...decomposition.concealedMelds, ...decomposition.declaredMelds];
    const occurrences = [];
    groups.forEach((meld, group) => {
        if (meld.kind === 'sequence' || !isTerminalOrWind(meld.tile))
            return;
        occurrences.push({
            key: `mcr-73:${group}`,
            fanCode: 'mcr-73',
            matchedGroups: [group],
            tile: meld.tile,
        });
    });
    const tileGroups = new Map();
    addTileGroup(tileGroups, decomposition.pair.tile, groups.length);
    addTileGroup(tileGroups, decomposition.pair.tile, groups.length);
    groups.forEach((meld, group) => {
        for (const tile of meldFaces(meld))
            addTileGroup(tileGroups, tile, group);
    });
    const kongTiles = new Set(decomposition.declaredMelds
        .filter((meld) => meld.kind === 'kong')
        .map((meld) => meld.tile));
    for (const [tile, matchedGroups] of tileGroups) {
        if (matchedGroups.length !== 4 || kongTiles.has(tile))
            continue;
        occurrences.push({
            key: `mcr-64:${tile}`,
            fanCode: 'mcr-64',
            matchedGroups: [...new Set(matchedGroups)].sort((left, right) => left - right),
            tile,
        });
    }
    return occurrences.sort((left, right) => left.key.localeCompare(right.key));
}
function meldFaces(meld) {
    if (meld.kind === 'sequence')
        return meld.tiles;
    return new Array(meld.kind === 'kong' ? 4 : 3).fill(meld.tile);
}
function addTileGroup(groups, tile, group) {
    const matched = groups.get(tile) ?? [];
    matched.push(group);
    groups.set(tile, matched);
}
function isTerminalOrWind(tile) {
    return isMcrSuitedTile(tile)
        ? mcrTileRank(tile) === 1 || mcrTileRank(tile) === 9
        : tile === 'E' || tile === 'S' || tile === 'W' || tile === 'N';
}
