import type { MetadataRoute } from "next";

export const dynamic = "force-static";

/** Name, colours and icons for "Add to Home Screen" and for search engines that read the site icon. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "弈方 · Yifang",
    short_name: "弈方",
    description: "象棋、围棋、国际象棋、将棋、麻将、德州扑克与魔方的入门教程、练习与好友对战。",
    lang: "zh-CN",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#21170f",
    theme_color: "#21170f",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
