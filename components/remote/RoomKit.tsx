import type { ReactNode } from 'react';
import { NicknameField, VisitorList } from './Visitors';
import type { Visitor } from '@/lib/peer-room';

/**
 * Presentational building blocks shared by every friend-play room.
 * Pure components without hooks: rooms own all connection state and pass it in.
 */

export type StepState = 'done' | 'now' | 'todo';
export type Tone = 'idle' | 'busy' | 'ok' | 'warn';

/** `children` is the live status line, announced politely to screen readers. */
export function RoomHeader({ title, lead, tone, children }: { title: string; lead?: ReactNode; tone: Tone; children: ReactNode }) {
  return <header className="room-header">
    <div className="min-w-0">
      <h2 className="room-title">{title}</h2>
      {lead && <p className="room-lead">{lead}</p>}
    </div>
    <p className={`room-status room-status-${tone}`} role="status"><span aria-hidden="true" className="room-status-dot" />{children}</p>
  </header>;
}

/** One entry point per role. Shown side by side so the first action is obvious. */
export function RoleCard({ badge, title, steps, children }: { badge: string; title: string; steps: string[]; children: ReactNode }) {
  return <section className="room-role">
    <p className="room-role-badge">{badge}</p>
    <h3 className="room-role-title">{title}</h3>
    <ol className="room-role-steps">{steps.map((step, i) => <li key={i}>{step}</li>)}</ol>
    <div className="room-role-actions">{children}</div>
  </section>;
}

export function Steps({ items }: { items: { label: string; state: StepState; body?: ReactNode }[] }) {
  return <ol className="room-steps">
    {items.map((item, i) => <li key={i} className={`room-step room-step-${item.state}`} aria-current={item.state === 'now' ? 'step' : undefined}>
      <span className="room-step-mark" aria-hidden="true">{item.state === 'done' ? '✓' : i + 1}</span>
      <div className="min-w-0 flex-1">
        <p className="room-step-label">{item.label}</p>
        {item.body && <div className="room-step-body">{item.body}</div>}
      </div>
    </li>)}
  </ol>;
}

/** Read-only connection text with a large copy action. */
export function SignalOutput({ label, value, copyLabel, onCopy, ariaLabel }: { label: string; value: string; copyLabel: string; onCopy: () => void; ariaLabel?: string }) {
  return <div className="room-signal">
    <label className="block text-sm font-bold">{label}
      <textarea readOnly aria-label={ariaLabel} className="room-field" rows={3} value={value} onFocus={e => e.target.select()} />
    </label>
    <button type="button" className="rpg-button" onClick={onCopy}>{copyLabel}</button>
  </div>;
}

/** Long safety and network explanations live here, collapsed by default. */
export function RoomNotes({ summary, children, open }: { summary: string; children: ReactNode; open?: boolean }) {
  return <details className="room-notes" open={open}>
    <summary>{summary}</summary>
    <div className="room-notes-body">{children}</div>
  </details>;
}

export function RoomAlert({ children }: { children: ReactNode }) {
  return <p role="alert" className="room-alert">{children}</p>;
}

export type FourSeatPhase = 'idle' | 'lobby' | 'connecting' | 'playing' | 'finished' | 'closed';

/**
 * Shared setup panel for the four-seat tables (poker, riichi, Sichuan, MCR).
 * The host is Player 1 and exchanges one invitation/reply pair with each other seat.
 */
export type FourSeatLink = { mode: 'link' | 'code'; onMode: (mode: 'link' | 'code') => void; code: string; note: string; entry: string; onEntry: (value: string) => void; canJoin: boolean; onJoin: () => void;
  visitors?: Visitor[]; onAdmit?: (id: string) => void; onDeny?: (id: string) => void; /** Shown while the table reconnects by itself. */ reconnect?: string };

