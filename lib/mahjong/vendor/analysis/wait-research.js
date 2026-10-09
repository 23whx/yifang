// Pinned local copy: miaoda-game-mcr-mahjong-analysis-core 0.3.1 (MIT metadata); see docs/mcr-dependencies.md.
import { enumerateMcrStandardHandDecompositions } from './structures.js';
import { MCR_STRUCTURE_TILES, mcrTileRank } from './tiles.js';
/** Enumerate standard-shape waits without treating special hands as standard waits. */
export function enumerateMcrStandardWaits(input) {
    const requiredConcealedMelds = 4 - input.declaredMelds.length;
    if (requiredConcealedMelds < 0 ||
        input.concealedTiles.length !== requiredConcealedMelds * 3 + 1)
        return [];
    const waits = MCR_STRUCTURE_TILES.flatMap((tile) => {
        const decompositions = enumerateMcrStandardHandDecompositions({
            concealedTiles: [...input.concealedTiles, tile],
            declaredMelds: input.declaredMelds,
        });
        return decompositions.length > 0 ? [{ tile, decompositions }] : [];
    });
    return waits.map(({ tile, decompositions }) => {
        const decompositionResults = decompositions.map((decomposition) => ({
            decomposition,
            fanAlternatives: waits.length === 1
                ? classifyWaitFanAlternatives(tile, decomposition)
                : [],
        }));
        return {
            tile,
            decompositionResults,
            decompositions,
            fanAlternatives: [...new Set(decompositionResults.flatMap((result) => result.fanAlternatives))].sort(),
        };
    });
}
function classifyWaitFanAlternatives(winningTile, decomposition) {
    const fanCodes = new Set();
    if (decomposition.pair.tile === winningTile)
        fanCodes.add('mcr-79');
    for (const meld of decomposition.concealedMelds) {
        if (meld.kind !== 'sequence')
            continue;
        const winningIndex = meld.tiles.indexOf(winningTile);
        if (winningIndex === 1)
            fanCodes.add('mcr-78');
        if (winningIndex === 2 && mcrTileRank(meld.tiles[0]) === 1)
            fanCodes.add('mcr-77');
        if (winningIndex === 0 && mcrTileRank(meld.tiles[0]) === 7)
            fanCodes.add('mcr-77');
    }
    return [...fanCodes].sort();
}
