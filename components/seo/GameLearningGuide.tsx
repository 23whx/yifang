import Link from 'next/link';
import { searchTopics } from '@/content/seo';
import type { GameSlug } from '@/content/games';
import type { Locale } from '@/lib/i18n';

export default function GameLearningGuide({ game, locale }: { game: GameSlug; locale: Locale }) {
  const topic = searchTopics[game];
  return <section className="seo-reading" aria-labelledby="learning-guide-title">
    <h2 id="learning-guide-title">{locale === 'zh' ? '入门常见问题' : 'Beginner questions'}</h2>
    <p>{topic.description[locale]}</p>
    {topic.questions.map(item => <div key={item.question.en}>
      <h3>{item.question[locale]}</h3><p>{item.answer[locale]}</p>
    </div>)}
    <nav aria-label={locale === 'zh' ? '下一步学习' : 'Continue learning'} className="seo-links">
      <Link href={`/${locale}/${game}/learn/`}>{locale === 'zh' ? '按顺序学习完整教程' : 'Follow the complete lesson sequence'}</Link>
      <Link href={`/${locale}/${game}/play/`}>{locale === 'zh' ? '在浏览器中动手练习' : 'Practice in your browser'}</Link>
    </nav>
    {topic.references.length > 0 && <p className="seo-reference">{locale === 'zh' ? '规则与方法参考：' : 'Rules and methods: '}
      {topic.references.map((reference, index) => <span key={reference.url}>{index > 0 && ' · '}<a href={reference.url}>{reference.name}</a></span>)}
    </p>}
  </section>;
}
