"use client";
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { ManualBoardConnection, type BoardConnection } from '@/lib/board/manual-connection';
import { hostPeerRoom, joinPeerRoom, newRoomCode, peerFailureMessage, deviceLabel, byeMessage, JOIN_LIMIT_MS, type PeerFailure, type PeerRoomEvents, type HostRoom, type Visitor, type LinkSession, type SessionMessage } from '@/lib/peer-room';
import { NicknameField, VisitorList, readNickname, useTitleAlert, useAttention, useLeaveGuard } from '@/components/remote/Visitors';
import { useLounge, LoungePanel } from '@/components/remote/Lounge';
import { readManualSignal } from '@/lib/manual-rtc';
import {secureMultiplayerContext,insecureMultiplayerMessage} from '@/lib/network-context';
import { loadFfish, type FfishBoard, type Ffish } from "@/lib/board/ffish";
import { BoardRecoverySession, type BoardRecoveryEvent } from '@/lib/board/recovery-session';
import { GoRecoverySession, type GoRecoveryEvent } from '@/lib/go/recovery-session';
import { BoardRecoveryChannel } from '@/lib/board/recovery-channel';
import {newBoardRecoverySecret} from '@/lib/board/recovery-agreement';
import {validRecoveryKey} from '@/lib/recovery-auth';
import {readBoardSave,writeBoardSave,clearBoardSave,type BoardRecoverySave} from '@/lib/board/recovery-save';
import { isBoardGame, VARIANTS } from "@/lib/board/variants";
import { newGo, playGo, scoreGo, type GoState } from "@/lib/go/rules";
import { newReview, changeReview, validReview, reviewDone, type Review, type ReviewAction } from '@/lib/go/review';
import ResultDialog from '@/components/ui/ResultDialog';
import { RoomHeader, RoleCard, Steps, SignalOutput, RoomNotes, RoomAlert, LinkShare, type StepState } from '@/components/remote/RoomKit';
import Board from "./Board";
import GoBoard from "../go/GoBoard";
import { newMatch, changeMatch, validMatch, roomCode, type MatchState, type MatchAction } from "@/lib/board/remote-match";
const noSubscribe = () => () => {};

