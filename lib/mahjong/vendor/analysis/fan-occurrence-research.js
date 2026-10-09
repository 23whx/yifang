// Pinned local copy: miaoda-game-mcr-mahjong-analysis-core 0.3.1 (MIT metadata); see docs/mcr-dependencies.md.
import { getMcrFanDefinition } from './fan-catalog.js';
import { resolveMcrFanExclusions, } from './fan-exclusions.js';
export function createMcrResearchFanOccurrence(fanCode, source, options = {}) {
    const definition = getMcrFanDefinition(fanCode);
    if (!definition)
        throw new Error(`mcr-analysis-core: unknown fan code ${fanCode}.`);
    return {
        key: options.key ?? `${source}:${fanCode}`,
        fanCode,
        name: definition.name,
        points: definition.points,
        source,
        matchedGroups: [...(options.matchedGroups ?? [])],
        matchedTiles: [...(options.matchedTiles ?? [])],
    };
}
export function resolveMcrFanOccurrenceExclusions(occurrences) {
    const resolution = resolveMcrFanExclusions(new Set(occurrences.map((occurrence) => occurrence.fanCode)));
    const allowed = new Set(resolution.fanCodes);
    const local = resolveGroupContainedExclusions(occurrences.filter((occurrence) => allowed.has(occurrence.fanCode)));
    return {
        occurrences: [...local.occurrences]
            .sort(compareOccurrences),
        exclusions: [...resolution.exclusions, ...local.exclusions]
            .sort((left, right) => left.fanCode.localeCompare(right.fanCode)),
    };
}
function resolveGroupContainedExclusions(occurrences) {
    const excludedKeys = new Set();
    const exclusions = [];
    // WMCC Explanation Item 1(6), Item 2(1)/(6): these six-face
    // compositions with Seven Pairs do not add Tile Hog. This is a
    // conjunctive exception, NOT a global All Green/All Terminals exclusion.
    // https://ooyamaneko.net/download/mahjong/mcr/Explanation_of_Mahjong_Competition_Rules_en.doc
    if (occurrences.some(o => o.fanCode === 'mcr-19')) {
        const causes = ['mcr-03', 'mcr-08'].filter(code => occurrences.some(o => o.fanCode === code));
        const hogs = occurrences.filter(o => o.fanCode === 'mcr-64');
        if (causes.length && hogs.length) {
            for (const hog of hogs) excludedKeys.add(hog.key);
            exclusions.push({fanCode:'mcr-64', excludedBy:[...causes, 'mcr-19'], occurrenceKeys:hogs.map(o => o.key).sort()});
        }
    }
    // A scoring seat/round wind already includes the generic wind-pung point.
    // Scope this to the same group (or special-hand wind tile), never all winds.
    for (const lower of occurrences.filter(o => o.fanCode === 'mcr-73')) {
        const causes = occurrences.filter(o => ['mcr-60', 'mcr-61'].includes(o.fanCode) &&
            (lower.matchedGroups.length > 0 && lower.matchedGroups.every(g => o.matchedGroups.includes(g)) ||
             lower.matchedGroups.length === 0 && lower.matchedTiles.length > 0 &&
             lower.matchedTiles.every(t => ['E','S','W','N'].includes(t) && o.matchedTiles.includes(t))));
        if (causes.length) {
            excludedKeys.add(lower.key);
            exclusions.push({fanCode:'mcr-73', excludedBy:[...new Set(causes.map(o => o.fanCode))], occurrenceKeys:[lower.key]});
        }
    }
    const threeWindGroups = occurrences
        .filter(({ fanCode }) => fanCode === 'mcr-38')
        .map((occurrence) => new Set(occurrence.matchedGroups));
    if (threeWindGroups.length > 0) {
        const terminalWindOccurrences = occurrences.filter((occurrence) => occurrence.fanCode === 'mcr-73' && occurrence.matchedGroups.length > 0 &&
            threeWindGroups.some((groups) => occurrence.matchedGroups.every((group) => groups.has(group))));
        for (const occurrence of terminalWindOccurrences)
            excludedKeys.add(occurrence.key);
        if (terminalWindOccurrences.length > 0) {
            exclusions.push({
                fanCode: 'mcr-73',
                excludedBy: ['mcr-38'],
                occurrenceKeys: terminalWindOccurrences.map(({ key }) => key).sort(),
            });
        }
    }
    return {
        occurrences: occurrences.filter(({ key }) => !excludedKeys.has(key)),
        exclusions,
    };
}
function compareOccurrences(left, right) {
    return left.fanCode.localeCompare(right.fanCode) || left.key.localeCompare(right.key);
}
