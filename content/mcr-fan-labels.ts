/** Display names in the 81-item MCR catalog order; never used to calculate scores.
 * Reference: https://mahjong-europe.org/portal/images/docs/mcr_EN.pdf
 * Chow = sequence; pung = triplet. Keep these definitions beside the UI. */
export const mcrEnglishFanNames = [
  'Big Four Winds','Big Three Dragons','All Green','Nine Gates','Four Kongs','Seven Shifted Pairs','Thirteen Orphans',
  'All Terminals','Little Four Winds','Little Three Dragons','All Honors','Four Concealed Pungs','Pure Terminal Chows',
  'Quadruple Chow','Four Pure Shifted Pungs','Four Pure Shifted Chows','Three Kongs','All Terminals and Honors',
  'Seven Pairs','Greater Honors and Knitted Tiles','All Even Pungs','Full Flush','Pure Triple Chow','Pure Shifted Pungs','Upper Tiles','Middle Tiles','Lower Tiles',
  'Pure Straight','Three-Suited Terminal Chows','Pure Shifted Chows','All Fives','Triple Pung','Three Concealed Pungs',
  'Lesser Honors and Knitted Tiles','Knitted Straight','Upper Four','Lower Four','Big Three Winds',
  'Mixed Straight','Reversible Tiles','Mixed Triple Chow','Mixed Shifted Pungs','Chicken Hand','Last Tile Draw','Last Tile Claim','Out with Replacement Tile','Robbing the Kong','Two Concealed Kongs',
  'All Pungs','Half Flush','Mixed Shifted Chows','All Types','Melded Hand','Two Dragon Pungs',
  'Outside Hand','Fully Concealed Hand','Two Melded Kongs','Last Tile',
  'Dragon Pung','Prevalent Wind','Seat Wind','Concealed Hand','All Chows','Tile Hog','Double Pung','Two Concealed Pungs','Concealed Kong','All Simples',
  'Pure Double Chow','Mixed Double Chow','Short Straight','Two Terminal Chows','Pung of Terminals or Honors','Melded Kong','One Voided Suit','No Honors','Edge Wait','Closed Wait','Single Waiting','Self-Drawn','Flower Tiles',
] as const;
export function mcrFanLabel(code:string,chinese:string,locale:'zh'|'en'){
  // WMO's Chinese book prints “单调将”; the learner-facing term is “单钓将”.
  if(locale==='zh')return code==='mcr-79'?'单钓将':chinese;
  const i=/^mcr-(0[1-9]|[1-7][0-9]|8[01])$/.test(code)?Number(code.slice(4))-1:-1;
  return mcrEnglishFanNames[i]??`Unknown scoring entry (${code})`;
}
