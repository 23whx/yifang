type DisplayChoice = {
  index: number;
  type: string;
  claim: string | null;
  tileIds: readonly string[];
};

/** Physical copies are interchangeable for a chow within one claim window.
 * Keep the host command index, not the filtered array position.
 * Other actions may have different semantics even with identical faces.
 */
export function mcrDisplayChoices<T extends DisplayChoice>(choices: readonly T[]): T[] {
  const seen = new Set<string>();
  return choices.filter(choice => {
    if (choice.type !== 'claim-discard' || choice.claim !== 'chow') return true;
    const key = choice.tileIds.map(id => id.split(':')[0]).sort().join('|');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Show a claimed sequence in reading order without mutating engine tile order. */
export function mcrMeldDisplayTiles<T extends {face: string}>(meld: {kind: string; tiles: readonly T[]}): T[] {
  const tiles = [...meld.tiles];
  return meld.kind === 'chow' ? tiles.sort((a, b) => Number(a.face[0]) - Number(b.face[0])) : tiles;
}
