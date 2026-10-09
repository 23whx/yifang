// Local runtime copy of miaoda-game-mcr-mahjong-rules 0.3.1 (package declares MIT).
// Scoring bridge and optional opening transcript; see docs/mcr-dependencies.md.
import {analyzeMcrHand} from '../mcr-analysis-bridge';
import { compareMcrTileFaces, createMcrTileSet, isMcrFlowerTile, isMcrStructureTile, isMcrSuitedTile, mcrTileRank, mcrTileSuit, settleMcrWin, sortMcrPhysicalTiles, } from 'miaoda-game-mcr-mahjong-analysis-core';
import { MCR_RULESET_ID, } from 'miaoda-game-mcr-mahjong-rules';
const SEATS = ['east', 'south', 'west', 'north'];
/**
 * Create a deterministic, fully dealt MCR hand. Opening flowers are immediately replaced.
 * The dealer is active in `discard` phase and must choose an id from `discardTileIds`.
 * Throws only for an invalid configuration.
 */
export function createMcrRound(config) {
    return buildMcrRound(config, false).round;
}
/** Actual shuffled opening snapshots, host-private until projected for one seat. */
export function createMcrRoundWithOpening(config) {
    return buildMcrRound(config, true);
}
function buildMcrRound(config, captureOpening) {
    if (config.playerIds.length !== 4 ||
        new Set(config.playerIds).size !== 4 ||
        config.playerIds.some((id) => typeof id !== 'string' || id.length === 0)) {
        throw new Error('mcr-mahjong-rules: playerIds must contain four unique non-empty ids.');
    }
    const dealerId = config.dealerId ?? config.playerIds[0];
    if (!config.playerIds.includes(dealerId)) {
        throw new Error('mcr-mahjong-rules: dealerId must be one of playerIds.');
    }
    const seed = normalizeSeed(config.seed ?? 1);
    const roundWind = config.roundWind ?? 'E';
    if (!['E', 'S', 'W', 'N'].includes(roundWind)) {
        throw new Error('mcr-mahjong-rules: roundWind must be E, S, W, or N.');
    }
    const wall = shuffle(createMcrTileSet(), seed);
    const hands = Object.fromEntries(config.playerIds.map((id) => [id, []]));
    const flowers = Object.fromEntries(config.playerIds.map((id) => [id, []]));
    const melds = Object.fromEntries(config.playerIds.map((id) => [id, []]));
    const remaining = [...wall];
    const dealerIndex = config.playerIds.indexOf(dealerId);
    const seatOrder = Array.from({ length: 4 }, (_, offset) => config.playerIds[(dealerIndex + offset) % 4]);
    for (let i = 0; i < 13; i++) {
        for (const playerId of seatOrder)
            drawInitial(remaining, hands[playerId]);
    }
    drawInitial(remaining, hands[dealerId]);
    const opening = [];
    for (const playerId of seatOrder) {
        const capture = captureOpening ? (flowerTile) => opening.push(structuredClone({
            playerId, flowerTile, hands, flowers, wall: remaining,
        })) : null;
        if (!replaceFlowers(remaining, hands[playerId], flowers[playerId], capture)) {
            throw new Error('mcr-mahjong-rules: wall exhausted during initial flower replacement.');
        }
    }
    const players = Object.fromEntries(config.playerIds.map((id, index) => [
        id,
        {
            id,
            seat: SEATS[(index - dealerIndex + 4) % 4],
            handZoneId: `hand:${id}`,
            flowerZoneId: `flowers:${id}`,
        },
    ]));
    // Preserve table order while assigning east relative to the selected dealer.
    const orderedPlayers = config.playerIds;
    const state = {
        version: 1,
        rulesetId: MCR_RULESET_ID,
        initialSeed: seed,
        playerOrder: orderedPlayers,
        dealerId,
        roundWind,
        activePlayerId: dealerId,
        phase: 'discard',
        drewThisTurn: true,
        pendingFlowerTileId: null,
        lastDrawnTileId: hands[dealerId][hands[dealerId].length - 1].id,
        turnSource: 'deal',
        claimWindow: null,
        actionHistory: [],
        wall: remaining,
        discardPile: [],
        players,
        hands,
        flowers,
        melds,
        winResult: null,
        drawResult: null,
    };
    assertValid(state);
    return {round: structuredClone(state), opening};
}
/**
 * Return exhaustive legal choices for one player. All flags are false and lists empty when that
 * player cannot act. Use exact physical ids and claim option objects from this result.
 */
export function getMcrRoundLegalActions(state, playerId) {
    assertValid(state);
    const player = state.players[playerId];
    const active = Boolean(player) && state.activePlayerId === playerId && state.phase !== 'finished';
    const hand = player ? state.hands[playerId] : [];
    const sortedHand = sortMcrPhysicalTiles(hand);
    const claimEligible = Boolean(player &&
        state.phase === 'claim' &&
        state.claimWindow &&
        state.claimWindow.sourcePlayerId !== playerId &&
        !Object.prototype.hasOwnProperty.call(state.claimWindow.responses, playerId));
    const selfDrawAnalysis = active && state.phase === 'discard' && state.lastDrawnTileId
        ? analyzeSelfDraw(state, playerId)
        : null;
    return {
        playerId,
        phase: state.phase,
        canDraw: active && state.phase === 'draw' && state.wall.length > 0,
        canDrawReplacement: active && state.phase === 'replacement',
        selfDrawAnalysis,
        concealedKongOptions: active && state.phase === 'discard' && state.turnSource !== 'claim'
            ? concealedKongOptions(hand)
            : [],
        addedKongOptions: active && state.phase === 'discard' && state.turnSource !== 'claim'
            ? addedKongOptions(state, playerId)
            : [],
        canReplaceFlower: active && state.phase === 'flower',
        canDiscardFlower: active && state.phase === 'flower',
        canPassClaim: claimEligible,
        claimOptions: claimEligible ? claimOptions(state, playerId) : [],
        discardTileIds: active && state.phase === 'discard' ? sortedHand.map((tile) => tile.id) : [],
    };
}
/**
 * Apply one command as an immutable atomic transition.
 * A rejection never mutates `state` and is never appended to `actionHistory`.
 */
