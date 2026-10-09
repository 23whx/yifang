// Pinned local copy: miaoda-game-mcr-mahjong-analysis-core 0.3.1 (MIT metadata); see docs/mcr-dependencies.md.
import { applyMcrFanExclusions } from './fan-exclusions.js';
import { isMcrSuitedTile, mcrTileRank, mcrTileSuit } from './tiles.js';
import { isMcrPushNotDown } from './whole-hand-pattern-research.js';
const GREEN_TILES = new Set(['2s', '3s', '4s', '6s', '8s', 'F']);
/**
 * Narrow structure-only detector used while the complete combination scorer is audited.
 * Win context, group reuse, and concealed-triplet status are deliberately out of scope.
 */
export function detectMcrStandardStructureFans(decomposition) {
    return applyMcrFanExclusions(new Set(detectMcrStandardStructureFanCandidates(decomposition)));
}
/** Detect structure facts before cross-layer scoring exclusions are applied. */
export function detectMcrStandardStructureFanCandidates(decomposition) {
    const melds = [...decomposition.concealedMelds, ...decomposition.declaredMelds];
    const faces = [decomposition.pair.tile, decomposition.pair.tile, ...melds.flatMap(meldFaces)];
    const fanCodes = new Set();
    const suited = faces.filter(isMcrSuitedTile);
    const suits = new Set(suited.map(mcrTileSuit));
    const hasHonors = suited.length !== faces.length;
    const hasWinds = faces.some(isWind);
    const hasDragons = faces.some(isDragon);
    if (faces.every((face) => GREEN_TILES.has(face)))
        fanCodes.add('mcr-03');
    if (isOneSuitDoubleDragon(decomposition))
        fanCodes.add('mcr-13');
    if (isThreeSuitDoubleDragon(decomposition))
        fanCodes.add('mcr-29');
    if (isMcrPushNotDown(faces))
        fanCodes.add('mcr-40');
    if (faces.every((face) => !isMcrSuitedTile(face)))
        fanCodes.add('mcr-11');
    if (faces.every((face) => isMcrSuitedTile(face) && isTerminal(face)))
        fanCodes.add('mcr-08');
    if (faces.every(isTerminalOrHonor) && suited.length > 0 && hasHonors)
        fanCodes.add('mcr-18');
    if (melds.every((meld) => meld.kind !== 'sequence') &&
        faces.every((face) => isMcrSuitedTile(face) && mcrTileRank(face) % 2 === 0)) {
        fanCodes.add('mcr-21');
    }
    if (melds.every((meld) => meld.kind !== 'sequence'))
        fanCodes.add('mcr-49');
    if (suits.size === 1 && !hasHonors)
        fanCodes.add('mcr-22');
    if (suits.size === 1 && hasHonors)
        fanCodes.add('mcr-50');
    if (melds.every(groupContainsTerminalOrHonor) &&
        isTerminalOrHonor(decomposition.pair.tile))
        fanCodes.add('mcr-55');
    if (melds.every((meld) => meld.kind === 'sequence') &&
        isMcrSuitedTile(decomposition.pair.tile))
        fanCodes.add('mcr-63');
    if (faces.every((face) => isMcrSuitedTile(face) &&
        mcrTileRank(face) >= 2 && mcrTileRank(face) <= 8))
        fanCodes.add('mcr-68');
    if (faces.every((face) => isMcrSuitedTile(face) && mcrTileRank(face) >= 7)) {
        fanCodes.add('mcr-25');
    }
    if (faces.every((face) => isMcrSuitedTile(face) &&
        mcrTileRank(face) >= 4 && mcrTileRank(face) <= 6))
        fanCodes.add('mcr-26');
    if (faces.every((face) => isMcrSuitedTile(face) && mcrTileRank(face) <= 3)) {
        fanCodes.add('mcr-27');
    }
    if (faces.every((face) => isMcrSuitedTile(face) && mcrTileRank(face) >= 6)) {
        fanCodes.add('mcr-36');
    }
    if (faces.every((face) => isMcrSuitedTile(face) && mcrTileRank(face) <= 4)) {
        fanCodes.add('mcr-37');
    }
    if (melds.every(containsFive) && isMcrSuitedTile(decomposition.pair.tile) &&
        mcrTileRank(decomposition.pair.tile) === 5)
        fanCodes.add('mcr-31');
    if (suits.size === 3 && hasWinds && hasDragons)
        fanCodes.add('mcr-52');
    if (suits.size === 2)
        fanCodes.add('mcr-75');
    if (!hasHonors)
        fanCodes.add('mcr-76');
    return [...fanCodes].sort();
}
/** Detect context and honor-set fans whose definitions do not depend on wait shape. */
export function detectMcrStandardContextFans(decomposition, context) {
    return applyMcrFanExclusions(new Set(detectMcrStandardContextFanCandidates(decomposition, context)));
}
/** Detect context facts before cross-layer scoring exclusions are applied. */
export function detectMcrStandardContextFanCandidates(decomposition, context) {
    const fanCodes = new Set();
    const setTiles = [...decomposition.concealedMelds, ...decomposition.declaredMelds]
        .filter((meld) => meld.kind !== 'sequence')
        .map((meld) => meld.tile);
    const dragonSets = setTiles.filter(isDragon);
    const windSets = setTiles.filter(isWind);
    const isClosed = decomposition.declaredMelds.every((meld) => meld.kind === 'kong' && meld.exposure === 'concealed');
    const isAllExposed = decomposition.concealedMelds.length === 0 &&
        decomposition.declaredMelds.length === 4 &&
        decomposition.declaredMelds.every((meld) => meld.kind !== 'kong' || meld.exposure === 'melded');
    if (dragonSets.length === 3) {
        fanCodes.add('mcr-02');
        fanCodes.add('mcr-54');
        fanCodes.add('mcr-59');
    }
    else if (dragonSets.length === 2 && isDragon(decomposition.pair.tile) &&
        !dragonSets.includes(decomposition.pair.tile)) {
        fanCodes.add('mcr-10');
        fanCodes.add('mcr-54');
        fanCodes.add('mcr-59');
    }
    else if (dragonSets.length === 2)
        fanCodes.add('mcr-54');
    else if (dragonSets.length === 1)
        fanCodes.add('mcr-59');
    if (windSets.length === 4) {
        fanCodes.add('mcr-01');
        fanCodes.add('mcr-38');
    }
    else if (windSets.length === 3 && isWind(decomposition.pair.tile) &&
        !windSets.includes(decomposition.pair.tile)) {
        fanCodes.add('mcr-09');
        fanCodes.add('mcr-38');
    }
    else if (windSets.length === 3)
        fanCodes.add('mcr-38');
    if (setTiles.includes(context.roundWind))
        fanCodes.add('mcr-60');
    if (setTiles.includes(context.seatWind))
        fanCodes.add('mcr-61');
    if (context.winMethod === 'self-draw') {
        fanCodes.add(isClosed ? 'mcr-56' : 'mcr-80');
    }
    else if (isClosed) {
        fanCodes.add('mcr-62');
    }
    else if (isAllExposed && context.winningTile === decomposition.pair.tile) {
        fanCodes.add('mcr-53');
    }
    return [...fanCodes].sort();
}
/** Resolve the highest applicable kong and concealed-set add-ons for zero to four kongs. */
export function detectMcrKongFans(decomposition) {
    const kongs = decomposition.declaredMelds.filter((meld) => meld.kind === 'kong');
    if (kongs.length > 4)
        return null;
    const concealedCount = kongs.filter((kong) => kong.exposure === 'concealed').length;
    const meldedCount = kongs.length - concealedCount;
    if (kongs.length >= 3) {
        const addOn = concealedKongAddOn(concealedCount);
        return [kongs.length === 4 ? 'mcr-05' : 'mcr-17', ...(addOn ? [addOn] : [])];
    }
    if (concealedCount === 2)
        return ['mcr-48'];
    if (meldedCount === 2)
        return ['mcr-57'];
    if (concealedCount === 1 && meldedCount === 1)
        return ['mcr-57', 'mcr-67'];
    if (concealedCount === 1)
        return ['mcr-67'];
    if (meldedCount === 1)
        return ['mcr-74'];
    return [];
}
function concealedKongAddOn(count) {
    if (count === 4)
        return 'mcr-12';
    if (count === 3)
        return 'mcr-33';
    if (count === 2)
        return 'mcr-48';
    if (count === 1)
        return 'mcr-67';
    return null;
}
/**
 * Detect mutually exclusive two/three/four concealed-set fan candidates. A triplet
 * completed by discard is exposed for these fans; self-drawn triplets remain concealed.
 */
