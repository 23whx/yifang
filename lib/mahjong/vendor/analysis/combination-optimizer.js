// Pinned local copy: miaoda-game-mcr-mahjong-analysis-core 0.3.1 (MIT metadata); see docs/mcr-dependencies.md.
/**
 * Research implementation of the no-separation/no-identical/once-only model.
 * Kept internal until all authorized appendix examples have been transcribed.
 */
export function optimizeMcrAssociatedFans(candidates, groupCount) {
    if (!Number.isSafeInteger(groupCount) || groupCount < 0 || groupCount > 5) {
        throw new Error('mcr-analysis-core: groupCount must be an integer from 0 to 5.');
    }
    const normalized = candidates.map(normalizeCandidate).sort(compareCandidates);
    if (normalized.length > 256) {
        throw new Error('mcr-analysis-core: at most 256 associated fan candidates are allowed.');
    }
    if (normalized.some((candidate) => candidate.matchedGroups.some((group) => group >= groupCount))) {
        throw new Error('mcr-analysis-core: candidate group index is outside groupCount.');
    }
    let best = { points: 0, candidates: [] };
    const visited = new Map();
    const visit = (index, parent, groupsByFan, selected, points) => {
        const stateKey = `${index}:${parentSignature(parent)}:${fanUsageSignature(groupsByFan)}`;
        const signature = candidateListSignature(selected);
        const previous = visited.get(stateKey);
        if (previous && (previous.points > points ||
            (previous.points === points && previous.signature.localeCompare(signature) <= 0)))
            return;
        visited.set(stateKey, { points, signature });
        if (index === normalized.length) {
            const candidate = { points, candidates: selected };
            if (isBetterSelection(candidate, best))
                best = candidate;
            return;
        }
        visit(index + 1, parent, groupsByFan, selected, points);
        const occurrence = normalized[index];
        if (occurrence.matchedGroups.some((group) => groupsByFan.get(occurrence.fanCode)?.has(group))) {
            return;
        }
        const nextParent = addAcyclicRelation(parent, occurrence.matchedGroups);
        if (nextParent) {
            const nextGroupsByFan = new Map(groupsByFan);
            nextGroupsByFan.set(occurrence.fanCode, new Set([
                ...(groupsByFan.get(occurrence.fanCode) ?? []),
                ...occurrence.matchedGroups,
            ]));
            visit(index + 1, nextParent, nextGroupsByFan, [...selected, occurrence], points + occurrence.points);
        }
    };
    visit(0, Array.from({ length: groupCount }, (_, index) => index), new Map(), [], 0);
    return best;
}
function normalizeCandidate(candidate) {
    if (!candidate || typeof candidate.fanCode !== 'string' || candidate.fanCode.length === 0 ||
        typeof candidate.key !== 'string' || candidate.key.length === 0 ||
        !Number.isSafeInteger(candidate.points) || candidate.points <= 0) {
        throw new Error('mcr-analysis-core: invalid associated fan candidate.');
    }
    const matchedGroups = [...candidate.matchedGroups].sort((left, right) => left - right);
    if (matchedGroups.length < 2 || new Set(matchedGroups).size !== matchedGroups.length ||
        matchedGroups.some((group) => !Number.isSafeInteger(group) || group < 0)) {
        throw new Error('mcr-analysis-core: candidates require at least two unique group indexes.');
    }
    return { ...candidate, matchedGroups };
}
function addAcyclicRelation(parent, groups) {
    const next = [...parent];
    const roots = groups.map((group) => find(next, group));
    if (new Set(roots).size !== roots.length)
        return null;
    for (let index = 1; index < roots.length; index++)
        union(next, roots[0], roots[index]);
    return next;
}
function find(parent, value) {
    if (parent[value] !== value)
        parent[value] = find(parent, parent[value]);
    return parent[value];
}
function union(parent, left, right) {
    const leftRoot = find(parent, left);
    const rightRoot = find(parent, right);
    if (leftRoot === rightRoot)
        return;
    if (leftRoot < rightRoot)
        parent[rightRoot] = leftRoot;
    else
        parent[leftRoot] = rightRoot;
}
function compareCandidates(left, right) {
    return right.points - left.points || left.key.localeCompare(right.key) ||
        groupSignature(left).localeCompare(groupSignature(right));
}
function fanUsageSignature(groupsByFan) {
    return [...groupsByFan]
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([fanCode, groups]) => `${fanCode}=${[...groups].sort((left, right) => left - right).join(',')}`)
        .join(';');
}
function isBetterSelection(candidate, current) {
    if (candidate.points !== current.points)
        return candidate.points > current.points;
    return selectionSignature(candidate).localeCompare(selectionSignature(current)) < 0;
}
function groupSignature(candidate) {
    return candidate.matchedGroups.join(',');
}
function selectionSignature(selection) {
    return candidateListSignature(selection.candidates);
}
function candidateListSignature(candidates) {
    return candidates.map((candidate) => `${candidate.key}:${groupSignature(candidate)}`)
        .join('|');
}
function parentSignature(parent) {
    const normalized = [...parent];
    return normalized.map((_, index) => find(normalized, index)).join(',');
}
