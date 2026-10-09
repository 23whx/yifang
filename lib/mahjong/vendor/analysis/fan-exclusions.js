// Pinned local copy: miaoda-game-mcr-mahjong-analysis-core 0.3.1 (MIT metadata); see docs/mcr-dependencies.md.
import { MCR_FAN_CATALOG } from './fan-catalog.js';
const DEFINITION_DERIVED_EXCLUSIONS = new Map([
    // 断幺 requires every tile to be a suited 2-8 tile, so 无字 is inherent.
    ['mcr-68', ['mcr-76']],
    // 十三幺 inherently contains the lower mixed-terminals-and-honors pattern.
    ['mcr-07', ['mcr-18']],
    // Seven shifted pairs and greater honors/knitted tiles contain their lower base structures.
    ['mcr-06', ['mcr-19']],
    ['mcr-20', ['mcr-34']],
    // High kong counts already include their melded-kong subsets; concealed add-ons remain valid.
    ['mcr-05', ['mcr-17', 'mcr-57', 'mcr-74']],
    ['mcr-17', ['mcr-57', 'mcr-74']],
    // 全大 and 全小 inherently contain the lower one-sided range patterns.
    ['mcr-25', ['mcr-36']],
    ['mcr-27', ['mcr-37']],
    // Four concealed sets inherently contain the lower three/two-concealed-set patterns.
    ['mcr-12', ['mcr-33', 'mcr-66']],
    // Three concealed sets inherently contain the lower two-concealed-set pattern.
    ['mcr-33', ['mcr-66']],
    // Two concealed kongs already account for the same two concealed sets.
    ['mcr-48', ['mcr-66', 'mcr-67']],
    // The double-kong tiers already account for their corresponding single kong.
    ['mcr-57', ['mcr-74']],
    // 不求人 is defined as a closed hand completed by self-draw, so 自摸 is inherent.
    ['mcr-56', ['mcr-80']],
]);
const EXCLUSIONS_BY_FAN = new Map(MCR_FAN_CATALOG.map((definition) => [
    definition.code,
    [...definition.explicitlyExcludes, ...(DEFINITION_DERIVED_EXCLUSIONS.get(definition.code) ?? [])],
]));
/** Resolve scoring exclusions while retaining their direct, detected causes. */
export function resolveMcrFanExclusions(fanCodes) {
    const excludedBy = new Map();
    for (const fanCode of fanCodes) {
        for (const excludedFanCode of EXCLUSIONS_BY_FAN.get(fanCode) ?? []) {
            if (!fanCodes.has(excludedFanCode))
                continue;
            const causes = excludedBy.get(excludedFanCode) ?? new Set();
            causes.add(fanCode);
            excludedBy.set(excludedFanCode, causes);
        }
    }
    return {
        fanCodes: [...fanCodes].filter((fanCode) => !excludedBy.has(fanCode)).sort(),
        exclusions: [...excludedBy]
            .sort(([left], [right]) => left.localeCompare(right))
            .map(([fanCode, causes]) => ({ fanCode, excludedBy: [...causes].sort() })),
    };
}
export function applyMcrFanExclusions(fanCodes) {
    return resolveMcrFanExclusions(fanCodes).fanCodes;
}
