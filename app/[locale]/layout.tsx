import type { Metadata } from "next";
import { notFound } from "next/navigation";
import "@fontsource-variable/big-shoulders/standard.css";
import "@fontsource-variable/literata/standard.css";
import "@fontsource-variable/noto-sans-sc/wght.css";
import "@fontsource-variable/noto-serif-sc/wght.css";
import SiteHeader from "@/components/ui/SiteHeader";
import SiteFooter from "@/components/ui/SiteFooter";
import { locales, isLocale, getDict } from "@/lib/i18n";
import { SITE_URL } from "@/lib/site";
import JsonLd from '@/components/seo/JsonLd';
import { pageMetadata, siteVerification, organizationSchema } from '@/lib/seo';
import { siteSearch } from '@/content/seo';
import "../globals.css";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const copy = siteSearch[locale];
  return {
    ...pageMetadata(locale, '', copy.title, copy.description),
    verification: siteVerification(),
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDict(locale);

  return (
    <html lang={locale === "zh" ? "zh-CN" : "en"}>
      <body className="flex min-h-screen flex-col">
        <JsonLd data={{ '@context': 'https://schema.org', '@type': 'WebSite', '@id': `${SITE_URL}/#website`,
          url: `${SITE_URL}/`, name: '弈方 · Yifang', alternateName: ['弈方', 'Yifang'],
          description: 'Learn and practice classic board games, the Rubik’s Cube and table-game rules.', inLanguage: ['zh-CN', 'en'], publisher: { '@id': `${SITE_URL}/#organization` },
        }} />
        <JsonLd data={organizationSchema()} />
        {/* Current direction: illustrated RPG atlas; see DESIGN.md. */}
        <SiteHeader locale={locale} dict={dict} />
        <main className="flex-1">{children}</main>
        <SiteFooter locale={locale} dict={dict} />
      </body>
    </html>
  );
}
