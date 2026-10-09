// Pinned local copy: miaoda-game-mcr-mahjong-analysis-core 0.3.1 (MIT metadata); see docs/mcr-dependencies.md.
import { parseMcrTileNotationResearch } from './tile-notation-research.js';
import { compareMcrTileFaces, isMcrStructureTile, isMcrSuitedTile, mcrTileRank, mcrTileSuit, } from './tiles.js';
/** Parse one compact declared meld while requiring explicit kong exposure. */
export function parseMcrDeclaredMeldNotationResearch(input) {
    const notation = typeof input === 'string' ? input : input.notation;
    const exposure = typeof input === 'string' ? null : input.exposure;
    const parsed = parseMcrTileNotationResearch(notation);
    if (!parsed.ok)
        return { ok: false, message: parsed.message };
    const tiles = parsed.tiles;
    if (tiles.length === 3 && tiles.every((tile) => tile === tiles[0])) {
        return { ok: true, meld: { kind: 'triplet', tile: tiles[0] } };
    }
    if (tiles.length === 3 && isSequence(tiles)) {
        const sorted = [...tiles].sort(compareMcrTileFaces);
        return { ok: true, meld: { kind: 'sequence', tiles: sorted } };
    }
    if (tiles.length === 4 && tiles.every((tile) => tile === tiles[0])) {
        if (!exposure) {
            return { ok: false, message: 'Kong notation requires melded or concealed exposure.' };
        }
        return { ok: true, meld: { kind: 'kong', tile: tiles[0], exposure } };
    }
    return { ok: false, message: 'A declared meld must be one sequence, triplet, or kong.' };
}
/** Normalize mixed structured and compact declared-meld input. */
export function normalizeMcrDeclaredMeldsResearch(inputs) {
    if (!Array.isArray(inputs)) {
        return { ok: false, index: 0, message: 'Declared melds must be an array.' };
    }
    const melds = [];
    for (let index = 0; index < inputs.length; index++) {
        const input = inputs[index];
        if (typeof input === 'string' ||
            (input && typeof input === 'object' && 'notation' in input)) {
            const parsed = parseMcrDeclaredMeldNotationResearch(input);
            if (!parsed.ok)
                return { ok: false, index, message: parsed.message };
            melds.push(parsed.meld);
        }
        else {
            melds.push(input);
        }
    }
    return { ok: true, melds: melds.sort(compareDeclaredMelds) };
}
function compareDeclaredMelds(left, right) {
    const leftFace = firstMeldFace(left);
    const rightFace = firstMeldFace(right);
    if (leftFace && rightFace) {
        const faceOrder = compareMcrTileFaces(leftFace, rightFace);
        if (faceOrder !== 0)
            return faceOrder;
    }
    else if (leftFace || rightFace) {
        return leftFace ? -1 : 1;
    }
    const kindOrder = meldKindOrder(left) - meldKindOrder(right);
    if (kindOrder !== 0)
        return kindOrder;
    if (left?.kind === 'kong' && right?.kind === 'kong') {
        return left.exposure.localeCompare(right.exposure);
    }
    return 0;
}
function firstMeldFace(meld) {
    if (!meld || typeof meld !== 'object')
        return null;
    if (meld.kind === 'sequence' && Array.isArray(meld.tiles)) {
        return [...meld.tiles].filter(isMcrStructureTile).sort(compareMcrTileFaces)[0] ?? null;
    }
    return (meld.kind === 'triplet' || meld.kind === 'kong') && isMcrStructureTile(meld.tile)
        ? meld.tile
        : null;
}
function meldKindOrder(meld) {
    if (!meld || typeof meld !== 'object')
        return 3;
    return meld.kind === 'sequence' ? 0 : meld.kind === 'triplet' ? 1 : meld.kind === 'kong' ? 2 : 3;
}
function isSequence(tiles) {
    if (!tiles.every(isMcrSuitedTile))
        return false;
    const sorted = [...tiles].sort(compareMcrTileFaces);
    return sorted.every((tile) => mcrTileSuit(tile) === mcrTileSuit(sorted[0])) &&
        mcrTileRank(sorted[1]) === mcrTileRank(sorted[0]) + 1 &&
        mcrTileRank(sorted[2]) === mcrTileRank(sorted[0]) + 2;
}