export function detectMcrConcealedSetFanAlternatives(decomposition, context) {
    const concealedTriplets = decomposition.concealedMelds.filter((meld) => meld.kind === 'triplet');
    const concealedKongCount = decomposition.declaredMelds.filter((meld) => meld.kind === 'kong' && meld.exposure === 'concealed').length;
    const baseCount = concealedTriplets.length + concealedKongCount;
    if (context.winMethod === 'self-draw') {
        return concealedSetFan(baseCount);
    }
    const possibleCounts = new Set();
    if (decomposition.pair.tile === context.winningTile)
        possibleCounts.add(baseCount);
    for (const meld of decomposition.concealedMelds) {
        if (meld.kind === 'sequence' && meld.tiles.includes(context.winningTile)) {
            possibleCounts.add(baseCount);
        }
        if (meld.kind === 'triplet' && meld.tile === context.winningTile) {
            possibleCounts.add(baseCount - 1);
        }
    }
    return [...new Set([...possibleCounts].flatMap(concealedSetFan))].sort();
}
function meldFaces(meld) {
    if (meld.kind === 'sequence')
        return [...meld.tiles];
    return new Array(meld.kind === 'kong' ? 4 : 3).fill(meld.tile);
}
function groupContainsTerminalOrHonor(meld) {
    if (meld.kind === 'sequence') {
        const firstRank = mcrTileRank(meld.tiles[0]);
        return firstRank === 1 || firstRank === 7;
    }
    return isTerminalOrHonor(meld.tile);
}
function isTerminalOrHonor(tile) {
    return !isMcrSuitedTile(tile) || isTerminal(tile);
}
function isTerminal(tile) {
    return isMcrSuitedTile(tile) && (mcrTileRank(tile) === 1 || mcrTileRank(tile) === 9);
}
function containsFive(meld) {
    if (meld.kind === 'sequence') {
        const start = mcrTileRank(meld.tiles[0]);
        return start >= 3 && start <= 5;
    }
    return isMcrSuitedTile(meld.tile) && mcrTileRank(meld.tile) === 5;
}
function isOneSuitDoubleDragon(decomposition) {
    const sequences = allSequences(decomposition);
    if (sequences.length !== 4 || !isMcrSuitedTile(decomposition.pair.tile) ||
        mcrTileRank(decomposition.pair.tile) !== 5)
        return false;
    const pairSuit = mcrTileSuit(decomposition.pair.tile);
    return sequences.every((sequence) => sequence.suit === pairSuit) &&
        sequenceStarts(sequences) === '1,1,7,7';
}
function isThreeSuitDoubleDragon(decomposition) {
    const sequences = allSequences(decomposition);
    if (sequences.length !== 4 || !isMcrSuitedTile(decomposition.pair.tile) ||
        mcrTileRank(decomposition.pair.tile) !== 5)
        return false;
    const lowSuits = sequences.filter((sequence) => sequence.start === 1)
        .map((sequence) => sequence.suit);
    const highSuits = sequences.filter((sequence) => sequence.start === 7)
        .map((sequence) => sequence.suit);
    if (lowSuits.length !== 2 || highSuits.length !== 2 ||
        new Set(lowSuits).size !== 2 || new Set(highSuits).size !== 2)
        return false;
    const dragonSuits = new Set(lowSuits);
    if (!highSuits.every((suit) => dragonSuits.has(suit)))
        return false;
    const pairSuit = mcrTileSuit(decomposition.pair.tile);
    return !dragonSuits.has(pairSuit);
}
function allSequences(decomposition) {
    return [...decomposition.concealedMelds, ...decomposition.declaredMelds]
        .filter((meld) => meld.kind === 'sequence')
        .map((meld) => ({ suit: mcrTileSuit(meld.tiles[0]), start: mcrTileRank(meld.tiles[0]) }));
}
function sequenceStarts(sequences) {
    return sequences.map((sequence) => sequence.start).sort((left, right) => left - right).join(',');
}
function isDragon(tile) {
    return tile === 'C' || tile === 'F' || tile === 'P';
}
function isWind(tile) {
    return tile === 'E' || tile === 'S' || tile === 'W' || tile === 'N';
}
function concealedSetFan(count) {
    if (count >= 4)
        return ['mcr-12'];
    if (count === 3)
        return ['mcr-33'];
    if (count === 2)
        return ['mcr-66'];
    return [];
}
