import Link from "next/link";
import type { Dict, Locale } from "@/lib/i18n";
import LangSwitch from "./LangSwitch";
export default function SiteHeader({ locale, dict }: { locale: Locale; dict: Dict }) {
 return <header className="rpg-header"><Link className="rpg-brand" href={`/${locale}`}><span>弈</span><div>弈方 <small>YIFANG · THE ART OF PLAY</small></div></Link><nav aria-label={locale==="zh"?"主导航":"Main navigation"}><Link href={`/${locale}`}>{locale==="zh"?"世界地图":"World map"}</Link><Link href={`/${locale}/collection`}>{locale==="zh"?"游戏图鉴":"Collection"}</Link><Link href={`/${locale}/academy`}>{locale==="zh"?"规则学堂":"Academy"}</Link></nav><LangSwitch locale={locale} label={dict.langSwitch} className="rpg-language"/></header>;
}
