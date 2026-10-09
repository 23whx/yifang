// Pinned local copy: miaoda-game-mcr-mahjong-analysis-core 0.3.1 (MIT metadata); see docs/mcr-dependencies.md.
import { createMcrResearchFanOccurrence, resolveMcrFanOccurrenceExclusions, } from './fan-occurrence-research.js';
import { enumerateMcrWinningStructures, mcrKnittedPatterns } from './structures.js';
import { MCR_NUMBER_SUITS, MCR_STRUCTURE_TILES, compareMcrTileFaces, isMcrSuitedTile, mcrTileRank, mcrTileSuit, } from './tiles.js';
import { isMcrPushNotDown } from './whole-hand-pattern-research.js';
/**
 * Narrow research scorer for the first authorized closed-hand golden cases.
 * It is intentionally not exported from the package entry point.
 */
export function scoreMcrClosedGoldenHand(faces, options) {
    const analysis = analyzeMcrClosedGoldenHand(faces, options);
    return analysis ? { fanCodes: analysis.fanCodes, total: analysis.total } : null;
}
/** Analyze the authorized special-hand subset from raw occurrences through exclusions. */
export function analyzeMcrClosedGoldenHand(faces, options) {
    const structures = enumerateMcrWinningStructures(faces);
    if (structures.length === 0)
        return null;
    const fanCandidates = [];
    const wholeHandTiles = [...faces].sort(compareMcrTileFaces);
    const thirteenOrphans = structures.some((structure) => structure.kind === 'thirteen-orphans');
    const sevenPairs = structures.some((structure) => structure.kind === 'seven-pairs');
    const allNotConnected = structures.find((structure) => structure.kind === 'all-not-connected');
    const combinationDragon = structures.find((structure) => structure.kind === 'combination-dragon');
    const nineGates = isNineGates(faces, options?.winningTile);
    const consecutiveSevenPairs = isConsecutiveSevenPairs(faces);
    if (nineGates)
        fanCandidates.push({ index: 4, matchedTiles: wholeHandTiles });
    else if (consecutiveSevenPairs) {
        fanCandidates.push({ index: 6, matchedTiles: wholeHandTiles });
    }
    else if (thirteenOrphans)
        fanCandidates.push({ index: 7, matchedTiles: wholeHandTiles });
    else if (sevenPairs)
        fanCandidates.push({ index: 19, matchedTiles: wholeHandTiles });
    else if (allNotConnected?.sevenStar) {
        fanCandidates.push({ index: 20, matchedTiles: wholeHandTiles });
    }
    else if (allNotConnected)
        fanCandidates.push({ index: 34, matchedTiles: wholeHandTiles });
    else if (combinationDragon) {
        fanCandidates.push({ index: 35, matchedTiles: combinationDragonTiles(structures, faces) });
    }
    else
        return null;
    // Preserve definition-contained lower structures so exclusions remain explainable.
    if (consecutiveSevenPairs && sevenPairs) {
        fanCandidates.push({ index: 19, matchedTiles: wholeHandTiles });
    }
    if (allNotConnected?.sevenStar) {
        fanCandidates.push({ index: 34, matchedTiles: wholeHandTiles });
    }
    fanCandidates.push(...detectWholeHandCompositionFanIndexes(faces)
        .map((index) => ({ index, matchedTiles: wholeHandTiles })));
    if (fanCandidates[0].index !== 35 && hasCombinationDragonTiles(faces)) {
        fanCandidates.push({ index: 35, matchedTiles: combinationDragonTiles(structures, faces) });
    }
    const pureStraight = pureStraightTiles(structures);
    if (pureStraight.length > 0)
        fanCandidates.push({ index: 28, matchedTiles: pureStraight });
    if (combinationDragon?.meld.kind === 'sequence' &&
        isMcrSuitedTile(combinationDragon.pair.tile)) {
        fanCandidates.push({ index: 63, matchedTiles: wholeHandTiles });
    }
    if (options.selfDraw)
        fanCandidates.push({ index: 56, matchedTiles: [] });
    const occurrences = occurrencesForFanCandidates(fanCandidates);
    occurrences.push(...selectCombinationDragonResidualOccurrences(structures));
    for (const tile of tileHogTiles(faces)) {
        occurrences.push(createMcrResearchFanOccurrence('mcr-64', 'special', {
            key: `special:mcr-64:${tile}`,
            matchedTiles: [tile],
        }));
    }
    const resolved = resolveMcrFanOccurrenceExclusions(occurrences);
    const fanCodes = resolved.occurrences.map((occurrence) => occurrence.fanCode);
    const total = resolved.occurrences.reduce((sum, occurrence) => sum + occurrence.points, 0);
    return { fanCodes, total, occurrences: resolved.occurrences, exclusions: resolved.exclusions };
}
function selectCombinationDragonResidualOccurrences(structures) {
    const candidates = new Map();
    for (const structure of structures) {
        if (structure.kind !== 'combination-dragon' || structure.meld.kind !== 'triplet')
            continue;
        const tile = structure.meld.tile;
        const fanCode = isDragon(tile)
            ? 'mcr-59'
            : isTerminalOrWind(tile) ? 'mcr-73' : null;
        if (!fanCode)
            continue;
        const occurrence = createMcrResearchFanOccurrence(fanCode, 'special', {
            key: `special:${fanCode}:residual:${tile}`,
            matchedTiles: [tile],
        });
        candidates.set(occurrence.key, occurrence);
    }
    const best = [...candidates.values()].sort((left, right) => right.points - left.points || left.key.localeCompare(right.key))[0];
    return best ? [best] : [];
}
function occurrencesForFanCandidates(candidates) {
    const counts = new Map();
    return candidates.map(({ index, matchedTiles }) => {
        const code = fanCode(index);
        const occurrenceIndex = counts.get(code) ?? 0;
        const source = code === 'mcr-56' ? 'context' : 'special';
        counts.set(code, occurrenceIndex + 1);
        return createMcrResearchFanOccurrence(code, source, {
            key: `${source}:${code}:${occurrenceIndex}`,
            matchedTiles,
        });
    });
}
function detectWholeHandCompositionFanIndexes(faces) {
    const fans = [];
    const suited = faces.filter(isMcrSuitedTile);
    const suits = new Set(suited.map(mcrTileSuit));
    const hasHonors = suited.length !== faces.length;
    const ranks = suited.map(mcrTileRank);
    if (faces.every((face) => ['2s', '3s', '4s', '6s', '8s', 'F'].includes(face)))
        fans.push(3);
    if (isOneSuitDoubleDragonFaces(faces))
        fans.push(13);
    if (isMcrPushNotDown(faces))
        fans.push(40);
    if (suited.length === 0)
        fans.push(11);
    if (!hasHonors && ranks.every((rank) => rank === 1 || rank === 9))
        fans.push(8);
    if (hasHonors && suited.length > 0 && ranks.every((rank) => rank === 1 || rank === 9)) {
        fans.push(18);
    }
    if (suits.size === 1 && !hasHonors)
        fans.push(22);
    if (suits.size === 1 && hasHonors)
        fans.push(50);
    if (!hasHonors && ranks.every((rank) => rank >= 7))
        fans.push(25);
    if (!hasHonors && ranks.every((rank) => rank >= 4 && rank <= 6))
        fans.push(26);
    if (!hasHonors && ranks.every((rank) => rank <= 3))
        fans.push(27);
    if (!hasHonors && ranks.every((rank) => rank >= 6))
        fans.push(36);
    if (!hasHonors && ranks.every((rank) => rank <= 4))
        fans.push(37);
    if (!hasHonors && ranks.every((rank) => rank >= 2 && rank <= 8))
        fans.push(68);
    if (suits.size === 3 && faces.some(isWind) && faces.some(isDragon))
        fans.push(52);
    if (suits.size === 2)
        fans.push(75);
    if (!hasHonors)
        fans.push(76);
    return fans;
}
function isOneSuitDoubleDragonFaces(faces) {
    if (faces.length !== 14 || !faces.every(isMcrSuitedTile))
        return false;
    const suited = faces;
    const suit = mcrTileSuit(suited[0]);
    if (!suited.every((tile) => mcrTileSuit(tile) === suit))
        return false;
    const counts = new Array(10).fill(0);
    for (const tile of suited)
        counts[mcrTileRank(tile)]++;
    return [1, 2, 3, 5, 7, 8, 9].every((rank) => counts[rank] === 2) &&
        [4, 6].every((rank) => counts[rank] === 0);
}
function isNineGates(faces, winningTile) {
    if (faces.length !== 14 || !faces.every(isMcrSuitedTile))
        return false;
    const suited = faces;
    const suit = mcrTileSuit(suited[0]);
    if (!suited.every((face) => mcrTileSuit(face) === suit))
        return false;
    const counts = new Array(10).fill(0);
    for (const face of suited)
        counts[mcrTileRank(face)]++;
    const minimum = [0, 3, 1, 1, 1, 1, 1, 1, 1, 3];
    // MCR requires the nine-way pre-win pattern, unlike final-shape-only
    // variants. The complete scorer supplies the actual winning tile.
    if (winningTile !== undefined) {
        const before = faces.slice();
        const index = before.indexOf(winningTile);
        if (index < 0) return false;
        before.splice(index, 1);
        const held = new Array(10).fill(0);
        for (const face of before) held[mcrTileRank(face)]++;
        if (!minimum.every((count, rank) => held[rank] === count)) return false;
    }
    return minimum.every((count, rank) => counts[rank] >= count) &&
        counts.reduce((sum, count) => sum + count, 0) === 14;
}
function isConsecutiveSevenPairs(faces) {
    if (faces.length !== 14 || !faces.every(isMcrSuitedTile))
        return false;
    const suited = faces;
    const suit = mcrTileSuit(suited[0]);
    if (!suited.every((face) => mcrTileSuit(face) === suit))
        return false;
    const ranks = [...new Set(suited.map(mcrTileRank))].sort((left, right) => left - right);
    if (ranks.length !== 7 || ranks.some((rank, index) => rank !== ranks[0] + index))
        return false;
    return ranks.every((rank) => suited.filter((face) => mcrTileRank(face) === rank).length === 2);
}
function pureStraightTiles(structures) {
    for (const structure of structures) {
        if (structure.kind !== 'standard')
            continue;
        for (const suit of MCR_NUMBER_SUITS) {
            const sequences = [1, 4, 7].map((start) => structure.melds.find((meld) => meld.kind === 'sequence' && mcrTileSuit(meld.tiles[0]) === suit &&
                mcrTileRank(meld.tiles[0]) === start));
            if (sequences.every((meld) => meld?.kind === 'sequence')) {
                return sequences.flatMap((meld) => meld.kind === 'sequence' ? meld.tiles : []);
            }
        }
    }
    return [];
}
function combinationDragonTiles(structures, faces) {
    const candidates = structures
        .filter((structure) => structure.kind === 'combination-dragon')
        .map((structure) => [...structure.knittedTiles].sort(compareMcrTileFaces));
    if (candidates.length === 0) {
        const faceSet = new Set(faces);
        candidates.push(...mcrKnittedPatterns()
            .filter((pattern) => pattern.every((tile) => faceSet.has(tile)))
            .map((pattern) => [...pattern].sort(compareMcrTileFaces)));
    }
    return candidates.sort((left, right) => left.join(',').localeCompare(right.join(',')))[0] ?? [];
}
function hasCombinationDragonTiles(faces) {
    const faceSet = new Set(faces);
    return mcrKnittedPatterns().some((pattern) => pattern.every((tile) => faceSet.has(tile)));
}
function tileHogTiles(faces) {
    const counts = new Array(MCR_STRUCTURE_TILES.length).fill(0);
    for (const face of faces)
        counts[MCR_STRUCTURE_TILES.indexOf(face)]++;
    return MCR_STRUCTURE_TILES.filter((_, index) => counts[index] === 4);
}
function fanCode(index) {
    return `mcr-${String(index).padStart(2, '0')}`;
}
function isWind(tile) {
    return tile === 'E' || tile === 'S' || tile === 'W' || tile === 'N';
}
function isDragon(tile) {
    return tile === 'C' || tile === 'F' || tile === 'P';
}
function isTerminalOrWind(tile) {
    return isMcrSuitedTile(tile)
        ? mcrTileRank(tile) === 1 || mcrTileRank(tile) === 9
        : isWind(tile);
}
