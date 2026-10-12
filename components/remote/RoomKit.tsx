import type { ReactNode } from 'react';

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
export function FourSeatSetup(p: {
  zh: boolean; title: string; role: 'none' | 'host' | 'guest'; phase: FourSeatPhase; connected: boolean[];
  offers: string[]; responses: string[]; invitation: string; answer: string; busy: boolean; error: string;
  saved: boolean; saveError: string; replaceSave: 'host' | 'guest' | null; clearConfirm: boolean; restoring: boolean; confirm: boolean;
  notes: ReactNode;
  onCreate: () => void; onLeave: () => void; onRestore: () => void; onClear: () => void;
  onOffer: (seat: number) => void; onCopy: (value: string) => void; onResponse: (seat: number, value: string) => void;
  onFinish: (seat: number) => void; onCancelOffer: (seat: number) => void; onStart: () => void;
  onInvitation: (value: string) => void; onJoin: () => void;
}) {
  const t = (cn: string, en: string) => p.zh ? cn : en;
  const count = p.connected.filter(Boolean).length;
  const choosing = p.role === 'none' || p.phase === 'closed' || p.phase === 'finished';
  const status = ({
    idle: t('尚未连接', 'Not connected'),
    lobby: p.role === 'host' ? t(`等待玩家到齐（${count}/4）`, `Waiting for players (${count}/4)`) : t('已加入，等待房主开局', 'Joined — waiting for the host to start'),
    connecting: p.answer ? t('等待房主连接你的回复码', 'Waiting for the host to use your reply') : t('正在生成回复码…', 'Creating your reply code…'),
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
      {p.saved && <p>{t('想接着打：房主先点“恢复上次牌局”，再按原座位给三人重新发邀请码；三位朋友也先点恢复，再粘贴自己的新邀请码。人齐后房主点“继续原牌局”，不会重新发牌。', 'To continue: the host chooses Restore previous match and sends fresh invitations for the original seats; each friend also restores first, then pastes their new invitation. Once all four are back, the host continues without a new deal.')}</p>}
      <div className="room-actions">
        {p.saved && <button disabled={p.busy} className="rpg-button" onClick={p.onRestore}>{t('恢复上次牌局', 'Restore previous match')}</button>}
        <button disabled={p.busy} className="room-link" onClick={p.onClear}>{p.clearConfirm ? t('确认删除存档（无法撤销）', 'Confirm delete (cannot be undone)') : t('删除这个存档', 'Delete this save')}</button>
      </div>
    </div>}
    {p.replaceSave && <RoomAlert>{t('你有一个未完成的牌局存档。点“确认创建新房”或“确认加入新房”开始新局；旧存档会保留到新局真正开始并成功保存后才被覆盖，你也可以先恢复上次牌局。', 'You have an unfinished saved match. Choose Confirm new room or Confirm joining to start fresh; the old save stays until the new match starts and saves successfully, or restore it first.')}</RoomAlert>}
    {p.restoring && <p className="room-progress">{p.phase === 'playing' || p.phase === 'finished' ? t('已恢复原牌局，保留原座位、牌面和进度。', 'Original match restored, including seats, cards and progress.') : t('恢复模式：保持原座位，等待重新连接；不会重新发牌。', 'Recovery mode: keep your original seat and reconnect. No new deal.')}</p>}
    {choosing && <div className="room-roles">
      <RoleCard badge={t('房主 · 玩家 1', 'Host · Player 1')} title={t('我来开房', 'Open a room')} steps={[t('创建房间，你是玩家 1', 'Create the room — you are Player 1'), t('分别给玩家 2、3、4 生成邀请码并发送', 'Create and send a separate invitation for Players 2, 3 and 4'), t('粘贴各自发回的回复码，人齐后开局', 'Paste each reply code, then start when all four are in')]}>
        <button disabled={p.busy} className="rpg-button" onClick={p.onCreate}>{p.replaceSave === 'host' ? t('确认创建新房', 'Confirm new room') : t('创建四人房间', 'Create four-player room')}</button>
      </RoleCard>
      <RoleCard badge={t('朋友', 'Guest')} title={t('作为朋友加入', 'Join as a guest')} steps={[t('粘贴房主单独发给你的邀请码', 'Paste the invitation the host made for you'), t('生成回复码，发回给房主', 'Create a reply code and send it back'), t('等房主开局', 'Wait for the host to start')]}>
        <label className="block text-sm font-bold">{t('粘贴房主发来的邀请码', 'Paste the host’s invitation code')}<textarea maxLength={65536} aria-label={t('房主邀请', 'Host invitation')} className="room-field" rows={3} value={p.invitation} onChange={e => p.onInvitation(e.target.value)} /></label>
        <button disabled={p.busy || !p.invitation} className="rpg-button" onClick={p.onJoin}>{p.replaceSave === 'guest' ? t('确认加入新房', 'Confirm joining new room') : t('生成回复码', 'Create reply code')}</button>
      </RoleCard>
    </div>}
    {p.role === 'guest' && (p.phase === 'connecting' || p.phase === 'lobby') && <Steps items={[
      { label: t('生成回复码', 'Create your reply code'), state: p.answer || p.phase === 'lobby' ? 'done' : 'now' },
      { label: t('把回复码发回给房主', 'Send the reply code back to the host'), state: p.phase === 'lobby' ? 'done' : p.answer ? 'now' : 'todo', body: p.answer && p.phase !== 'lobby' ? <SignalOutput label={t('你的回复码（整段复制发给房主）', 'Your reply code (send all of it to the host)')} ariaLabel={t('我的回复', 'My answer')} value={p.answer} copyLabel={t('复制回复码', 'Copy reply code')} onCopy={() => p.onCopy(p.answer)} /> : undefined },
      { label: t('等房主开局', 'Wait for the host to start'), state: p.phase === 'lobby' ? 'now' : 'todo', body: p.phase === 'lobby' ? <p>{t('你已加入房间。保持本页打开，其他玩家到齐后由房主开局。', 'You are in the room. Keep this page open; the host starts once everyone has joined.')}</p> : undefined },
    ]} />}
    {p.role === 'host' && p.phase === 'lobby' && <>
      <p className="room-progress">{t(`已到齐 ${count}/4 人。你是玩家 1。每位朋友要用自己专属的邀请码，不能把同一份发给三个人。`, `${count}/4 players in. You are Player 1. Each friend needs their own invitation — do not send one to all three.`)}</p>
      <div className="room-seats">{[1, 2, 3].map(id => <div key={id} className={`room-seat ${p.connected[id] ? 'room-seat-ok' : ''}`}>
        <p className="room-seat-head"><span>{t('玩家', 'Player')} {id + 1}</span><span>{p.connected[id] ? t('✓ 已连接', '✓ Connected') : t('未连接', 'Not connected')}</span></p>
        {!p.connected[id] && !p.offers[id] && <button disabled={p.busy} className="rpg-button" onClick={() => p.onOffer(id)}>{t(`生成玩家 ${id + 1} 的邀请码`, `Create invitation for Player ${id + 1}`)}</button>}
        {!p.connected[id] && p.offers[id] && <>
          <SignalOutput label={t(`① 发给玩家 ${id + 1} 的邀请码`, `① Invitation for Player ${id + 1}`)} ariaLabel={`${t('邀请', 'Invitation')} ${id + 1}`} value={p.offers[id]} copyLabel={t('复制邀请码', 'Copy invitation')} onCopy={() => p.onCopy(p.offers[id])} />
          <label className="block text-sm font-bold">{t(`② 粘贴玩家 ${id + 1} 发回的回复码`, `② Paste Player ${id + 1}’s reply code`)}<textarea maxLength={65536} aria-label={`${t('回复', 'Answer')} ${id + 1}`} className="room-field" rows={3} value={p.responses[id]} onChange={e => p.onResponse(id, e.target.value)} /></label>
          <div className="room-actions"><button disabled={p.busy || !p.responses[id]} className="rpg-button" onClick={() => p.onFinish(id)}>{t(`连接玩家 ${id + 1}`, `Connect Player ${id + 1}`)}</button><button disabled={p.busy} className="room-link" onClick={() => p.onCancelOffer(id)}>{t('取消此邀请', 'Cancel this invitation')}</button></div>
        </>}
      </div>)}</div>
      <div><button disabled={!p.connected.every(Boolean) || p.busy} className="rpg-button" onClick={p.onStart}>{p.restoring ? t('四人到齐，继续原牌局', 'All four ready — resume original match') : t('四人到齐，开始对局', 'All four ready — start match')}</button></div>
    </>}
    {p.role !== 'none' && p.phase !== 'closed' && <div className="room-actions"><button className={p.confirm ? 'rpg-button' : 'room-link'} onClick={p.onLeave}>{p.confirm ? t('确认离开，停止本场', 'Confirm leave and stop match') : t('离开房间', 'Leave room')}</button></div>}
    {choosing && <RoomNotes summary={t('连接说明与常见问题', 'Connection notes and troubleshooting')}>{p.notes}</RoomNotes>}
  </section>;
}
