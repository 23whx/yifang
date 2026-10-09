import Link from 'next/link';
import {contact,siteInfo,type InfoPage} from '@/content/site-info';
import type {Locale} from '@/lib/i18n';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import PageSchema from '@/components/seo/PageSchema';

export default function InfoArticle({locale,page}:{locale:Locale;page:InfoPage}){
 const article=siteInfo[locale][page],zh=locale==='zh';
 return <article className="rpg-directory site-info">
  <Breadcrumbs locale={locale} items={[{name:zh?'弈方首页':'Yifang home',path:`/${locale}`},{name:article.title,path:`/${locale}/${page}`}]} />
  <PageSchema locale={locale} path={`/${page}`} name={article.title} description={article.intro} type={page==='about'?'AboutPage':page==='contact'?'ContactPage':'WebPage'} />
  <nav aria-label={zh?'站点信息':'Site information'} className="flex flex-wrap gap-3">
   {(['about','contact','privacy'] as const).map(key=><Link key={key} href={`/${locale}/${key}`} aria-current={key===page?'page':undefined} className="inline-flex min-h-11 items-center underline underline-offset-4">{siteInfo[locale][key].title}</Link>)}
  </nav>
  <h1>{article.title}</h1><p>{article.intro}</p>
  <div className="max-w-[68ch]">
   {article.sections.map(section=><section key={section.title} className="mt-8"><h2 className="mb-3 text-xl font-bold">{section.title}</h2>{section.paragraphs.map(text=><p key={text} className="mb-4 text-base leading-8">{text}</p>)}</section>)}
   <address className="mt-8 border-t border-[#ae8550] pt-5 not-italic break-words">
    <p>{zh?'联系邮箱':'Email'}：<a className="inline-flex min-h-11 items-center underline" href={`mailto:${contact.email}`}>{contact.email}</a></p>
    <p>{zh?'工具站（外部网站）':'Tools (external website)'}：<a className="inline-flex min-h-11 items-center underline" href={contact.siteUrl}>{contact.siteName}</a></p>
   </address>
   <Link href={`/${locale}/academy`} className="mt-6 inline-flex min-h-11 items-center underline">{zh?'前往学习学院':'Visit the academy'} →</Link>
  </div>
 </article>;
}
