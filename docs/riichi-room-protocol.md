# Four-human riichi room core

## Current integration status

Manual room UI is now connected at `/zh/mahjong/remote` and `/en/mahjong/remote`, linked from play pages. Four actual in-app tabs exchanged three native WebRTC offer/answer pairs, completed one exhaustive draw, required all four acknowledgements, rotated seats into East 2 and stopped all remaining clients after a guest left. No signaling/STUN/TURN or application backend was used. This is one machine with four tabs; physical-device LAN, cross-NAT and network win-result paths remain unverified. The earlier implementation notes below describe the staged development history, not current absence of the UI.

`lib/mahjong/riichi-room.ts` coordinates four human inputs using a Game in the host **browser**. It does not open network connections, create accounts or contact a backend. Actual WebRTC transport/UI integration remains to be built.

`lib/mahjong/riichi-manual.ts` now supplies a manual native WebRTC adapter: host creates one independent offer for each guest, guests return separate answers, and host applies each answer to its original seat. Default channels reuse `ManualRTC` with empty ICE servers (no signaling/STUN/TURN). A welcome frame binds match/seat; later envelopes must retain both and advance in order. Actual connection UI, deep payload validation, acknowledgement timeouts and four-browser verification remain pending. The adapter's current tests use mock channels, not browser ICE.

Follow-up: `riichi-wire.ts` now checks payload bodies before guest rendering: bounded seat snapshots, hand/tile notation, score arrays, unique IDs/ranks, decision kinds/values, acknowledgements and recognized engine-event shapes. Existing private full replay logs are rejected. These are runtime rendering/schema guards, not independent Mahjong adjudication. Guest actions now permit only one outstanding request, clear it only on matching acknowledgement and close after 15 seconds without one; duplicate clicks cannot send another action while waiting. Transport UI and real four-browser acceptance are still pending.

## Identity and transport contract

- Construct a new host with a fresh unpredictable match ID (12–80 alphanumeric/hyphen characters). Never reuse an ID after restarting. Match IDs separate sessions; they are not authentication credentials.
- Seat 0 belongs to the host. Transport binds each accepted guest connection to a distinct seat 1–3. Use that bound identity in `receive`; never trust a sender-supplied seat field.
- Start only after all four are present. Guests cannot replace an occupied seat. Lobby departures free a seat; a departure after starting terminates the session and sends `closed`, with no invented unfinished-hand award. Reconnection/resumption is not implemented.
- Use ordered reliable channels. Synchronous send exceptions terminate safely; transport must call `leave` on asynchronous errors/disconnection. Manual WebRTC can provide these channels without signaling servers; room-code convenience, if provided, must disclose its signaling dependency.

## Messages

Outgoing envelopes contain version 1, game `riichi`, match ID, recipient ID and an increasing per-recipient sequence. Payloads are lobby, event, state, decision, acknowledgement, final summary or closure. **Only public lobby/final/closure data is broadcast.** Events and snapshots are sent to their own recipient, from that player's redacted model. Full final private replay logs are omitted.

Actions contain version/game/match, a positive increasing request number, the exact decision revision and one offered choice ID. The host checks these against the bound seat's pending decision. No scores, tiles or situation flags supplied by the guest are accepted. Repeated requests, stale revisions and illegal choices cannot apply twice. Acknowledgements include the request number and acceptance result.

The future guest controller must validate envelope identity and sequence, wait for acknowledgement, handle errors without inventing success, and clear controls on closure. This module is not yet a complete reconnect or retransmission protocol. Host trust remains necessary: a browser host owns the wall and cannot be made cheat-proof by these checks.

## Current evidence

`node scripts/verify-riichi-room.cjs`: 5,618 JSON-round-tripped recipient messages across four hands, four-human settlement consent, consistent final 100,000-point total, own-only initial hands, rotating wind/identity mapping, forged/stale/duplicate input checks, disconnect cancellation and synchronous send failure. Uses a fake scheduler with the real asynchronous Game path. It does **not** prove WebRTC connectivity, browser room rendering or cross-network operation.

`node scripts/verify-riichi-manual.cjs`: three mock channel pairs exchange independent offer/answer identities, pass 16 legal decision submissions with acknowledgements, terminate all peers after a guest disconnect, cancel/recreate unused offers and reject replayed envelopes. Fixed reentrant closure ordering so the original disconnected seat is reported before closure cascades. These assertions do not replace real-browser transport acceptance.
