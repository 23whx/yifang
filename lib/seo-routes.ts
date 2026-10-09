import { games } from '@/content/games';
import { tutorials } from '@/content/tutorials';
import { sectionsFor } from '@/content/sections';

export const remoteGames = ['chess', 'xiangqi', 'shogi', 'go', 'holdem', 'mahjong'] as const;

/** Content-derived routes; no invented freshness timestamps or daily-update claims. */
export function publicContentPaths(): string[] {
  return ['', '/collection', '/academy', '/about', '/contact', '/privacy',
    ...games.flatMap(game => [
      `/${game.slug}`, `/${game.slug}/learn`, ...(game.playable ? [`/${game.slug}/play`] : []),
      ...sectionsFor(game.slug).map(section => `/${game.slug}/${section}`),
    ]),
    ...remoteGames.map(game => `/${game}/remote`),
    ...tutorials.map(tutorial => `/${tutorial.game}/learn/${tutorial.slug}`),
  ];
}
