import Link from "next/link";
import { games } from "@/content/games";
import type { Dict, Locale } from "@/lib/i18n";
import {siteInfo} from '@/content/site-info';

export default function SiteFooter({ locale, dict }: { locale: Locale; dict: Dict }) {
  return (
    <footer className="rpg-footer border-t border-ink bg-ink text-paper">
      <div className="mx-auto grid max-w-[1400px] gap-10 px-5 py-14 sm:px-8 md:grid-cols-[2fr_1fr_1fr]">
        <div>
          <p className="display-cjk text-[36px] leading-none">弈方 · Yifang</p>
          <p className="mt-4 max-w-md text-sm leading-6 text-paper/70">{dict.footerLine}</p>
          <p className="mt-4 max-w-md text-xs leading-6 text-paper/70">Fairy-Stockfish / ffish.js · <a className="underline" href="/engine/Copying.txt">GPL-3.0</a> · <a className="underline" href="/engine/AUTHORS.txt">AUTHORS</a></p>
          <p className="mt-2 max-w-md text-xs leading-6 text-paper/70">{locale==='zh'?'固定版本源码候选，仍待对应核验：':'Pinned source candidates; correspondence unverified:'} <a className="underline" href="https://github.com/fairy-stockfish/Fairy-Stockfish/commit/43b66c8abfebfcab893a3a4c349aa790d18df148">ffish 0.7.10</a> · <a className="underline" href="https://github.com/fairy-stockfish/fairy-stockfish.wasm/tree/1.1.12">WASM 1.1.12</a></p>
          <p className="mt-2 max-w-md text-xs leading-6 text-paper/70">React Three Fiber · <a className="underline" href="/licenses/react-three-fiber.txt">MIT notice</a> · majiang-core · <a className="underline" href="/licenses/majiang-core.txt">MIT notice</a></p>
          <p className="mt-2 max-w-md text-xs leading-6 text-paper/70"><a className="underline" href="/licenses/direct-mit-notices.txt">{locale==='zh'?'已核实的 MIT 依赖通知':'Verified MIT dependency notices'}</a></p>
          <p className="mt-2 max-w-md text-xs leading-6 text-paper/70"><a className="underline" href="/licenses/font-ofl-notices.txt">{locale==='zh'?'网站字体的 OFL 许可与署名':'Self-hosted font OFL licenses and credits'}</a></p>
        </div>
        <div>
          <p className="text-xs font-bold tracking-[0.18em] text-paper/50 uppercase">{dict.nav.games}</p>
          <ul className="mt-4 space-y-2 text-sm">
            {games.map((g) => (
              <li key={g.slug}>
                <Link href={`/${locale}/${g.slug}`} className="hover:text-ochre">
                  {g.name[locale]}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-bold tracking-[0.18em] text-paper/50 uppercase">{dict.siteNameLatin}</p>
          <ul className="mt-4 space-y-2 text-sm">
            {(['about','contact','privacy'] as const).map(page=><li key={page}><Link href={`/${locale}/${page}`} className="inline-flex min-h-11 items-center hover:text-ochre">{siteInfo[locale][page].title}</Link></li>)}
            <li>
              <Link href={`/${locale}/academy/`} className="hover:text-ochre">{locale === 'zh' ? '全部教程' : 'All tutorials'}</Link>
            </li>
            <li>
              <Link href={`/${locale}/collection/`} className="hover:text-ochre">{locale === 'zh' ? '八个游戏与练习' : 'All games & practice'}</Link>
            </li>
          </ul>
          <p className="mt-10 text-xs text-paper/40">© {new Date().getFullYear()} Yifang</p>
        </div>
      </div>
    </footer>
  );
}
