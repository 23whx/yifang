import {pageMetadata} from '@/lib/seo';
import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import InfoArticle from '@/components/ui/InfoArticle';
import {siteInfo} from '@/content/site-info';
import {isLocale} from '@/lib/i18n';

type Props={params:Promise<{locale:string}>};
export async function generateMetadata({params}:Props):Promise<Metadata>{
 const {locale}=await params;if(!isLocale(locale))return {};
 const article=siteInfo[locale].contact;
 return pageMetadata(locale, '/contact', article.title, article.intro);
}
export default async function Page({params}:Props){
 const {locale}=await params;if(!isLocale(locale))notFound();
 return <InfoArticle locale={locale} page="contact"/>;
}
