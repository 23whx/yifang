import type { Locale } from '@/lib/i18n';

/** Visible "last updated" line; the same date goes into the page's dateModified. */
export default function UpdatedOn({ locale, date, className = '' }: { locale: Locale; date?: string; className?: string }) {
  if (!date) return null;
  const [y, m, d] = date.split('-').map(Number);
  const text = locale === 'zh' ? `${y}年${m}月${d}日` : new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
  return <span className={className}>{locale === 'zh' ? '最后更新：' : 'Last updated: '}<time dateTime={date}>{text}</time></span>;
}
