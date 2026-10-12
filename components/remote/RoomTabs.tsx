'use client';
import { useEffect, useState, type ReactNode } from 'react';

/** Picks one room variant. Every panel stays mounted so a live connection survives tab switches. */
export default function RoomTabs({ label, tabs }: { label: string; tabs: { id: string; title: string; note?: string; kind?: string; panel: ReactNode }[] }) {
  const [current, setCurrent] = useState(tabs[0].id);
  // An invitation link names its room kind; open the tab that can join it.
  useEffect(() => {
    const kind = /^yf-(.+)-[a-f0-9]{12}$/.exec(new URL(window.location.href).searchParams.get('room') ?? '')?.[1];
    const match = tabs.find(t => t.kind === kind);
    if (match) queueMicrotask(() => setCurrent(match.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const active = tabs.find(t => t.id === current) ?? tabs[0];
  return <div>
    <div role="tablist" aria-label={label} className="room-tabs">
      {tabs.map(t => <button key={t.id} type="button" role="tab" id={`room-tab-${t.id}`} aria-controls={`room-panel-${t.id}`} aria-selected={t.id === active.id} className="room-tab" onClick={() => setCurrent(t.id)}>{t.title}</button>)}
    </div>
    {active.note && <p className="room-tab-note">{active.note}</p>}
    {tabs.map(t => <div key={t.id} role="tabpanel" id={`room-panel-${t.id}`} aria-labelledby={`room-tab-${t.id}`} hidden={t.id !== active.id}>{t.panel}</div>)}
  </div>;
}
