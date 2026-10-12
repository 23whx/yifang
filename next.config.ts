import type { NextConfig } from "next";

const staticExport = process.env.YIFANG_STATIC_EXPORT === "1";
const isolatedPreview = process.env.YIFANG_ISOLATED_PREVIEW === "1";

const nextConfig: NextConfig = {
  trailingSlash: true,
  ...(staticExport ? { output: "export", distDir: ".next-static", images: { unoptimized: true } } : isolatedPreview ? { distDir: ".next-preview" } : {}),
  // Fairy-Stockfish 的 wasm 用多线程（SharedArrayBuffer），需要页面处于 cross-origin isolated 状态。
  // 只给用引擎的三个实战页加头：全站加会让 AdSense 的跨域广告 iframe 被 COEP 拦截。
  // 客户端路由进出这三页时，components/CrossOriginGuard 会整页重载一次，让新的文档策略生效。
  ...(!staticExport ? { async headers() {
    return [
      {
        source: "/:locale(zh|en)/:game(chess|xiangqi|shogi)/play/:rest*",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
        ],
      },
      {
        // The engine's worker scripts run inside the isolated page and need the same policy.
        source: "/engine/:file*",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
        ],
      },
    ];
  } } : {}),
};

export default nextConfig;
