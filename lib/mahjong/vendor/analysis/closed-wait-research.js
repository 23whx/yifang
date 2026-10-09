// Pinned local copy: miaoda-game-mcr-mahjong-analysis-core 0.3.1 (MIT metadata); see docs/mcr-dependencies.md.
import { enumerateMcrWinningStructures } from './structures.js';
import { MCR_STRUCTURE_TILES } from './tiles.js';
/** Enumerate every standard or special winning tile for a closed 13-tile hand. */
export function enumerateMcrClosedWaits(concealedTiles) {
    if (concealedTiles.length !== 13)
        return [];
    return MCR_STRUCTURE_TILES.flatMap((tile) => {
        const structures = enumerateMcrWinningStructures([...concealedTiles, tile]);
        return structures.length > 0 ? [{ tile, structures }] : [];
    });
}
