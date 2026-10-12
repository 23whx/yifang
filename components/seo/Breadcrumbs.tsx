import Link from 'next/link';
import JsonLd from './JsonLd';
import { breadcrumbSchema, type Breadcrumb } from '@/lib/seo';
import { sitePath } from '@/lib/site';
import type { Locale } from '@/lib/i18n';

/** Rendered at the top of every inner page, outside its content container, so all pages share one left edge. */
export default function Breadcrumbs({ locale, items }: { locale: Locale; items: Breadcrumb[] }) {
  return <>
    <JsonLd data={breadcrumbSchema(items)} />
    <nav aria-label={locale === 'zh' ? '面包屑导航' : 'Breadcrumb'} className="seo-breadcrumbs page-shell">
      <ol>{items.map((item, index) => <li key={item.path}>
        {index > 0 && <span aria-hidden="true" className="crumb-sep">›</span>}
        {index === items.length - 1 ? <span aria-current="page">{item.name}</span> : <Link href={sitePath(item.path)}>{item.name}</Link>}
      </li>)}</ol>
    </nav>
  </>;
}