type Game = "chess" | "xiangqi" | "shogi" | "go";
interface Wire {
  v: 5;
  epoch?: string;
  secret?: string;
  identity?: string;
  matchEvent?: BoardRecoveryEvent;
  goEvent?: GoRecoveryEvent;
  goJournal?: 1;
  game: Game;
  round: number;
  match?: MatchState;
  matchAction?: MatchAction;
  kind: "hello" | "ready" | "move" | "review-action" | "review-state" | "match-action" | "match-state";
  seq: number;
  move?: string | null;
  review?: Review;
  action?: ReviewAction;
  revision?: number;
}
export default function RemoteGame({
  game,
  locale,
}: {
  game: Game;
  locale: "zh" | "en";
}) {
  const zh = locale === "zh",
    peer = useRef<{ destroy(): void } | null>(null),
    connection = useRef<BoardConnection | null>(null),
    board = useRef<FfishBoard | null>(null),
    go = useRef<GoState>(newGo()),
    sequence = useRef(0),
    host = useRef(false),
    active = useRef(false),
    generation = useRef(0),
    timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialFen = useRef("");
  const rules = useRef<Ffish|null>(null);
  const journal = useRef<BoardRecoverySession|null>(null);
  const goJournal = useRef<GoRecoverySession|null>(null);
  const peerIdentity = useRef<string|null>(null);
  const recoverySecret=useRef(''),transportEpoch=useRef(''),recoveryChannel=useRef<BoardRecoveryChannel|null>(null);
  const resumeSelection=useRef<BoardRecoverySave|null>(null);
  const [saved,setSaved]=useState<BoardRecoverySave|null>(null),[saveError,setSaveError]=useState('');
  const [replaceIntent,setReplaceIntent]=useState<'host'|'guest'|null>(null),[clearConfirm,setClearConfirm]=useState(false),[restoring,setRestoring]=useState(false);
  useEffect(()=>{let live=true;queueMicrotask(()=>{if(!live)return;try{setSaved(readBoardSave(sessionStorage,game));}catch{setSaveError(zh?'无法读取本标签页存档；请勿假定可以恢复。':'Cannot read this tab’s save; recovery is not assured.');}});return()=>{live=false;};},[game,zh]);
  function persist(){const log=game==='go'?goJournal.current:journal.current;if(!log||!recoverySecret.current)return;try{setSaved(writeBoardSave(sessionStorage,{version:1,game,role:host.current?'host':'guest',secret:recoverySecret.current,checkpoint:log.checkpoint()}));setSaveError('');}catch{setSaveError(zh?'保存失败，请保持页面开启；刷新可能丢失最新进度。':'Save failed. Keep this page open; refreshing may lose recent progress.');}}
  function forget(){try{try{sessionStorage.removeItem(`yifang:board:${game}:room:v1`);}catch{/* best effort */}clearBoardSave(sessionStorage,game);setSaved(null);setSaveError('');setClearConfirm(false);resumeSelection.current=null;return true;}catch{setSaveError(zh?'无法清除存档，请检查浏览器存储设置。':'Could not clear the save. Check browser storage settings.');return false;}}
  const matchRef = useRef<MatchState>(newMatch());
  const [match, setMatch] = useState<MatchState>(newMatch);
  const [copyMessage, setCopyMessage] = useState("");
  const [confirmResign, setConfirmResign] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const manual = useRef<ManualBoardConnection | null>(null);
  // Default: friends join by opening a link. Manual codes remain for service-free play.
  const [mode, setMode] = useState<'manual' | 'public'>('public');
  const [linkNote, setLinkNote] = useState('');
  // Link mode reconnects by itself: phones drop WebRTC on screen lock or app switch.
  // The host keeps its room id; the guest rejoins it and both run the verified recovery.
  const hostRoom = useRef<HostRoom | null>(null), linkCode = useRef(''), autoTries = useRef(0);
  const hostEvents = useRef<{ ready(code: string): void; connection(c: BoardConnection, visitor: Visitor, session: LinkSession): void; failure(reason: PeerFailure): void; reconnecting(): void; policy(v: Visitor): 'admit' | 'full' | 'ask' } | null>(null);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  useTitleAlert(visitors.filter(v => v.state === 'knocking').length, zh);
  // Lobby: who is here, how good the connection is, and chat.
  const lounge = useLounge(zh, { name: readNickname(), device: deviceLabel() });
  const guestSession = useRef<LinkSession | null>(null), friendName = useRef(''), [friend, setFriend] = useState('');
function nameFriend(value: string) { friendName.current = value; setFriend(value); }
  // A reconnection wait has a visible clock and a way out, like a game lobby.
  const [waitSince, setWaitSince] = useState<number | null>(null), [clock, setClock] = useState(0);
  useEffect(() => { if (waitSince === null) return; const timer = setInterval(() => setClock(Date.now()), 1000); return () => clearInterval(timer); }, [waitSince]);
  /** Session-level news: goodbyes end things for good; "away" warns that a drop is coming. */
  function watchSession(session: LinkSession, isHost: boolean, token: number) {
    session.onMessage((m: SessionMessage) => {
      if (token !== generation.current) return;
      if (m.kind === 'yf-bye') {
        if (isHost) {
          const who = friendName.current || (zh ? '朋友' : 'Your friend');
          lounge.hostDetach('guest', true);
          if (active.current) { fail(zh ? `${who}离开了对局，本局结束（不判胜负）。房间已关闭。` : `${who} left the game; it ends without a result. The room has closed.`); forgetRoom(); return; }
          lounge.system(byeMessage('left', zh, friendName.current));
          return;
        }
        // The host dissolved the room, removed us, or ended the match: no reconnection.
        lounge.guestDetach('offline'); forgetRoom(); guestSession.current = null;
        fail(byeMessage(m.reason, zh));
      } else if (m.kind === 'yf-away') {
        setLinkNote(isHost
          ? (zh ? `${friendName.current || '朋友'}离开了页面（可能在刷新或切到了其他应用），正在等他回来…` : `${friendName.current || 'Your friend'} left the page (refreshing or switching apps); waiting for them…`)
          : (zh ? '房主离开了页面（可能在刷新或切到了其他应用），正在等房主回来…' : 'The host left the page (refreshing or switching apps); waiting for them…'));
      }
    });
  }
  function forgetRoom() { linkCode.current = ''; try { sessionStorage.removeItem(roomKey); } catch { /* best effort */ } }
  const [reconnecting, setReconnecting] = useState(false);
  const roomKey = `yifang:board:${game}:room:v1`;
  function rememberRoom(value: string) { linkCode.current = value; try { sessionStorage.setItem(roomKey, value); } catch { /* reconnect still works while this page lives */ } }
  function storedRoom() { try { return roomCode(sessionStorage.getItem(roomKey) ?? '', game); } catch { return ''; } }
  const autoJoin = useRef(false);
  const [invitation, setInvitation] = useState('');
  const [signal, setSignal] = useState('');
  const [answer, setAnswer] = useState('');
  const [signalBusy, setSignalBusy] = useState(false);
  const invited = useSyncExternalStore(noSubscribe, () => roomCode(new URL(window.location.href).searchParams.get('room') ?? '', game), () => '');
  // Opening an invitation link joins straight away, unless this tab holds a saved match to protect.
  useEffect(() => {
    if (!invited || autoJoin.current) return;
    autoJoin.current = true;
    let protectedSave = false;
    try { protectedSave = readBoardSave(sessionStorage, game) !== null; } catch { protectedSave = true; }
    if (!protectedSave) queueMicrotask(() => { void start(false); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invited]);
  function ended() { return matchRef.current.resigned !== null || (game === 'go' ? reviewDone(reviewRef.current) : !!board.current?.isGameOver()); }
  function publishMatch(next: MatchState) {
    setConfirmResign(false);
    if (next.round > matchRef.current.round) {
      if (board.current && isBoardGame(game)) board.current.setFen(initialFen.current);
      go.current = newGo(); sequence.current = 0; setHistory([]); publishReview(newReview()); refresh();
    }
    matchRef.current = next; setMatch(next);persist();
  }
  function sendMatchAction(action: MatchAction) {
    if (!active.current || !connection.current?.open) return;
    if (host.current) hostMatch(action, 0);
    else connection.current.send({v:5,epoch:transportEpoch.current,game,round:matchRef.current.round,kind:'match-action',seq:sequence.current,matchAction:action} satisfies Wire);
  }
  function hostMatch(action: MatchAction, actor: 0 | 1) {
    const next=changeMatch(matchRef.current, actor, action, ended());
    let matchEvent:BoardRecoveryEvent|undefined;
    let goEvent:GoRecoveryEvent|undefined;
    if(goJournal.current&&JSON.stringify(next)!==JSON.stringify(matchRef.current)){
      goEvent={seat:actor,round:matchRef.current.round,revision:goJournal.current.view().revision,action:{kind:action}};
      try{goJournal.current.apply(goEvent);}catch{return fail(zh?'围棋操作记录不一致，已暂停对局。':'Go action record mismatch; play paused.');}
    }
    if(journal.current&&JSON.stringify(next)!==JSON.stringify(matchRef.current)){
      matchEvent={seat:actor,round:matchRef.current.round,revision:journal.current.view().revision,action:{kind:action}};
      try{journal.current.apply(matchEvent);}catch{return fail(zh?'棋谱记录不一致，已暂停对局。':'Move record mismatch; play paused.');}
    }
    publishMatch(next);
    connection.current?.send({v:5,epoch:transportEpoch.current,game,round:matchRef.current.round,kind:'match-state',seq:sequence.current,match:matchRef.current,matchEvent,goEvent} satisfies Wire);
  }
  const reviewRef = useRef<Review>(newReview());
  const [review,setReview] = useState<Review>(newReview);
  function publishReview(r:Review){reviewRef.current=r;setReview(r);if(r.resumed){go.current={...go.current,passes:0};refresh();}}
  function hostReview(action:ReviewAction,actor:0|1,revision:number){
    if(game!=='go'||matchRef.current.resigned!==null||!active.current||go.current.passes<2)return;
    let next:Review;
    try{next=changeReview(go.current,reviewRef.current,actor,action,revision);}catch{
      connection.current?.send({v:5,epoch:transportEpoch.current,game,round:matchRef.current.round,kind:'review-state',seq:sequence.current,review:reviewRef.current} satisfies Wire);return;
    }
    if(!goJournal.current)return fail(zh?'缺少围棋操作记录。':'Missing Go action record.');
    const goEvent:GoRecoveryEvent={seat:actor,round:matchRef.current.round,revision:goJournal.current.view().revision,action:{kind:'review',proposal:revision,action}};
    try{goJournal.current.apply(goEvent);}catch{return fail(zh?'围棋计分记录不一致。':'Go scoring record mismatch.');}
    publishReview(next);persist();
    connection.current?.send({v:5,epoch:transportEpoch.current,game,round:matchRef.current.round,kind:'review-state',seq:sequence.current,review:reviewRef.current,goEvent} satisfies Wire);
  }
  function requestReview(action:ReviewAction){
    if(matchRef.current.resigned!==null||!active.current||!connection.current?.open)return;
    if(host.current)hostReview(action,0,reviewRef.current.revision);
    else connection.current.send({v:5,epoch:transportEpoch.current,game,round:matchRef.current.round,kind:'review-action',seq:sequence.current,revision:reviewRef.current.revision,action} satisfies Wire);
  }
  const [code, setCode] = useState(""),
    [entry, setEntry] = useState<string | null>(null),
    [status, setStatus] = useState("idle"),
    [error, setError] = useState(""),
    [snapshot, setSnapshot] = useState<{
      fen: string;
      legal: string[];
      over: boolean;
      turn: boolean;
      result: string;
      inCheck: boolean;
      checked: string[];
    } | null>(null),
    [goState, setGoState] = useState(() => newGo()),
    [history, setHistory] = useState<string[]>([]),
    [isHostPlayer, setIsHostPlayer] = useState(false);
  function refresh() {
    const b = board.current;
    if (b)
      setSnapshot({
        fen: b.fen(),
        legal: b.legalMoves().trim().split(" ").filter(Boolean),
        over: b.isGameOver(),
        turn: b.turn(),
        result: b.result(),
        inCheck: b.isCheck(),
        checked: b.checkedPieces().trim().split(/\s+/).filter(Boolean),
      });
    setGoState({ ...go.current });
  }
  function dispose(keepRoom = false) {
    generation.current++;
    active.current = false;
    recoveryChannel.current?.stop();recoveryChannel.current=null;recoverySecret.current='';transportEpoch.current='';
    if (timeout.current) clearTimeout(timeout.current);
    connection.current?.close();
    if (!keepRoom || peer.current !== hostRoom.current) { peer.current?.destroy(); if (peer.current === hostRoom.current) { hostRoom.current = null; setVisitors([]); } }
    connection.current = null;
    manual.current = null;
    peer.current = null;
    board.current?.delete();
    board.current = null;
    journal.current?.dispose();journal.current=null;peerIdentity.current=null;
    goJournal.current=null;
  }
  useEffect(
    () => () => {
      dispose();
    },
    [],
  );
  function reconnectHost(c: BoardConnection) {
    persist();
    let save: BoardRecoverySave | null = null;
    try { save = readBoardSave(sessionStorage, game); } catch { /* handled below */ }
    if (!save) { c.close(); return; }
    setReconnecting(true);
    void start(true, save, { auto: true, pending: c });
  }
  function autoReconnect(isHost: boolean) {
    if (active.current) persist();
    let save: BoardRecoverySave | null = null;
    try { save = readBoardSave(sessionStorage, game); } catch { /* fall through to a plain stop */ }
    if (!save || autoTries.current >= 3) {
      fail(zh ? '对手已离线，棋谱已保存。双方保留本页，点“恢复上次对局”即可接着下。' : 'Opponent disconnected; moves are saved. Keep this page and choose Restore previous match to continue.');
      return;
    }
    autoTries.current++;
    const resume = save;
    setReconnecting(true); setWaitSince(w => w ?? Date.now());
    if (isHost) lounge.hostDetach('guest', false); else lounge.guestDetach('offline');
    setLinkNote(isHost
      ? (zh ? '对方暂时断线了（手机锁屏或切到其他应用时常见）。房间仍然有效，对方回到页面后会自动接上，棋局已保存。' : 'Your opponent dropped out (common when a phone locks or switches apps). The room stays open; they reconnect automatically when they return. The game is saved.')
      : (zh ? '连接中断了，正在自动重新连上房主……棋局已保存，会回到原来的局面。' : 'Connection lost; reconnecting to the host automatically… The game is saved and will resume where it stopped.'));
    const go = () => { void start(isHost, resume, { auto: true }); };
    // A hidden page cannot hold a connection on phones; rejoin when the player returns.
    if (isHost || typeof document === 'undefined' || document.visibilityState === 'visible') { go(); return; }
    const token = generation.current;
    const back = () => { if (document.visibilityState !== 'visible') return; document.removeEventListener('visibilitychange', back); if (token === generation.current) go(); };
    document.addEventListener('visibilitychange', back);
  }
  function fail(message: string) {
    generation.current++;
    active.current = false;
    recoveryChannel.current?.stop();recoveryChannel.current=null;
    setStatus("error");
    setSignal(''); setAnswer(''); setInvitation(''); setSignalBusy(false);
    setError(message); setLinkNote('');
    if (timeout.current) clearTimeout(timeout.current);
    connection.current?.close();
    peer.current?.destroy();
    if (peer.current === hostRoom.current) { hostRoom.current = null; setVisitors([]); }
    setReconnecting(false); setWaitSince(null);
  }
  function apply(move: string | null, remote: boolean) {
    if (!active.current || matchRef.current.resigned !== null) return false;
    const first = game === "go" ? go.current.turn === 1 : board.current?.turn();
    if (first !== (remote ? !host.current : host.current)) return false;
    if (game === "go") {
      const p = move === null ? null : Number(move);
      if (move !== null && (!/^\d+$/.test(move) || !Number.isInteger(p)))
        return false;
      const result = playGo(go.current, p);
      if (!result.state) return false;
      try{
        if(!goJournal.current)throw new Error('Missing Go journal');
        goJournal.current.apply({seat:(remote?!host.current:host.current)?0:1,round:matchRef.current.round,revision:goJournal.current.view().revision,action:{kind:'move',point:p}});
      }catch{fail(zh?'围棋操作记录不一致，已暂停对局。':'Go action record mismatch; play paused.');return false;}
      go.current = result.state;
      if(result.state.passes>=2)publishReview(newReview());
    } else {
      const b = board.current;
      if (
        !b ||
        b.isGameOver() ||
        !move ||
        !b.legalMoves().split(" ").includes(move)
      )
        return false;
      if(!journal.current)return false;
      try{journal.current.apply({seat:(remote?!host.current:host.current)?0:1,round:matchRef.current.round,revision:journal.current.view().revision,action:{kind:'move',uci:move}});}
      catch{fail(zh?'棋谱记录不一致，已暂停对局。':'Move record mismatch; play paused.');return false;}
      if (!b.push(move)) {fail(zh?'棋盘与棋谱不同步，已暂停对局。':'Board and move record differ; play paused.');return false;}
    }
    sequence.current++;
    const readableMove = game === 'go' && move !== null ? `${'ABCDEFGHJKLMNOPQRST'[Number(move)%go.current.size]}${go.current.size-Math.floor(Number(move)/go.current.size)}` : move;
    setHistory((h) => [...h, readableMove ?? (zh ? "停一手" : "Pass")]);
    refresh();
    persist();
    return true;
  }
  function sendMove(move: string | null) {
    const conn = connection.current;
    if (!conn?.open) return;
    const seq = sequence.current;
    if (apply(move, false))
      conn.send({ v: 5, epoch:transportEpoch.current, game, round:matchRef.current.round, kind: "move", seq, move } satisfies Wire);
  }
  async function start(isHost: boolean, recovery:BoardRecoverySave|null=null, opts: { auto?: boolean; pending?: BoardConnection; fresh?: boolean } = {}) {
    if(!secureMultiplayerContext()){setError(insecureMultiplayerMessage(locale));return;}
    if(recovery&&(recovery.game!==game||(recovery.role==='host')!==isHost))return;
    const chosenMode=mode;
    if(!isHost&&chosenMode==='manual'){
      try{readManualSignal(invitation,game,'offer');}
      catch{setError(zh?'邀请文本无效或不属于当前游戏。请粘贴房主发来的完整邀请，再重试。':'Invalid invitation or wrong game. Paste the complete invitation from the host and retry.');return;}
    }
    if(!recovery&&(saved||saveError)){const intent=isHost?'host':'guest';if(replaceIntent!==intent){setReplaceIntent(intent);return;}}
    dispose(isHost && !!opts.auto && chosenMode === 'public');
    if (!opts.auto) { autoTries.current = 0; setReconnecting(false); }
    resumeSelection.current=recovery;setRestoring(!!recovery);setReplaceIntent(null);setClearConfirm(false);
    recoverySecret.current=recovery?.secret??(isHost?newBoardRecoverySecret():'');
    transportEpoch.current=isHost?crypto.randomUUID():'';
    matchRef.current = newMatch(); setMatch(newMatch()); setCopyMessage('');
    const token = generation.current;
    host.current = isHost;
    setIsHostPlayer(isHost);
    sequence.current = 0;
    setHistory([]);
    setCode("");
    setSignal(''); setAnswer(''); setSignalBusy(chosenMode === 'manual');
    setError("");
    setStatus("connecting");
    go.current = newGo();
    publishReview(newReview());
    setSnapshot(null);
    try {
      if (isBoardGame(game)) {
        const f = await loadFfish();
        if (token !== generation.current) return;
        board.current = new f.Board(game);
        rules.current=f;
        if(recovery)journal.current=BoardRecoverySession.restore(f,recovery.checkpoint,game);
        else if(isHost)journal.current=new BoardRecoverySession(f,game,crypto.randomUUID());
        initialFen.current = board.current.fen();
      }
      else {rules.current=null;if(recovery)goJournal.current=GoRecoverySession.restore(recovery.checkpoint);else if(isHost)goJournal.current=new GoRecoverySession(crypto.randomUUID());}
      refresh();
      timeout.current = setTimeout(() => {
        if (token === generation.current)
          fail(
            zh
              ? "连接超时。请检查网络，或重新创建房间。"
              : "Connection timed out. Check the network or create a new room.",
          );
      }, 25000);
      // Link-mode host: a handshake that never completed (for example the guest gave up while this
      // page sat in the background) frees the seat instead of ending the room.
      const linkHostWaiting = () => isHost && chosenMode === 'public' && !active.current;
      const release = (c: BoardConnection) => {
        if (connection.current !== c) return;
        connection.current = null; recoveryChannel.current?.stop(); recoveryChannel.current = null;
        if (timeout.current) clearTimeout(timeout.current);
        setStatus('waiting');
      };
      const attach = (c: BoardConnection) => {
        if (connection.current) {
          // The guest rejoined while this side still believes the old channel is alive.
          if (isHost && chosenMode === 'public' && active.current) { reconnectHost(c); return; }
          if (!linkHostWaiting()) { c.on("open", () => c.close()); return; }
          const stale = connection.current; release(stale); stale.close();
        }
        connection.current = c;
        if(recovery){
          recoveryChannel.current=new BoardRecoveryChannel(c,rules.current,game,isHost?'host':'guest',recovery.secret,recovery.checkpoint,(checkpoint,epoch)=>{
            if(token!==generation.current)return;
            try{
              if(game==='go'){
                const restored=GoRecoverySession.restore(checkpoint),v=restored.view();goJournal.current=restored;go.current=v.board;reviewRef.current=v.review;setReview(v.review);matchRef.current=v.match;setMatch(v.match);
                const moves=(JSON.parse(checkpoint).events as GoRecoveryEvent[]).filter(e=>e.round===v.match.round&&e.action.kind==='move').map(e=>e.action.kind==='move'?e.action.point:null);
                sequence.current=moves.length;setHistory(moves.map(p=>p===null?(zh?'停一手':'Pass'):`${'ABCDEFGHJKLMNOPQRST'[p%v.board.size]}${v.board.size-Math.floor(p/v.board.size)}`));
              }else{
              const restored=BoardRecoverySession.restore(rules.current!,checkpoint,game),v=restored.view();
              const b=new rules.current!.Board(game);if(v.moves)b.pushMoves(v.moves);
              board.current?.delete();board.current=b;journal.current?.dispose();journal.current=restored;
              matchRef.current=v.match;setMatch(v.match);const moves=v.moves.trim().split(/\s+/).filter(Boolean);sequence.current=moves.length;setHistory(moves);
              }
              transportEpoch.current=epoch;active.current=true;autoTries.current=0;setReconnecting(false);setWaitSince(null);setLinkNote('');setStatus('connected');setSignal('');setAnswer('');setInvitation('');setSignalBusy(false);
              if(timeout.current)clearTimeout(timeout.current);refresh();persist();
            }catch{fail(zh?'恢复棋谱失败，原存档保留。':'Could not restore the move record; original save retained.');}
          },()=>{if(token===generation.current)fail(zh?'恢复验证失败或连接超时。请检查双方原标签页、游戏与存档；不会重新发局。':'Recovery verification failed or timed out. Check both original tabs, games and saves. No new game was started.');});
        }
        if (timeout.current) clearTimeout(timeout.current);
        timeout.current = setTimeout(() => {
          if (token !== generation.current) return;
          if (linkHostWaiting()) { release(c); c.close(); return; }
          fail(zh ? "对手连接超时，请重新创建房间。" : "Peer handshake timed out. Create a new room.");
        }, 25000);
        const opened = () => {
          if (token !== generation.current || connection.current !== c) return;
          if(recovery){recoveryChannel.current?.open();return;}
          c.send({ v: 5, epoch:transportEpoch.current,secret:isHost?recoverySecret.current:undefined,game, round:matchRef.current.round, kind: "hello", seq: 0,identity:journal.current?.view().identity??goJournal.current?.view().identity,goJournal:game==='go'?1:undefined } satisfies Wire);
        };
        c.on("open", opened);
        // A link-mode connection is handed over already open.
        if (c.open) queueMicrotask(opened);
        c.on("data", (raw) => {
          if (
            token !== generation.current || connection.current !== c ||
            typeof raw !== "object" ||
            raw === null
          )
            return;
          if(recovery&&!active.current){recoveryChannel.current?.receive(raw);return;}
          const m = raw as Partial<Wire>;
          if (m.v !== 5 || m.game !== game)
            return fail(
              zh ? "房间游戏或版本不匹配。" : "Game or protocol mismatch.",
            );
          if(active.current&&m.epoch!==transportEpoch.current)return fail(zh?'收到旧连接的消息，已暂停对局。':'Message from a different connection; play paused.');
          if (m.kind === 'match-state') {
            if (host.current || !active.current || !validMatch(m.match) || m.round !== m.match.round) return;
            if (m.match.round < matchRef.current.round) return;
            if (m.match.round > matchRef.current.round + 1) return fail(zh ? '对局轮次不同步。' : 'Round mismatch.');
            if(isBoardGame(game)){
              try{
                if(!journal.current)throw new Error('Missing journal');
                if(m.matchEvent){if(m.matchEvent.action.kind==='move')throw new Error('Wrong event channel');journal.current.apply(m.matchEvent);}
                if(JSON.stringify(journal.current.view().match)!==JSON.stringify(m.match))throw new Error('Match record mismatch');
              }catch{return fail(zh?'认输或再开记录不一致，已暂停对局。':'Resignation or rematch record mismatch; play paused.');}
            }
            else{
              try{
                if(!goJournal.current)throw new Error('Missing Go journal');
                if(m.goEvent){if(!['resign','rematch'].includes(m.goEvent.action.kind))throw new Error('Wrong Go event channel');goJournal.current.apply(m.goEvent);}
                if(JSON.stringify(goJournal.current.view().match)!==JSON.stringify(m.match))throw new Error('Go match mismatch');
              }catch{return fail(zh?'围棋认输或再开记录不一致。':'Go resignation or rematch record mismatch.');}
            }
            publishMatch(m.match); return;
          }
          if (m.round !== matchRef.current.round) return;
          if (m.kind === 'match-action') {
            if (host.current && active.current && (m.matchAction === 'resign' || m.matchAction === 'rematch')) hostMatch(m.matchAction, 1);
            return;
          }
          if (m.kind === "hello" && m.seq === 0 && !active.current) {
            if(game==='go'){
              if(m.goJournal!==1)return fail(zh?'围棋版本不匹配，请双方刷新。':'Go version mismatch. Both players must refresh.');
              if(!host.current){
                if(peerIdentity.current||typeof m.identity!=='string'||!/^[a-zA-Z0-9-]{12,80}$/.test(m.identity)||!validRecoveryKey(m.secret))return fail(zh?'围棋对局标识或恢复凭证无效。':'Invalid Go match identity or recovery credential.');
                recoverySecret.current=m.secret;
                peerIdentity.current=m.identity;goJournal.current=new GoRecoverySession(m.identity);
              }
            }
            if(isBoardGame(game)&&!host.current){
              if(peerIdentity.current||!rules.current||typeof m.identity!=='string'||!/^[a-zA-Z0-9-]{12,80}$/.test(m.identity)||!validRecoveryKey(m.secret))return fail(zh?'对局标识或恢复凭证无效。':'Invalid match identity or recovery credential.');
              recoverySecret.current=m.secret;
              peerIdentity.current=m.identity;journal.current=new BoardRecoverySession(rules.current,game,m.identity);
            }
            if(!host.current){if(typeof m.epoch!=='string'||!/^[a-zA-Z0-9-]{12,80}$/.test(m.epoch))return fail(zh?'连接标识无效。':'Invalid connection identity.');transportEpoch.current=m.epoch;}
            c.send({ v: 5, epoch:transportEpoch.current,game, round:matchRef.current.round, kind: "ready", seq: 0,identity:journal.current?.view().identity??goJournal.current?.view().identity,goJournal:game==='go'?1:undefined } satisfies Wire);
            return;
          }
          if (
            m.kind === "ready" &&
            m.seq === 0 &&
            !active.current &&
            sequence.current === 0
          ) {
            if(m.epoch!==transportEpoch.current||isBoardGame(game)&&(!journal.current||m.identity!==journal.current.view().identity))return fail(zh?'对局标识不同步。':'Match identity mismatch.');
            if(game==='go'&&(m.goJournal!==1||!goJournal.current||m.identity!==goJournal.current.view().identity))return fail(zh?'围棋对局标识或版本不匹配。':'Go identity or version mismatch.');
            active.current = true;
            autoTries.current = 0; setReconnecting(false); setWaitSince(null); setLinkNote('');
            setStatus("connected");
            setSignal(''); setAnswer(''); setInvitation(''); setSignalBusy(false);
            if (timeout.current) clearTimeout(timeout.current);
            persist();
            return;
          }
          if(m.kind==='review-action'&&host.current&&game==='go'&&m.seq===sequence.current&&m.action&&Number.isInteger(m.revision)){hostReview(m.action,1,m.revision!);return;}
          if(m.kind==='review-state'&&!host.current&&game==='go'&&active.current&&go.current.passes>=2&&m.seq===sequence.current){
            if(!validReview(m.review,go.current))return fail(zh?'收到不合法的计分提案。':'Invalid scoring proposal.');
            try{
              if(!goJournal.current)throw new Error('Missing Go journal');
              if(m.goEvent){if(m.goEvent.action.kind!=='review')throw new Error('Wrong Go event channel');goJournal.current.apply(m.goEvent);}
              if(JSON.stringify(goJournal.current.view().review)!==JSON.stringify(m.review))throw new Error('Go review mismatch');
            }catch{return fail(zh?'围棋计分操作记录不一致，已暂停对局。':'Go scoring action record mismatch; play paused.');}
            publishReview(m.review);persist();return;
          }
          if (m.kind === "move") {
            if (matchRef.current.resigned !== null) return;
            if (
              m.seq !== sequence.current ||
              !(typeof m.move === "string" || m.move === null) ||
              !apply(m.move, true)
            )
              fail(
                zh
                  ? "收到不合法或不同步的着法，已暂停对局。"
                  : "Invalid or out-of-sync move. The game has been paused.",
              );
          }
        });
        c.on("close", () => {
          if (token !== generation.current || connection.current !== c) return;
          if (linkHostWaiting()) { release(c); return; }
          if (chosenMode === 'public' && (active.current || opts.auto)) { autoReconnect(isHost); return; }
          if (chosenMode === 'public' && isHost) lounge.hostDetach('guest', true, byeMessage('left', zh, friendName.current));
          fail(
              zh
                ? "对手已离线，棋谱保留。双方可用原标签页存档重新交换邀请恢复。请先检查保存是否成功。"
                : "Opponent disconnected; moves retained. Both original tabs can restore using their saves and fresh invitations. Check that saving succeeded first.",
            );
        });
        c.on("error", () => {
          if (token !== generation.current || connection.current !== c) return;
          if (linkHostWaiting()) { release(c); c.close(); return; }
          if (chosenMode === 'public' && (active.current || opts.auto)) { autoReconnect(isHost); return; }
          fail(
            active.current
              ? zh
                ? "对战连接已中断，可能是对方离开或网络变化。棋盘与棋谱已保留，不会自动判胜。请双方重新交换连接码开始新局。"
                : "The game connection was interrupted: the other player may have left or the network changed. The position and moves are retained; no winner is awarded automatically. Exchange new connection text to start a new game."
              : zh
                ? "未能建立直连。请核对双方网络与完整连接码后重试；不要关闭防火墙。"
                : "Could not establish a direct connection. Check both networks and the complete connection text before retrying; do not disable your firewall.",
          );
        });
      };
      if (chosenMode === 'manual') {
        const c = new ManualBoardConnection(game, isHost);
        manual.current = c;
        attach(c);
        // Exchanging text is a human-paced step, not a 25-second handshake.
        if (timeout.current) clearTimeout(timeout.current);
        const text = isHost ? await c.rtc.offer() : await c.rtc.answer(invitation);
        if (token !== generation.current) return;
        if (!active.current) { setSignal(text); setStatus('waiting'); }
        setSignalBusy(false);
        return;
      }
      // Link mode: the public signaling service relays only the handshake.
      if (isHost) {
        hostEvents.current = {
          ready: own => { if (token !== generation.current) return; rememberRoom(own); lounge.hostOpen(); setCode(own); setStatus('waiting'); if (!opts.auto) setLinkNote(''); if (timeout.current) clearTimeout(timeout.current); },
          reconnecting: () => { if (token === generation.current && !active.current && !opts.auto) setLinkNote(zh ? '正在重新连上房间服务，房间仍然有效…' : 'Reconnecting to the room service; the room is still open…'); },
          connection: (c, visitor, session) => {
            if (token !== generation.current) { c.close(); return; }
            nameFriend(visitor.name);
            lounge.hostAttach('guest', session, visitor);
            watchSession(session, true, token);
            attach(c);
          },
          // Returning players go straight to the verified recovery; newcomers wait for the host,
          // and nobody new is asked about once a game (or its recovery) is under way.
          policy: v => v.resume ? 'admit' : active.current || connection.current || recovery ? 'full' : 'ask',
          failure: reason => {
            if (token !== generation.current) return;
            // After a refresh the old id may still be held briefly; fall back to a fresh link.
            if (reason === 'room-taken' && recovery && !opts.fresh) { hostRoom.current?.destroy(); hostRoom.current = null; peer.current = null; void start(true, recovery, { fresh: true }); return; }
            fail(peerFailureMessage(reason, zh));
          },
        };
        const delegating: PeerRoomEvents = {
          onReady: own => hostEvents.current?.ready(own),
          onReconnecting: () => hostEvents.current?.reconnecting(),
          onConnection: (c, _meta, visitor, session) => { if (hostEvents.current) hostEvents.current.connection(c, visitor, session); else c.close(); },
          profile: { name: readNickname(), device: deviceLabel() },
          onFailure: reason => hostEvents.current?.failure(reason),
          onVisitors: setVisitors,
          policy: v => hostEvents.current?.policy(v) ?? 'full',
        };
        if (hostRoom.current) {
          peer.current = hostRoom.current;
          hostRoom.current.update(delegating);
          setCode(linkCode.current); setStatus('waiting');
          if (timeout.current) clearTimeout(timeout.current);
          if (opts.pending) attach(opts.pending);
        } else {
          const preferred = recovery && !opts.fresh ? storedRoom() : '';
          const room = await hostPeerRoom(preferred || newRoomCode(game), delegating);
          if (token !== generation.current) { room.destroy(); return; }
          peer.current = hostRoom.current = room;
        }
      } else {
        const target = recovery ? (linkCode.current || storedRoom() || roomCode(entry ?? invited, game)) : roomCode(entry ?? invited, game);
        if (!target) { fail(zh ? '请粘贴房主发来的邀请链接。' : 'Paste the invitation link from the host.'); return; }
        if (timeout.current) clearTimeout(timeout.current);
        const lookingNote = zh ? '已连上房间服务，正在寻找房主……如果房主暂时切到了其他应用，会自动重试，最多等 5 分钟。' : 'Room service reached; looking for the host… if they switched apps briefly, this retries automatically for up to 5 minutes.';
        if (!opts.auto) setLinkNote(zh ? '正在连接房间服务…' : 'Connecting to the room service…');
        let missingShown = false;
        const missingNote = zh ? '暂时找不到这个房间：房主可能已关闭页面，或暂时切到了其他应用。会继续自动尝试 2 分钟；一直找不到的话，请向房主要新的邀请链接。' : 'This room cannot be found right now: the host may have closed the page or briefly switched apps. Retrying automatically for 2 minutes; if it never appears, ask the host for a new link.';
        const room = await joinPeerRoom(target, {}, {
          onOpen: (c, session, hostProfile) => {
            if (token !== generation.current) { c.close(); return; }
            guestSession.current = session; nameFriend(hostProfile.name);
            lounge.guestAttach(session, hostProfile); watchSession(session, false, token);
            rememberRoom(target); if (!opts.auto) setLinkNote(''); attach(c);
          },
          onService: () => { if (token === generation.current && !opts.auto) setLinkNote(lookingNote); },
          onWaiting: () => { if (token === generation.current && !opts.auto && !missingShown) setLinkNote(lookingNote); },
          onMissing: () => { if (token !== generation.current || opts.auto) return; missingShown = true; setLinkNote(missingNote); },
          onKnocking: () => { if (token === generation.current && !opts.auto) setLinkNote(zh ? '已连上房主，正在等房主同意你加入……' : 'Reached the host; waiting for them to let you in…'); },
          onFailure: reason => { if (token === generation.current) fail(peerFailureMessage(reason, zh)); },
        }, { name: readNickname(), resume: !!recovery });
        if (token !== generation.current) { room.destroy(); return; }
        peer.current = room;
      }
    } catch {
      if (token === generation.current)
        fail(
          zh
            ? "无法加载规则或连接服务，请重试。"
            : "Could not load the rules or connection service. Please retry.",
        );
    }
  }
  async function finishManual() {
    const c = manual.current, token = generation.current;
    if (!c || signalBusy) return;
    setSignalBusy(true);
    try {
      await c.rtc.finish(answer);
      if (token !== generation.current) return;
      setSignalBusy(false);
      if (!active.current) {
        setStatus('connecting');
        timeout.current = setTimeout(() => {
          if (token === generation.current && !active.current)
            fail(zh ? '直连超时。请检查双方局域网和防火墙后重新交换连接码。' : 'Direct connection timed out. Check the LAN and firewall, then exchange fresh codes.');
        }, 25000);
      }
    } catch {
      if (token !== generation.current) return;
      // Name the cause so players know whether to re-copy or start over.
      let parsed: { id: string } | null = null;
      try { parsed = readManualSignal(answer, game, 'answer'); } catch { /* not a reply code */ }
      if (!parsed) { setSignalBusy(false); setError(zh ? '这不是完整的回复码。请让朋友重新复制整段回复码，再粘贴一次。' : 'That is not a complete reply code. Ask your friend to copy the whole reply again and paste it.'); return; }
      fail(c.rtc.signalId !== parsed.id
        ? (zh ? '这个回复码对应的是另一张邀请码（可能重新生成过邀请码）。请把当前的邀请码重新发给朋友。' : 'This reply belongs to a different invitation (one may have been recreated). Send your current invitation again.')
        : (zh ? '邀请已失效：等待期间这个页面的连接被浏览器关闭了（手机切到后台时常见）。请重新生成邀请码再试。' : 'The invitation expired: the browser closed this page’s connection while waiting (common when a phone switches apps). Create a new invitation and try again.'));
    }
  }
  const myTurn =
    status === "connected" && match.resigned === null &&
    (game === "go" ? goState.turn === 1 : snapshot?.turn) === isHostPlayer;
  const hasEnded = match.resigned !== null || (game === 'go' ? reviewDone(review) : !!snapshot?.over);
  const t = (cn: string, en: string) => zh ? cn : en;
  const connected = status === 'connected', starting = status === 'idle' || status === 'error';
  const seatName = isHostPlayer ? t('房主', 'Host') : t('朋友', 'Guest');
  const sides = game === 'go' ? null : VARIANTS[game].sideName;
  const firstSide = sides ? t(`执${sides.w.zh}（先走）`, `playing ${sides.w.en} (moves first)`) : t('执黑（先走）', 'playing Black (moves first)');
  const secondSide = sides ? t(`执${sides.b.zh}（后走）`, `playing ${sides.b.en} (moves second)`) : t('执白（后走）', 'playing White (moves second)');
  const turnText = hasEnded ? t('本局结束，双方都同意才会再来一局', 'Game over — both must agree to a rematch') : game === 'go' && goState.passes >= 2
    ? (reviewDone(review) ? t('双方已确认，本局结束', 'Both confirmed — game ended') : t('双方停一手：一起核对死子与计分', 'Both passed: review dead stones and the score together'))
    : myTurn ? t('轮到你了', 'Your turn') : t('等待对方落子', 'Opponent’s turn');
  const statusText = connected ? turnText
    : reconnecting ? (isHostPlayer ? t('等待对方重新连上', 'Waiting for your opponent to reconnect') : t('正在重新连线…', 'Reconnecting…'))
    : status === 'waiting' ? (mode === 'public' ? (isHostPlayer ? (visitors.some(v => v.state === 'knocking') ? t('有人想加入', 'Someone wants to join') : t('等待朋友打开链接', 'Waiting for your friend to open the link')) : t('正在加入房间…', 'Joining the room…')) : isHostPlayer ? t('等待朋友的回复码', 'Waiting for your friend’s reply code') : t('等待房主连接', 'Waiting for the host to connect'))
    : status === 'connecting' ? t('正在连接…', 'Connecting…')
    : status === 'error' ? t('连接已中断', 'Connection stopped') : t('未连接', 'Not connected');
  const waited = waitSince === null ? 0 : Math.max(0, Math.floor(((clock || waitSince) - waitSince) / 1000));
  const left = Math.max(0, Math.ceil(JOIN_LIMIT_MS / 1000) - waited);
  const mmss = (n: number) => `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`;
  useAttention(connected && myTurn && !hasEnded ? t('♟ 轮到你了', '♟ Your turn') : lounge.unread ? t(`💬 新消息（${lounge.unread}）`, `💬 ${lounge.unread} new`) : null);
  useLeaveGuard(connected && !hasEnded);
  const tone = connected ? 'ok' : status === 'error' ? 'warn' : status === 'idle' ? 'idle' : 'busy';
  async function copyText(value: string, done: string) {
    try { await navigator.clipboard.writeText(value); setCopyMessage(done); }
    catch { setCopyMessage(t('自动复制失败：请点一下文本框，全选后手动复制。', 'Copy failed: tap the box, select everything and copy it manually.')); }
  }
  /** Leaving on purpose: the host dissolves the room; a guest says goodbye. Nobody waits for a reconnection. */
  function leave() {
    if (mode === 'public') {
      if (isHostPlayer && hostRoom.current) { const room = hostRoom.current; hostRoom.current = null; peer.current = null; connection.current = null; room.dissolve(); }
      else if (guestSession.current) { const session = guestSession.current, room = peer.current; peer.current = null; connection.current = null; session.bye('left'); setTimeout(() => room?.destroy(), 500); }
      guestSession.current = null; forgetRoom(); lounge.clear();
    }
    dispose(); setReconnecting(false); setWaitSince(null); autoTries.current = 0; setStatus('idle'); setSignal(''); setAnswer(''); setInvitation(''); setSignalBusy(false); setError(''); setCode(''); setCopyMessage(''); setLinkNote(''); }
  const hostSteps: { label: string; state: StepState; body?: ReactNode }[] = [
    { label: t('生成邀请码', 'Create an invitation code'), state: signal ? 'done' : 'now', body: !signal && signalBusy ? <p>{t('正在生成，通常几秒钟…', 'Creating it — usually a few seconds…')}</p> : undefined },
    { label: t('把邀请码发给朋友，再粘贴朋友发回的回复码', 'Send the invitation, then paste your friend’s reply code'), state: signal && status === 'waiting' ? 'now' : status === 'connecting' && !signalBusy ? 'done' : 'todo', body: signal && status === 'waiting' ? <>
      <SignalOutput label={t('你的邀请码（整段复制发给朋友，它不是网址）', 'Your invitation code (send all of it; it is not a web address)')} value={signal} copyLabel={t('复制邀请码', 'Copy invitation code')} onCopy={() => copyText(signal, t('邀请码已复制，发给朋友吧。', 'Invitation copied — send it to your friend.'))} />
      <label className="block text-sm font-bold">{t('粘贴朋友发回的回复码', 'Paste your friend’s reply code')}<textarea className="room-field" rows={3} maxLength={65536} value={answer} onChange={e => setAnswer(e.target.value)} /></label>
      <div><button className="rpg-button" disabled={!answer.trim() || signalBusy || status !== 'waiting'} onClick={finishManual}>{t('使用回复码连接', 'Connect with reply code')}</button></div>
    </> : undefined },
    { label: t('连接成功后开始对局', 'Start playing once connected'), state: status === 'connecting' && !signalBusy ? 'now' : 'todo', body: status === 'connecting' && !signalBusy ? <p>{t('正在建立连接，最多约 25 秒。', 'Connecting — this takes up to about 25 seconds.')}</p> : undefined },
  ];
  const guestSteps: { label: string; state: StepState; body?: ReactNode }[] = [
    { label: t('生成回复码', 'Create your reply code'), state: signal ? 'done' : 'now', body: !signal ? <p>{t('正在生成，通常几秒钟…', 'Creating it — usually a few seconds…')}</p> : undefined },
    { label: t('把回复码发回给房主，等房主连接', 'Send the reply code back and wait for the host'), state: signal ? 'now' : 'todo', body: signal ? <SignalOutput label={t('你的回复码（整段复制发给房主）', 'Your reply code (send all of it to the host)')} value={signal} copyLabel={t('复制回复码', 'Copy reply code')} onCopy={() => copyText(signal, t('回复码已复制，发回给房主吧。', 'Reply copied — send it back to the host.'))} /> : undefined },
    { label: t('房主连接后自动开始', 'The game starts when the host connects'), state: 'todo' },
  ];
  return (
    <div className="space-y-7">
      <div className="room">
        <RoomHeader title={connected ? t(`第 ${match.round} 局 · 你是${seatName}，${isHostPlayer ? firstSide : secondSide}`, `Round ${match.round} · You are the ${seatName.toLowerCase()} and ${isHostPlayer ? firstSide : secondSide}`) : t('双人好友对战', 'Two-player friend room')} lead={connected ? undefined : t('一人开房、一人加入。房主执先，朋友执后。', 'One player opens the room, the other joins. The host moves first.')} tone={tone}>{statusText}</RoomHeader>
        {error && <RoomAlert>{error}</RoomAlert>}
        {saveError && <RoomAlert>{saveError}</RoomAlert>}
        {starting && (saved || saveError) && <div className="room-banner" aria-label={t('上次的对局', 'Previous match')}>
          <p className="room-banner-title">{saved ? t('发现本标签页保存的上次对局', 'This tab has a saved match') : t('存档读取失败', 'The save could not be read')}</p>
          {saved && <p>{t(`你上次是${saved.role === 'host' ? '房主' : '朋友'}。想接着下：双方都点“恢复上次对局”，${mode === 'public' ? '房主把新的邀请链接发给朋友，朋友把链接粘贴到“加入房间”' : '再像开房一样重新交换一次邀请码和回复码'}，棋局会回到断开时的局面。`, `You were the ${saved.role} last time. To continue, both players choose Restore previous match, then ${mode === 'public' ? 'the host sends a new invitation link and the guest pastes it into Join room' : 'swap a fresh invitation and reply'}; the board returns to where it stopped.`)}</p>}
          <div className="room-actions">
            {saved && <button className="rpg-button" onClick={() => { setReplaceIntent(null); setClearConfirm(false); if (saved.role === 'host') void start(true, saved); else if (mode === 'public' && storedRoom()) void start(false, saved); else { resumeSelection.current = saved; setRestoring(true); setError(''); } }}>{t('恢复上次对局', 'Restore previous match')}</button>}
            <button className="room-link" onClick={() => { if (!clearConfirm) { setClearConfirm(true); return; } if (forget()) setRestoring(false); }}>{clearConfirm ? t('确认删除存档（无法撤销）', 'Confirm delete (cannot be undone)') : t('删除这个存档', 'Delete this save')}</button>
          </div>
        </div>}
        {replaceIntent && <RoomAlert>{t('你有一个未完成的对局存档。再点一次同一个按钮就开始新对局；旧存档会保留到新对局连上并保存后才被替换。', 'You have an unfinished saved match. Click the same button again to start a new game; the old save stays until the new game connects and saves.')}</RoomAlert>}
        {restoring && !(reconnecting && !connected) && <p className="room-progress">{connected ? t('已恢复原对局，没有重新开局。', 'Original match restored; no new game was started.') : mode === 'public' ? t('恢复模式：原房主会得到新的邀请链接，原朋友把它粘贴到“加入房间”。验证完成前不能走棋。', 'Recovery mode: the original host gets a new invitation link; the original guest pastes it into Join room. Moves stay locked until verification completes.') : t('恢复模式：原房主重新生成邀请码，原朋友粘贴后生成回复码。验证完成前不能走棋。', 'Recovery mode: the original host makes a new invitation, the original guest pastes it and replies. Moves stay locked until verification completes.')}</p>}
        {starting && mode === 'manual' && <div className="room-roles">
          <RoleCard badge={t('房主', 'Host')} title={t('我来开房', 'Open a room')} steps={[t('生成邀请码，发给朋友', 'Create an invitation code and send it'), t('粘贴朋友发回的回复码', 'Paste the reply code your friend sends back'), t('连接成功，你执先', 'Connected — you move first')]}>
            <button className="rpg-button" disabled={signalBusy} onClick={() => start(true)}>{t('生成邀请码', 'Create invitation code')}</button>
          </RoleCard>
          <RoleCard badge={t('朋友', 'Guest')} title={t('朋友邀请我', 'A friend invited me')} steps={[t('粘贴房主发来的邀请码', 'Paste the host’s invitation code'), t('生成回复码，发回给房主', 'Create a reply code and send it back'), t('房主连接后开始，你执后', 'Play starts when the host connects — you move second')]}>
            <label className="block text-sm font-bold">{t('粘贴房主发来的邀请码', 'Paste the host’s invitation code')}<textarea className="room-field" rows={3} maxLength={65536} value={invitation} onChange={e => { setInvitation(e.target.value); setReplaceIntent(null); }} /></label>
            <button className="rpg-button" disabled={!invitation.trim()} onClick={() => start(false, resumeSelection.current?.role === 'guest' ? resumeSelection.current : null)}>{t('生成回复码', 'Create reply code')}</button>
          </RoleCard>
        </div>}
        {starting && mode === 'public' && <div className="room-roles">
          <RoleCard badge={t('房主', 'Host')} title={t('我来开房', 'Open a room')} steps={[t('点“创建房间”，得到邀请链接', 'Create a room to get an invitation link'), t('把链接发给朋友（微信、短信都行）', 'Send the link to your friend by any chat app'), t('朋友打开链接就自动进房，你执先', 'Your friend joins by opening it — you move first')]}>
            <button className="rpg-button" onClick={() => start(true)}>{t('创建房间', 'Create room')}</button>
          </RoleCard>
          <RoleCard badge={t('朋友', 'Guest')} title={t('朋友邀请我', 'A friend invited me')} steps={[t('直接打开房主发来的链接，会自动加入', 'Open the host’s link — you join automatically'), t('或把链接粘贴到下面，点“加入房间”', 'Or paste the link below and choose Join room'), t('连接后开始，你执后', 'Play starts once connected — you move second')]}>
            <NicknameField zh={zh} />
            <label className="block text-sm font-bold">{t('房间码或邀请链接', 'Room code or invitation link')}<input className="room-field" placeholder={`yf-${game}-…`} value={entry ?? invited} onChange={e => { setEntry(e.target.value); setReplaceIntent(null); }} /></label>
            <button className="rpg-button" disabled={!roomCode(entry ?? invited, game)} onClick={() => start(false, resumeSelection.current?.role === 'guest' ? resumeSelection.current : null)}>{t('加入房间', 'Join room')}</button>
          </RoleCard>
        </div>}
        {!starting && !connected && mode === 'manual' && <Steps items={isHostPlayer ? hostSteps : guestSteps} />}
        {!starting && !connected && !reconnecting && mode === 'public' && code && <LinkShare zh={zh} code={code} title={t('房间已开好，把邀请链接发给朋友', 'Room ready — send the invitation link to your friend')} body={t('朋友打开链接后，这里会出现“有人想加入”，由你决定让不让他进来。你可以切去微信等应用发链接，房间在这个页面开着期间一直有效。', 'When your friend opens the link, “Someone wants to join” appears here and you decide whether to let them in. You can switch to a chat app to send it; the room stays open as long as this page is open.')} onCopied={value => copyText(value, t('邀请链接已复制，发给朋友吧。本机地址（localhost）只能在这台电脑打开。', 'Invitation link copied. A localhost link only opens on this computer.'))} />}
        {reconnecting && !connected && mode === 'public' && <div className="room-banner" role="status">
          <p className="room-banner-title">{isHostPlayer ? t(`等待${friend || '对方'}重新连上`, `Waiting for ${friend || 'your opponent'} to reconnect`) : t('正在等房主回来', 'Waiting for the host to come back')}</p>
          <p className="room-countdown">{isHostPlayer ? t(`已等待 ${mmss(waited)}。棋局已保存，对方回到页面后会自动接上。`, `Waiting ${mmss(waited)}. The game is saved; they reconnect automatically when they return.`) : t(`最多再等 ${mmss(left)}。房主回来后会自动接上；超时则视为房间已解散。`, `Up to ${mmss(left)} more. You reconnect automatically when the host returns; after that the room counts as closed.`)}</p>
          <div className="room-actions"><button className="rpg-button secondary" onClick={leave}>{isHostPlayer ? t('不等了，解散房间', 'Stop waiting and close the room') : t('不等了，离开', 'Stop waiting and leave')}</button></div>
        </div>}
        {isHostPlayer && mode === 'public' && !connected && <VisitorList zh={zh} visitors={visitors} onAdmit={id => hostRoom.current?.admit(id)} onDeny={id => hostRoom.current?.deny(id)} />}
        {mode === 'public' && !connected && <LoungePanel zh={zh} lounge={lounge} />}
        {linkNote && !connected && <p role="status" className="room-progress">{linkNote}</p>}
        {copyMessage && !connected && <p role="status" className="text-sm font-bold">{copyMessage}</p>}
        {!starting && !connected && <div><button className="room-link" onClick={leave}>{t('取消并离开', 'Cancel and leave')}</button></div>}
        {connected && <div className="room-bar">
          {!hasEnded && <div className="room-actions"><button className="rpg-button secondary" onClick={() => { if (confirmResign) sendMatchAction('resign'); else setConfirmResign(true); }}>{confirmResign ? t('确认认输，结束本局', 'Confirm resignation') : t('认输', 'Resign')}</button>{confirmResign && <button className="room-link" onClick={() => setConfirmResign(false)}>{t('取消', 'Cancel')}</button>}</div>}
          {hasEnded && <div className="room-actions"><button className="rpg-button" disabled={match.rematch[isHostPlayer ? 0 : 1]} onClick={() => sendMatchAction('rematch')}>{t('同意再来一局', 'Agree to a rematch')}</button><p className="text-sm">{t(`房主${match.rematch[0] ? '已同意' : '未同意'}；朋友${match.rematch[1] ? '已同意' : '未同意'}。双方同意后重新开局，房主仍然执先。`, `Host ${match.rematch[0] ? 'agreed' : 'pending'}; guest ${match.rematch[1] ? 'agreed' : 'pending'}. A new game starts once both agree; the host moves first again.`)}</p></div>}
          {confirmLeave
            ? <span className="room-actions"><button className="rpg-button secondary" onClick={() => { setConfirmLeave(false); leave(); }}>{isHostPlayer ? t('确认离开并解散房间', 'Leave and close the room') : t('确认离开（本局不判胜负）', 'Leave (no result for this game)')}</button><button className="room-link" onClick={() => setConfirmLeave(false)}>{t('继续下棋', 'Keep playing')}</button></span>
            : <button className="room-link" onClick={() => setConfirmLeave(true)}>{t('离开对局', 'Leave game')}</button>}
        </div>}
        {match.resigned !== null && <ResultDialog key={match.round} locale={locale} title={match.resigned === (isHostPlayer ? 0 : 1) ? t('你已认输', 'You resigned') : t('你获胜了', 'You win')} reason={t('一方主动认输，本局结束。棋盘与棋谱保留；双方同意再来一局才会清空。', 'A player resigned, ending this game. The position and moves remain until both agree to a rematch.')}/>}
        {starting && <RoomNotes summary={t('连接说明与常见问题', 'Connection notes and troubleshooting')}>
          <p>{mode === 'manual'
            ? t('当前为邀请码方式：不联系任何外部服务，需要双方各发一次代码。房主发出邀请码后可以切去聊天应用，回来再粘贴回复码。连接失败时，先确认双方使用同一局域网，再检查访客 Wi-Fi 隔离和防火墙，并重新交换完整连接码。不要关闭防火墙；也可以返回人机或同屏双人。', 'Code mode: no external service is contacted; each side sends one code. The host can switch to a chat app after sending the invitation and paste the reply later. If connection fails, check that both devices share a LAN, check guest Wi-Fi isolation and firewall rules, then exchange complete fresh codes. Do not disable the firewall. AI and local play remain available.')
            : t('当前为邀请链接方式：通过 PeerJS 公共服务转交连接信息，连上后棋步直接在双方之间传送。如果一直连不上（例如该服务在你的网络被屏蔽），可在下方改用“邀请码 + 回复码”。', 'Link mode: the PeerJS public service passes on the connection details; once connected, moves travel directly between the two players. If it never connects (for example the service is blocked on your network), switch to invitation + reply codes below.')}</p>
          <p>{t('双方都要通过有效 HTTPS 打开同一个游戏页面。localhost 只能在本机预览；直接用 http://局域网IP 打开时，浏览器不允许保存可恢复的对局。最好在同一个 Wi-Fi 下使用，跨网络不保证能连上。', 'Both players open the same game page over valid HTTPS. Localhost works only on this device; opening plain http on a LAN IP prevents the browser from keeping a recoverable match. The same Wi-Fi works best; cross-network connections are not guaranteed.')}</p>
          <p>{t('邀请码和回复码里可能包含本地网络信息，只发给你信任的朋友。离开页面后它们就失效了。', 'Invitation and reply codes may contain local network details. Share them only with friends you trust; they stop working when you leave the page.')}</p>
          <p>{t('刷新或断线后：连接成功后，棋谱、座位和恢复凭证会自动保存在本标签页（sessionStorage）。双方都保留原来的标签页，点“恢复上次对局”并重新交换一次邀请码和回复码即可接着下。关闭标签页、清理浏览数据或换设备后无法恢复；不要把存档分享给别人。', 'After a refresh or disconnect: once connected, the moves, seats and a recovery credential are saved in this tab (sessionStorage). Keep both original tabs, choose Restore previous match and swap a fresh invitation and reply to continue. Closing the tab, clearing browsing data or switching devices prevents recovery; never share a save.')}</p>
          {game === 'go' && <p>{t('围棋还会保存停一手、死子标记和双方的计分确认，恢复后从原来的步骤继续。', 'Go also saves passes, dead-stone marks and scoring approvals, and resumes at the same step.')}</p>}
          <label className="block"><span className="font-bold">{t('连接方式', 'Connection method')}</span><select className="room-field" value={mode} disabled={['connecting', 'waiting', 'connected'].includes(status)} onChange={e => { dispose(); resumeSelection.current = null; setRestoring(false); setReplaceIntent(null); setClearConfirm(false); setStatus('idle'); setError(''); setSignal(''); setAnswer(''); setInvitation(''); setMode(e.target.value as 'manual' | 'public'); }}><option value="public">{t('邀请链接 · 朋友打开即进房（推荐）', 'Invitation link · friend joins by opening it (recommended)')}</option><option value="manual">{t('邀请码 + 回复码 · 不经过任何服务', 'Invitation + reply codes · no service involved')}</option></select></label>
          {mode === 'public' && <p>{t('只有选择此模式并创建或加入房间后，才会联系 PeerJS 公共信令；其默认配置还会尝试第三方 STUN，并可能通过 TURN 中继传输对局数据。这不是完全无服务的直连，也不保证点对点传输。房间码不是密码，只发给受邀的朋友。远方朋友要打开已部署的网站，localhost 链接对方打不开。', 'Only after you select this mode and create or join a room does it contact public PeerJS signaling. Its default configuration also tries third-party STUN and may relay match data through TURN. This is not fully service-free or guaranteed peer-to-peer transport. A room code is not a password; share it only with invited players. A distant friend must open the deployed site — your localhost link will not work for them.')}</p>}
        </RoomNotes>}
      </div>
      {(connected || history.length > 0) && <div className="grid gap-8 lg:grid-cols-[minmax(0,640px)_1fr]">
        <div>
          {game === "go" ? (
            <>
              <GoBoard
                state={goState}
                locale={locale}
                dead={review.dead}
                disabled={goState.passes>=2 ? status!=='connected'||match.resigned!==null||reviewDone(review) : !myTurn}
                onPoint={(p) => goState.passes>=2 ? requestReview({kind:'toggle',point:p}) : sendMove(String(p))}
              />
              <button
                className="btn-sign mt-4"
                disabled={!myTurn || goState.passes >= 2}
                onClick={() => sendMove(null)}
              >
                {zh ? "停一手" : "Pass"}
              </button>
              {goState.passes >= 2 && (
                <section className="mt-5 space-y-3 rounded border border-[#ae8550] bg-paper p-4 leading-8">
                  <h3 className="text-xl font-bold">{zh?'双方核对死子，再确认结果':'Review dead groups, then both confirm'}</h3>
                  <p>{zh?'死子是双方认为已经无法救活的棋子。点击一枚棋子会标记或取消整块；这不是自动判死活。任意修改都会清除双方旧确认，有争议就继续下。':'Dead stones are groups both players agree cannot survive. Click a stone to toggle its entire group. Life and death is not automatic; edits clear both approvals. Resume play if disputed.'}</p>
                  <p>{zh?`当前计分：黑 ${scoreGo(goState,review.dead).black}，白 ${scoreGo(goState,review.dead).white}（含 7.5 贴目）。房主${review.approved[0]?'已确认':'未确认'}，朋友${review.approved[1]?'已确认':'未确认'}。`:`Current score: Black ${scoreGo(goState,review.dead).black}, White ${scoreGo(goState,review.dead).white} (7.5 komi included). Host ${review.approved[0]?'confirmed':'pending'}, guest ${review.approved[1]?'confirmed':'pending'}.`}</p>
                  <button className="btn-sign" disabled={status!=='connected'||reviewDone(review)||review.approved[isHostPlayer?0:1]} onClick={()=>requestReview({kind:'confirm'})}>{zh?'我同意这份死子与计分提案':'I agree with this proposal'}</button>
                  <button className="btn-sign btn-sign-outline ml-3" disabled={status!=='connected'||reviewDone(review)} onClick={()=>requestReview({kind:'resume'})}>{zh?'有争议，继续下':'Disputed — resume play'}</button>
                  {reviewDone(review)&&<ResultDialog locale={locale} title={scoreGo(goState,review.dead).black>scoreGo(goState,review.dead).white?(zh?'黑方获胜':'Black wins'):(zh?'白方获胜':'White wins')} reason={zh?`双方已确认同一提案。按活子＋独占空点计分，白另加 7.5。黑 ${scoreGo(goState,review.dead).black}，白 ${scoreGo(goState,review.dead).white}；高分方获胜。提走的棋子不再额外加分。`:`Both accepted the same proposal. Count surviving stones plus enclosed empty points; White adds 7.5. Black ${scoreGo(goState,review.dead).black}, White ${scoreGo(goState,review.dead).white}. Higher total wins; captures are not added again.`}/>} 
                </section>
              )}
            </>
          ) : snapshot && isBoardGame(game) ? (
            <>
              <Board
                spec={VARIANTS[game]}
                fen={snapshot.fen}
                legalMoves={snapshot.legal}
                onMove={sendMove}
                locale={locale}
                orientation={isHostPlayer ? "w" : "b"}
                movable={
                  myTurn && !snapshot.over
                    ? isHostPlayer
                      ? "w"
                      : "b"
                    : undefined
                }
                lastMove={history.at(-1) ?? null}
                checked={snapshot.checked}
              />
              {snapshot.over && (
                <ResultDialog key={match.round} locale={locale} title={snapshot.result === '1/2-1/2' ? t('和棋', 'Draw') : (snapshot.result === '1-0') === isHostPlayer ? t('你获胜了', 'You win') : t('对方获胜', 'Your opponent wins')} reason={snapshot.result === '1/2-1/2' ? (zh ? '规则引擎判定本局和棋。棋盘保留供复盘。' : 'The rules engine determined a draw. The board stays for review.') : (snapshot.inCheck ? (zh ? '被将军的一方没有合法应对，构成将死。' : 'The checked side has no legal response: checkmate.') : (zh ? '规则引擎判定本游戏的终局条件成立。无子可走在不同游戏中不一定都是和棋。' : 'The rules engine reached this variant’s terminal condition. No legal moves is not a draw in every variant.'))}/>
              )}
            </>
          ) : null}
        </div>
        <div className="min-w-0 space-y-6">
        {mode === 'public' && connected && <LoungePanel zh={zh} lounge={lounge} />}
        <section className="min-w-0" aria-label={t('棋谱', 'Move list')}>
          <h3 className="mb-2 font-bold">{t('棋谱', 'Moves')}</h3>
          {history.length === 0 ? <p className="text-sm text-ink-3">{t('还没有走棋。', 'No moves yet.')}</p> : <ol className="max-h-[320px] overflow-y-auto text-sm space-y-2">
            {history.map((m, i) => <li key={i}>{i + 1}. {i % 2 === 0 ? t('房主', 'Host') : t('朋友', 'Guest')} · {m}</li>)}
          </ol>}
        </section>
        </div>
      </div>}
    </div>
  );
}
