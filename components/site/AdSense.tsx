import { ADSENSE_CLIENT } from "@/content/ads";
import { SITE_INDEXABLE } from "@/lib/site";

/** AdSense loader for <head>. Only production builds (real site URL) load it, so previews and local tests stay ad-free. */
export default function AdSense() {
  if (!SITE_INDEXABLE) return null;
  return <script async src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`} crossOrigin="anonymous" />;
}
