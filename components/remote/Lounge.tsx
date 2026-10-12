'use client';
import { useEffect, useRef, useState } from 'react';
import { writeNickname } from './Visitors';
import { CHAT_MAX, clip, type LinkSession, type Profile, type RosterEntry, type Visitor, type Welcome } from '@/lib/peer-room';

export type ChatLine = { id: number; from: string; text: string; mine?: boolean; system?: boolean };
type Member = RosterEntry & { key: string };
const QUICK = { zh: ['你好！', '准备好了', '等我一下', '好棋！', '再来一局？', '我先走了'], en: ['Hi!', 'Ready', 'One moment', 'Nice move!', 'Rematch?', 'I have to go'] };

/** Room members and chat for one browser tab, the way game lobbies show them.
 * The host owns the truth: it tracks each admitted guest's session, relays chat to
 * everyone (guests only talk to the host) and broadcasts the roster. Guests mirror it. */
export function useLounge(zh: boolean, me: Profile) {
  const [members, setMembers] = useState<Member[]>([]);
  const [lines, setLines] = useState<ChatLine[]>([]);
  const [unread, setUnread] = useState(0);
  const role = useRef<'host' | 'guest' | null>(null);
  const sessions = useRef(new Map<string, { session: LinkSession; off: (() => void)[] }>());
  const roster = useRef<Member[]>([]);
  const counter = useRef(0);
  const [selfId, setSelfId] = useState('host');
  const meRef = useRef(me); meRef.current = me;
  const t = (cn: string, en: string) => zh ? cn : en;
  const push = (line: Omit<ChatLine, 'id'>) => {
    setLines(list => [...list.slice(-79), { ...line, id: ++counter.current }]);
    if (!line.mine && typeof document !== 'undefined' && document.visibilityState !== 'visible') setUnread(n => n + 1);
  };
  const publish = (next: Member[]) => {
    roster.current = next; setMembers(next);
    if (role.current !== 'host') return;
    const people = next.map(m => ({ id: m.id, name: m.name, device: m.device, role: m.role, seat: m.seat, status: m.status, rtt: m.rtt }));
    for (const { session } of sessions.current.values()) session.send({ kind: 'yf-roster', v: 1, people });
  };
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const seen = () => { if (document.visibilityState === 'visible') setUnread(0); };
    document.addEventListener('visibilitychange', seen);
    return () => document.removeEventListener('visibilitychange', seen);
  }, []);
  /** Host: start a fresh roster with yourself. */
  function hostOpen() {
    role.current = 'host'; setSelfId('host');
    const self: Member = { key: 'host', id: 'host', name: meRef.current.name, device: meRef.current.device, role: 'host', status: 'online' };
    publish([self, ...roster.current.filter(m => m.key !== 'host' && m.status !== 'offline')]);
  }
  /** Host: an admitted guest under a stable key ('guest' or 'seat-N'), replacing an offline entry. */
  function hostAttach(key: string, session: LinkSession, visitor: Visitor, seat?: number) {
    role.current = 'host';
    sessions.current.get(key)?.off.forEach(f => f());
    const name = visitor.name;
    const returning = roster.current.some(m => m.key === key);
    const entry: Member = { key, id: visitor.id, name, device: visitor.device, role: 'guest', seat, status: 'online', rtt: null };
    const off = [
      session.onMessage(m => {
        if (m.kind === 'yf-chat') {
          const from = name || (seat ? t(`玩家 ${seat + 1}`, `Player ${seat + 1}`) : t('朋友', 'Friend'));
          push({ from, text: m.text });
          for (const [k, s] of sessions.current) if (k !== key) s.session.chat(m.text, from, seat);
        } else if (m.kind === 'yf-away') mark(key, 'away');
        else if (m.kind === 'yf-name') {
          const before = roster.current.find(p => p.key === key)?.name || t('朋友', 'Friend');
          publish(roster.current.map(p => p.key === key ? { ...p, name: m.name } : p));
          push({ from: '', system: true, text: t(`${before} 改名为 ${m.name || '（未填）'}`, `${before} is now ${m.name || '(no name)'}`) });
        }
      }),
      session.onRtt(rtt => { const next = roster.current.map(m => m.key === key ? { ...m, rtt } : m); roster.current = next; setMembers(next); }),
    ];
    sessions.current.set(key, { session, off });
    if (!roster.current.some(m => m.key === 'host')) hostOpen();
    publish([...roster.current.filter(m => m.key !== key), entry].sort(order));
    push({ from: '', system: true, text: returning ? t(`${name || '朋友'} 重新连上了`, `${name || 'Your friend'} reconnected`) : t(`${name || '朋友'} 加入了房间`, `${name || 'A friend'} joined the room`) });
  }
  /** Host: a guest's channel ended. `gone` removes them; otherwise they show as offline. */
  function hostDetach(key: string, gone = false, note?: string) {
    const s = sessions.current.get(key);
    s?.off.forEach(f => f()); sessions.current.delete(key);
    const member = roster.current.find(m => m.key === key);
    if (!member) return;
    publish(gone ? roster.current.filter(m => m.key !== key) : roster.current.map(m => m.key === key ? { ...m, status: 'offline', rtt: null } : m));
    if (note) push({ from: '', system: true, text: note });
  }
  function mark(key: string, status: RosterEntry['status']) { publish(roster.current.map(m => m.key === key ? { ...m, status } : m)); }
  /** Guest: mirror the host's roster and chat through the one session we have. */
  function guestAttach(session: LinkSession, host: Welcome) {
    role.current = 'guest'; if (host.you) setSelfId(host.you);
    sessions.current.forEach(s => s.off.forEach(f => f())); sessions.current.clear();
    const off = [
      session.onMessage(m => {
        if (m.kind === 'yf-chat') push({ from: m.from || host.name || t('房主', 'Host'), text: m.text });
        else if (m.kind === 'yf-roster') {
          const next = m.people.map(p => ({ ...p, key: p.id }));
          roster.current = next; setMembers(next);
        } else if (m.kind === 'yf-away') { const next = roster.current.map(p => p.role === 'host' ? { ...p, status: 'away' as const } : p); roster.current = next; setMembers(next); }
      }),
      session.onRtt(rtt => { const next = roster.current.map(p => p.role === 'host' ? { ...p, rtt } : p); roster.current = next; setMembers(next); }),
    ];
    sessions.current.set('host', { session, off });
    if (!roster.current.length) { const first: Member[] = [{ key: 'host', id: 'host', name: host.name, device: host.device, role: 'host', status: 'online', rtt: null }]; roster.current = first; setMembers(first); }
  }
  /** Guest: the link to the host is down (temporarily or for good). */
  function guestDetach(status: RosterEntry['status'] = 'offline') {
    sessions.current.forEach(s => s.off.forEach(f => f())); sessions.current.clear();
    const next = roster.current.map(p => p.role === 'host' ? { ...p, status, rtt: null } : p);
    roster.current = next; setMembers(next);
  }
  function say(text: string) {
    const value = clip(text, CHAT_MAX);
    if (!value) return;
    push({ from: meRef.current.name || t('我', 'Me'), text: value, mine: true });
    for (const { session } of sessions.current.values()) session.chat(value, role.current === 'host' ? meRef.current.name || t('房主', 'Host') : undefined);
  }
  function system(text: string) { push({ from: '', system: true, text }); }
  /** Change your own name: the host updates the roster for everyone; a guest asks the host to. */
  function rename(name: string) {
    const value = clip(name, 24);
    writeNickname(value); meRef.current = { ...meRef.current, name: value };
    if (role.current === 'host') publish(roster.current.map(p => p.role === 'host' ? { ...p, name: value } : p));
    else for (const { session } of sessions.current.values()) session.send({ kind: 'yf-name', v: 1, name: value });
  }
  function clear() { sessions.current.forEach(s => s.off.forEach(f => f())); sessions.current.clear(); roster.current = []; setMembers([]); role.current = null; }
  return { members, lines, unread, selfId, rename, hostOpen, hostAttach, hostDetach, guestAttach, guestDetach, say, system, clear, mark };
}
const order = (a: RosterEntry, b: RosterEntry) => (a.role === 'host' ? -1 : 0) - (b.role === 'host' ? -1 : 0) || (a.seat ?? 0) - (b.seat ?? 0);
export type Lounge = ReturnType<typeof useLounge>;

