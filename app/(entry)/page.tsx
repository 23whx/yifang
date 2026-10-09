"use client";

/* eslint-disable @next/next/no-html-link-for-pages -- Language destinations use separate root layouts; use full document navigation, including without JS. */

import { useEffect } from "react";

export default function LanguageEntry() {
  useEffect(() => {
    const language = navigator.languages?.[0] || navigator.language || "zh";
    const locale = language.toLowerCase().startsWith("zh") ? "zh" : "en";
    window.location.replace(`/${locale}/${window.location.search}${window.location.hash}`);
  }, []);

  // Real links remain usable without JavaScript. No request-time redirect/server is needed.
  return <main>
    <h1>弈方 · Yifang</h1>
    <p>正在选择语言。您也可以直接进入： / Choose your language:</p>
    <nav aria-label="语言 / Language"><a href="/zh/" lang="zh-CN">简体中文</a>{" · "}<a href="/en/" lang="en">English</a></nav>
  </main>;
}
