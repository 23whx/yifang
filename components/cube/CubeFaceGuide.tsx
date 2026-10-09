import { faceColors, facePalette, stickerGrids, type CubeOrientation } from '@/lib/cube/stickers';
import type { Face } from '@/lib/cube/alg';

export default function CubeFaceGuide({ algorithm, orientation, locale }: { algorithm: string; orientation: CubeOrientation; locale: 'zh' | 'en' }) {
  const zh=locale==='zh', grids=stickerGrids(algorithm), names=faceColors(orientation), palette=facePalette(orientation);
  const colors={white:'白',yellow:'黄',green:'绿',blue:'蓝',red:'红',orange:'橙'};
  const labels: Record<Face,string>={U:zh?'顶面':'Top',F:zh?'前面':'Front',R:zh?'右面':'Right',L:zh?'左面':'Left',B:zh?'后面':'Back',D:zh?'底面':'Bottom'};
  return <details className="border-t border-rule p-4">
    <summary className="cursor-pointer text-sm font-bold">{zh?'这一刻的六面贴纸图':'Six faces at this step'}</summary>
    <p className="mt-2 text-xs leading-6">{zh?'每张小图都正对该面。顶面图的上方靠后面、下方靠前面。字母指固定方位；拖动 3D 视角不改变它们。动画结束后贴纸图才更新。':'Each grid looks straight at that face. Top grid: back at its top, front at its bottom. Letters stay fixed when you orbit the 3D view. Grids update after a turn finishes.'}</p>
    <div className="mt-3 grid grid-cols-3 gap-3">{(['U','F','R','L','B','D'] as Face[]).map(face=><div key={face}>
      <p className="mb-1 text-xs font-bold">{face} · {labels[face]}</p>
      <div className="grid grid-cols-3 gap-px border border-[#392616] bg-[#392616]" aria-label={`${labels[face]} ${zh?'贴纸':'stickers'}`}>{grids[face].map((color,i)=><span key={i} className="grid aspect-square place-items-center text-[10px] font-bold text-black" style={{background:palette[color]}} aria-label={`${face} ${Math.floor(i/3)+1},${i%3+1}: ${zh?colors[names[color]]:names[color]}`}>{zh?colors[names[color]]:names[color].slice(0,1).toUpperCase()}</span>)}</div>
    </div>)}</div>
  </details>;
}
