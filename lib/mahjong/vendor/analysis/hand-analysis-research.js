// Pinned local copy: miaoda-game-mcr-mahjong-analysis-core 0.3.1 (MIT metadata); see docs/mcr-dependencies.md.
import { analyzeMcrClosedGoldenHand } from './closed-hand-research.js';
import { selectMcrAssociatedStructureFans } from './associated-fan-research.js';
import { analyzeMcrCompleteClosedGoldenHandResearch, analyzeMcrCompleteOrdinaryHandResearch, } from './complete-hand-research.js';
import { getMcrFanDefinition } from './fan-catalog.js';
import { analyzeMcrOrdinaryHandResearch } from './ordinary-hand-research.js';
import { normalizeMcrDeclaredMeldsResearch, } from './meld-notation-research.js';
import { mcrAnalysisResearchContractMetadata, } from './research-contract.js';
import { enumerateMcrStandardHandDecompositions, enumerateMcrWinningStructures, } from './structures.js';
import { parseMcrTileNotationResearch } from './tile-notation-research.js';
import { MCR_HONOR_TILES, MCR_STRUCTURE_TILES, isMcrStructureTile, isMcrSuitedTile, mcrTileRank, mcrTileSuit, } from './tiles.js';
/**
 * Task-level facade for a complete MCR winning-hand analysis.
 * The package entry exports it as analyzeMcrHand.
 */