export function applyMcrRoundAction(state, action) {
    const next = structuredClone(state);
    const events = [];
    assertValid(next);
    if (!isMcrRoundAction(action))
        return reject('invalid-claim', 'Malformed round action.');
    if (!next.players[action.playerId])
        return reject('unknown-player', 'Unknown player.');
    if (next.phase === 'finished')
        return reject('wrong-phase', 'The hand is finished.');
    if (action.type === 'pass-claim' ||
        action.type === 'claim-discard' ||
        action.type === 'claim-added-kong-win') {
        return applyClaimAction(next, action, events);
    }
    if (next.activePlayerId !== action.playerId)
        return reject('not-active-player', "It is not this player's turn.");
    const hand = next.hands[action.playerId];
    if (action.type === 'declare-self-draw') {
        const analysis = analyzeSelfDraw(next, action.playerId);
        const winningTile = hand.find((tile) => tile.id === next.lastDrawnTileId);
        if (!analysis || !winningTile)
            return reject('invalid-claim', 'The current hand is not a qualified self-draw win.');
        next.phase = 'finished';
        next.winResult = {
            winnerId: action.playerId,
            discarderId: null,
            winMethod: 'self-draw',
            winningTile,
            analysis: structuredClone(analysis),
            settlement: settlementFor(next, action.playerId, null, analysis),
        };
        events.push({
            type: 'hand-won',
            result: structuredClone(next.winResult),
        });
    }
    else if (action.type === 'declare-concealed-kong') {
        const legal = concealedKongOptions(hand).find((option) => sameIds(option.tileIds, action.tileIds));
        if (next.phase !== 'discard' || next.turnSource === 'claim' || !legal) {
            return reject('invalid-claim', 'The selected concealed kong is not legal.');
        }
        const tiles = legal.tileIds.map((id) => {
            const index = hand.findIndex((tile) => tile.id === id);
            return hand.splice(index, 1)[0];
        });
        next.melds[action.playerId].push({
            kind: 'kong',
            exposure: 'concealed',
            tiles,
            claimedTileId: null,
            fromPlayerId: null,
        });
        next.phase = 'replacement';
        next.drewThisTurn = false;
        next.lastDrawnTileId = null;
        events.push({
            type: 'meld-declared',
            playerId: action.playerId,
            kind: 'kong',
            exposure: 'concealed',
            tileIds: tiles.map((tile) => tile.id),
            claimedTileId: null,
        });
    }
    else if (action.type === 'declare-added-kong') {
        const legal = addedKongOptions(next, action.playerId).find((option) => option.meldIndex === action.meldIndex && option.tileId === action.tileId);
        if (next.phase !== 'discard' || next.turnSource === 'claim' || !legal) {
            return reject('invalid-claim', 'The selected added kong is not legal.');
        }
        next.claimWindow = {
            kind: 'added-kong',
            sourcePlayerId: action.playerId,
            tileId: action.tileId,
            meldIndex: action.meldIndex,
            responses: {},
        };
        next.phase = 'claim';
        next.drewThisTurn = false;
        next.lastDrawnTileId = null;
        events.push({
            type: 'claim-window-opened',
            kind: 'added-kong',
            sourcePlayerId: action.playerId,
            tileId: action.tileId,
        });
    }
    else if (action.type === 'draw' || action.type === 'draw-replacement') {
        if (action.type === 'draw-replacement') {
            if (next.phase !== 'replacement')
                return reject('wrong-phase', 'No replacement draw is pending.');
            const tile = next.wall.pop();
            if (!tile) {
                next.phase = 'finished';
                next.drewThisTurn = false;
                next.drawResult = { reason: 'wall-exhausted' };
                events.push({ type: 'hand-drawn', result: next.drawResult });
            }
            else {
                hand.push(tile);
                next.lastDrawnTileId = tile.id;
                next.turnSource = 'kong-replacement';
                next.drewThisTurn = true;
                events.push({
                    type: 'tile-drawn',
                    playerId: action.playerId,
                    tileId: tile.id,
                    source: 'kong-replacement',
                });
                if (isMcrFlowerTile(tile.face)) {
                    next.phase = 'flower';
                    next.pendingFlowerTileId = tile.id;
                }
                else {
                    next.phase = 'discard';
                }
            }
        }
        else {
            if (next.phase !== 'draw' || next.drewThisTurn) {
                return reject('must-discard', 'Discard before drawing again.');
            }
            const tile = next.wall.shift();
            if (!tile)
                return reject('wall-exhausted', 'The wall is exhausted.');
            hand.push(tile);
            next.lastDrawnTileId = tile.id;
            next.turnSource = 'wall';
            events.push({
                type: 'tile-drawn',
                playerId: action.playerId,
                tileId: tile.id,
                source: 'wall',
            });
            if (isMcrFlowerTile(tile.face)) {
                next.phase = 'flower';
                next.pendingFlowerTileId = tile.id;
                next.drewThisTurn = true;
            }
            else {
                next.phase = 'discard';
                next.drewThisTurn = true;
            }
        }
    }
    else if (action.type === 'replace-flower' || action.type === 'discard-flower') {
        if (next.phase !== 'flower' || !next.pendingFlowerTileId) {
            return reject('must-resolve-flower', 'There is no drawn flower to resolve.');
        }
        const flowerIndex = hand.findIndex((tile) => tile.id === next.pendingFlowerTileId);
        if (flowerIndex < 0)
            throw new Error('mcr-mahjong-rules: pending flower is not in the hand.');
        const [flower] = hand.splice(flowerIndex, 1);
        next.pendingFlowerTileId = null;
        next.lastDrawnTileId = null;
        if (action.type === 'discard-flower') {
            next.discardPile.push(flower);
            events.push({ type: 'flower-discarded', playerId: action.playerId, tileId: flower.id });
            advanceAfterDiscard(next, action.playerId, events);
        }
        else {
            next.flowers[action.playerId].push(flower);
            const replacement = next.wall.pop();
            if (!replacement) {
                next.phase = 'finished';
                next.drewThisTurn = false;
                next.drawResult = { reason: 'wall-exhausted' };
                events.push({
                    type: 'flower-replaced',
                    playerId: action.playerId,
                    flowerTileId: flower.id,
                    replacementTileId: null,
                });
                events.push({ type: 'hand-drawn', result: next.drawResult });
            }
            else {
                hand.push(replacement);
                next.lastDrawnTileId = replacement.id;
                next.turnSource = 'flower-replacement';
                events.push({
                    type: 'flower-replaced',
                    playerId: action.playerId,
                    flowerTileId: flower.id,
                    replacementTileId: replacement.id,
                });
                events.push({
                    type: 'tile-drawn',
                    playerId: action.playerId,
                    tileId: replacement.id,
                    source: 'flower-replacement',
                });
                if (isMcrFlowerTile(replacement.face)) {
                    next.phase = 'flower';
                    next.pendingFlowerTileId = replacement.id;
                }
                else {
                    next.phase = 'discard';
                }
            }
        }
    }
    else {
        if (next.phase !== 'discard' || !next.drewThisTurn)
            return reject('must-draw', 'Draw before discarding.');
        const index = hand.findIndex((tile) => tile.id === action.tileId);
        if (index < 0)
            return reject('tile-not-in-hand', 'The selected tile is not in the hand.');
        next.discardPile.push(...hand.splice(index, 1));
        next.lastDrawnTileId = null;
        next.claimWindow = {
            kind: 'discard',
            sourcePlayerId: action.playerId,
            tileId: action.tileId,
            meldIndex: null,
            responses: {},
        };
        next.phase = 'claim';
        next.drewThisTurn = false;
        events.push({ type: 'tile-discarded', playerId: action.playerId, tileId: action.tileId });
        events.push({
            type: 'claim-window-opened',
            kind: 'discard',
            sourcePlayerId: action.playerId,
            tileId: action.tileId,
        });
    }
    next.actionHistory.push(structuredClone(action));
    assertValid(next);
    return {
        ok: true,
        state: structuredClone(next),
        events: structuredClone(events),
    };
}
/**
 * Create a detached player-safe snapshot with that viewer's exhaustive legal actions.
 * Throws for an invalid authoritative state or an unknown viewer id.
 */