/** Members, connection quality and chat; shown once anyone has joined. */
export function LoungePanel({ zh, lounge, onKick, compact }: { zh: boolean; lounge: Lounge; onKick?: (id: string, name: string) => void; compact?: boolean }) {
  const t = (cn: string, en: string) => zh ? cn : en;
  const [text, setText] = useState('');
  const [confirmKick, setConfirmKick] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const log = useRef<HTMLOListElement>(null);
  useEffect(() => { log.current?.scrollTo({ top: log.current.scrollHeight }); }, [lounge.lines.length]);
  if (!lounge.members.length && !lounge.lines.length) return null;
  const status = (m: RosterEntry) => m.status === 'away' ? t('暂时离开', 'Away') : m.status === 'offline' ? t('断线中', 'Disconnected') : t('在线', 'Online');
  const quality = (rtt?: number | null) => rtt == null ? '' : rtt < 120 ? t('流畅', 'smooth') : rtt < 300 ? t('一般', 'fair') : t('较慢', 'slow');
  const send = () => { lounge.say(text); setText(''); };
  const body = <>
    <ul className="room-members">
      {lounge.members.map(m => {
        const self = m.id === lounge.selfId;
        const label = m.role === 'host' ? t('房主', 'Host') : m.seat ? t(`玩家 ${m.seat + 1}`, `Player ${m.seat + 1}`) : t('朋友', 'Friend');
        return <li key={m.key} className={`room-member room-member-${m.status}`}>
          <span className="room-member-dot" aria-hidden="true" />
          <span className="room-member-name">{m.name || t('未填昵称', 'No name')}{self && <span className="room-member-you">{t('（你）', ' (you)')}</span>}</span>
          <span className="room-member-role">{label}</span>
          <span className="room-member-meta">{[m.device, status(m), m.status === 'online' && m.rtt != null ? `${m.rtt} ms · ${quality(m.rtt)}` : ''].filter(Boolean).join(' · ')}</span>
          {self && (renaming === null
            ? <button className="room-link room-member-rename" onClick={() => setRenaming(m.name)}>{t('改昵称', 'Rename')}</button>
            : <form className="room-chat-form room-member-rename" onSubmit={e => { e.preventDefault(); lounge.rename(renaming); setRenaming(null); }}><input className="room-field" autoFocus maxLength={24} value={renaming} onChange={e => setRenaming(e.target.value)} aria-label={t('新的昵称', 'New name')} /><button className="rpg-button" type="submit">{t('保存', 'Save')}</button></form>)}
          {onKick && m.role !== 'host' && (confirmKick === m.id
            ? <span className="room-actions"><button className="room-link" onClick={() => { setConfirmKick(null); onKick(m.id, m.name); }}>{t('确认移出', 'Confirm remove')}</button><button className="room-link" onClick={() => setConfirmKick(null)}>{t('取消', 'Cancel')}</button></span>
            : <button className="room-link" onClick={() => setConfirmKick(m.id)}>{t('移出房间', 'Remove')}</button>)}
        </li>;
      })}
    </ul>
    {(lounge.members.length > 1 || lounge.lines.length > 0) && <div className="room-chat">
      <ol ref={log} className="room-chat-log" aria-live="polite" aria-label={t('聊天记录', 'Chat log')}>
        {!lounge.lines.length && <li className="room-chat-empty">{t('还没有消息。可以打个招呼。', 'No messages yet. Say hi.')}</li>}
        {lounge.lines.map(l => <li key={l.id} className={l.system ? 'room-chat-system' : l.mine ? 'room-chat-mine' : ''}>{l.system ? l.text : <><b>{l.from}</b>：{l.text}</>}</li>)}
      </ol>
      <div className="room-chat-quick">{(zh ? QUICK.zh : QUICK.en).map(q => <button key={q} type="button" className="room-chip" onClick={() => lounge.say(q)}>{q}</button>)}</div>
      <form className="room-chat-form" onSubmit={e => { e.preventDefault(); send(); }}>
        <input className="room-field" maxLength={CHAT_MAX} value={text} onChange={e => setText(e.target.value)} placeholder={t('说点什么…', 'Say something…')} aria-label={t('聊天消息', 'Chat message')} />
        <button className="rpg-button" type="submit" disabled={!text.trim()}>{t('发送', 'Send')}</button>
      </form>
    </div>}
  </>;
  // During play a table needs the screen: fold the lobby into one line that still shows news.
  if (compact) return <details className="room-lounge room-lounge-compact">
    <summary>{t(`房间成员与聊天（${lounge.members.filter(m => m.status === 'online').length}/${lounge.members.length} 在线）`, `Members and chat (${lounge.members.filter(m => m.status === 'online').length}/${lounge.members.length} online)`)}{lounge.lines.length > 0 && <span className="room-lounge-last">{lounge.lines.at(-1)!.system ? lounge.lines.at(-1)!.text : `${lounge.lines.at(-1)!.from}：${lounge.lines.at(-1)!.text}`}</span>}</summary>
    {body}
  </details>;
  return <section className="room-lounge" aria-label={t('房间成员与聊天', 'Room members and chat')}>{body}</section>;
}

/** Live mm:ss since `since` (or remaining until `limit`), for reconnection waits. */
export function WaitClock({ since, limit, zh }: { since: number; limit?: number; zh: boolean }) {
  const [now, setNow] = useState(since);
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  const passed = Math.max(0, Math.floor((now - since) / 1000)), value = limit ? Math.max(0, Math.ceil(limit / 1000) - passed) : passed;
  const text = `${Math.floor(value / 60)}:${String(value % 60).padStart(2, '0')}`;
  return <span className="room-countdown">{limit ? (zh ? `最多再等 ${text}` : `up to ${text} more`) : (zh ? `已等待 ${text}` : `waiting ${text}`)}</span>;
}
