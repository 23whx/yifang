import Link from 'next/link';
import { tutorialsForGame } from '@/content/tutorials';
import { getGame, type GameSlug } from '@/content/games';
import { sectionsFor } from '@/content/sections';
import type { Locale } from '@/lib/i18n';
import { searchTopics } from '@/content/seo';

export default function LessonNavigation({ game, slug, locale }: { game: GameSlug; slug: string; locale: Locale }) {
  const lessons = tutorialsForGame(game);
  const index = lessons.findIndex(lesson => lesson.slug === slug);
  const related = [lessons[index - 1], lessons[index + 1]].filter(Boolean);
  const name = getGame(game)!.name[locale];
  return <aside className="seo-reading" aria-label={locale === 'zh' ? '继续学习' : 'Continue learning'}>
    <h2>{locale === 'zh' ? '把本课知识接到下一步' : 'Continue from this lesson'}</h2>
    <nav className="seo-links" aria-label={locale === 'zh' ? '相关课程与练习' : 'Related lessons and practice'}>
      {related.map(lesson => <Link key={lesson.slug} href={`/${locale}/${game}/learn/${lesson.slug}/`}>{lesson.title[locale]}</Link>)}
      <Link href={`/${locale}/${game}/learn/`}>{locale === 'zh' ? `${name}全部教程` : `All ${name} lessons`}</Link>
      {sectionsFor(game).includes('glossary') && <Link href={`/${locale}/${game}/glossary/`}>{locale === 'zh' ? `${name}术语解释` : `${name} glossary`}</Link>}
      <Link href={`/${locale}/${game}/play/`}>{locale === 'zh' ? '打开规则练习' : 'Open rules practice'}</Link>
    </nav>
    {searchTopics[game].references.length > 0 && <p className="seo-reference">{locale === 'zh' ? '延伸参考（本站课程是独立撰写的教学内容）：' : 'Further reading (Yifang lessons are independently written): '}
      {searchTopics[game].references.map((reference, i) => <span key={reference.url}>{i > 0 && ' · '}<a href={reference.url}>{reference.name}</a></span>)}
    </p>}
  </aside>;
}
