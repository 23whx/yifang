"use client";

/* eslint-disable @next/next/no-html-link-for-pages -- Language destinations use separate root layouts; use full document navigation, including without JS. */

import { useEffect } from "react";
import { games } from "@/content/games";
import { searchTopics } from "@/content/seo";

export default function LanguageEntry() {
  useEffect(() => {
    const language = navigator.languages?.[0] || navigator.language || "zh";
    const locale = language.toLowerCase().startsWith("zh") ? "zh" : "en";
    window.location.replace(`/${locale}/${window.location.search}${window.location.hash}`);
  }, []);

  // Real links and a short bilingual overview stay usable without JavaScript (and for crawlers
  // that do not run it). No request-time redirect/server is needed.
  return <main style={{ maxWidth: 760, margin: "0 auto", padding: "32px 16px", lineHeight: 1.7, fontFamily: "system-ui, sans-serif" }}>
    <h1>弈方 · Yifang</h1>
    <p lang="zh-CN">免费学下棋：象棋、围棋、国际象棋、日本将棋、麻将、德州扑克、百家乐与三阶魔方的入门教程，配合人机对弈、练习题和好友在线对战，无需注册。</p>
    <p lang="en">Free beginner lessons for chess, xiangqi, shogi, Go, mahjong, Texas Hold’em, baccarat and the Rubik’s Cube, with play against the computer, puzzles and online games with friends. No sign-up.</p>
    <nav aria-label="语言 / Language"><a href="/zh/" lang="zh-CN">简体中文</a>{" · "}<a href="/en/" lang="en">English</a></nav>
    <h2>游戏与教程 / Games and lessons</h2>
    <ul>
      {games.map(game => <li key={game.slug}>
        <a href={`/zh/${game.slug}/`} lang="zh-CN">{searchTopics[game.slug].title.zh}</a>
        {" / "}
        <a href={`/en/${game.slug}/`} lang="en">{searchTopics[game.slug].title.en}</a>
      </li>)}
    </ul>
  </main>;
}
