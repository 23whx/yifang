// Pinned local copy: miaoda-game-mcr-mahjong-analysis-core 0.3.1 (MIT metadata); see docs/mcr-dependencies.md.
import { selectMcrAssociatedStructureFans } from './associated-fan-research.js';
import { MCR_FAN_CATALOG } from './fan-catalog.js';
import { createMcrResearchFanOccurrence, resolveMcrFanOccurrenceExclusions, } from './fan-occurrence-research.js';
import { detectMcrSimpleFanOccurrences } from './simple-occurrence-research.js';
import { detectMcrConcealedSetFanAlternatives, detectMcrKongFans, detectMcrStandardContextFanCandidates, detectMcrStandardStructureFanCandidates, } from './standard-hand-research.js';
import { compareMcrTileFaces } from './tiles.js';
import { enumerateMcrStandardWaits } from './wait-research.js';
/** Score only the ordinary-hand fan subset already covered by authorized tests. */
export function scoreMcrOrdinaryHandResearch(input) {
    const analysis = analyzeMcrOrdinaryHandResearch(input);
    if (!analysis)
        return null;
    return {
        fanCodes: analysis.fanCodes,
        total: analysis.total,
        decompositionIndex: analysis.decompositionIndex,
    };
}
/** Analyze the researched ordinary subset with occurrence and exclusion attribution. */
export function analyzeMcrOrdinaryHandResearch(input) {
    const wait = enumerateMcrStandardWaits({
        concealedTiles: input.concealedTilesBeforeWin,
        declaredMelds: input.declaredMelds,
    }).find((candidate) => candidate.tile === input.winningTile);
    if (!wait)
        return null;
    let best = null;
    for (let decompositionIndex = 0; decompositionIndex < wait.decompositionResults.length; decompositionIndex++) {
        const decompositionResult = wait.decompositionResults[decompositionIndex];
        const decomposition = decompositionResult.decomposition;
        const kongFans = detectMcrKongFans(decomposition);
        if (kongFans === null)
            return null;
        const kongFanCandidates = containedKongFanCodes(kongFans, decomposition);
        const baseOccurrences = [
            ...detectMcrStandardStructureFanCandidates(decomposition)
                .map((code) => createStructureOccurrence(code, decomposition)),
            ...detectMcrStandardContextFanCandidates(decomposition, input)
                .map((code) => createContextOccurrence(code, decomposition, input)),
            ...kongFanCandidates.map((code) => createKongOccurrence(code, decomposition)),
        ];
        const concealedAlternatives = detectMcrConcealedSetFanAlternatives(decomposition, input);
        const associated = selectMcrAssociatedStructureFans(decomposition);
        const simpleOccurrences = detectMcrSimpleFanOccurrences(decomposition);
        const candidates = combineOccurrenceAlternatives(baseOccurrences, concealedAlternatives, decompositionResult.fanAlternatives, decomposition, input);
        const attributedOccurrences = [
            ...associated.candidates.map((occurrence) => createMcrResearchFanOccurrence(occurrence.fanCode, 'associated', {
                key: occurrence.key,
                matchedGroups: occurrence.matchedGroups,
                matchedTiles: matchedTilesForGroups(decomposition, occurrence.matchedGroups),
            })),
            ...simpleOccurrences.map((occurrence) => createMcrResearchFanOccurrence(occurrence.fanCode, 'simple', {
                key: occurrence.key,
                matchedGroups: occurrence.matchedGroups,
                matchedTiles: [occurrence.tile],
            })),
        ];
        for (const baseCandidateOccurrences of candidates) {
            const resolved = resolveMcrFanOccurrenceExclusions([
                ...baseCandidateOccurrences,
                ...attributedOccurrences,
            ]);
            const fanCodes = resolved.occurrences.map((occurrence) => occurrence.fanCode);
            const candidate = {
                fanCodes,
                total: fanCodes.reduce((sum, code) => sum + fanPoints(code), 0),
                decompositionIndex,
                occurrences: resolved.occurrences,
                exclusions: [...resolved.exclusions, ...associated.exclusions]
                    .sort((left, right) => left.fanCode.localeCompare(right.fanCode)),
            };
            if (isBetterResult(candidate, best))
                best = candidate;
        }
    }
    return best;
}
function createStructureOccurrence(fanCode, decomposition) {
    const groups = [
        ...decomposition.concealedMelds,
        ...decomposition.declaredMelds,
        decomposition.pair,
    ];
    return createMcrResearchFanOccurrence(fanCode, 'structure', {
        matchedGroups: groups.map((_, index) => index),
        matchedTiles: matchedTilesForGroups(decomposition, groups.map((_, index) => index)),
    });
}
function matchedTilesForGroups(decomposition, groupIndexes) {
    const groups = [
        ...decomposition.concealedMelds,
        ...decomposition.declaredMelds,
        decomposition.pair,
    ];
    return groupIndexes.flatMap((index) => {
        const group = groups[index];
        if (group.kind === 'sequence')
            return [...group.tiles];
        const count = group.kind === 'pair' ? 2 : group.kind === 'kong' ? 4 : 3;
        return new Array(count).fill(group.tile);
    }).sort(compareMcrTileFaces);
}
function createContextOccurrence(fanCode, decomposition, input) {
    const melds = [...decomposition.concealedMelds, ...decomposition.declaredMelds];
    const pairIndex = melds.length;
    const indexedSets = melds.flatMap((meld, index) => meld.kind === 'sequence'
        ? []
        : [{ index, tile: meld.tile }]);
    const dragonSets = indexedSets.filter(({ tile }) => isDragon(tile));
    const windSets = indexedSets.filter(({ tile }) => isWind(tile));
    let matched = [];
    if (fanCode === 'mcr-02' || fanCode === 'mcr-54' || fanCode === 'mcr-59') {
        matched = dragonSets;
    }
    else if (fanCode === 'mcr-10') {
        matched = [...dragonSets, { index: pairIndex, tile: decomposition.pair.tile }];
    }
    else if (fanCode === 'mcr-01' || fanCode === 'mcr-38') {
        matched = windSets;
    }
    else if (fanCode === 'mcr-09') {
        matched = [...windSets, { index: pairIndex, tile: decomposition.pair.tile }];
    }
    else if (fanCode === 'mcr-60') {
        matched = indexedSets.filter(({ tile }) => tile === input.roundWind);
    }
    else if (fanCode === 'mcr-61') {
        matched = indexedSets.filter(({ tile }) => tile === input.seatWind);
    }
    else if (fanCode === 'mcr-53') {
        matched = [{ index: pairIndex, tile: input.winningTile }];
    }
    return createMcrResearchFanOccurrence(fanCode, 'context', {
        matchedGroups: matched.map(({ index }) => index),
        matchedTiles: matchedTilesForGroups(decomposition, matched.map(({ index }) => index)),
    });
}
function createKongOccurrence(fanCode, decomposition) {
    const concealedCount = decomposition.concealedMelds.length;
    const kongs = decomposition.declaredMelds.flatMap((meld, declaredIndex) => meld.kind === 'kong' ? [{
            index: concealedCount + declaredIndex,
            tile: meld.tile,
            exposure: meld.exposure,
        }] : []);
    const selected = fanCode === 'mcr-05'
        ? kongs
        : fanCode === 'mcr-17'
            ? kongs.slice(0, 3)
            : fanCode === 'mcr-57'
                ? kongs.length === 2
                    ? kongs
                    : kongs.filter(({ exposure }) => exposure === 'melded').slice(0, 2)
                : fanCode === 'mcr-12' || fanCode === 'mcr-33' ||
                    fanCode === 'mcr-48' || fanCode === 'mcr-67'
                    ? kongs.filter(({ exposure }) => exposure === 'concealed')
                    : fanCode === 'mcr-74'
                        ? kongs.filter(({ exposure }) => exposure === 'melded').slice(0, 1)
                        : [];
    return createMcrResearchFanOccurrence(fanCode, 'kong', {
        matchedGroups: selected.map(({ index }) => index),
        matchedTiles: selected.flatMap(({ tile }) => new Array(4).fill(tile)),
    });
}
function isDragon(tile) {
    return tile === 'C' || tile === 'F' || tile === 'P';
}
function isWind(tile) {
    return tile === 'E' || tile === 'S' || tile === 'W' || tile === 'N';
}
function createConcealedSetOccurrence(fanCode, decomposition, input) {
    const concealedSets = [
        ...decomposition.concealedMelds.flatMap((meld, index) => meld.kind === 'triplet'
            ? [{ index, tile: meld.tile, copies: 3 }]
            : []),
        ...decomposition.declaredMelds.flatMap((meld, declaredIndex) => meld.kind === 'kong' && meld.exposure === 'concealed'
            ? [{
                    index: decomposition.concealedMelds.length + declaredIndex,
                    tile: meld.tile,
                    copies: 4,
                }]
            : []),
    ];
    const candidates = [];
    if (input.winMethod === 'self-draw' || decomposition.pair.tile === input.winningTile ||
        decomposition.concealedMelds.some((meld) => meld.kind === 'sequence' && meld.tiles.includes(input.winningTile))) {
        candidates.push(concealedSets);
    }
    if (input.winMethod === 'discard') {
        for (const set of concealedSets) {
            if (set.copies === 3 && set.tile === input.winningTile) {
                candidates.push(concealedSets.filter(({ index }) => index !== set.index));
            }
        }
    }
    const requiredCount = fanCode === 'mcr-12' ? 4 : fanCode === 'mcr-33' ? 3 : 2;
    const selected = candidates
        .filter((candidate) => candidate.length >= requiredCount)
        .map((candidate) => candidate.slice(0, requiredCount))
        .sort((left, right) => left.map(({ index }) => index).join(',')
        .localeCompare(right.map(({ index }) => index).join(',')))[0] ?? [];
    return createMcrResearchFanOccurrence(fanCode, 'concealed-set', {
        matchedGroups: selected.map(({ index }) => index),
        matchedTiles: selected.flatMap(({ tile, copies }) => new Array(copies).fill(tile)),
    });
}
function combineOccurrenceAlternatives(baseOccurrences, concealedAlternatives, waitAlternatives, decomposition, input) {
    const concealedChoices = concealedAlternatives.length > 0 ? concealedAlternatives : [null];
    const waitChoices = waitAlternatives.length > 0 ? waitAlternatives : [null];
    return concealedChoices.flatMap((concealed) => waitChoices.map((wait) => {
        const selected = [...baseOccurrences];
        const selectedCodes = new Set(selected.map((occurrence) => occurrence.fanCode));
        if (concealed) {
            for (const fanCode of containedConcealedSetFanCodes(concealed)) {
                if (selectedCodes.has(fanCode))
                    continue;
                selected.push(createConcealedSetOccurrence(fanCode, decomposition, input));
                selectedCodes.add(fanCode);
            }
        }
        if (wait && !selectedCodes.has(wait)) {
            selected.push(createMcrResearchFanOccurrence(wait, 'wait', {
                matchedTiles: [input.winningTile],
            }));
        }
        return selected;
    }));
}
function containedConcealedSetFanCodes(fanCode) {
    if (fanCode === 'mcr-12')
        return ['mcr-12', 'mcr-33', 'mcr-66'];
    if (fanCode === 'mcr-33')
        return ['mcr-33', 'mcr-66'];
    return [fanCode];
}
function containedKongFanCodes(fanCodes, decomposition) {
    const candidates = new Set(fanCodes);
    const highKongCount = candidates.has('mcr-05') || candidates.has('mcr-17');
    if (candidates.has('mcr-05'))
        candidates.add('mcr-17');
    const meldedCount = decomposition.declaredMelds.filter((meld) => meld.kind === 'kong' && meld.exposure === 'melded').length;
    if (highKongCount && meldedCount >= 2)
        candidates.add('mcr-57');
    if (highKongCount && meldedCount >= 1)
        candidates.add('mcr-74');
    if (candidates.has('mcr-48'))
        candidates.add('mcr-67');
    if (candidates.has('mcr-57'))
        candidates.add('mcr-74');
    return [...candidates].sort();
}
function fanPoints(code) {
    return MCR_FAN_CATALOG.find((fan) => fan.code === code)?.points ?? 0;
}
function isBetterResult(candidate, current) {
    if (!current || candidate.total !== current.total)
        return !current || candidate.total > current.total;
    const candidateSignature = candidate.fanCodes.join(',');
    const currentSignature = current.fanCodes.join(',');
    return candidateSignature.localeCompare(currentSignature) < 0 ||
        (candidateSignature === currentSignature &&
            candidate.decompositionIndex < current.decompositionIndex);
}
