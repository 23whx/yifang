export {createMcrRound,applyMcrRoundAction,createMcrRoundPlayerView,getMcrRoundLegalActions,replayMcrRound,restoreMcrRoundState,validateMcrRoundState} from 'miaoda-game-mcr-mahjong-rules';
import type {CreateMcrRoundConfig,McrRoundState} from 'miaoda-game-mcr-mahjong-rules';
import type {McrPhysicalTile} from 'miaoda-game-mcr-mahjong-analysis-core';
export type McrOpeningSnapshot={playerId:string;flowerTile:McrPhysicalTile;hands:Record<string,McrPhysicalTile[]>;flowers:Record<string,McrPhysicalTile[]>;wall:McrPhysicalTile[]};
export function createMcrRoundWithOpening(config:CreateMcrRoundConfig):{round:McrRoundState;opening:McrOpeningSnapshot[]};
