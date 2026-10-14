import { games } from '@/content/games';
import { tutorials, localizeTutorial } from '@/content/tutorials';
import { sectionsFor } from '@/content/sections';
import { contact } from '@/content/site-info';
import { remoteGames } from '@/lib/seo-routes';
import { absoluteUrl, SITE_URL } from '@/lib/site';

export const dynamic = 'force-static';

/**
 * /llms.txt: a plain-text map of the site for AI assistants (llmstxt.org format). Google Search ignores it;
 * it costs nothing and some other tools read it. Built from the same content as the pages.
 */
export function GET() {
  const url = (path: string) => absoluteUrl(path);
  const lines = [
    '# 弈方 · Yifang',
    '',
    '> 免费的双语（简体中文 / English）棋牌入门网站：中国象棋、国际象棋、日本将棋、围棋、麻将、德州扑克、百家乐和三阶魔方。每个游戏都有从零开始的图文教程、术语表、练习题，以及在浏览器里的人机对弈或好友在线对战。无需注册，不涉及真钱。',
    '> Free bilingual (Simplified Chinese / English) lessons for xiangqi, chess, shogi, Go, mahjong, Texas Hold’em, baccarat and the Rubik’s Cube, with glossaries, puzzles, play against the computer and online games with friends in the browser. No sign-up, no real money.',
    '',
    `Contact: ${contact.email}`,
    '',
  ];
  for (const game of games) {
    lines.push(`## ${game.name.zh} / ${game.name.en}`, '', game.definition.zh, game.definition.en, '');
    const sections = sectionsFor(game.slug);
    for (const locale of ['zh', 'en'] as const) {
      const label = locale === 'zh'
        ? { hub: '总览', learn: '教程目录', play: '在线练习', remote: '好友对战', glossary: '术语表', history: '历史', puzzles: '练习题' }
        : { hub: 'Overview', learn: 'All lessons', play: 'Play online', remote: 'Play with friends', glossary: 'Glossary', history: 'History', puzzles: 'Puzzles' };
      lines.push(`- [${game.name[locale]} · ${label.hub}](${url(`/${locale}/${game.slug}`)})`);
      lines.push(`- [${game.name[locale]} · ${label.learn}](${url(`/${locale}/${game.slug}/learn`)})`);
      for (const tutorial of tutorials.filter(t => t.game === game.slug)) {
        const lesson = localizeTutorial(tutorial, locale);
        lines.push(`  - [${lesson.title}](${url(`/${locale}/${game.slug}/learn/${tutorial.slug}`)}): ${lesson.description}`);
      }
      if (game.playable) lines.push(`- [${game.name[locale]} · ${label.play}](${url(`/${locale}/${game.slug}/play`)})`);
      if ((remoteGames as readonly string[]).includes(game.slug)) lines.push(`- [${game.name[locale]} · ${label.remote}](${url(`/${locale}/${game.slug}/remote`)})`);
      for (const section of sections) lines.push(`- [${game.name[locale]} · ${label[section]}](${url(`/${locale}/${game.slug}/${section}`)})`);
    }
    lines.push('');
  }
  lines.push('## 网站信息 / About', '',
    `- [关于弈方](${url('/zh/about')}) · [About Yifang](${url('/en/about')})`,
    `- [隐私与数据说明](${url('/zh/privacy')}) · [Privacy](${url('/en/privacy')})`,
    `- [联系](${url('/zh/contact')}) · [Contact](${url('/en/contact')})`,
    `- [Sitemap](${SITE_URL}/sitemap.xml)`, '');
  return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
