# Manual WebRTC transport

The architecture remains client-only: no account, database, custom signaling endpoint or game backend. `lib/manual-rtc.ts` constructs a native `RTCPeerConnection` with `iceServers: []`. It adds only an ordered data channel; no camera/microphone permissions or media tracks are requested. The normal PeerJS room-code mode remains separate and uses public signaling.

## Beginner workflow

1. Both players open the same game website, preferably over HTTPS, on devices connected to the same LAN. This transport does not host or distribute the webpage. A localhost URL points at the current device, not the other player's machine.
2. Host generates a complete invitation after local ICE gathering completes and sends it to the invited player over a channel of their choice.
3. Guest pastes that invitation and generates a complete response, then sends it back.
4. Host pastes and applies the response. Only a successful data-channel handshake starts the game.

The output contains session-specific connection metadata and may include network addresses. Share it only with the intended player. Keep the original pages open; a replacement invitation belongs to a new transport connection, not the old one. This does not mean a saved match is automatically deleted: use the game's restore workflow to resume its original seat and match, rather than confirming a new match. There is no silent fallback to STUN, TURN or public signaling. LAN client isolation, firewalls and browser address protection may still prevent connection. Manual exchange does not guarantee NAT traversal across the internet.

## Refresh and recovery are separate from connection setup

After refreshing an original game tab, select its saved-match recovery flow and original host/guest seat. Exchange a new invitation and response as instructed by that flow. A recovered game needs both a new transport and successful game-specific identity/history checks; an open channel alone is not proof that the game was restored. Keep the other players' original tabs and saved journals available. A completely new tab, closed tab, different browser or different device is not guaranteed to retain the tab-scoped session save. There is no account service to retrieve a lost save.

Do not expose a development listener or bypass a certificate warning merely to make a second device connect. A page served from another computer's plain HTTP LAN address is not equivalent to that device's own localhost secure context. The current development listener stays on 127.0.0.1; real-device acceptance requires an appropriate accessible secure page and the user's actual devices. Public deployment remains deferred by the user.

## Boundaries and verification

The unexecuted two-device checklist is in `lan-device-acceptance.md`. It starts with Xiangqi and distinguishes connection, synchronized moves, same-match refresh recovery and actual network interruption. Two physical devices with four logical seats must not be reported as four-device acceptance. Preparing that checklist is not evidence that a secure test URL, user device or LAN test has been provided.

- The offer/answer envelope checks game, protocol, role and 96-bit session identifier. Only data-channel SDP is accepted; audio/video descriptions are rejected. Signal text has a 65536-character bound. Data frames separately have a 65536-UTF-8-byte bound; sending also honors a smaller negotiated SCTP message limit and the existing outgoing buffer threshold. These are distinct checks, not a claim that signaling uses the data-frame byte check.
- Cancellation rejects pending candidate gathering and closes the channel/peer once. Invalid JSON closes the connection. Game messages retain their separate turn, revision and private-card checks.
- Once closed, connection-state callbacks also return immediately rather than creating a new disconnect-grace timer. A controlled-clock regression checks stale old-room events alongside a new room's independent 5-second grace; it is defensive callback isolation, not native jitter or memory-leak evidence.
- Incoming `yifang` channels must also be ordered and fully reliable (`maxRetransmits` and `maxPacketLifeTime` both null). Wrong-label, duplicate or incompatible channels are closed without replacing the accepted channel. Matching the name alone is not proof of compatible transport guarantees.
- The host browser remains trusted; this is not cryptographic anti-cheat. No persistent balances or real money.
- `scripts/verify-manual-rtc.cjs` uses a mock peer to test envelope checks, no-ICE-server configuration, offer/answer identity, invalid payload handling and cleanup. Mock tests alone are not proof of actual connectivity.
- Current acceptance and remaining gates are recorded in `remaining-work.md`; `completion-audit.md` is historical. Native same-page UTF-8 boundaries, non-text rejection, wrong/duplicate channel rejection and a real remote-SDP 32768-byte send-limit check are in `manual-rtc-native-acceptance.md`. These do not prove cross-tab recovery, network jitter or different-device connectivity. Real-device and cross-network results must be reported separately.

References: [MDN createOffer](https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/createOffer), [ICE gathering state](https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/iceGatheringState). Create the data channel before the offer and export the description after gathering, so the manually exchanged payload includes the collected candidates.
