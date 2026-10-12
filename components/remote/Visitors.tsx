'use client';
import { useEffect, useRef, useState } from 'react';
import type { Visitor } from '@/lib/peer-room';

const NICKNAME_KEY = 'yifang:nickname';
/** A per-viewer convenience; joining works without it. */
export function readNickname() { try { return localStorage.getItem(NICKNAME_KEY) ?? ''; } catch { return ''; } }
export function writeNickname(value: string) { try { localStorage.setItem(NICKNAME_KEY, value); } catch { /* not remembered */ } }

/** Optional name the host sees when this guest knocks. */
export function NicknameField({ zh }: { zh: boolean }) {
  const [value, setValue] = useState('');
  useEffect(() => { queueMicrotask(() => setValue(readNickname())); }, []);
  return <label className="block text-sm font-bold">{zh ? '你的昵称（房主会看到，可不填）' : 'Your name (shown to the host, optional)'}
    <input className="room-field" maxLength={24} autoComplete="nickname" value={value} placeholder={zh ? '例如：小明' : 'e.g. Sam'} onChange={e => { setValue(e.target.value); writeNickname(e.target.value); }} />
  </label>;
}

/** The host's door: who is opening the link, and who is waiting to be let in. */
export function VisitorList({ zh, visitors, onAdmit, onDeny }: { zh: boolean; visitors: Visitor[]; onAdmit: (id: string) => void; onDeny: (id: string) => void }) {
  const t = (cn: string, en: string) => zh ? cn : en;
  const knocking = visitors.filter(v => v.state === 'knocking'), connecting = visitors.length - knocking.length;
  if (!visitors.length) return null;
  return <div className="room-visitors" aria-live="polite">
    {connecting > 0 && <p className="room-progress">{t(`有 ${connecting} 人打开了邀请链接，正在建立连接…`, `${connecting} ${connecting === 1 ? 'person has' : 'people have'} opened the link — connecting…`)}</p>}
    {knocking.map(v => <div key={v.id} className="room-banner room-visitor">
      <p className="room-banner-title">{t('有人想加入：', 'Someone wants to join: ')}{v.name || t('未填昵称', 'No name given')}</p>
      {v.device && <p className="text-sm">{t('设备：', 'Device: ')}{v.device}</p>}
      <div className="room-actions">
        <button className="rpg-button" onClick={() => onAdmit(v.id)}>{t('让他进来', 'Let them in')}</button>
        <button className="rpg-button secondary" onClick={() => onDeny(v.id)}>{t('拒绝', 'Decline')}</button>
      </div>
    </div>)}
  </div>;
}

/** Flash the tab title with `text` while the player is looking at another tab or app. */
export function useAttention(text: string | null) {
  useEffect(() => {
    if (!text || typeof document === 'undefined') return;
    const original = document.title;
    let on = false;
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') { if (on) { document.title = original; on = false; } return; }
      on = !on; document.title = on ? text : original;
    }, 1000);
    return () => { clearInterval(timer); document.title = original; };
  }, [text]);
}
/** A short, soft two-note chime — a lobby's "someone is here". Silent where audio is unavailable. */
export function chime() {
  try {
    const Context = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Context) return;
    const ctx = new Context(), o = ctx.createOscillator(), g = ctx.createGain(), at = ctx.currentTime;
    o.type = 'sine'; o.frequency.setValueAtTime(880, at); o.frequency.setValueAtTime(1320, at + 0.12);
    g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(0.1, at + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, at + 0.4);
    o.connect(g).connect(ctx.destination); o.start(at); o.stop(at + 0.42); o.onended = () => { void ctx.close(); };
  } catch { /* no sound is fine */ }
}
/** Ask before closing or refreshing the page while a match is running. */
export function useLeaveGuard(active: boolean) {
  useEffect(() => {
    if (!active || typeof window === 'undefined') return;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [active]);
}
/** Flash the tab title while someone waits and the host is looking elsewhere; chime when a new knock arrives. */
export function useTitleAlert(count: number, zh: boolean) {
  const previous = useRef(0);
  useEffect(() => { if (count > previous.current) chime(); previous.current = count; }, [count]);
  useAttention(count ? (zh ? `🔔 有人想加入（${count}）` : `🔔 ${count} waiting to join`) : null);
}