/** Share-or-copy box for an invitation link. */
export function LinkShare({ zh, code, title, body, onCopied }: { zh: boolean; code: string; title: string; body: string; onCopied: (value: string) => void }) {
  const t = (cn: string, en: string) => zh ? cn : en;
  const link = () => { const url = new URL(window.location.href); url.search = ''; url.hash = ''; url.searchParams.set('room', code); return url.toString(); };
  return <div className="room-banner">
    <p className="room-banner-title">{title}</p>
    <p>{body}</p>
    <div className="room-actions">
      <button className="rpg-button" onClick={async () => { const value = link(); if (typeof navigator.share === 'function') { try { await navigator.share({ title: t('来一起玩', 'Join my table'), url: value }); return; } catch (e) { if ((e as Error).name === 'AbortError') return; } } onCopied(value); }}>{t('发送邀请链接', 'Send invitation link')}</button>
      <button className="rpg-button secondary" onClick={() => onCopied(link())}>{t('复制链接', 'Copy link')}</button>
    </div>
    <p className="text-sm">{t('房间码：', 'Room code: ')}<code className="break-all font-bold">{code}</code></p>
  </div>;
}

export function FourSeatSetup(p: {
  zh: boolean; title: string; role: 'none' | 'host' | 'guest'; phase: FourSeatPhase; connected: boolean[];
  offers: string[]; responses: string[]; invitation: string; answer: string; busy: boolean; error: string;
  saved: boolean; saveError: string; replaceSave: 'host' | 'guest' | null; clearConfirm: boolean; restoring: boolean; confirm: boolean;
  notes: ReactNode;
  onCreate: () => void; onLeave: () => void; onRestore: () => void; onClear: () => void;
  onOffer: (seat: number) => void; onCopy: (value: string) => void; onResponse: (seat: number, value: string) => void;
  onFinish: (seat: number) => void; onCancelOffer: (seat: number) => void; onStart: () => void;
  onInvitation: (value: string) => void; onJoin: () => void;
  /** Link mode (default): one invitation link for the table instead of per-seat codes. */
  link?: FourSeatLink;
}) {
  const linkMode = p.link?.mode === 'link';
  const t = (cn: string, en: string) => p.zh ? cn : en;
  const count = p.connected.filter(Boolean).length;
  const choosing = p.role === 'none' || p.phase === 'closed' || p.phase === 'finished';
  const status = ({
    idle: t('尚未连接', 'Not connected'),
    lobby: p.role === 'host' ? t(`等待玩家到齐（${count}/4）`, `Waiting for players (${count}/4)`) : t('已加入，等待房主开局', 'Joined — waiting for the host to start'),
    connecting: linkMode ? t('正在加入房间…', 'Joining the room…') : p.answer ? t('等待房主连接你的回复码', 'Waiting for the host to use your reply') : t('正在生成回复码…', 'Creating your reply code…'),
    playing: t('对局中', 'Playing'),
    finished: t('本场结束', 'Match finished'),
    closed: t('已关闭', 'Closed'),
  } as Record<FourSeatPhase, string>)[p.phase];
  const tone: Tone = p.phase === 'playing' ? 'ok' : p.phase === 'closed' ? 'warn' : p.phase === 'idle' || p.phase === 'finished' ? 'idle' : 'busy';
  return <section className="room">
    <RoomHeader title={p.title} lead={choosing ? t('四位玩家各用自己的设备。一人开房当房主，其他三人加入。', 'Four players, each on their own device. One opens the room as host; the other three join.') : undefined} tone={tone}>{status}</RoomHeader>
    {p.error && <RoomAlert>{p.error}</RoomAlert>}
    {p.saveError && <RoomAlert>{p.saveError}</RoomAlert>}
    {(p.saved || p.saveError) && choosing && <div className="room-banner" aria-label={t('上次的牌局', 'Previous match')}>
      <p className="room-banner-title">{p.saved ? t('本标签页保存了上次的牌局（不代表另外三人也保存了）', 'This tab has a saved match (the other three need their own saves)') : t('存档读取失败', 'The save could not be read')}</p>
      {p.saved && linkMode && <p>{t('想接着打：房主先点“恢复上次牌局”，把新的邀请链接发给三人；三位朋友也先点“恢复上次牌局”，再把链接粘贴到“加入房间”，会自动回到原座位。人齐后房主点“继续原牌局”，不会重新发牌。', 'To continue: the host chooses Restore previous match and sends the new invitation link; each friend also restores first, then pastes the link into Join room and returns to their original seat. Once all four are back, the host continues without a new deal.')}</p>}
      {p.saved && !linkMode && <p>{t('想接着打：房主先点“恢复上次牌局”，再按原座位给三人重新发邀请码；三位朋友也先点恢复，再粘贴自己的新邀请码。人齐后房主点“继续原牌局”，不会重新发牌。', 'To continue: the host chooses Restore previous match and sends fresh invitations for the original seats; each friend also restores first, then pastes their new invitation. Once all four are back, the host continues without a new deal.')}</p>}
      <div className="room-actions">
        {p.saved && <button disabled={p.busy} className="rpg-button" onClick={p.onRestore}>{t('恢复上次牌局', 'Restore previous match')}</button>}
        <button disabled={p.busy} className="room-link" onClick={p.onClear}>{p.clearConfirm ? t('确认删除存档（无法撤销）', 'Confirm delete (cannot be undone)') : t('删除这个存档', 'Delete this save')}</button>
      </div>
    </div>}
    {p.replaceSave && <RoomAlert>{t('你有一个未完成的牌局存档。点“确认创建新房”或“确认加入新房”开始新局；旧存档会保留到新局真正开始并成功保存后才被覆盖，你也可以先恢复上次牌局。', 'You have an unfinished saved match. Choose Confirm new room or Confirm joining to start fresh; the old save stays until the new match starts and saves successfully, or restore it first.')}</RoomAlert>}
    {p.restoring && <p className="room-progress">{p.phase === 'playing' || p.phase === 'finished' ? t('已恢复原牌局，保留原座位、牌面和进度。', 'Original match restored, including seats, cards and progress.') : t('恢复模式：保持原座位，等待重新连接；不会重新发牌。', 'Recovery mode: keep your original seat and reconnect. No new deal.')}</p>}
    {choosing && linkMode && p.link && <div className="room-roles">
      <RoleCard badge={t('房主 · 玩家 1', 'Host · Player 1')} title={t('我来开房', 'Open a room')} steps={[t('创建房间，你是玩家 1', 'Create the room — you are Player 1'), t('把同一个邀请链接发给三位朋友', 'Send the same invitation link to all three friends'), t('朋友打开链接就自动入座，人齐后开局', 'Friends take a seat by opening it; start when all four are in')]}>
        <button disabled={p.busy} className="rpg-button" onClick={p.onCreate}>{p.replaceSave === 'host' ? t('确认创建新房', 'Confirm new room') : t('创建四人房间', 'Create four-player room')}</button>
      </RoleCard>
      <RoleCard badge={t('朋友', 'Guest')} title={t('作为朋友加入', 'Join as a guest')} steps={[t('直接打开房主发来的链接，会自动加入', 'Open the host’s link — you join automatically'), t('或把链接粘贴到下面，点“加入房间”', 'Or paste the link below and choose Join room'), t('等房主开局', 'Wait for the host to start')]}>
        <NicknameField zh={p.zh} />
        <label className="block text-sm font-bold">{t('邀请链接', 'Invitation link')}<input className="room-field" placeholder="https://…?room=…" value={p.link.entry} onChange={e => p.link!.onEntry(e.target.value)} /></label>
        <button disabled={p.busy || !p.link.canJoin} className="rpg-button" onClick={p.link.onJoin}>{p.replaceSave === 'guest' ? t('确认加入新房', 'Confirm joining new room') : t('加入房间', 'Join room')}</button>
      </RoleCard>
    </div>}
    {p.link?.reconnect && p.phase !== 'playing' && <p role="status" className="room-progress">{p.link.reconnect}</p>}
    {p.link?.note && !p.link.reconnect && !choosing && p.phase !== 'playing' && <p role="status" className="room-progress">{p.link.note}</p>}
    {choosing && !linkMode && <div className="room-roles">
      <RoleCard badge={t('房主 · 玩家 1', 'Host · Player 1')} title={t('我来开房', 'Open a room')} steps={[t('创建房间，你是玩家 1', 'Create the room — you are Player 1'), t('分别给玩家 2、3、4 生成邀请码并发送', 'Create and send a separate invitation for Players 2, 3 and 4'), t('粘贴各自发回的回复码，人齐后开局', 'Paste each reply code, then start when all four are in')]}>
        <button disabled={p.busy} className="rpg-button" onClick={p.onCreate}>{p.replaceSave === 'host' ? t('确认创建新房', 'Confirm new room') : t('创建四人房间', 'Create four-player room')}</button>
      </RoleCard>
      <RoleCard badge={t('朋友', 'Guest')} title={t('作为朋友加入', 'Join as a guest')} steps={[t('粘贴房主单独发给你的邀请码', 'Paste the invitation the host made for you'), t('生成回复码，发回给房主', 'Create a reply code and send it back'), t('等房主开局', 'Wait for the host to start')]}>
        <label className="block text-sm font-bold">{t('粘贴房主发来的邀请码', 'Paste the host’s invitation code')}<textarea maxLength={65536} aria-label={t('房主邀请', 'Host invitation')} className="room-field" rows={3} value={p.invitation} onChange={e => p.onInvitation(e.target.value)} /></label>
        <button disabled={p.busy || !p.invitation} className="rpg-button" onClick={p.onJoin}>{p.replaceSave === 'guest' ? t('确认加入新房', 'Confirm joining new room') : t('生成回复码', 'Create reply code')}</button>
      </RoleCard>
    </div>}
    {p.role === 'guest' && linkMode && p.phase === 'lobby' && <p className="room-progress">{t('你已加入房间。保持本页打开，其他玩家到齐后由房主开局。', 'You are in the room. Keep this page open; the host starts once everyone has joined.')}</p>}
    {p.role === 'guest' && !linkMode && (p.phase === 'connecting' || p.phase === 'lobby') && <Steps items={[
      { label: t('生成回复码', 'Create your reply code'), state: p.answer || p.phase === 'lobby' ? 'done' : 'now' },
      { label: t('把回复码发回给房主', 'Send the reply code back to the host'), state: p.phase === 'lobby' ? 'done' : p.answer ? 'now' : 'todo', body: p.answer && p.phase !== 'lobby' ? <SignalOutput label={t('你的回复码（整段复制发给房主）', 'Your reply code (send all of it to the host)')} ariaLabel={t('我的回复', 'My answer')} value={p.answer} copyLabel={t('复制回复码', 'Copy reply code')} onCopy={() => p.onCopy(p.answer)} /> : undefined },
      { label: t('等房主开局', 'Wait for the host to start'), state: p.phase === 'lobby' ? 'now' : 'todo', body: p.phase === 'lobby' ? <p>{t('你已加入房间。保持本页打开，其他玩家到齐后由房主开局。', 'You are in the room. Keep this page open; the host starts once everyone has joined.')}</p> : undefined },
    ]} />}
    {p.role === 'host' && p.phase === 'lobby' && <>
      {linkMode && p.link?.visitors && <VisitorList zh={p.zh} visitors={p.link.visitors} onAdmit={id => p.link?.onAdmit?.(id)} onDeny={id => p.link?.onDeny?.(id)} />}
      {linkMode && p.link?.code && !p.link.reconnect && <LinkShare zh={p.zh} code={p.link.code} title={t('房间已开好，把邀请链接发给三位朋友', 'Room ready — send the invitation link to your three friends')} body={t('三人用同一个链接。有人打开后，这里会出现“有人想加入”，由你决定让不让他入座。你可以切去微信等应用发链接，房间在这个页面开着期间一直有效。', 'All three use the same link. When someone opens it, “Someone wants to join” appears here and you decide whether to seat them. You can switch to a chat app to send it; the room stays open as long as this page is open.')} onCopied={p.onCopy} />}
      {linkMode && !p.link?.code && <p className="room-progress">{t('正在开房…', 'Opening the room…')}</p>}
      {linkMode && <p className="room-progress">{t(`已到齐 ${count}/4 人。你是玩家 1。`, `${count}/4 players in. You are Player 1.`)}</p>}
      {!linkMode && <p className="room-progress">{t(`已到齐 ${count}/4 人。你是玩家 1。每位朋友要用自己专属的邀请码，不能把同一份发给三个人。`, `${count}/4 players in. You are Player 1. Each friend needs their own invitation — do not send one to all three.`)}</p>}
      <div className="room-seats">{[1, 2, 3].map(id => <div key={id} className={`room-seat ${p.connected[id] ? 'room-seat-ok' : ''}`}>
        <p className="room-seat-head"><span>{t('玩家', 'Player')} {id + 1}</span><span>{p.connected[id] ? t('✓ 已连接', '✓ Connected') : t('未连接', 'Not connected')}</span></p>
        {linkMode && !p.connected[id] && <p className="text-sm">{t('等待朋友打开链接…', 'Waiting for a friend to open the link…')}</p>}
        {!linkMode && !p.connected[id] && !p.offers[id] && <button disabled={p.busy} className="rpg-button" onClick={() => p.onOffer(id)}>{t(`生成玩家 ${id + 1} 的邀请码`, `Create invitation for Player ${id + 1}`)}</button>}
        {!linkMode && !p.connected[id] && p.offers[id] && <>
          <SignalOutput label={t(`① 发给玩家 ${id + 1} 的邀请码`, `① Invitation for Player ${id + 1}`)} ariaLabel={`${t('邀请', 'Invitation')} ${id + 1}`} value={p.offers[id]} copyLabel={t('复制邀请码', 'Copy invitation')} onCopy={() => p.onCopy(p.offers[id])} />
          <label className="block text-sm font-bold">{t(`② 粘贴玩家 ${id + 1} 发回的回复码`, `② Paste Player ${id + 1}’s reply code`)}<textarea maxLength={65536} aria-label={`${t('回复', 'Answer')} ${id + 1}`} className="room-field" rows={3} value={p.responses[id]} onChange={e => p.onResponse(id, e.target.value)} /></label>
          <div className="room-actions"><button disabled={p.busy || !p.responses[id]} className="rpg-button" onClick={() => p.onFinish(id)}>{t(`连接玩家 ${id + 1}`, `Connect Player ${id + 1}`)}</button><button disabled={p.busy} className="room-link" onClick={() => p.onCancelOffer(id)}>{t('取消此邀请', 'Cancel this invitation')}</button></div>
        </>}
      </div>)}</div>
      <div><button disabled={!p.connected.every(Boolean) || p.busy} className="rpg-button" onClick={p.onStart}>{p.restoring ? t('四人到齐，继续原牌局', 'All four ready — resume original match') : t('四人到齐，开始对局', 'All four ready — start match')}</button></div>
    </>}
    {p.role !== 'none' && p.phase !== 'closed' && <div className="room-actions"><button className={p.confirm ? 'rpg-button' : 'room-link'} onClick={p.onLeave}>{p.confirm ? t('确认离开，停止本场', 'Confirm leave and stop match') : t('离开房间', 'Leave room')}</button></div>}
    {choosing && <RoomNotes summary={t('连接说明与常见问题', 'Connection notes and troubleshooting')}>
      {p.link && <>
        <p>{linkMode ? t('当前为邀请链接方式：通过 PeerJS 公共服务转交连接信息（其默认配置还会尝试第三方 STUN，必要时经 TURN 中继），连上后牌局数据在玩家之间传送。如果一直连不上（例如该服务在你的网络被屏蔽），可在下方改用“邀请码 + 回复码”。下面关于交换文本的说明只适用于邀请码方式。', 'Link mode: the PeerJS public service passes on connection details (its defaults also try third-party STUN and may relay through TURN); once connected, match data travels between the players. If it never connects (for example the service is blocked on your network), switch to invitation + reply codes below. The text-exchange notes below apply to code mode only.') : t('当前为邀请码方式：不联系任何外部服务，房主要和每位朋友各交换一次代码。', 'Code mode: no external service; the host swaps one code pair with each friend.')}</p>
        <label className="block"><span className="font-bold">{t('连接方式', 'Connection method')}</span><select className="room-field" value={p.link.mode} onChange={e => p.link!.onMode(e.target.value as 'link' | 'code')}><option value="link">{t('邀请链接 · 朋友打开即入座（推荐）', 'Invitation link · friends join by opening it (recommended)')}</option><option value="code">{t('邀请码 + 回复码 · 不经过任何服务', 'Invitation + reply codes · no service involved')}</option></select></label>
      </>}
      {p.notes}
    </RoomNotes>}
  </section>;
}
