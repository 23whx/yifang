// Pinned local copy: miaoda-game-mcr-mahjong-analysis-core 0.3.1 (MIT metadata); see docs/mcr-dependencies.md.
/** Analysis-contract metadata; table states use their separate formal profile ids. */
export const MCR_ANALYSIS_RESEARCH_RULESET = 'mcr';
export const MCR_ANALYSIS_RESEARCH_SCHEMA_VERSION = 1;
export function mcrAnalysisResearchContractMetadata() {
    return {
        ruleset: MCR_ANALYSIS_RESEARCH_RULESET,
        schemaVersion: MCR_ANALYSIS_RESEARCH_SCHEMA_VERSION,
    };
}
