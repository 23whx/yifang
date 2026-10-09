import Link from 'next/link';
import { games } from '@/content/games';
import { searchTopics } from '@/content/seo';
import type { Locale } from '@/lib/i18n';

export default function HomeLearningGuide({ locale }: { locale: Locale }) {
  const zh = locale === 'zh';
  return <section className="seo-reading seo-home-guide" aria-labelledby="learning-paths">
    <h2 id="learning-paths">{zh ? '从零学习规则，再亲手练习' : 'Learn the rules, then practice them'}</h2>
    <p>{zh ? '弈方是中英文双语的棋类、魔方与牌桌教学平台。每条学习路线从用具、目标与基本词语开始，逐步进入规则、例题与操作。无需账号或下载；各游戏的练习方式以对应页面为准。' : 'Yifang teaches board games, the Rubik’s Cube and table games in English and Chinese. Start with equipment, objectives and vocabulary, then work through rules, examples and hands-on practice. No account or download is needed; available practice modes vary by game.'}</p>
    <ul className="seo-topic-list">{games.map(game => <li key={game.slug}>
      <h3><Link href={`/${locale}/${game.slug}/`}>{game.name[locale]}</Link></h3>
      <p>{searchTopics[game.slug].description[locale]}</p>
      <Link href={`/${locale}/${game.slug}/learn/`}>{zh ? `学习${game.name[locale]}规则` : `Learn ${game.name[locale]} rules`} →</Link>
    </li>)}</ul>
    <h3>{zh ? '第一次访问，如何选择课程？' : 'How should I choose a first lesson?'}</h3>
    <p>{zh ? '对某个游戏完全陌生，就从它的零基础第一课开始；只想查一个词，进入术语栏目；已经理解基本规则，再尝试练习与对战。麻将先选择日式立直、国标或四川分支，不把不同地区的计分混用。' : 'Start with lesson one if a game is entirely new to you. Use the glossary for a specific term, then try practice and play after learning the basics. Choose a Riichi, MCR or Sichuan branch for mahjong, keeping their scoring systems separate.'}</p>
    <p>{zh ? '牌桌中的筹码和余额只用于教学，无真钱、充值、提现或奖品兑换。跟做案例与原创练习不是赛事成绩，也不代表获利能力。' : 'Table chips and balances are for teaching only: no real money, purchases, withdrawals or prize exchanges. Guided examples and original exercises are not competition results or evidence of profitability.'}</p>
    <nav className="seo-links" aria-label={zh ? '学习目录' : 'Learning directories'}>
      <Link href={`/${locale}/academy/`}>{zh ? '查看全部课程' : 'Browse all lessons'}</Link>
      <Link href={`/${locale}/collection/`}>{zh ? '比较八个游戏' : 'Explore all eight games'}</Link>
    </nav>
  </section>;
}
