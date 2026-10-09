"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "@/lib/i18n";

/** 切换语言但停留在当前页面：只替换路径里的 locale 段 */
export default function LangSwitch({ locale, label, className }: { locale: Locale; label: string; className?: string }) {
  const pathname = usePathname() ?? `/${locale}`;
  const other = locale === "zh" ? "en" : "zh";
  const segments = pathname.split("/");
  segments[1] = other;
  return (
    <Link href={segments.join("/") || `/${other}`} hrefLang={other} lang={other} className={className}>
      {label}
    </Link>
  );
}
