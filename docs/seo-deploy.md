# 上线与搜索引擎收录清单（yifang.oumashu.top）

网站的 SEO 设置（canonical、hreflang、sitemap、robots、结构化数据）都由构建时的环境变量决定。**不设置就整站 `noindex`**，这是为了避免预览站被收录。

## 1. Vercel 设置（必须）

1. Project → Settings → **Environment Variables**，只对 **Production** 添加：
   - `NEXT_PUBLIC_SITE_URL` = `https://yifang.oumashu.top`（不要带路径或结尾斜杠以外的内容）
2. Project → Settings → **Domains**：添加 `yifang.oumashu.top`，并在 DNS 服务商为 `yifang` 添加 CNAME 记录指向 Vercel 给出的地址（通常是 `cname.vercel-dns.com`）。
3. 在 Domains 里把 `*.vercel.app` 域名设为 **重定向到 `yifang.oumashu.top`**，避免两个网址同时被收录。
4. 重新部署（Redeploy）。部署后检查：
   - `https://yifang.oumashu.top/zh/` 源码里应有 `<meta name="robots" content="index, follow` 和 `<link rel="canonical" href="https://yifang.oumashu.top/zh/"`。
   - `https://yifang.oumashu.top/robots.txt` 末尾应有 `Sitemap: https://yifang.oumashu.top/sitemap.xml`。
   - `https://yifang.oumashu.top/sitemap.xml` 应列出 149 个网址。

## 2. 搜索引擎站长平台（建议）

| 平台 | 适用 | 验证方式 |
|---|---|---|
| Google Search Console | 全球、英文 | HTML 标记 → 把 content 值填入 Vercel 环境变量 `GOOGLE_SITE_VERIFICATION` |
| 百度搜索资源平台 | 中国大陆 | HTML 标签 → 填入 `BAIDU_SITE_VERIFICATION` |
| Bing Webmaster Tools | Bing、部分 AI 搜索 | HTML 标记 → 填入 `BING_SITE_VERIFICATION`（也可直接从 Google Search Console 导入） |

填好环境变量后重新部署，再回平台点“验证”。验证通过后，在每个平台**提交 sitemap**：`https://yifang.oumashu.top/sitemap.xml`。

## 3. 已做好的技术 SEO（代码中）

- 每页唯一的标题与描述，长度控制在搜索结果可完整显示的范围（`scripts/verify-seo.cjs` 会自动检查）。
- 中英双语 hreflang（`zh-CN` / `en` / `x-default`），sitemap 内同样带有语言对应关系。
- 每页自指 canonical；带 `?room=` 的对战邀请链接也指回不带参数的页面。
- 结构化数据：WebSite、Organization（含联系邮箱）、BreadcrumbList、CollectionPage、LearningResource、DefinedTermSet 等。
- 网站图标：`app/icon.svg` 是源文件（方形棋盘转成菱形，中央一枚棋子）；`favicon.ico`、`apple-icon.png`、`public/icons/*.png` 由 `CHROME_PATH=<chrome.exe 路径> node scripts/generate-icons.cjs` 生成，另有 `manifest.webmanifest`。Organization 结构化数据带 `logo`。
- 分享卡片（Open Graph 与 Twitter 大图，1200×630）：全站一张、每个游戏一张，中英各一套，共 18 张（`public/social/*.jpg`）。游戏下的所有页面（教程、实战、好友对战等）用该游戏的图。改文字在 `content/social.ts`，重新生成：`CHROME_PATH=<chrome.exe 路径> node scripts/generate-social-images.cjs`（需要 `playwright-core`）。
- 根网址 `/` 是有实际内容的双语入口页，并按浏览器语言自动跳转到 `/zh/` 或 `/en/`。
- `applicable-device: pc,mobile` 告诉百度同一页面同时适配手机与电脑。

## 4. 关键词布局（摘要）

| 页面类型 | 中文主要关键词 | 英文主要关键词 |
|---|---|---|
| 游戏首页 | 象棋入门、围棋入门、国际象棋规则、麻将规则、德州扑克规则、三阶魔方还原教程 | chess for beginners, how to solve a Rubik’s Cube … |
| 实战页 | 人机对弈、在线下棋、免费无需注册、魔方模拟器 | play chess vs computer, Rubik’s Cube simulator |
| 好友对战页 | 在线好友对战、发链接就能下、麻将好友房、免注册 | play chess with friends online, online mahjong with friends |
| 教程目录 / 单课 | 入门教程、零基础、第一课、图解 | lessons for beginners, first lesson |
| 术语 / 历史 / 练习 | 术语大全、历史与起源、练习题 | glossary, history, puzzles |
