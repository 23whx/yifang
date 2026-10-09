"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { Peer } from "peerjs";
import { ManualBoardConnection, type BoardConnection } from '@/lib/board/manual-connection';
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
    peer = useRef<Peer | null>(null),
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
  function forget(){try{clearBoardSave(sessionStorage,game);setSaved(null);setSaveError('');setClearConfirm(false);resumeSelection.current=null;return true;}catch{setSaveError(zh?'无法清除存档，请检查浏览器存储设置。':'Could not clear the save. Check browser storage settings.');return false;}}
  const matchRef = useRef<MatchState>(newMatch());
  const [match, setMatch] = useState<MatchState>(newMatch);
  const [copyMessage, setCopyMessage] = useState("");
  const [confirmResign, setConfirmResign] = useState(false);
  const manual = useRef<ManualBoardConnection | null>(null);
  const [mode, setMode] = useState<'manual' | 'public'>('manual');
  const [invitation, setInvitation] = useState('');
  const [signal, setSignal] = useState('');
  const [answer, setAnswer] = useState('');
  const [signalBusy, setSignalBusy] = useState(false);
  const invited = useSyncExternalStore(noSubscribe, () => roomCode(new URL(window.location.href).searchParams.get('room') ?? '', game), () => '');
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
  function dispose() {
    generation.current++;
    active.current = false;
    recoveryChannel.current?.stop();recoveryChannel.current=null;recoverySecret.current='';transportEpoch.current='';
    if (timeout.current) clearTimeout(timeout.current);
    connection.current?.close();
    peer.current?.destroy();
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
  function fail(message: string) {
    generation.current++;
    active.current = false;
    recoveryChannel.current?.stop();recoveryChannel.current=null;
    setStatus("error");
    setSignal(''); setAnswer(''); setInvitation(''); setSignalBusy(false);
    setError(message);
    if (timeout.current) clearTimeout(timeout.current);
    connection.current?.close();
    peer.current?.destroy();
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
  async function start(isHost: boolean, recovery:BoardRecoverySave|null=null) {
    if(!secureMultiplayerContext()){setError(insecureMultiplayerMessage(locale));return;}
    if(recovery&&(recovery.game!==game||(recovery.role==='host')!==isHost))return;
    const chosenMode=recovery?'manual':mode;
    if(!isHost&&chosenMode==='manual'){
      try{readManualSignal(invitation,game,'offer');}
      catch{setError(zh?'邀请文本无效或不属于当前游戏。请粘贴房主发来的完整邀请，再重试。':'Invalid invitation or wrong game. Paste the complete invitation from the host and retry.');return;}
    }
    if(!recovery&&(saved||saveError)){const intent=isHost?'host':'guest';if(replaceIntent!==intent){setReplaceIntent(intent);return;}}
    dispose();
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
      const attach = (c: BoardConnection) => {
        if (connection.current) {
          c.on("open", () => c.close());
          return;
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
              transportEpoch.current=epoch;active.current=true;setStatus('connected');setSignal('');setAnswer('');setInvitation('');setSignalBusy(false);
              if(timeout.current)clearTimeout(timeout.current);refresh();persist();
            }catch{fail(zh?'恢复棋谱失败，原存档保留。':'Could not restore the move record; original save retained.');}
          },()=>{if(token===generation.current)fail(zh?'恢复验证失败或连接超时。请检查双方原标签页、游戏与存档；不会重新发局。':'Recovery verification failed or timed out. Check both original tabs, games and saves. No new game was started.');});
        }
        if (timeout.current) clearTimeout(timeout.current);
        timeout.current = setTimeout(() => {
          if (token === generation.current) fail(zh ? "对手连接超时，请重新创建房间。" : "Peer handshake timed out. Create a new room.");
        }, 25000);
        c.on("open", () => {
          if (token !== generation.current) return;
          if(recovery){recoveryChannel.current?.open();return;}
          c.send({ v: 5, epoch:transportEpoch.current,secret:isHost?recoverySecret.current:undefined,game, round:matchRef.current.round, kind: "hello", seq: 0,identity:journal.current?.view().identity??goJournal.current?.view().identity,goJournal:game==='go'?1:undefined } satisfies Wire);
        });
        c.on("data", (raw) => {
          if (
            token !== generation.current ||
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
          if (token === generation.current)
            fail(
              zh
                ? "对手已离线，棋谱保留。双方可用原标签页存档重新交换邀请恢复。请先检查保存是否成功。"
                : "Opponent disconnected; moves retained. Both original tabs can restore using their saves and fresh invitations. Check that saving succeeded first.",
            );
        });
        c.on("error", () => {
          if (token === generation.current) fail(
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
      const { Peer } = await import('peerjs');
      if (token !== generation.current) return;
      const id = isHost ? `yf-${game}-${crypto.randomUUID().replaceAll('-', '').slice(0, 12)}` : undefined;
      const p = id ? new Peer(id) : new Peer();
      peer.current = p;
      p.on("open", (own) => {
        if (token !== generation.current) return;
        if (isHost) {
          setCode(own);
          setStatus("waiting");
          if (timeout.current) clearTimeout(timeout.current);
        } else attach(p.connect(roomCode(entry ?? invited, game), { reliable: true }));
      });
      p.on("connection", (c) => {
        if (token !== generation.current) { c.close(); return; }
        if (!isHost) {
          c.on("open", () => c.close());
          return;
        }
        attach(c);
      });
      p.on("error", (e) => {
        if (token === generation.current)
          fail(`${zh ? "连接失败" : "Connection failed"}: ${e.type}`);
      });
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
      if (token === generation.current) fail(zh ? '应答码不匹配或连接失败，请重新创建。' : 'Invalid answer or connection failure. Create a new invitation.');
    }
  }
  const myTurn =
    status === "connected" && match.resigned === null &&
    (game === "go" ? goState.turn === 1 : snapshot?.turn) === isHostPlayer;
  const hasEnded = match.resigned !== null || (game === 'go' ? reviewDone(review) : !!snapshot?.over);
  return (
    <div className="space-y-7">
      <div className="border border-ink p-5 space-y-4">
        <h2 className="text-xl font-bold">{zh ? '双人网络对战 · 房间邀请' : 'Online two-player room'}</h2>
        {<aside className="space-y-3 rounded-xl border border-[#ae8550] bg-[#f3e7cd] p-4 text-[#392616]" aria-label={zh?'本标签页棋谱恢复':'This tab’s match recovery'}>
          <h3 className="font-bold">{zh?'刷新前先知道':'Before refreshing'}</h3>
          {game==='go'&&<p className="text-sm leading-7">{zh?'围棋还会保存停一手、死子标记及双方计分确认；恢复后接着原来的步骤进行，不会擅自清除标记或替你确认。':'Go also saves passes, dead-stone marks and both scoring approvals. Restoration keeps the current step; it does not clear marks or approve the score for you.'}</p>}
          <p className="max-w-[68ch] text-sm leading-7">{zh?'连接后自动把完整棋谱、原座位和恢复凭证保存在本标签页 sessionStorage，不保存邀请或应答码。双方刷新后先点“恢复本标签页对局”，原房主重新生成邀请，原客方再粘贴邀请生成应答；验证通过后继续原来的局面和轮次。请保留双方标签页，不要分享存档。关闭标签页、清理数据、禁止存储或换设备可能无法恢复。':'After connection, the full move record, original seat and recovery credential are saved in this tab’s sessionStorage, not invitation or answer text. After refreshing, both choose “Restore this tab’s match.” The original host generates a fresh invitation; the original guest then pastes it and generates an answer. Successful verification restores the position and turn. Keep both tabs; never share saves. Closing tabs, clearing data, blocked storage or changing devices may prevent recovery.'}</p>
          <p role="status" className="text-sm">{saved?(zh?'本标签页已有存档；仍需对方保留自己的存档。':'This tab has a save; the other player also needs their own save.'):(zh?'尚无已保存的对局。':'No saved match yet.')}</p>
          {saveError&&<p role="alert" className="font-bold text-[#803d2b]">{saveError}</p>}
          {['idle','error'].includes(status)&&<div className="flex flex-wrap gap-3">
            {saved&&<button className="rpg-button" onClick={()=>{setMode('manual');setReplaceIntent(null);setClearConfirm(false);if(saved.role==='host')void start(true,saved);else{resumeSelection.current=saved;setRestoring(true);setError('');}}}>{zh?'恢复本标签页对局':'Restore this tab’s match'}</button>}
            {(saved||saveError)&&<button className="rpg-button" onClick={()=>{if(!clearConfirm){setClearConfirm(true);return;}if(forget())setRestoring(false);}}>{clearConfirm?(zh?'确认清除，无法撤销':'Confirm permanent removal'):(zh?'清除本标签页存档':'Clear this tab’s save')}</button>}
          </div>}
          {replaceIntent&&<p role="alert" className="font-bold text-[#803d2b]">{zh?'本标签页有存档或读取失败。再次点击同一个创建／加入按钮确认新局；旧存档会保留到新对局连接成功并保存后才被覆盖。':'This tab has a save or its save could not be read. Click the same host/join button again to confirm a new game. The old save stays until the new game connects and saves successfully.'}</p>}
          {restoring&&<p className="font-bold">{status==='connected'?(zh?'已恢复原对局，没有重新开局。':'Original match restored; no new game was started.'):(zh?'恢复模式：原房主生成新邀请；原客方粘贴新邀请。验证完成前不能走棋。':'Recovery mode: original host generates an invitation; original guest pastes it. Play stays disabled until verification completes.')}</p>}
        </aside>}
        <label className="block space-y-2"><span>{zh ? '连接方式' : 'Connection method'}</span><select className="block max-w-full border border-ink p-3" value={mode} disabled={['connecting','waiting','connected'].includes(status)} onChange={e => { dispose(); resumeSelection.current=null;setRestoring(false);setReplaceIntent(null);setClearConfirm(false);setStatus('idle'); setError(''); setSignal(''); setAnswer(''); setInvitation(''); setMode(e.target.value as 'manual' | 'public'); }}><option value="manual">{zh ? '局域网直连 · 手动交换连接码' : 'LAN direct · exchange connection text'}</option><option value="public">{zh ? '公共信令服务 · 短房间码' : 'Public signaling service · short room code'}</option></select></label>
        {mode === 'manual' && <section className="space-y-4">
          <p className="text-sm leading-7">{zh ? '双方先通过有效 HTTPS 打开同一个游戏页面；localhost 只能在本机预览，直接使用 http://局域网IP 不具备刷新恢复所需的安全上下文。本模式不联系信令、STUN 或 TURN 服务，无账号。优先在同一局域网使用；网络隔离、防火墙可能阻止连接，跨网络不保证成功。' : 'Both players first open the same game page over valid HTTPS. Localhost is only for this device; plain HTTP on a LAN IP lacks the secure context required for refresh recovery. This mode uses no signaling, STUN, TURN or account. Prefer the same LAN; isolation or firewalls may block it, and cross-network success is not guaranteed.'}</p>
          <ol className="list-decimal pl-5 space-y-2 text-sm leading-7"><li>{zh ? '房主生成邀请，将完整邀请文字私下发给朋友。它不是网址，不要粘贴到地址栏。' : 'Host generates an invitation and privately sends the complete text. It is not a URL.'}</li><li>{zh ? '朋友粘贴邀请，生成应答，再把完整应答发回房主。' : 'Guest pastes the invitation, generates an answer, and sends the complete answer back.'}</li><li>{zh ? '房主粘贴应答并连接。看到“轮到你了”或“等待对方落子”才算连接完成，房主先走。保持双方页面开启。' : 'Host pastes the answer and connects. Wait for Your turn or Opponent’s turn; host moves first. Keep both pages open.'}</li></ol>
          <p className="text-sm">{zh ? '连接码可能含本地网络信息，只发给信任的朋友；离开后失效，不支持自动重连。' : 'Connection text may contain local network information. Share only with trusted friends; leaving invalidates it. No automatic reconnection.'}</p>
          {['idle','error'].includes(status) && <>
            <button className="btn-sign" onClick={() => start(true)}>{zh ? '我是房主：生成邀请' : 'Host: generate invitation'}</button>
            <label className="block">{zh ? '朋友：粘贴房主邀请' : 'Guest: paste host invitation'}<textarea className="block w-full min-w-0 border border-ink p-3" rows={3} maxLength={65536} value={invitation} onChange={e => {setInvitation(e.target.value);setReplaceIntent(null);}} /></label>
            <button className="btn-sign btn-sign-outline" disabled={!invitation.trim()} onClick={() => start(false,resumeSelection.current?.role==='guest'?resumeSelection.current:null)}>{zh ? '我是朋友：生成应答' : 'Guest: generate answer'}</button>
          </>}
          {signal && <label className="block">{isHostPlayer ? (zh ? '你的邀请：全选复制给朋友' : 'Your invitation: copy all for your guest') : (zh ? '你的应答：全选复制给房主' : 'Your answer: copy all for your host')}<textarea className="block w-full min-w-0 border border-ink p-3" rows={3} readOnly value={signal} onFocus={e => e.target.select()} /></label>}
          {signal && isHostPlayer && <><label className="block">{zh ? '粘贴朋友的应答' : 'Paste your guest’s answer'}<textarea className="block w-full min-w-0 border border-ink p-3" rows={3} maxLength={65536} value={answer} onChange={e => setAnswer(e.target.value)} /></label><button className="btn-sign" disabled={!answer.trim() || signalBusy || status !== 'waiting'} onClick={finishManual}>{zh ? '使用应答连接' : 'Connect using answer'}</button></>}
          {status !== 'idle' && <button className="btn-sign btn-sign-outline" onClick={() => { dispose(); setStatus('idle'); setSignal(''); setAnswer(''); setInvitation(''); setSignalBusy(false); setError(''); }}>{zh ? '离开并清除连接码' : 'Leave and clear connection text'}</button>}
        </section>}
        {mode === 'public' && <>
        <p className="text-sm">{zh ? '只有选择此模式并创建或加入房间后，才会联系 PeerJS 公共信令；其默认配置还会尝试第三方 STUN，并可能通过 TURN 中继传输对局数据。这不是完全无服务的直连，也不保证点对点传输。不同设备应通过有效 HTTPS 打开网站以支持安全恢复；无需账号。如不希望使用这些服务，请改选局域网手动直连。' : 'Only after you select this mode and create or join a room does it contact public PeerJS signaling. Its default configuration also tries third-party STUN and may relay match data through TURN. This is not fully service-free or guaranteed peer-to-peer transport. Each device should open a valid HTTPS site for secure recovery; no account is needed. Choose Manual LAN connection to avoid those services.'}</p>
        <ol className="list-decimal space-y-2 pl-5 text-sm leading-7"><li>{zh ? '房主点击创建房间，再把房间码或邀请链接发给朋友。' : 'Host: create a room and share its code or invitation link.'}</li><li>{zh ? '朋友打开同一个游戏的网络页，粘贴房间码或链接，再点击加入房间。' : 'Friend: open the same game, paste the code or link, then select Join room.'}</li><li>{zh ? '看到“轮到你了”才表示握手完成。房主先走，双方每步同步。' : 'Your turn means the handshake finished. The host moves first; moves synchronize.'}</li></ol>
        <p className="text-sm">{zh ? '注意：127.0.0.1 / localhost 只代表当前电脑，不能直接把此本机地址发给远方朋友。朋友需要打开已部署的网站，再输入房间码。房间码不是密码，请只分享给受邀者。' : '127.0.0.1 / localhost means this computer, not a publicly accessible site. A distant friend must open the deployed site and enter the code. Share room codes only with invited players.'}</p>
        <p className="text-sm leading-7">
          {zh
            ? "创建房间后，将房间码发给朋友。房主执先，对方执后。保持双方页面开启；无账号、无自动重连，房间仅容纳两人。"
            : "Create a room and share its code. The host plays first. Keep both pages open; no account or automatic reconnection, two players per room."}
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            className="btn-sign"
            disabled={
              status === "connecting" ||
              status === "connected" ||
              status === "waiting"
            }
            onClick={() => start(true)}
          >
            {zh ? "创建房间" : "Create room"}
          </button>
          <input
            className="border border-ink px-3 min-w-0"
            aria-label={zh ? "房间码" : "Room code"}
            placeholder={`yf-${game}-…`}
            value={entry ?? invited}
            onChange={(e) => {setEntry(e.target.value);setReplaceIntent(null);}}
          />
          <button
            className="btn-sign btn-sign-outline"
            disabled={
              !roomCode(entry ?? invited, game) ||
              ["connecting", "connected", "waiting"].includes(status)
            }
            onClick={() => start(false)}
          >
            {zh ? "加入房间" : "Join room"}
          </button>
          {status !== "idle" && (
            <button
              className="btn-sign btn-sign-outline"
              onClick={() => {
                dispose();
                setStatus("idle");
                setCode("");
                setError("");
              }}
            >
              {zh ? "离开房间" : "Leave room"}
            </button>
          )}
        </div>
        {code && (
          <div className="flex flex-wrap gap-3 items-center">
            <code className="break-all">{code}</code>
            <button
              className="underline text-sm"
              onClick={() =>
                navigator.clipboard
                  .writeText(code)
                  .catch(() =>
                    setError(
                      zh
                        ? "请手动复制房间码。"
                        : "Please copy the room code manually.",
                    ),
                  )
              }
            >
              {zh ? "复制房间码" : "Copy code"}
            </button>
          </div>
        )}
        {code && <button className="btn-sign btn-sign-outline" onClick={async () => {
          const url = new URL(window.location.href); url.search = ''; url.searchParams.set('room', code); url.hash = '';
          try { await navigator.clipboard.writeText(url.toString()); setCopyMessage(zh ? '邀请链接已复制。本机地址只能本机打开；跨设备请使用部署域名。' : 'Invitation copied. Localhost links are local only; use the deployed domain across devices.'); } catch { setCopyMessage(zh ? '复制失败，请使用上方房间码。' : 'Copy failed; use the room code above.'); }
        }}>{zh ? '复制邀请链接' : 'Copy invitation link'}</button>}
        {copyMessage && <p role="status">{copyMessage}</p>}
        </>}
        {status === 'connected' && <section className="space-y-3 border-t border-rule pt-4">
          <p>{zh ? `第 ${match.round} 局 · ${isHostPlayer ? '你是房主，执先' : '你是客方，执后'}` : `Round ${match.round} · ${isHostPlayer ? 'Host, first side' : 'Guest, second side'}`}</p>
          {!hasEnded && <><button className="btn-sign btn-sign-outline" onClick={() => { if(confirmResign) sendMatchAction('resign'); else setConfirmResign(true); }}>{confirmResign ? (zh ? '确认认输，结束本局' : 'Confirm resignation') : (zh ? '认输' : 'Resign')}</button>{confirmResign && <button className="btn-sign btn-sign-outline ml-3" onClick={()=>setConfirmResign(false)}>{zh ? '取消' : 'Cancel'}</button>}</>}
          {hasEnded && <><button className="btn-sign" disabled={match.rematch[isHostPlayer ? 0 : 1]} onClick={() => sendMatchAction('rematch')}>{zh ? '同意再来一局' : 'Agree to a rematch'}</button><p>{zh ? `房主${match.rematch[0] ? '已同意' : '未同意'}；客方${match.rematch[1] ? '已同意' : '未同意'}。双方同意后才重置；房主继续执先。` : `Host ${match.rematch[0] ? 'agreed' : 'pending'}; guest ${match.rematch[1] ? 'agreed' : 'pending'}. Both must agree; host remains first.`}</p></>}
        </section>}
        {match.resigned !== null && <ResultDialog key={match.round} locale={locale} title={match.resigned === (isHostPlayer ? 0 : 1) ? (zh ? '你已认输' : 'You resigned') : (zh ? '你获胜了' : 'You win')} reason={zh ? '一方主动认输，本局结束。棋盘与棋谱保留；双方同意再来一局才会清空。' : 'A player resigned, ending this game. The position and moves remain until both agree to a rematch.'}/>}
        <p role="status">
          {status === "waiting"
            ? zh
              ? "等待朋友加入…"
              : "Waiting for a friend…"
            : status === "connecting"
              ? zh
                ? "正在连接…"
                : "Connecting…"
              : status === "connected"
                ? hasEnded ? (zh ? '本局结束，可双方同意再来一局' : 'Game ended; both may agree to a rematch') : game === 'go' && goState.passes >= 2
                  ? reviewDone(review) ? (zh ? '双方已确认，本局结束' : 'Both confirmed — game ended') : (zh ? '核对死子与计分提案，不需要按落子轮次等待' : 'Review the scoring proposal; either player may respond')
                  : myTurn
                  ? zh
                    ? "轮到你了"
                    : "Your turn"
                  : zh
                    ? "等待对方落子"
                    : "Opponent’s turn"
                : error}
        </p>
      </div>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,640px)_1fr]">
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
                  <p>{zh?`当前计分：黑 ${scoreGo(goState,review.dead).black}，白 ${scoreGo(goState,review.dead).white}（含 7.5 贴目）。房主${review.approved[0]?'已确认':'未确认'}，客方${review.approved[1]?'已确认':'未确认'}。`:`Current score: Black ${scoreGo(goState,review.dead).black}, White ${scoreGo(goState,review.dead).white} (7.5 komi included). Host ${review.approved[0]?'confirmed':'pending'}, guest ${review.approved[1]?'confirmed':'pending'}.`}</p>
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
                <ResultDialog key={match.round} locale={locale} title={zh ? `棋局结束 · ${snapshot.result}` : `Game over · ${snapshot.result}`} reason={snapshot.result === '1/2-1/2' ? (zh ? '规则引擎判定本局和棋。棋盘保留供复盘。' : 'The rules engine determined a draw. The board stays for review.') : (snapshot.inCheck ? (zh ? '被将军的一方没有合法应对，构成将死。' : 'The checked side has no legal response: checkmate.') : (zh ? '规则引擎判定本游戏的终局条件成立。无子可走在不同游戏中不一定都是和棋。' : 'The rules engine reached this variant’s terminal condition. No legal moves is not a draw in every variant.'))}/>
              )}
            </>
          ) : null}
        </div>
        <ol className="max-h-[550px] overflow-y-auto text-sm space-y-2">
          {history.map((m, i) => (
            <li key={i}>
              {i + 1}. {m}
            </li>
          ))}
        </ol>
      </div>
      <p className="text-xs text-ink-3 leading-6">
        {mode === 'manual'
          ? (zh
            ? '当前为手动直连：不联系公共信令、STUN 或 TURN 服务。连接失败时，先确认双方使用同一局域网，再检查访客 Wi-Fi 隔离和防火墙，并重新交换完整连接码。不要关闭防火墙；也可以返回人机或同屏双人。'
            : 'Manual direct mode: no public signaling, STUN or TURN services. If connection fails, check that both devices share a LAN, check guest Wi-Fi isolation and firewall rules, then exchange complete fresh codes. Do not disable the firewall. AI and local play remain available.')
          : (zh
            ? '当前为公共房间号模式：使用 PeerJS 公共信令服务交换连接信息，不是完全无外部服务。部分公司网络或严格 NAT 环境可能无法直连；此时可切换手动直连，或使用人机、同屏双人。'
            : 'Public room-code mode uses PeerJS public signaling to exchange connection information; it is not free of external services. Some corporate networks or strict NATs prevent direct connections. You can try manual mode, AI or local play.')}
      </p>
    </div>
  );
}
