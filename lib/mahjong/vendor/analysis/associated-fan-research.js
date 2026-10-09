// Pinned local copy: miaoda-game-mcr-mahjong-analysis-core 0.3.1 (MIT metadata); see docs/mcr-dependencies.md.
import { optimizeMcrAssociatedFans, } from './combination-optimizer.js';
import { isMcrSuitedTile, mcrTileRank, mcrTileSuit } from './tiles.js';
/** Generate and optimize the verified sequence-association fan subset. */
export function selectMcrAssociatedStructureFans(decomposition) {
    const groups = [...decomposition.concealedMelds, ...decomposition.declaredMelds];
    const sequences = groups.flatMap((meld, group) => sequenceRef(meld, group));
    const sets = groups.flatMap((meld, group) => setRef(meld, group));
    const candidates = [];
    forEachCombination(sequences, 2, ([left, right]) => {
        if (left.suit === right.suit && left.start === right.start) {
            candidates.push(candidate('mcr-69', 1, [left.group, right.group]));
        }
        if (left.suit !== right.suit && left.start === right.start) {
            candidates.push(candidate('mcr-70', 1, [left.group, right.group]));
        }
        if (left.suit === right.suit && Math.abs(left.start - right.start) === 3) {
            candidates.push(candidate('mcr-71', 1, [left.group, right.group]));
        }
        if (left.suit === right.suit && [left.start, right.start].sort().join(',') === '1,7') {
            candidates.push(candidate('mcr-72', 1, [left.group, right.group]));
        }
    });
    forEachCombination(sequences, 3, (selected) => {
        const suits = new Set(selected.map((sequence) => sequence.suit));
        const starts = selected.map((sequence) => sequence.start).sort((left, right) => left - right);
        const groupIndexes = selected.map((sequence) => sequence.group);
        if (suits.size === 1 && new Set(starts).size === 1) {
            candidates.push(candidate('mcr-23', 24, groupIndexes));
        }
        if (suits.size === 3 && new Set(starts).size === 1) {
            candidates.push(candidate('mcr-41', 8, groupIndexes));
        }
        if (suits.size === 1 && starts.join(',') === '1,4,7') {
            candidates.push(candidate('mcr-28', 16, groupIndexes));
        }
        if (suits.size === 3 && starts.join(',') === '1,4,7') {
            candidates.push(candidate('mcr-39', 8, groupIndexes));
        }
        if (suits.size === 1 && isArithmeticStep(starts, [1, 2])) {
            candidates.push(candidate('mcr-30', 16, groupIndexes));
        }
        if (suits.size === 3 && isArithmeticStep(starts, [1])) {
            candidates.push(candidate('mcr-51', 6, groupIndexes));
        }
    });
    forEachCombination(sequences, 4, (selected) => {
        if (new Set(selected.map((sequence) => sequence.suit)).size === 1 &&
            new Set(selected.map((sequence) => sequence.start)).size === 1) {
            candidates.push(candidate('mcr-14', 48, selected.map((sequence) => sequence.group)));
        }
        const starts = selected.map((sequence) => sequence.start).sort((left, right) => left - right);
        if (new Set(selected.map((sequence) => sequence.suit)).size === 1 &&
            isArithmeticStep(starts, [1, 2])) {
            candidates.push(candidate('mcr-16', 32, selected.map((sequence) => sequence.group)));
        }
    });
    forEachCombination(sets, 2, ([left, right]) => {
        if (left.suit !== right.suit && left.rank === right.rank) {
            candidates.push(candidate('mcr-65', 2, [left.group, right.group]));
        }
    });
    forEachCombination(sets, 3, (selected) => {
        const suits = new Set(selected.map((set) => set.suit));
        const ranks = selected.map((set) => set.rank).sort((left, right) => left - right);
        const groupIndexes = selected.map((set) => set.group);
        if (suits.size === 3 && new Set(ranks).size === 1) {
            candidates.push(candidate('mcr-32', 16, groupIndexes));
        }
        if (suits.size === 1 && isArithmeticStep(ranks, [1])) {
            candidates.push(candidate('mcr-24', 24, groupIndexes));
        }
        if (suits.size === 3 && isArithmeticStep(ranks, [1])) {
            candidates.push(candidate('mcr-42', 8, groupIndexes));
        }
    });
    forEachCombination(sets, 4, (selected) => {
        const ranks = selected.map((set) => set.rank).sort((left, right) => left - right);
        if (new Set(selected.map((set) => set.suit)).size === 1 &&
            isArithmeticStep(ranks, [1])) {
            candidates.push(candidate('mcr-15', 48, selected.map((set) => set.group)));
        }
    });
    const selection = optimizeMcrAssociatedFans(candidates, groups.length);
    // The optimizer already chooses the non-repeating maximum, but a lower
    // association wholly contained in a selected higher association otherwise
    // vanishes from the final explanation. Report that exact lower occurrence
    // (e.g. triple/double chow within quadruple chow, or old-young within a
    // pure straight), without excluding another independent occurrence of the
    // same fan code that was actually selected on different groups.
    const absorbed = candidates.flatMap((lower) => {
        if (selection.candidates.some((selected) => selected.fanCode === lower.fanCode))
            return [];
        const upper = selection.candidates.find((selected) => selected.points > lower.points &&
            lower.matchedGroups.every((group) => selected.matchedGroups.includes(group)));
        return upper ? [{ lower, upper }] : [];
    });
    const exclusionsByFan = new Map();
    for (const { lower, upper } of absorbed) {
        const record = exclusionsByFan.get(lower.fanCode) ?? {
            fanCode: lower.fanCode,
            excludedBy: new Set(),
            occurrenceKeys: new Set(),
        };
        record.excludedBy.add(upper.fanCode);
        record.occurrenceKeys.add(lower.key);
        exclusionsByFan.set(lower.fanCode, record);
    }
    const exclusions = [...exclusionsByFan.values()].map((record) => ({
        fanCode: record.fanCode,
        excludedBy: [...record.excludedBy].sort(),
        occurrenceKeys: [...record.occurrenceKeys].sort(),
    })).sort((left, right) => left.fanCode.localeCompare(right.fanCode));
    return {
        ...selection,
        fanCodes: selection.candidates.map((selected) => fanCodeFromKey(selected.key)),
        exclusions,
    };
}
function sequenceRef(meld, group) {
    if (meld.kind !== 'sequence')
        return [];
    return [{ group, suit: mcrTileSuit(meld.tiles[0]), start: mcrTileRank(meld.tiles[0]) }];
}
function setRef(meld, group) {
    if (meld.kind === 'sequence' || !isMcrSuitedTile(meld.tile))
        return [];
    return [{ group, suit: mcrTileSuit(meld.tile), rank: mcrTileRank(meld.tile) }];
}
function candidate(fanCode, points, matchedGroups) {
    const groups = [...matchedGroups].sort((left, right) => left - right);
    return { fanCode, key: `${fanCode}:${groups.join(',')}`, points, matchedGroups: groups };
}
function fanCodeFromKey(key) {
    return key.slice(0, key.indexOf(':'));
}
function isArithmeticStep(values, allowedSteps) {
    if (values.length < 2)
        return false;
    const step = values[1] - values[0];
    return allowedSteps.includes(step) &&
        values.every((value, index) => index === 0 || value - values[index - 1] === step);
}
function forEachCombination(values, size, visit, start = 0, selected = []) {
    if (selected.length === size) {
        visit(selected);
        return;
    }
    for (let index = start; index <= values.length - (size - selected.length); index++) {
        forEachCombination(values, size, visit, index + 1, [...selected, values[index]]);
    }
}
