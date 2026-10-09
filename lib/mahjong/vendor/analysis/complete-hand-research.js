// Pinned local copy: miaoda-game-mcr-mahjong-analysis-core 0.3.1 (MIT metadata); see docs/mcr-dependencies.md.
import { analyzeMcrClosedGoldenHand } from './closed-hand-research.js';
import { enumerateMcrClosedWaits } from './closed-wait-research.js';
import { createMcrResearchFanOccurrence, resolveMcrFanOccurrenceExclusions, } from './fan-occurrence-research.js';
import { analyzeMcrOrdinaryHandResearch, } from './ordinary-hand-research.js';
import { enumerateMcrWinningStructures } from './structures.js';
import { mcrTileRank } from './tiles.js';
import { analyzeMcrWinEventResearch, } from './win-event-research.js';
/** Combine the researched ordinary-hand and event layers before applying 无番和. */
export function scoreMcrCompleteOrdinaryHandResearch(input) {
    const analysis = analyzeMcrCompleteOrdinaryHandResearch(input);
    if (!analysis)
        return null;
    return projectCompleteResult(analysis);
}
/** Analyze ordinary, event, no-fan, and flower occurrences through the final scoring stage. */
export function analyzeMcrCompleteOrdinaryHandResearch(input) {
    if (winMethodForSource(input.event.source) !== input.winMethod)
        return null;
    const ordinary = analyzeMcrOrdinaryHandResearch(input);
    if (!ordinary)
        return null;
    const finalized = finalizeMcrResearchOccurrences(ordinary.occurrences, ordinary.exclusions, input.event, input.winningTile);
    if (!finalized)
        return null;
    return { ...finalized, decompositionIndex: ordinary.decompositionIndex };
}
/** Apply the shared final scoring stage to the authorized closed-hand golden subset. */
export function scoreMcrCompleteClosedGoldenHandResearch(input) {
    const analysis = analyzeMcrCompleteClosedGoldenHandResearch(input);
    return analysis ? projectCompleteResult(analysis) : null;
}
/** Analyze the authorized special-hand subset through the shared occurrence finalizer. */
export function analyzeMcrCompleteClosedGoldenHandResearch(input) {
    if (winMethodForSource(input.event.source) !== input.winMethod)
        return null;
    const golden = analyzeMcrClosedGoldenHand(input.tiles, {
        selfDraw: input.winMethod === 'self-draw',
        winningTile: input.winningTile,
    });
    if (!golden)
        return null;
    const contextFanCodes = [];
    const residualWind = golden.occurrences.find((occurrence) => occurrence.fanCode === 'mcr-73' && occurrence.source === 'special' &&
        occurrence.matchedTiles.length === 1 && isWindTile(occurrence.matchedTiles[0]))
        ?.matchedTiles[0];
    if (residualWind === input.roundWind)
        contextFanCodes.push('mcr-60');
    if (residualWind === input.seatWind)
        contextFanCodes.push('mcr-61');
    if (input.winMethod === 'discard')
        contextFanCodes.push('mcr-62');
    const waitFanCode = detectCombinationDragonWaitFan(input.tiles, input.winningTile);
    if (waitFanCode)
        contextFanCodes.push(waitFanCode);
    const contextOccurrences = contextFanCodes.map((fanCode) => createMcrResearchFanOccurrence(fanCode, 'context', {
        matchedTiles: matchedContextTiles(fanCode, residualWind, input.winningTile),
    }));
    return finalizeMcrResearchOccurrences([...golden.occurrences, ...contextOccurrences], golden.exclusions, input.event, input.winningTile);
}
function matchedContextTiles(fanCode, residualWind, winningTile) {
    if ((fanCode === 'mcr-60' || fanCode === 'mcr-61') && residualWind)
        return [residualWind];
    if (fanCode === 'mcr-77' || fanCode === 'mcr-78' || fanCode === 'mcr-79') {
        return [winningTile];
    }
    return [];
}
function finalizeMcrResearchOccurrences(baseOccurrences, inheritedExclusions, eventInput, winningTile) {
    const event = analyzeMcrWinEventResearch(eventInput);
    if (!event)
        return null;
    const eventNonFlowerOccurrences = event.occurrences
        .filter((occurrence) => occurrence.source !== 'flower')
        .map((occurrence) => ({ ...occurrence, matchedTiles: [winningTile] }));
    const flowerOccurrences = event.occurrences
        .filter((occurrence) => occurrence.source === 'flower');
    const resolved = resolveMcrFanOccurrenceExclusions([
        ...baseOccurrences,
        ...eventNonFlowerOccurrences,
    ]);
    const nonFlowerOccurrences = resolved.occurrences.length > 0
        ? resolved.occurrences
        : [createMcrResearchFanOccurrence('mcr-43', 'no-fan')];
    const nonFlowerTotal = nonFlowerOccurrences.reduce((sum, occurrence) => sum + occurrence.points, 0);
    if (nonFlowerTotal < 8)
        return null;
    const occurrences = [...nonFlowerOccurrences, ...flowerOccurrences];
    return {
        fanCodes: occurrences.map((occurrence) => occurrence.fanCode),
        nonFlowerTotal,
        flowerPoints: eventInput.flowerCount,
        total: nonFlowerTotal + eventInput.flowerCount,
        occurrences,
        exclusions: mergeExclusions(inheritedExclusions, event.exclusions, resolved.exclusions),
    };
}
function mergeExclusions(...groups) {
    const causesByFan = new Map();
    const occurrenceKeysByFan = new Map();
    for (const exclusion of groups.flat()) {
        const causes = causesByFan.get(exclusion.fanCode) ?? new Set();
        for (const cause of exclusion.excludedBy)
            causes.add(cause);
        causesByFan.set(exclusion.fanCode, causes);
        if (exclusion.occurrenceKeys) {
            const keys = occurrenceKeysByFan.get(exclusion.fanCode) ?? new Set();
            for (const key of exclusion.occurrenceKeys)
                keys.add(key);
            occurrenceKeysByFan.set(exclusion.fanCode, keys);
        }
    }
    return [...causesByFan]
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([fanCode, causes]) => {
        const occurrenceKeys = occurrenceKeysByFan.get(fanCode);
        return {
            fanCode,
            excludedBy: [...causes].sort(),
            ...(occurrenceKeys ? { occurrenceKeys: [...occurrenceKeys].sort() } : {}),
        };
    });
}
function projectCompleteResult(analysis) {
    const { occurrences: _occurrences, exclusions: _exclusions, ...result } = analysis;
    return result;
}
function winMethodForSource(source) {
    return source === 'discard' || source === 'robbed-kong' ? 'discard' : 'self-draw';
}
function isWindTile(tile) {
    return tile === 'E' || tile === 'S' || tile === 'W' || tile === 'N';
}
function detectCombinationDragonWaitFan(tiles, winningTile) {
    const concealedTilesBeforeWin = [...tiles];
    const winningIndex = concealedTilesBeforeWin.lastIndexOf(winningTile);
    if (winningIndex < 0)
        return null;
    concealedTilesBeforeWin.splice(winningIndex, 1);
    const waits = enumerateMcrClosedWaits(concealedTilesBeforeWin);
    // 边张、坎张和单调将 all require this to be the only winning face.
    if (waits.length !== 1 || waits[0]?.tile !== winningTile)
        return null;
    const combinationDragons = enumerateMcrWinningStructures(tiles)
        .filter((structure) => structure.kind === 'combination-dragon');
    if (combinationDragons.length === 0)
        return null;
    // Exhaustive structure tests establish that a legal 14-tile hand has at most one.
    const structure = combinationDragons[0];
    const candidates = new Set();
    if (structure.pair.tile === winningTile)
        candidates.add('mcr-79');
    if (structure.meld.kind === 'sequence') {
        const winningPosition = structure.meld.tiles.indexOf(winningTile);
        const firstRank = mcrTileRank(structure.meld.tiles[0]);
        if (winningPosition === 1)
            candidates.add('mcr-78');
        if ((winningPosition === 2 && firstRank === 1) ||
            (winningPosition === 0 && firstRank === 7))
            candidates.add('mcr-77');
    }
    return [...candidates].sort()[0] ?? null;
}
