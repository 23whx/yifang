// Pinned local copy: miaoda-game-mcr-mahjong-analysis-core 0.3.1 (MIT metadata); see docs/mcr-dependencies.md.
import { MCR_HONOR_TILES, MCR_NUMBER_SUITS, MCR_STRUCTURE_TILES } from './tiles.js';
/** Parse compact structure-tile notation such as `123m 456p 789s EEE 5p`. */
export function parseMcrTileNotationResearch(notation) {
    if (typeof notation !== 'string')
        return failure(0, 'Tile notation must be a string.');
    const tiles = [];
    const sourceIndexes = [];
    let pendingDigits = '';
    let pendingStart = 0;
    for (let index = 0; index < notation.length; index++) {
        const character = notation[index];
        if (character >= '1' && character <= '9') {
            if (pendingDigits.length === 0)
                pendingStart = index;
            pendingDigits += character;
            continue;
        }
        if (character === 'm' || character === 'p' || character === 's') {
            if (pendingDigits.length === 0)
                return failure(index, `Suit ${character} has no ranks.`);
            for (let digitIndex = 0; digitIndex < pendingDigits.length; digitIndex++) {
                tiles.push(`${pendingDigits[digitIndex]}${character}`);
                sourceIndexes.push(pendingStart + digitIndex);
            }
            pendingDigits = '';
            continue;
        }
        if (isHonorCharacter(character)) {
            if (pendingDigits.length > 0)
                return failure(index, 'Ranks must be followed by m, p, or s.');
            tiles.push(character);
            sourceIndexes.push(index);
            continue;
        }
        if (character === ' ' || character === '\t' || character === '\n' || character === ',') {
            if (pendingDigits.length > 0)
                return failure(index, 'Ranks must be followed by m, p, or s.');
            continue;
        }
        return failure(index, `Unsupported tile-notation character: ${character}.`);
    }
    if (pendingDigits.length > 0) {
        return failure(notation.length, 'Ranks must be followed by m, p, or s.');
    }
    const counts = new Array(MCR_STRUCTURE_TILES.length).fill(0);
    for (let index = 0; index < tiles.length; index++) {
        const tile = tiles[index];
        const tileIndex = MCR_STRUCTURE_TILES.indexOf(tile);
        counts[tileIndex]++;
        if (counts[tileIndex] > 4) {
            return failure(sourceIndexes[index], `Tile ${tile} appears more than four times.`);
        }
    }
    return { ok: true, tiles };
}
/** Format a structure-tile multiset as deterministic compact notation. */
export function formatMcrTileNotationResearch(tiles) {
    if (!Array.isArray(tiles))
        return { ok: false, message: 'Tiles must be an array.' };
    const counts = new Array(MCR_STRUCTURE_TILES.length).fill(0);
    for (const tile of tiles) {
        const index = MCR_STRUCTURE_TILES.indexOf(tile);
        if (index < 0)
            return { ok: false, message: `Unsupported MCR structure tile: ${String(tile)}.` };
        counts[index]++;
        if (counts[index] > 4) {
            return { ok: false, message: `Tile ${tile} appears more than four times.` };
        }
    }
    const groups = [];
    for (const suit of MCR_NUMBER_SUITS) {
        let ranks = '';
        for (let rank = 1; rank <= 9; rank++) {
            const tile = `${rank}${suit}`;
            ranks += String(rank).repeat(counts[MCR_STRUCTURE_TILES.indexOf(tile)]);
        }
        if (ranks)
            groups.push(`${ranks}${suit}`);
    }
    const honors = MCR_HONOR_TILES.map((tile) => tile.repeat(counts[MCR_STRUCTURE_TILES.indexOf(tile)])).join('');
    if (honors)
        groups.push(honors);
    return { ok: true, notation: groups.join(' ') };
}
function isHonorCharacter(character) {
    return character === 'E' || character === 'S' || character === 'W' || character === 'N' ||
        character === 'C' || character === 'F' || character === 'P';
}
function failure(index, message) {
    return { ok: false, index, message };
}
