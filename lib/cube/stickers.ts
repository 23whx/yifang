import { parseAlg, type Face } from './alg';
export type CubeOrientation = 'white-up' | 'yellow-up';
const hex = { white: '#f8fafc', yellow: '#facc15', green: '#22c55e', blue: '#3b82f6', red: '#ef4444', orange: '#f97316' };
export const faceColors = (orientation: CubeOrientation): Record<Face, keyof typeof hex> => orientation === 'yellow-up'
  ? { U: 'yellow', D: 'white', F: 'green', B: 'blue', R: 'orange', L: 'red' }
  : { U: 'white', D: 'yellow', F: 'green', B: 'blue', R: 'red', L: 'orange' };
export const facePalette = (orientation: CubeOrientation): Record<Face, string> => Object.fromEntries(Object.entries(faceColors(orientation)).map(([f, c]) => [f, hex[c]])) as Record<Face, string>;
type Vector = [number, number, number];
type Sticker = { p: Vector; n: Vector; color: Face };
const faceAxis: Record<Face, [number, number]> = { R:[0,1],L:[0,-1],U:[1,1],D:[1,-1],F:[2,1],B:[2,-1] };

/** Face-on rows: U has B above/F below; D has F above/B below. */
export function stickerGrids(algorithm: string): Record<Face, Face[]> {
  const stickers: Sticker[] = [];
  for (const face of Object.keys(faceAxis) as Face[]) {
    const [axis, side] = faceAxis[face];
    for (let a=-1;a<=1;a++) for (let b=-1;b<=1;b++) {
      const p: Vector=[0,0,0],n: Vector=[0,0,0];p[axis]=side;n[axis]=side;
      p[(axis+1)%3]=a;p[(axis+2)%3]=b;stickers.push({p,n,color:face});
    }
  }
  for (const move of parseAlg(algorithm)) {
    const [axis, side] = faceAxis[move.face];
    for (const s of stickers) if(s.p[axis]===side) {
      for(let i=0;i<((4-move.turns*side)%4);i++) for(const v of [s.p,s.n]) {
        const a=(axis+1)%3,b=(axis+2)%3;const old=v[a];v[a]=-v[b];v[b]=old;
      }
    }
  }
  const result = {} as Record<Face, Face[]>;
  for (const face of Object.keys(faceAxis) as Face[]) {
    const [axis,side]=faceAxis[face];
    const order = (p: Vector) => {
      if(face==='U') return (p[2]+1)*3+p[0]+1;
      if(face==='D') return (1-p[2])*3+p[0]+1;
      if(face==='F') return (1-p[1])*3+p[0]+1;
      if(face==='B') return (1-p[1])*3+1-p[0];
      if(face==='R') return (1-p[1])*3+1-p[2];
      return (1-p[1])*3+p[2]+1;
    };
    result[face]=stickers.filter(s=>s.n[axis]===side).sort((a,b)=>order(a.p)-order(b.p)).map(s=>s.color);
  }
  return result;
}
