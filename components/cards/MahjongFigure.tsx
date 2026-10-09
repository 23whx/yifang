import MahjongTile from './MahjongTile';
import { mahjongFigures } from '@/content/mahjong-lessons';
import { variantFigures } from '@/content/mahjong-variants';

export default function MahjongFigure({ id, locale }: { id: string; locale: 'zh' | 'en' }) {
  const figure = mahjongFigures[id] ?? variantFigures[id];
  if (!figure) return null;
  return <figure className="my-6 min-w-0 rounded-lg border border-[#ae8550] bg-[#f3e7cd] p-3 text-[#392616] sm:p-5">
    <figcaption className="mb-5 text-base font-semibold leading-8">{figure.caption[locale]}</figcaption>
    <div className="flex flex-wrap items-start gap-4">{figure.panels.map((panel,i)=><div key={i} className="min-w-0 max-w-full rounded border border-[#ae8550]/50 bg-[#fff8e8] p-3">
      <p className="mb-3 max-w-prose text-sm font-bold leading-6">{panel.label[locale]}</p>
      <div className="flex flex-wrap gap-1">{panel.tiles.map((tile,j)=><MahjongTile key={j} tile={tile} locale={locale}/>)}</div>
      {panel.note?.[locale] && <p className="mt-3 max-w-prose text-sm leading-7">{panel.note[locale]}</p>}
    </div>)}</div>
  </figure>;
}
