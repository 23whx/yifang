// Pinned local copy: miaoda-game-mcr-mahjong-analysis-core 0.3.1 (MIT metadata); see docs/mcr-dependencies.md.
import { MCR_FAN_CATALOG } from './fan-catalog.js';
import { createMcrResearchFanOccurrence, resolveMcrFanOccurrenceExclusions, } from './fan-occurrence-research.js';
/** Detect event-only fans while preserving the eight-point non-flower threshold boundary. */
export function scoreMcrWinEventResearch(input) {
    const analysis = analyzeMcrWinEventResearch(input);
    if (!analysis)
        return null;
    return {
        fanCodes: analysis.fanCodes,
        nonFlowerTotal: analysis.nonFlowerTotal,
        flowerPoints: analysis.flowerPoints,
        total: analysis.total,
    };
}
/** Analyze event and flower fans with repeatable occurrence attribution. */
export function analyzeMcrWinEventResearch(input) {
    if (!Number.isSafeInteger(input.flowerCount) || input.flowerCount < 0 ||
        input.flowerCount > 8)
        return null;
    if (input.lastWallEvent && input.source !== 'wall' && input.source !== 'discard')
        return null;
    const eventFans = new Set();
    if (input.source === 'wall' && input.lastWallEvent)
        eventFans.add('mcr-44');
    if (input.source === 'discard' && input.lastWallEvent)
        eventFans.add('mcr-45');
    if (input.source === 'kong-replacement')
        eventFans.add('mcr-46');
    if (input.source === 'robbed-kong')
        eventFans.add('mcr-47');
    if (input.lastCopy)
        eventFans.add('mcr-58');
    const resolved = resolveMcrFanOccurrenceExclusions([...eventFans]
        .map((code) => createMcrResearchFanOccurrence(code, 'event')));
    const flowerOccurrences = Array.from({ length: input.flowerCount }, (_, index) => createMcrResearchFanOccurrence('mcr-81', 'flower', { key: `flower:mcr-81:${index}` }));
    const occurrences = [...resolved.occurrences, ...flowerOccurrences];
    const nonFlowerFanCodes = resolved.occurrences.map((occurrence) => occurrence.fanCode);
    const flowerFanCodes = flowerOccurrences.map((occurrence) => occurrence.fanCode);
    const nonFlowerTotal = nonFlowerFanCodes.reduce((sum, code) => sum + fanPoints(code), 0);
    return {
        fanCodes: [...nonFlowerFanCodes, ...flowerFanCodes],
        nonFlowerTotal,
        flowerPoints: input.flowerCount,
        total: nonFlowerTotal + input.flowerCount,
        occurrences,
        exclusions: resolved.exclusions,
    };
}
function fanPoints(code) {
    return MCR_FAN_CATALOG.find((fan) => fan.code === code)?.points ?? 0;
}
