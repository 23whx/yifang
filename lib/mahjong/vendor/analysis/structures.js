// Pinned local copy: miaoda-game-mcr-mahjong-analysis-core 0.3.1 (MIT metadata); see docs/mcr-dependencies.md.
import { MCR_HONOR_TILES, MCR_NUMBER_SUITS, MCR_STRUCTURE_TILES, compareMcrTileFaces, isMcrStructureTile, isMcrSuitedTile, mcrTileRank, mcrTileSuit, } from './tiles.js';
const ORPHANS = new Set([
    '1m', '9m', '1p', '9p', '1s', '9s', ...MCR_HONOR_TILES,
]);
const KNITTED_GROUPS = [[1, 4, 7], [2, 5, 8], [3, 6, 9]];
/** Enumerate every supported closed 14-tile MCR winning structure deterministically. */
export function enumerateMcrWinningStructures(faces) {
    const counts = countValidFaces(faces);
    if (!counts || faces.length !== 14)
        return [];
    const results = [];
    results.push(...enumerateStandard(counts));
    const sevenPairs = detectSevenPairs(counts);
    if (sevenPairs)
        results.push(sevenPairs);
    const thirteenOrphans = detectThirteenOrphans(counts);
    if (thirteenOrphans)
        results.push(thirteenOrphans);
    const notConnected = detectAllNotConnected(counts);
    if (notConnected)
        results.push(notConnected);
    results.push(...enumerateCombinationDragons(counts));
    return deduplicateStructures(results);
}
export function isMcrWinningStructure(faces) {
    return enumerateMcrWinningStructures(faces).length > 0;
}
/** Enumerate normal four-set-and-pair decompositions with zero to four declared melds. */
export function enumerateMcrStandardHandDecompositions(input) {
    const declaredMelds = normalizeDeclaredMelds(input.declaredMelds);
    if (!declaredMelds || declaredMelds.length > 4)
        return [];
    const requiredConcealedMelds = 4 - declaredMelds.length;
    if (input.concealedTiles.length !== requiredConcealedMelds * 3 + 2)
        return [];
    const counts = countValidFaces(input.concealedTiles);
    if (!counts || !hasValidPhysicalCounts(input.concealedTiles, declaredMelds))
        return [];
    const results = [];
    for (let pairIndex = 0; pairIndex < counts.length; pairIndex++) {
        if (counts[pairIndex] < 2)
            continue;
        const remaining = [...counts];
        remaining[pairIndex] -= 2;
        const pair = { kind: 'pair', tile: MCR_STRUCTURE_TILES[pairIndex] };
        enumerateMelds(remaining, [], requiredConcealedMelds, (concealedMelds) => {
            results.push({ concealedMelds, declaredMelds, pair });
        });
    }
    return results;
}
function countValidFaces(faces) {
    const counts = new Array(MCR_STRUCTURE_TILES.length).fill(0);
    for (const face of faces) {
        if (!isMcrStructureTile(face))
            return null;
        const index = MCR_STRUCTURE_TILES.indexOf(face);
        counts[index] = (counts[index] ?? 0) + 1;
        if (counts[index] > 4)
            return null;
    }
    return counts;
}
function enumerateStandard(initial) {
    const results = [];
    for (let pairIndex = 0; pairIndex < initial.length; pairIndex++) {
        if (initial[pairIndex] < 2)
            continue;
        const counts = [...initial];
        counts[pairIndex] -= 2;
        const pair = { kind: 'pair', tile: MCR_STRUCTURE_TILES[pairIndex] };
        enumerateMelds(counts, [], 4, (melds) => results.push({ kind: 'standard', melds, pair }));
    }
    return results;
}
function enumerateMelds(counts, groups, expectedGroupCount, visit) {
    const first = counts.findIndex((count) => count > 0);
    if (first < 0) {
        if (groups.length === expectedGroupCount)
            visit([...groups]);
        return;
    }
    if (groups.length >= expectedGroupCount)
        return;
    const tile = MCR_STRUCTURE_TILES[first];
    if (counts[first] >= 3) {
        counts[first] -= 3;
        groups.push({ kind: 'triplet', tile });
        enumerateMelds(counts, groups, expectedGroupCount, visit);
        groups.pop();
        counts[first] += 3;
    }
    if (!isMcrSuitedTile(tile) || mcrTileRank(tile) > 7)
        return;
    const second = first + 1;
    const third = first + 2;
    if (counts[second] <= 0 || counts[third] <= 0)
        return;
    const suit = mcrTileSuit(tile);
    const secondTile = MCR_STRUCTURE_TILES[second];
    const thirdTile = MCR_STRUCTURE_TILES[third];
    if (!isMcrSuitedTile(secondTile) || !isMcrSuitedTile(thirdTile) ||
        mcrTileSuit(secondTile) !== suit || mcrTileSuit(thirdTile) !== suit)
        return;
    counts[first]--;
    counts[second]--;
    counts[third]--;
    groups.push({ kind: 'sequence', tiles: [tile, secondTile, thirdTile] });
    enumerateMelds(counts, groups, expectedGroupCount, visit);
    groups.pop();
    counts[first]++;
    counts[second]++;
    counts[third]++;
}
function detectSevenPairs(counts) {
    if (counts.some((count) => count % 2 !== 0))
        return null;
    const pairs = [];
    for (let index = 0; index < counts.length; index++) {
        for (let copy = 0; copy < counts[index] / 2; copy++) {
            pairs.push({ kind: 'pair', tile: MCR_STRUCTURE_TILES[index] });
        }
    }
    return pairs.length === 7 ? { kind: 'seven-pairs', pairs } : null;
}
function normalizeDeclaredMelds(melds) {
    if (!Array.isArray(melds))
        return null;
    const normalized = [];
    for (const meld of melds) {
        if (!meld || (meld.kind !== 'sequence' && meld.kind !== 'triplet' && meld.kind !== 'kong')) {
            return null;
        }
        if (meld.kind === 'sequence') {
            if (meld.tiles.length !== 3 || !meld.tiles.every(isMcrStructureTile) ||
                !meld.tiles.every(isMcrSuitedTile))
                return null;
            const tiles = [...meld.tiles].sort(compareMcrTileFaces);
            if (mcrTileSuit(tiles[0]) !== mcrTileSuit(tiles[1]) ||
                mcrTileSuit(tiles[1]) !== mcrTileSuit(tiles[2]) ||
                mcrTileRank(tiles[1]) !== mcrTileRank(tiles[0]) + 1 ||
                mcrTileRank(tiles[2]) !== mcrTileRank(tiles[0]) + 2)
                return null;
            normalized.push({ kind: 'sequence', tiles });
            continue;
        }
        if (!isMcrStructureTile(meld.tile))
            return null;
        if (meld.kind === 'kong') {
            if (meld.exposure !== 'melded' && meld.exposure !== 'concealed')
                return null;
            normalized.push({ kind: 'kong', tile: meld.tile, exposure: meld.exposure });
        }
        else {
            normalized.push({ kind: 'triplet', tile: meld.tile });
        }
    }
    return normalized;
}
function hasValidPhysicalCounts(concealedTiles, declaredMelds) {
    const counts = new Array(MCR_STRUCTURE_TILES.length).fill(0);
    const add = (tile, amount) => {
        const index = MCR_STRUCTURE_TILES.indexOf(tile);
        counts[index] += amount;
        return counts[index] <= 4;
    };
    for (const tile of concealedTiles)
        if (!add(tile, 1))
            return false;
    for (const meld of declaredMelds) {
        if (meld.kind === 'sequence') {
            for (const tile of meld.tiles)
                if (!add(tile, 1))
                    return false;
        }
        else if (!add(meld.tile, meld.kind === 'kong' ? 4 : 3))
            return false;
    }
    return true;
}
function detectThirteenOrphans(counts) {
    let pair = null;
    for (let index = 0; index < counts.length; index++) {
        const tile = MCR_STRUCTURE_TILES[index];
        const count = counts[index];
        if (!ORPHANS.has(tile)) {
            if (count > 0)
                return null;
            continue;
        }
        if (count === 2 && pair === null)
            pair = tile;
        else if (count !== 1)
            return null;
    }
    return pair ? { kind: 'thirteen-orphans', pair: { kind: 'pair', tile: pair } } : null;
}
function detectAllNotConnected(counts) {
    if (counts.some((count) => count > 1))
        return null;
    const faces = MCR_STRUCTURE_TILES.filter((_, index) => counts[index] === 1);
    if (faces.length !== 14)
        return null;
    for (const knitted of mcrKnittedPatterns()) {
        const allowed = new Set([...knitted, ...MCR_HONOR_TILES]);
        if (faces.every((face) => allowed.has(face))) {
            return {
                kind: 'all-not-connected',
                tiles: faces,
                sevenStar: MCR_HONOR_TILES.every((honor) => faces.includes(honor)),
            };
        }
    }
    return null;
}
function enumerateCombinationDragons(counts) {
    const results = [];
    for (const knitted of mcrKnittedPatterns()) {
        const rest = [...counts];
        if (!knitted.every((tile) => takeOne(rest, tile)))
            continue;
        for (let pairIndex = 0; pairIndex < rest.length; pairIndex++) {
            if (rest[pairIndex] < 2)
                continue;
            const afterPair = [...rest];
            afterPair[pairIndex] -= 2;
            const meld = detectSingleMeld(afterPair);
            if (meld) {
                results.push({
                    kind: 'combination-dragon',
                    knittedTiles: knitted,
                    meld,
                    pair: { kind: 'pair', tile: MCR_STRUCTURE_TILES[pairIndex] },
                });
            }
        }
    }
    return results;
}
function detectSingleMeld(counts) {
    const indexes = counts.flatMap((count, index) => Array(count).fill(index));
    if (indexes.length !== 3)
        return null;
    const [first, second, third] = indexes;
    if (first === second && second === third) {
        return { kind: 'triplet', tile: MCR_STRUCTURE_TILES[first] };
    }
    const tiles = indexes.map((index) => MCR_STRUCTURE_TILES[index]);
    if (tiles.every(isMcrSuitedTile)) {
        const suited = tiles;
        if (suited.every((tile) => mcrTileSuit(tile) === mcrTileSuit(suited[0])) &&
            mcrTileRank(suited[1]) === mcrTileRank(suited[0]) + 1 &&
            mcrTileRank(suited[2]) === mcrTileRank(suited[0]) + 2) {
            return { kind: 'sequence', tiles: [suited[0], suited[1], suited[2]] };
        }
    }
    return null;
}
/** Return all six canonical nine-tile combination-dragon knitted patterns. */
export function mcrKnittedPatterns() {
    const permutations = permute([...MCR_NUMBER_SUITS]);
    return permutations.map((suits) => KNITTED_GROUPS.flatMap((ranks, index) => ranks.map((rank) => `${rank}${suits[index]}`)).sort(compareMcrTileFaces));
}
function permute(values) {
    if (values.length <= 1)
        return [values];
    return values.flatMap((value, index) => permute(values.filter((_, other) => other !== index)).map((rest) => [value, ...rest]));
}
function takeOne(counts, tile) {
    const index = MCR_STRUCTURE_TILES.indexOf(tile);
    if (counts[index] <= 0)
        return false;
    counts[index]--;
    return true;
}
function deduplicateStructures(structures) {
    const seen = new Set();
    return structures.filter((structure) => {
        const key = JSON.stringify(structure);
        if (seen.has(key))
            return false;
        seen.add(key);
        return true;
    });
}
