import {pageMetadata} from '@/lib/seo';
import { infoSearch } from '@/content/seo';
import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import InfoArticle from '@/components/ui/InfoArticle';
import {isLocale} from '@/lib/i18n';

type Props={params:Promise<{locale:string}>};
export async function generateMetadata({params}:Props):Promise<Metadata>{
 const {locale}=await params;if(!isLocale(locale))return {};
 return pageMetadata(locale, '/about', infoSearch.about[locale].title, infoSearch.about[locale].description);
}
export default async function Page({params}:Props){
 const {locale}=await params;if(!isLocale(locale))notFound();
 return <InfoArticle locale={locale} page="about"/>;
}