export function createMcrRoundPlayerView(state, viewerId) {
    assertValid(state);
    if (!state.players[viewerId])
        throw new Error(`mcr-mahjong-rules: unknown viewer "${viewerId}".`);
    return structuredClone({
        rulesetId: state.rulesetId,
        viewerId,
        playerOrder: state.playerOrder,
        dealerId: state.dealerId,
        roundWind: state.roundWind,
        activePlayerId: state.activePlayerId,
        phase: state.phase,
        drewThisTurn: state.drewThisTurn,
        pendingFlowerTileId: state.pendingFlowerTileId,
        lastDrawnTileId: viewerId === state.activePlayerId ? state.lastDrawnTileId : null,
        turnSource: state.turnSource,
        claimWindow: state.claimWindow
            ? {
                kind: state.claimWindow.kind,
                sourcePlayerId: state.claimWindow.sourcePlayerId,
                tileId: state.claimWindow.kind === 'discard' || state.claimWindow.sourcePlayerId === viewerId
                    ? state.claimWindow.tileId
                    : null,
                hasResponded: Object.prototype.hasOwnProperty.call(state.claimWindow.responses, viewerId),
            }
            : null,
        ownHand: sortMcrPhysicalTiles(state.hands[viewerId]),
        ownFlowers: state.flowers[viewerId],
        otherHandCounts: Object.fromEntries(state.playerOrder.filter((id) => id !== viewerId).map((id) => [id, state.hands[id].length])),
        otherFlowerCounts: Object.fromEntries(state.playerOrder.filter((id) => id !== viewerId).map((id) => [id, state.flowers[id].length])),
        discardPile: state.discardPile,
        melds: Object.fromEntries(state.playerOrder.map((id) => [
            id,
            state.melds[id].map((meld) => id === viewerId || meld.exposure === 'melded'
                ? meld
                : { kind: 'concealed-kong', tileCount: 4 }),
        ])),
        winResult: state.winResult,
        drawResult: state.drawResult,
        wallCount: state.wall.length,
        legalActions: getMcrRoundLegalActions(state, viewerId),
    });
}
/** Validate an authoritative state by strict deterministic replay. */
export function validateMcrRoundState(state) {
    const restored = restoreMcrRoundState(state);
    return restored.ok ? { ok: true } : restored;
}
/** Rebuild a hand from its deterministic initial configuration and accepted actions. */
export function replayMcrRound(config, actions) {
    let state;
    try {
        state = createMcrRound(config);
    }
    catch (error) {
        return {
            ok: false,
            actionIndex: -1,
            rejection: { code: 'invalid-claim', message: String(error) },
        };
    }
    for (let actionIndex = 0; actionIndex < actions.length; actionIndex++) {
        let result;
        try {
            result = applyMcrRoundAction(state, actions[actionIndex]);
        }
        catch (error) {
            return {
                ok: false,
                actionIndex,
                rejection: { code: 'invalid-claim', message: String(error) },
            };
        }
        if (!result.ok)
            return { ...result, actionIndex };
        state = result.state;
    }
    return { ok: true, state };
}
/** Strictly restore an authoritative JSON snapshot by validating and replaying its full history. */
export function restoreMcrRoundState(snapshot) {
    const state = snapshot;
    try {
        assertValid(state);
    }
    catch (error) {
        return {
            ok: false,
            issues: [{ code: 'invalid-state', message: String(error) }],
        };
    }
    const replay = replayMcrRound({
        playerIds: state.playerOrder,
        dealerId: state.dealerId,
        seed: state.initialSeed,
        roundWind: state.roundWind,
    }, state.actionHistory);
    if (!replay.ok) {
        return {
            ok: false,
            issues: [
                {
                    code: 'invalid-action-history',
                    message: `Action ${replay.actionIndex} cannot be replayed: ${replay.rejection.message}`,
                },
            ],
        };
    }
    if (!deepEqual(replay.state, state)) {
        return {
            ok: false,
            issues: [
                {
                    code: 'replay-mismatch',
                    message: 'Snapshot does not match the state produced by its initial configuration and action history.',
                },
            ],
        };
    }
    return { ok: true, state: structuredClone(replay.state) };
}
function drawInitial(wall, hand) {
    const tile = wall.shift();
    if (!tile)
        throw new Error('mcr-mahjong-rules: wall exhausted during deal.');
    hand.push(tile);
}
function advanceAfterDiscard(state, playerId, events) {
    state.pendingFlowerTileId = null;
    state.lastDrawnTileId = null;
    state.turnSource = null;
    if (state.wall.length === 0) {
        state.phase = 'finished';
        state.drewThisTurn = false;
        state.drawResult = { reason: 'wall-exhausted' };
        events.push({ type: 'hand-drawn', result: state.drawResult });
        return;
    }
    const currentIndex = state.playerOrder.indexOf(playerId);
    state.activePlayerId = state.playerOrder[(currentIndex + 1) % state.playerOrder.length];
    state.phase = 'draw';
    state.drewThisTurn = false;
}
function applyClaimAction(state, action, events) {
    const window = state.claimWindow;
    if (state.phase !== 'claim' || !window || action.playerId === window.sourcePlayerId) {
        return reject('not-claim-eligible', 'This player cannot respond to the current discard.');
    }
    if (Object.prototype.hasOwnProperty.call(window.responses, action.playerId)) {
        return reject('already-responded', 'This player already responded to the discard.');
    }
    if (action.type === 'pass-claim') {
        window.responses[action.playerId] = null;
    }
    else {
        if ((window.kind === 'discard') !== (action.type === 'claim-discard')) {
            return reject('invalid-claim', 'The claim action does not match the current window.');
        }
        const selected = claimOptions(state, action.playerId).find((option) => sameClaim(option, action.option));
        if (!selected)
            return reject('invalid-claim', 'The selected discard claim is not legal.');
        window.responses[action.playerId] = structuredClone(selected);
    }
    const recordedAction = action.type === 'pass-claim'
        ? action
        : {
            type: action.type,
            playerId: action.playerId,
            option: structuredClone(window.responses[action.playerId]),
        };
    events.push({
        type: 'claim-response-submitted',
        playerId: action.playerId,
        response: action.type === 'pass-claim' ? 'pass' : action.option.kind,
    });
    state.actionHistory.push(recordedAction);
    if (Object.keys(window.responses).length === 3)
        resolveClaimWindow(state, events);
    assertValid(state);
    return {
        ok: true,
        state: structuredClone(state),
        events: structuredClone(events),
    };
}
function resolveClaimWindow(state, events) {
    const window = state.claimWindow;
    const claims = Object.entries(window.responses)
        .filter((entry) => entry[1] !== null)
        .sort(([leftId, left], [rightId, right]) => claimPriority(right.kind) - claimPriority(left.kind) ||
        seatDistance(state, window.sourcePlayerId, leftId) -
            seatDistance(state, window.sourcePlayerId, rightId));
    const winner = claims[0];
    if (!winner) {
        events.push({
            type: 'claim-resolved',
            kind: window.kind,
            sourcePlayerId: window.sourcePlayerId,
            playerId: null,
            claim: 'none',
            tileId: window.tileId,
        });
        if (window.kind === 'added-kong') {
            commitAddedKong(state, events);
            return;
        }
        state.claimWindow = null;
        advanceAfterDiscard(state, window.sourcePlayerId, events);
        return;
    }
    const [playerId, option] = winner;
    events.push({
        type: 'claim-resolved',
        kind: window.kind,
        sourcePlayerId: window.sourcePlayerId,
        playerId,
        claim: option.kind,
        tileId: window.tileId,
    });
    const sourceHand = state.hands[window.sourcePlayerId];
    const sourceIndex = window.kind === 'discard'
        ? state.discardPile.findIndex((tile) => tile.id === window.tileId)
        : sourceHand.findIndex((tile) => tile.id === window.tileId);
    if (sourceIndex < 0)
        throw new Error('mcr-mahjong-rules: claimed tile is missing.');
    const [discard] = window.kind === 'discard'
        ? state.discardPile.splice(sourceIndex, 1)
        : sourceHand.splice(sourceIndex, 1);
    if (option.kind === 'win') {
        state.hands[playerId].push(discard);
        state.claimWindow = null;
        state.activePlayerId = playerId;
        state.phase = 'finished';
        state.drewThisTurn = true;
        state.turnSource = 'claim';
        state.winResult = {
            winnerId: playerId,
            discarderId: window.sourcePlayerId,
            winMethod: 'discard',
            winningTile: discard,
            analysis: structuredClone(option.analysis),
            settlement: settlementFor(state, playerId, window.sourcePlayerId, option.analysis),
        };
        events.push({
            type: 'hand-won',
            result: structuredClone(state.winResult),
        });
        return;
    }
    if (window.kind !== 'discard')
        throw new Error('mcr-mahjong-rules: added kong accepts only win claims.');
    const hand = state.hands[playerId];
    const claimedFromHand = option.handTileIds.map((id) => {
        const index = hand.findIndex((tile) => tile.id === id);
        if (index < 0)
            throw new Error('mcr-mahjong-rules: claim tile is missing.');
        return hand.splice(index, 1)[0];
    });
    state.melds[playerId].push({
        kind: option.kind,
        exposure: 'melded',
        tiles: [...claimedFromHand, discard],
        claimedTileId: discard.id,
        fromPlayerId: window.sourcePlayerId,
    });
    events.push({
        type: 'meld-declared',
        playerId,
        kind: option.kind,
        exposure: 'melded',
        tileIds: state.melds[playerId][state.melds[playerId].length - 1].tiles.map((tile) => tile.id),
        claimedTileId: discard.id,
    });
    state.claimWindow = null;
    state.activePlayerId = playerId;
    state.lastDrawnTileId = null;
    state.turnSource = 'claim';
    if (option.kind === 'kong') {
        state.phase = 'replacement';
        state.drewThisTurn = false;
    }
    else {
        state.phase = 'discard';
        state.drewThisTurn = true;
    }
}
function commitAddedKong(state, events) {
    const window = state.claimWindow;
    if (window.kind !== 'added-kong' || window.meldIndex === null) {
        throw new Error('mcr-mahjong-rules: invalid added-kong window.');
    }
    const meld = state.melds[window.sourcePlayerId][window.meldIndex];
    const hand = state.hands[window.sourcePlayerId];
    const tileIndex = hand.findIndex((tile) => tile.id === window.tileId);
    if (!meld || meld.kind !== 'pung' || meld.exposure !== 'melded' || tileIndex < 0) {
        throw new Error('mcr-mahjong-rules: added kong source is invalid.');
    }
    meld.kind = 'kong';
    meld.tiles.push(...hand.splice(tileIndex, 1));
    events.push({
        type: 'meld-declared',
        playerId: window.sourcePlayerId,
        kind: 'kong',
        exposure: 'melded',
        tileIds: meld.tiles.map((tile) => tile.id),
        claimedTileId: null,
    });
    state.claimWindow = null;
    state.activePlayerId = window.sourcePlayerId;
    state.phase = 'replacement';
    state.drewThisTurn = false;
    state.lastDrawnTileId = null;
    state.turnSource = null;
}
function claimOptions(state, playerId) {
    const window = state.claimWindow;
    if (!window)
        return [];
    if (window.kind === 'added-kong') {
        const tile = state.hands[window.sourcePlayerId].find((item) => item.id === window.tileId);
        if (!tile)
            return [];
        const analysis = analyzeRobbedKongWin(state, playerId, tile);
        return analysis ? [{ kind: 'win', handTileIds: [], analysis }] : [];
    }
    const discard = state.discardPile.find((tile) => tile.id === window.tileId);
    if (!discard || isMcrFlowerTile(discard.face))
        return [];
    const hand = state.hands[playerId];
    const matching = hand.filter((tile) => tile.face === discard.face);
    const result = [];
    const winAnalysis = analyzeDiscardWin(state, playerId, discard);
    if (winAnalysis)
        result.push({ kind: 'win', handTileIds: [], analysis: winAnalysis });
    for (let first = 0; first < matching.length; first++) {
        for (let second = first + 1; second < matching.length; second++) {
            for (let third = second + 1; third < matching.length; third++) {
                result.push({
                    kind: 'kong',
                    handTileIds: [matching[first].id, matching[second].id, matching[third].id],
                });
            }
        }
    }
    for (let left = 0; left < matching.length; left++) {
        for (let right = left + 1; right < matching.length; right++) {
            result.push({ kind: 'pung', handTileIds: [matching[left].id, matching[right].id] });
        }
    }
    if (seatDistance(state, window.sourcePlayerId, playerId) === 1 && isMcrSuitedTile(discard.face)) {
        const rank = mcrTileRank(discard.face);
        const suit = mcrTileSuit(discard.face);
        for (let start = rank - 2; start <= rank; start++) {
            if (start < 1 || start > 7)
                continue;
            const faces = [start, start + 1, start + 2]
                .filter((value) => value !== rank)
                .map((value) => `${value}${suit}`);
            const first = hand.filter((tile) => tile.face === faces[0]);
            const second = hand.filter((tile) => tile.face === faces[1]);
            for (const left of first)
                for (const right of second) {
                    result.push({ kind: 'chow', handTileIds: [left.id, right.id].sort() });
                }
        }
    }
    return result.sort((left, right) => claimPriority(right.kind) - claimPriority(left.kind) ||
        left.handTileIds.join('|').localeCompare(right.handTileIds.join('|')));
}
function analyzeDiscardWin(state, playerId, discard) {
    if (!isMcrStructureTile(discard.face))
        return null;
    const concealedTiles = state.hands[playerId].map((tile) => tile.face);
    if (!concealedTiles.every(isMcrStructureTile))
        return null;
    const declaredMelds = analysisDeclaredMelds(state, playerId);
    const publiclyShownCopies = publicOtherCopies(state, discard);
    const result = analyzeMcrHand({
        concealedTilesBeforeWin: concealedTiles,
        declaredMelds,
        winningTile: discard.face,
        roundWind: state.roundWind,
        seatWind: seatWind(state.players[playerId].seat),
        event: {
            source: 'discard',
            lastWallEvent: state.wall.length === 0 && state.turnSource === 'wall',
            lastCopy: publiclyShownCopies === 3,
            flowerCount: state.flowers[playerId].length,
        },
    });
    return result.ok ? result.analysis : null;
}
function analyzeSelfDraw(state, playerId) {
    const winningTile = state.hands[playerId].find((tile) => tile.id === state.lastDrawnTileId);
    if (!winningTile || !isMcrStructureTile(winningTile.face))
        return null;
    const concealedTilesBeforeWin = state.hands[playerId]
        .filter((tile) => tile.id !== winningTile.id)
        .map((tile) => tile.face);
    if (!concealedTilesBeforeWin.every(isMcrStructureTile))
        return null;
    const source = state.turnSource === 'kong-replacement'
        ? 'kong-replacement'
        : state.turnSource === 'flower-replacement'
            ? 'flower-replacement'
            : 'wall';
    const result = analyzeMcrHand({
        concealedTilesBeforeWin,
        declaredMelds: analysisDeclaredMelds(state, playerId),
        winningTile: winningTile.face,
        roundWind: state.roundWind,
        seatWind: seatWind(state.players[playerId].seat),
        event: {
            source,
            lastWallEvent: source === 'wall' && state.wall.length === 0,
            lastCopy: publicOtherCopies(state, winningTile) === 3,
            flowerCount: state.flowers[playerId].length,
        },
    });
    return result.ok ? result.analysis : null;
}
function publicOtherCopies(state, winningTile) {
    const visible = [...state.discardPile,
        ...state.playerOrder.flatMap(id => state.melds[id]
            .filter(meld => meld.exposure === 'melded').flatMap(meld => meld.tiles))];
    return new Set(visible.filter(tile => tile.face === winningTile.face && tile.id !== winningTile.id).map(tile => tile.id)).size;
}
function analyzeRobbedKongWin(state, playerId, winningTile) {
    if (!isMcrStructureTile(winningTile.face))
        return null;
    const concealedTilesBeforeWin = state.hands[playerId].map((tile) => tile.face);
    if (!concealedTilesBeforeWin.every(isMcrStructureTile))
        return null;
    const result = analyzeMcrHand({
        concealedTilesBeforeWin,
        declaredMelds: analysisDeclaredMelds(state, playerId),
        winningTile: winningTile.face,
        roundWind: state.roundWind,
        seatWind: seatWind(state.players[playerId].seat),
        event: {
            source: 'robbed-kong',
            lastWallEvent: false,
            lastCopy: false,
            flowerCount: state.flowers[playerId].length,
        },
    });
    return result.ok ? result.analysis : null;
}
function analysisDeclaredMelds(state, playerId) {
    return state.melds[playerId].map((meld) => {
        const faces = meld.tiles.map((tile) => tile.face).filter(isMcrStructureTile);
        if (meld.kind === 'chow') {
            return {
                kind: 'sequence',
                tiles: [...faces].sort(compareMcrTileFaces),
            };
        }
        return meld.kind === 'pung'
            ? { kind: 'triplet', tile: faces[0] }
            : { kind: 'kong', tile: faces[0], exposure: meld.exposure };
    });
}
function concealedKongOptions(hand) {
    const byFace = new Map();
    for (const tile of hand) {
        if (!isMcrStructureTile(tile.face))
            continue;
        const ids = byFace.get(tile.face) ?? [];
        ids.push(tile.id);
        byFace.set(tile.face, ids);
    }
    return [...byFace.values()]
        .filter((ids) => ids.length === 4)
        .map((tileIds) => ({ tileIds: [...tileIds].sort() }));
}
function addedKongOptions(state, playerId) {
    const result = [];
    state.melds[playerId].forEach((meld, meldIndex) => {
        if (meld.kind !== 'pung' || meld.exposure !== 'melded')
            return;
        const face = meld.tiles[0]?.face;
        for (const tile of state.hands[playerId]) {
            if (tile.face === face)
                result.push({ meldIndex, tileId: tile.id });
        }
    });
    return result;
}
function sameIds(left, right) {
    return left.length === right.length && left.every((id, index) => id === right[index]);
}
function seatWind(seat) {
    return { east: 'E', south: 'S', west: 'W', north: 'N' }[seat];
}
function settlementFor(state, winnerId, discarderId, analysis) {
    const winner = state.playerOrder.indexOf(winnerId);
    const discarder = discarderId === null ? null : state.playerOrder.indexOf(discarderId);
    const result = settleMcrWin({
        winner,
        winMethod: discarder === null ? 'self-draw' : 'discard',
        discarder,
        nonFlowerFan: analysis.nonFlowerTotal,
        flowerPoints: analysis.flowerPoints,
    });
    if (!result)
        throw new Error('mcr-mahjong-rules: qualified win produced invalid settlement.');
    return {
        totalFan: result.totalFan,
        deltas: Object.fromEntries(state.playerOrder.map((id, index) => [id, result.deltas[index]])),
        payments: Object.fromEntries(state.playerOrder.map((id, index) => [id, result.payments[index]])),
    };
}
function sameClaim(left, right) {
    return (left.kind === right.kind &&
        left.handTileIds.length === right.handTileIds.length &&
        left.handTileIds.every((id, index) => id === right.handTileIds[index]));
}
function claimPriority(kind) {
    if (kind === 'win')
        return 3;
    return kind === 'chow' ? 1 : 2;
}
function seatDistance(state, from, to) {
    return (state.playerOrder.indexOf(to) - state.playerOrder.indexOf(from) + 4) % 4;
}
function replaceFlowers(wall, hand, flowers, beforeReplace = null) {
    for (let index = 0; index < hand.length;) {
        if (!isMcrFlowerTile(hand[index].face)) {
            index += 1;
            continue;
        }
        if (beforeReplace) beforeReplace(hand[index]);
        flowers.push(...hand.splice(index, 1));
        const replacement = wall.pop();
        if (!replacement)
            return false;
        hand.push(replacement);
    }
    return true;
}
function shuffle(tiles, seed) {
    const result = [...tiles];
    let value = seed;
    for (let index = result.length - 1; index > 0; index--) {
        value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
        const swap = value % (index + 1);
        [result[index], result[swap]] = [result[swap], result[index]];
    }
    return result;
}
function normalizeSeed(seed) {
    if (!Number.isFinite(seed))
        throw new Error('mcr-mahjong-rules: seed must be finite.');
    return seed >>> 0;
}
function assertValid(state) {
    if (state.version !== 1 || state.rulesetId !== MCR_RULESET_ID)
        throw new Error('mcr-mahjong-rules: unsupported state version.');
    if (!Number.isSafeInteger(state.initialSeed) ||
        state.initialSeed < 0 ||
        state.initialSeed > 4294967295) {
        throw new Error('mcr-mahjong-rules: invalid initial seed.');
    }
    if (!Array.isArray(state.playerOrder) ||
        state.playerOrder.length !== 4 ||
        new Set(state.playerOrder).size !== 4 ||
        state.playerOrder.some((id) => typeof id !== 'string' || id.length === 0)) {
        throw new Error('mcr-mahjong-rules: invalid player order.');
    }
    if (!['E', 'S', 'W', 'N'].includes(state.roundWind)) {
        throw new Error('mcr-mahjong-rules: invalid round wind.');
    }
    if (!['discard', 'draw', 'replacement', 'flower', 'claim', 'finished'].includes(state.phase)) {
        throw new Error('mcr-mahjong-rules: invalid phase.');
    }
    for (const record of [state.players, state.hands, state.flowers, state.melds]) {
        if (!record || !sameStringSet(Object.keys(record), state.playerOrder)) {
            throw new Error('mcr-mahjong-rules: player records do not match player order.');
        }
    }
    if (!state.players[state.dealerId] || !state.players[state.activePlayerId])
        throw new Error('mcr-mahjong-rules: invalid active or dealer player.');
    const dealerIndex = state.playerOrder.indexOf(state.dealerId);
    for (let index = 0; index < state.playerOrder.length; index++) {
        const id = state.playerOrder[index];
        const player = state.players[id];
        if (player.id !== id ||
            player.seat !== SEATS[(index - dealerIndex + 4) % 4] ||
            player.handZoneId !== `hand:${id}` ||
            player.flowerZoneId !== `flowers:${id}`) {
            throw new Error('mcr-mahjong-rules: invalid player metadata.');
        }
        if (!Array.isArray(state.hands[id]) ||
            !Array.isArray(state.flowers[id]) ||
            !Array.isArray(state.melds[id]) ||
            state.melds[id].length > 4) {
            throw new Error('mcr-mahjong-rules: invalid player zones.');
        }
        if (state.flowers[id].some((tile) => !isMcrFlowerTile(tile.face))) {
            throw new Error('mcr-mahjong-rules: a flower zone contains a structure tile.');
        }
        const handFlowers = state.hands[id].filter((tile) => isMcrFlowerTile(tile.face));
        if (handFlowers.length > 0 &&
            (state.phase !== 'flower' ||
                id !== state.activePlayerId ||
                handFlowers.length !== 1 ||
                handFlowers[0].id !== state.pendingFlowerTileId)) {
            throw new Error('mcr-mahjong-rules: a hand contains an unresolved flower outside the flower phase.');
        }
        for (const meld of state.melds[id])
            validateMeld(state, id, meld);
    }
    const all = [
        ...state.wall,
        ...state.discardPile,
        ...state.playerOrder.flatMap((id) => [
            ...state.hands[id],
            ...state.flowers[id],
            ...state.melds[id].flatMap((meld) => meld.tiles),
        ]),
    ];
    const canonicalTiles = new Map(createMcrTileSet().map((tile) => [tile.id, tile]));
    if (all.length !== 144 ||
        new Set(all.map((tile) => tile.id)).size !== 144 ||
        all.some((tile) => {
            const canonical = canonicalTiles.get(tile?.id);
            return !canonical || canonical.face !== tile.face || canonical.copy !== tile.copy;
        })) {
        throw new Error('mcr-mahjong-rules: canonical physical tile conservation failed.');
    }
    if (!Array.isArray(state.actionHistory))
        throw new Error('mcr-mahjong-rules: invalid action history.');
    if (state.phase === 'draw' && state.drewThisTurn)
        throw new Error('mcr-mahjong-rules: draw phase cannot have a drawn turn.');
    if (state.phase === 'replacement' && state.drewThisTurn) {
        throw new Error('mcr-mahjong-rules: replacement phase cannot have a drawn turn.');
    }
    if (state.phase === 'discard' && !state.drewThisTurn)
        throw new Error('mcr-mahjong-rules: discard phase requires a drawn turn.');
    if ((state.phase === 'flower') !== (state.pendingFlowerTileId !== null))
        throw new Error('mcr-mahjong-rules: pending flower does not match phase.');
    if ((state.phase === 'claim') !== (state.claimWindow !== null))
        throw new Error('mcr-mahjong-rules: claim window does not match phase.');
    if (state.claimWindow &&
        (state.claimWindow.sourcePlayerId !== state.activePlayerId ||
            !state.players[state.claimWindow.sourcePlayerId] ||
            !sameStringSet(Object.keys(state.claimWindow.responses), Object.keys(state.claimWindow.responses).filter((id) => Boolean(state.players[id]) && id !== state.claimWindow.sourcePlayerId)) ||
            Object.keys(state.claimWindow.responses).length >= 3)) {
        throw new Error('mcr-mahjong-rules: invalid claim response participants.');
    }
    if (state.claimWindow?.kind === 'discard' &&
        !state.discardPile.some((tile) => tile.id === state.claimWindow.tileId)) {
        throw new Error('mcr-mahjong-rules: discard claim tile is missing.');
    }
    if (state.claimWindow?.kind === 'added-kong' &&
        (!state.hands[state.claimWindow.sourcePlayerId].some((tile) => tile.id === state.claimWindow.tileId) ||
            state.claimWindow.meldIndex === null ||
            state.melds[state.claimWindow.sourcePlayerId][state.claimWindow.meldIndex]?.kind !== 'pung')) {
        throw new Error('mcr-mahjong-rules: added-kong claim source is invalid.');
    }
    if (state.claimWindow) {
        for (const [playerId, response] of Object.entries(state.claimWindow.responses)) {
            if (response === null)
                continue;
            const canonical = claimOptions(state, playerId).find((option) => sameClaim(option, response));
            if (!canonical || !deepEqual(canonical, response)) {
                throw new Error('mcr-mahjong-rules: claim response is not a canonical legal option.');
            }
        }
    }
    if (state.lastDrawnTileId &&
        !state.hands[state.activePlayerId].some((tile) => tile.id === state.lastDrawnTileId)) {
        throw new Error('mcr-mahjong-rules: last drawn tile is not in the active hand.');
    }
    if ((state.phase === 'draw' || state.phase === 'replacement' || state.phase === 'claim') &&
        state.lastDrawnTileId !== null) {
        throw new Error('mcr-mahjong-rules: waiting phase cannot retain a last drawn tile.');
    }
    if (state.winResult &&
        (state.phase !== 'finished' ||
            state.activePlayerId !== state.winResult.winnerId ||
            !state.hands[state.winResult.winnerId].some((tile) => tile.id === state.winResult.winningTile.id))) {
        throw new Error('mcr-mahjong-rules: win result does not match the terminal state.');
    }
    const terminalResults = Number(state.winResult !== null) + Number(state.drawResult !== null);
    if ((state.phase === 'finished' && terminalResults !== 1) ||
        (state.phase !== 'finished' && terminalResults !== 0)) {
        throw new Error('mcr-mahjong-rules: terminal result does not match phase.');
    }
    if (state.winResult) {
        let deltaTotal = 0;
        for (const id of state.playerOrder) {
            const delta = state.winResult.settlement.deltas[id];
            if (!Number.isSafeInteger(delta)) {
                throw new Error('mcr-mahjong-rules: settlement contains an invalid delta.');
            }
            deltaTotal += delta;
        }
        if (deltaTotal !== 0)
            throw new Error('mcr-mahjong-rules: settlement is not zero-sum.');
        if (!sameStringSet(Object.keys(state.winResult.settlement.deltas), state.playerOrder) ||
            !sameStringSet(Object.keys(state.winResult.settlement.payments), state.playerOrder)) {
            throw new Error('mcr-mahjong-rules: settlement player ids are invalid.');
        }
        const expected = settlementFor(state, state.winResult.winnerId, state.winResult.discarderId, state.winResult.analysis);
        if (!deepEqual(expected, state.winResult.settlement)) {
            throw new Error('mcr-mahjong-rules: settlement does not match the authorized formula.');
        }
        const winningTile = state.hands[state.winResult.winnerId].find((tile) => tile.id === state.winResult.winningTile.id);
        if ((state.winResult.winMethod === 'self-draw') !== (state.winResult.discarderId === null) ||
            (state.winResult.discarderId !== null && !state.players[state.winResult.discarderId]) ||
            state.winResult.discarderId === state.winResult.winnerId ||
            !winningTile ||
            !deepEqual(winningTile, state.winResult.winningTile)) {
            throw new Error('mcr-mahjong-rules: invalid win provenance.');
        }
    }
    if (state.drawResult && state.wall.length !== 0) {
        throw new Error('mcr-mahjong-rules: wall-exhausted result requires an empty wall.');
    }
    if (state.pendingFlowerTileId &&
        !state.hands[state.activePlayerId].some((tile) => tile.id === state.pendingFlowerTileId && isMcrFlowerTile(tile.face))) {
        throw new Error('mcr-mahjong-rules: pending flower is invalid.');
    }
    validateEffectiveHandCounts(state);
}
function validateMeld(state, ownerId, meld) {
    if (!meld ||
        !Array.isArray(meld.tiles) ||
        !['chow', 'pung', 'kong'].includes(meld.kind) ||
        !['melded', 'concealed'].includes(meld.exposure)) {
        throw new Error('mcr-mahjong-rules: invalid meld shape.');
    }
    const faces = meld.tiles.map((tile) => tile.face);
    if (faces.some((face) => !isMcrStructureTile(face))) {
        throw new Error('mcr-mahjong-rules: a meld contains a flower.');
    }
    if (meld.kind === 'chow') {
        const sorted = [...faces].sort(compareMcrTileFaces);
        if (meld.tiles.length !== 3 ||
            meld.exposure !== 'melded' ||
            !sorted.every(isMcrSuitedTile) ||
            new Set(sorted.map(mcrTileSuit)).size !== 1 ||
            mcrTileRank(sorted[1]) !== mcrTileRank(sorted[0]) + 1 ||
            mcrTileRank(sorted[2]) !== mcrTileRank(sorted[0]) + 2) {
            throw new Error('mcr-mahjong-rules: invalid chow meld.');
        }
    }
    else {
        const expectedLength = meld.kind === 'pung' ? 3 : 4;
        if (meld.tiles.length !== expectedLength ||
            new Set(faces).size !== 1 ||
            (meld.kind === 'pung' && meld.exposure !== 'melded')) {
            throw new Error('mcr-mahjong-rules: invalid pung or kong meld.');
        }
    }
    if (meld.exposure === 'concealed') {
        if (meld.kind !== 'kong' || meld.claimedTileId !== null || meld.fromPlayerId !== null) {
            throw new Error('mcr-mahjong-rules: invalid concealed meld provenance.');
        }
    }
    else if (!meld.claimedTileId ||
        !meld.tiles.some((tile) => tile.id === meld.claimedTileId) ||
        !meld.fromPlayerId ||
        meld.fromPlayerId === ownerId ||
        !state.players[meld.fromPlayerId]) {
        throw new Error('mcr-mahjong-rules: invalid melded provenance.');
    }
}
function validateEffectiveHandCounts(state) {
    for (const id of state.playerOrder) {
        const count = state.hands[id].filter((tile) => isMcrStructureTile(tile.face)).length +
            state.melds[id].length * 3;
        const expected = state.phase === 'discard' && id === state.activePlayerId
            ? 14
            : state.phase === 'claim' &&
                state.claimWindow?.kind === 'added-kong' &&
                id === state.activePlayerId
                ? 14
                : state.phase === 'finished' && state.winResult?.winnerId === id
                    ? 14
                    : 13;
        if (count !== expected) {
            throw new Error(`mcr-mahjong-rules: invalid effective hand count for player "${id}".`);
        }
    }
}
function sameStringSet(left, right) {
    return left.length === right.length && left.every((value) => right.includes(value));
}
function isMcrRoundAction(value) {
    if (!isRecord(value) || typeof value.type !== 'string' || typeof value.playerId !== 'string')
        return false;
    if (value.type === 'draw' ||
        value.type === 'draw-replacement' ||
        value.type === 'declare-self-draw' ||
        value.type === 'replace-flower' ||
        value.type === 'discard-flower' ||
        value.type === 'pass-claim') {
        return hasExactKeys(value, ['type', 'playerId']);
    }
    if (value.type === 'discard') {
        return hasExactKeys(value, ['type', 'playerId', 'tileId']) && typeof value.tileId === 'string';
    }
    if (value.type === 'declare-concealed-kong') {
        return (hasExactKeys(value, ['type', 'playerId', 'tileIds']) &&
            Array.isArray(value.tileIds) &&
            value.tileIds.every((id) => typeof id === 'string'));
    }
    if (value.type === 'declare-added-kong') {
        return (hasExactKeys(value, ['type', 'playerId', 'meldIndex', 'tileId']) &&
            Number.isSafeInteger(value.meldIndex) &&
            typeof value.tileId === 'string');
    }
    if (value.type === 'claim-discard' || value.type === 'claim-added-kong-win') {
        if (!hasExactKeys(value, ['type', 'playerId', 'option']) ||
            !isRecord(value.option) ||
            !Array.isArray(value.option.handTileIds) ||
            !value.option.handTileIds.every((id) => typeof id === 'string'))
            return false;
        if (value.option.kind === 'win') {
            return (hasExactKeys(value.option, ['kind', 'handTileIds', 'analysis']) &&
                value.option.handTileIds.length === 0 &&
                isRecord(value.option.analysis));
        }
        return (value.type === 'claim-discard' &&
            (value.option.kind === 'chow' ||
                value.option.kind === 'pung' ||
                value.option.kind === 'kong') &&
            hasExactKeys(value.option, ['kind', 'handTileIds']));
    }
    return false;
}
function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function hasExactKeys(value, keys) {
    return sameStringSet(Object.keys(value), keys);
}
function deepEqual(left, right) {
    if (Object.is(left, right))
        return true;
    if (typeof left !== 'object' || left === null || typeof right !== 'object' || right === null) {
        return false;
    }
    if (Array.isArray(left) || Array.isArray(right)) {
        return (Array.isArray(left) &&
            Array.isArray(right) &&
            left.length === right.length &&
            left.every((value, index) => deepEqual(value, right[index])));
    }
    const leftRecord = left;
    const rightRecord = right;
    const leftKeys = Object.keys(leftRecord);
    const rightKeys = Object.keys(rightRecord);
    return (sameStringSet(leftKeys, rightKeys) &&
        leftKeys.every((key) => deepEqual(leftRecord[key], rightRecord[key])));
}
function reject(code, message) {
    return { ok: false, rejection: { code, message } };
}
