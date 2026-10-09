import type { NextConfig } from "next";

const staticExport = process.env.YIFANG_STATIC_EXPORT === "1";
const isolatedPreview = process.env.YIFANG_ISOLATED_PREVIEW === "1";

const nextConfig: NextConfig = {
  trailingSlash: true,
  ...(staticExport ? { output: "export", distDir: ".next-static", images: { unoptimized: true } } : isolatedPreview ? { distDir: ".next-preview" } : {}),
  // Fairy-Stockfish 的 wasm 用多线程（SharedArrayBuffer），需要页面处于 cross-origin isolated 状态。
  // 全站统一加头：客户端路由切换不会重新协商文档策略，只对 /play 加头会在软导航后失效。
  ...(!staticExport ? { async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
        ],
      },
    ];
  } } : {}),
};

export default nextConfig;