export function analyzeMcrHandResearch(input) {
    if (!input || typeof input !== 'object')
        return failure('invalid-input', 'Input must be an object.');
    const concealed = normalizeTiles(input.concealedTilesBeforeWin);
    if (!concealed.ok) {
        return failure('invalid-input', `concealedTilesBeforeWin: ${concealed.message}`);
    }
    const concealedTilesBeforeWin = concealed.tiles;
    const declared = normalizeMcrDeclaredMeldsResearch(input.declaredMelds ?? []);
    if (!declared.ok) {
        return failure('invalid-input', `declaredMelds[${declared.index}]: ${declared.message}`);
    }
    const event = normalizeEvent(input.event);
    if (!event)
        return failure('invalid-input', 'event contains an invalid source, flag, or flower count.');
    const normalizedInput = {
        ...input,
        concealedTilesBeforeWin,
        declaredMelds: declared.melds,
        event,
    };
    const validationMessage = validateInput(normalizedInput);
    if (validationMessage)
        return failure('invalid-input', validationMessage);
    const winMethod = winMethodForSource(normalizedInput.event.source);
    const concealedTiles = [...normalizedInput.concealedTilesBeforeWin, normalizedInput.winningTile];
    const ordinaryStructures = enumerateMcrStandardHandDecompositions({
        concealedTiles,
        declaredMelds: normalizedInput.declaredMelds,
    });
    const closedStructures = normalizedInput.declaredMelds.length === 0
        ? enumerateMcrWinningStructures(concealedTiles)
        : [];
    if (ordinaryStructures.length === 0 && closedStructures.length === 0) {
        return failure('not-winning', 'The supplied winning tile does not complete a legal hand.');
    }
    const ordinary = analyzeMcrCompleteOrdinaryHandResearch({ ...normalizedInput, winMethod });
    const special = normalizedInput.declaredMelds.length === 0
        ? analyzeMcrCompleteClosedGoldenHandResearch({
            tiles: concealedTiles,
            winningTile: normalizedInput.winningTile,
            winMethod,
            roundWind: normalizedInput.roundWind,
            seatWind: normalizedInput.seatWind,
            event: normalizedInput.event,
        })
        : null;
    const candidates = [];
    if (ordinary) {
        const { exclusions, ...analysis } = ordinary;
        const decomposition = ordinaryStructures[ordinary.decompositionIndex];
        const groups = [
            ...decomposition.concealedMelds,
            ...decomposition.declaredMelds,
            decomposition.pair,
        ].map((group, index) => ({ index, group }));
        candidates.push({
            handKind: 'ordinary',
            ...analysis,
            groups,
            exclusions: explainExclusions(exclusions),
        });
    }
    if (special) {
        const { exclusions, ...analysis } = special;
        candidates.push({
            handKind: 'special',
            ...analysis,
            exclusions: explainExclusions(exclusions),
        });
    }
    const analysis = candidates.sort(compareAnalysisCandidates)[0];
    if (analysis) {
        // A closed Pure Terminal Chows hand can also be partitioned as Seven
        // Pairs. The ordinary and special candidates are scored separately,
        // so the ordinary exclusion resolver never sees the alternative.
        // WMO/EMA fan 13 explicitly absorbs fan 19; keep that reason in the
        // selected result only when the alternate seven-pair hand is real.
        const sevenPairsAbsorbed = analysis.handKind === 'ordinary' &&
            analysis.fanCodes.includes('mcr-13') &&
            special?.exclusions.some((item) => item.fanCode === 'mcr-19' &&
                item.excludedBy.includes('mcr-13')) &&
            !analysis.exclusions.some((item) => item.fanCode === 'mcr-19');
        // Four identical chows may also be decomposed into three consecutive
        // pungs plus one chow. That lower fan belongs to a different ordinary
        // decomposition, so it is absent from the chosen one's resolver.
        const shiftedPungsAbsorbed = analysis.handKind === 'ordinary' &&
            analysis.fanCodes.includes('mcr-14') &&
            ordinaryStructures.some((decomposition) => selectMcrAssociatedStructureFans(decomposition)
                .fanCodes.includes('mcr-24')) &&
            !analysis.exclusions.some((item) => item.fanCode === 'mcr-24');
        // Three identical concealed chows can instead be split into three
        // consecutive concealed pungs. When that decomposition wins the score
        // comparison, the omitted chow interpretation must be visible in the
        // explanation. An exposed chow prevents the alternate pung split.
        const tripleChowAbsorbed = analysis.handKind === 'ordinary' &&
            analysis.fanCodes.includes('mcr-24') &&
            ordinaryStructures.some((decomposition) => selectMcrAssociatedStructureFans(decomposition)
                .fanCodes.includes('mcr-23')) &&
            !analysis.exclusions.some((item) => item.fanCode === 'mcr-23');
        const crossDecompositionExclusions = [
            ...(sevenPairsAbsorbed ? [['mcr-19', 'mcr-13']] : []),
            ...(shiftedPungsAbsorbed ? [['mcr-24', 'mcr-14']] : []),
            ...(tripleChowAbsorbed ? [['mcr-23', 'mcr-24']] : []),
        ].map(([lower, higher]) => ({
            fanCode: lower,
            name: fanName(lower),
            excludedBy: [{ fanCode: higher, name: fanName(higher) }],
        }));
        const completeAnalysis = crossDecompositionExclusions.length > 0
            ? {
                ...analysis,
                exclusions: [...analysis.exclusions, ...crossDecompositionExclusions]
                    .sort((left, right) => left.fanCode.localeCompare(right.fanCode)),
            }
            : analysis;
        return { ...mcrAnalysisResearchContractMetadata(), ok: true, analysis: completeAnalysis };
    }
    const hasSupportedBase = analyzeMcrOrdinaryHandResearch({ ...normalizedInput, winMethod }) !== null ||
        (normalizedInput.declaredMelds.length === 0 && analyzeMcrClosedGoldenHand(concealedTiles, {
            selfDraw: winMethod === 'self-draw',
        }) !== null);
    return hasSupportedBase
        ? failure('below-minimum', 'The hand has fewer than eight non-flower points.')
        : failure('unsupported', 'The hand is structurally valid but its scoring path is not covered yet.');
}
function compareAnalysisCandidates(left, right) {
    return right.total - left.total ||
        right.nonFlowerTotal - left.nonFlowerTotal ||
        left.fanCodes.join(',').localeCompare(right.fanCodes.join(',')) ||
        left.handKind.localeCompare(right.handKind);
}
function explainExclusions(exclusions) {
    return exclusions.map((exclusion) => ({
        fanCode: exclusion.fanCode,
        name: fanName(exclusion.fanCode),
        ...(exclusion.occurrenceKeys ? { occurrenceKeys: exclusion.occurrenceKeys } : {}),
        excludedBy: exclusion.excludedBy.map((fanCode) => ({
            fanCode,
            name: fanName(fanCode),
        })),
    }));
}
function fanName(fanCode) {
    return getMcrFanDefinition(fanCode)?.name ?? fanCode;
}
function validateInput(input) {
    if (!input || typeof input !== 'object')
        return 'Input must be an object.';
    if (!Array.isArray(input.concealedTilesBeforeWin) ||
        !input.concealedTilesBeforeWin.every(isMcrStructureTile)) {
        return 'concealedTilesBeforeWin must contain only MCR structure tiles.';
    }
    if (!Array.isArray(input.declaredMelds) || input.declaredMelds.length > 4 ||
        !input.declaredMelds.every(isValidDeclaredMeld)) {
        return 'declaredMelds must contain zero to four legal sequences, triplets, or kongs.';
    }
    const expectedConcealedCount = (4 - input.declaredMelds.length) * 3 + 1;
    if (input.concealedTilesBeforeWin.length !== expectedConcealedCount) {
        return `concealedTilesBeforeWin must contain ${expectedConcealedCount} tiles for this meld count.`;
    }
    if (!isMcrStructureTile(input.winningTile))
        return 'winningTile must be an MCR structure tile.';
    if (!isWind(input.roundWind) || !isWind(input.seatWind)) {
        return 'roundWind and seatWind must be E, S, W, or N.';
    }
    if (!isValidEvent(input.event))
        return 'event contains an invalid source, flag, or flower count.';
    if (!hasValidPhysicalCounts(input))
        return 'No structure tile may appear more than four times.';
    return null;
}
function normalizeTiles(input) {
    if (typeof input === 'string') {
        const parsed = parseMcrTileNotationResearch(input);
        return parsed.ok ? parsed : { ok: false, message: parsed.message };
    }
    return Array.isArray(input) && input.every(isMcrStructureTile)
        ? { ok: true, tiles: input }
        : { ok: false, message: 'Value must be a structure-tile array or compact notation.' };
}
function normalizeEvent(input) {
    if (!input || typeof input !== 'object')
        return null;
    return {
        source: input.source,
        lastWallEvent: input.lastWallEvent === undefined ? false : input.lastWallEvent,
        lastCopy: input.lastCopy === undefined ? false : input.lastCopy,
        flowerCount: input.flowerCount === undefined ? 0 : input.flowerCount,
    };
}
function isValidDeclaredMeld(meld) {
    if (!meld || typeof meld !== 'object')
        return false;
    if (meld.kind === 'sequence') {
        if (!Array.isArray(meld.tiles) || meld.tiles.length !== 3 ||
            !meld.tiles.every(isMcrStructureTile) || !meld.tiles.every(isMcrSuitedTile))
            return false;
        const tiles = [...meld.tiles].sort((left, right) => mcrTileRank(left) - mcrTileRank(right));
        return tiles.every((tile) => mcrTileSuit(tile) === mcrTileSuit(tiles[0])) &&
            mcrTileRank(tiles[1]) === mcrTileRank(tiles[0]) + 1 &&
            mcrTileRank(tiles[2]) === mcrTileRank(tiles[0]) + 2;
    }
    if (meld.kind === 'triplet')
        return isMcrStructureTile(meld.tile);
    return meld.kind === 'kong' && isMcrStructureTile(meld.tile) &&
        (meld.exposure === 'melded' || meld.exposure === 'concealed');
}
function isValidEvent(event) {
    if (!event || typeof event !== 'object')
        return false;
    const sources = [
        'wall', 'discard', 'kong-replacement', 'flower-replacement', 'robbed-kong',
    ];
    return sources.includes(event.source) &&
        typeof event.lastWallEvent === 'boolean' &&
        typeof event.lastCopy === 'boolean' &&
        Number.isSafeInteger(event.flowerCount) && event.flowerCount >= 0 && event.flowerCount <= 8 &&
        (!event.lastWallEvent || event.source === 'wall' || event.source === 'discard');
}
function hasValidPhysicalCounts(input) {
    const counts = new Array(MCR_STRUCTURE_TILES.length).fill(0);
    const add = (tile, amount) => {
        const index = MCR_STRUCTURE_TILES.indexOf(tile);
        counts[index] += amount;
        return counts[index] <= 4;
    };
    for (const tile of input.concealedTilesBeforeWin)
        if (!add(tile, 1))
            return false;
    if (!add(input.winningTile, 1))
        return false;
    for (const meld of input.declaredMelds) {
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
function failure(reason, message) {
    return { ...mcrAnalysisResearchContractMetadata(), ok: false, reason, message };
}
function winMethodForSource(source) {
    return source === 'discard' || source === 'robbed-kong' ? 'discard' : 'self-draw';
}
function isWind(value) {
    return typeof value === 'string' && MCR_HONOR_TILES.slice(0, 4).includes(value);
}
