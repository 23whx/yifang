# 弈方 SEO 实施与上线说明

本次使用 marketingskills 的 SEO audit、content strategy、schema，claude-seo 的 technical SEO，以及 web-quality-skills 的 SEO 指引。实现针对已有八个游戏与真实教学内容，不创建只有关键词的批量页面。

## 发布状态

候选域名为 `https://yifang.oumashu.top`，用户尚未确认正式域名。`.env.local` 以该地址预览，并设置 `YIFANG_NOINDEX=1`。预览 HTML 带 noindex，sitemap 不列出待索引页面，也不在 robots.txt 中提交 sitemap。此状态不应拿来推广搜索流量。

正式上线前确定最终域名，并在构建环境设置：

```dotenv
NEXT_PUBLIC_SITE_URL=https://yifang.oumashu.top
YIFANG_NOINDEX=0
# 可选：Search Console 给出的公开 HTML 验证 token，不是 API key。
# GOOGLE_SITE_VERIFICATION=...
```

如果域名改变，先替换配置再重新构建。不要只修改已经生成的 sitemap。`NEXT_PUBLIC_SITE_URL` 只接受 origin，不接受路径、查询或凭据。未配置、localhost、HTTP 或示例域名不能作为可索引生产站点。页面、sitemap、社交分享与 JSON-LD 共用同一来源和尾斜线 URL。

`YIFANG_NOINDEX` 是构建时开关；修改后必须重新 `npm run build:static`。不要误把预览产物上传到正式站点。

## 搜索意图与关键词分工

以下是基于产品与实际课程的编辑性关键词规划，不是付费关键词数据库结果。没有声称搜索量、难度、预期排名或竞争分数。优先让具体课程满足具体问题，游戏总览负责宽泛入门意图。

| 主题 | 中文主要意图 | 英文主要意图 | 内容入口 |
|---|---|---|---|
| 魔方 | 三阶魔方还原教程、层先法、转动公式 | how to solve a 3×3 Rubik’s Cube, beginner method, cube notation | `/zh/cube/`、`/en/cube/`，基础记号与层先法课程 |
| 国际象棋 | 国际象棋规则、棋子走法、将死与逼和 | chess rules for beginners, piece moves, checkmate vs stalemate | chess 总览、课程、术语与战术练习 |
| 中国象棋 | 中国象棋入门、蹩马腿、将帅照面 | how to play xiangqi, Chinese chess rules, blocked horse | xiangqi 总览与分阶段课程 |
| 日本将棋 | 将棋规则、升变、持驹、二步 | how to play shogi, promotion, drops, two-pawn rule | shogi 总览、走法与打入课程 |
| 围棋 | 围棋入门、气与提子、九路棋盘 | how to play Go, liberties, captures, 9×9 Go | go 总览、规则课与局部练习 |
| 麻将 | 麻将认牌、日式立直、国标、四川规则 | mahjong rules for beginners, Riichi, MCR, Sichuan | mahjong 第一课和各地区分支，不混用规则 |
| 德州扑克 | 德州扑克规则、牌型大小、最佳五张牌 | Texas Hold’em rules, hand rankings, best five cards | holdem 课程与教学练习，不吸引真钱下注意图 |
| 百家乐 | 点数计算、天然牌、第三张补牌规则 | baccarat scoring, natural hands, third-card rules | baccarat 规则教学与固定补牌示例，不承诺获利 |

目录 `/academy/` 负责全站课程导航，`/collection/` 负责比较游戏。每个总览、教程目录、实际课程、术语、历史、练习和好友直连页有独立标题、描述、canonical、OG 和语言替代链接。没有加入 Google 不用于排名的 meta keywords 标签。

标题和 H1 保持自然语言；避免重复堆砌“免费、最好、第一名”。既有课程标题、正文与实际步骤是长尾内容的主体。新增加的入门问答提供直接答案，并链接到学习与练习，不使用 FAQ 富结果承诺。

## 已落实的技术与内容改进

- `lib/site.ts` / `lib/seo.ts` 统一绝对地址、canonical、尾斜线、索引状态、社交描述与 HTML 语言。
- 每页中英文 hreflang 互相对应且自引用，深页的 x-default 指向同内容中文版本；首页 x-default 是语言入口。
- sitemap 从实际游戏、教程与栏目数据生成，包括六类好友页面和根语言入口。不使用每次构建时间伪造 lastmod，也不把固定题库说成每天新增。
- 根语言入口与首页提供 WebSite；目录和游戏总览有 CollectionPage / ItemList；阅读页有可见面包屑和 BreadcrumbList；课程用 LearningResource；词典用 DefinedTermSet。JSON-LD 转义 `<`，避免脚本标签注入。没有虚构作者资历、评分、用户数或评论。
- 首页地图之外新增可见、静态 HTML 学习导航与内容说明。八个游戏总览新增具体入门问答，课程增加相关课程、术语与练习入口。
- 历史与术语栏目标题包含游戏名称，摘要不再错用魔方通用文案；历史成绩明确是历史节点，不代表当前纪录。
- 分享图静态存放在 `public/social/`，普通静态托管可用，不依赖运行时图片接口。
- `/rtc-acceptance/` 测试入口带 noindex，不进入 sitemap。robots 不阻止正常页面、脚本、样式和字体的抓取。

## 验证与实际发布

```powershell
npm run build:static
npm run verify:seo
node scripts/verify-static-export.cjs
node scripts/verify-tutorial-navigation.cjs
```

SEO 验证读取真实 `.next-static` HTML，检查所有公共内容页的标题与描述唯一性、canonical、robots、双语目标、结构化数据与章节锚点、内链、分享图片和 sitemap 覆盖。同时独立验证正式站与预览模式的开关。构建通过不等于线上 HTTP 验证或 Google 已收录。

本次验证结果：149 个公共 HTML 路由、3,972 处内链及锚点、379 个 JSON-LD 对象通过 SEO 检查；152 个导出 HTML 文件与 2,457 处本地资源引用通过交付检查；44 个双语课程页、314 个章节目标与 512 处课程链接通过导航检查。正式模式的 sitemap XML 和 robots 使用当前安装的 Next 序列化器另行验证，未把正式索引开关应用到预览产物。

浏览器检查覆盖 1280×720 桌面中文首页，以及 390×844 手机宽度的中英文首页与学习导航。两种语言的手机首页没有横向溢出，新增内容显示为单列。桌面检查没有缺失图片或缺少 alt 的 img；地图装饰图仍由 CSS 承载。这些是本地渲染检查，不是线上性能或真实用户体验数据。

手机宽度的麻将词典也没有横向溢出；实际点击第一个延伸阅读链接后，到达第一课 `#step-beginner-draw`，对应“用 13 → 14 → 13 理解轮次”章节位于视口顶部附近。词典中原有六处失效锚点已对应到第一课的真实章节。

托管配置必须保留已有棋类 WASM 所需的 COOP/COEP 响应头；不能为了 SEO 去掉隔离策略。静态服务器应提供 HTTPS、目录 URL 的单次规范化重定向、真实 404、文本压缩与合理缓存。不要把所有未知 URL 回退到首页的 200 状态。

正式域名与托管就绪后，在 Google Search Console 添加对应资源、验证域名或 HTML token，提交 `/sitemap.xml`，抽查中文与英文首页、各游戏与课程的 URL 检查。查看 Google 选择的 canonical、抓取可用性、结构化数据与移动渲染，不用本地测试替代这些结果。

本次未发布站点、未操作 Search Console、未购买关键词研究、未获取真实用户 CrUX 数据，也未声称获得排名提升。性能需要针对线上页面测量：首页装饰图片和中英文字体是后续重点；未经测量不宣称 Core Web Vitals 达标。交互 WASM 与 3D 模块保持现有加载边界，不用空白内容换取分数。

## 后续迭代

先用 Search Console 找到有展现但点击率低的具体查询与页面，再调整对应标题或补充缺失解释。用真实课堂问题改进内容；核心规则变化通过协会原始资料核对。新增高质量原始示例、可引用的规则对照与术语解释，比批量复制相似页面更符合本站定位。外部引用由内容价值和正常分享获得，不能制造评价或购买垃圾链接。

## 依据

- [Google SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)：内容质量、可抓取链接、标题与无排名保证。
- [Google localized versions](https://developers.google.com/search/docs/specialty/international/localized-versions)：双语互相对应与自引用。
- [Google structured data policies](https://developers.google.com/search/docs/appearance/structured-data/sd-policies)：标记必须对应实际内容。
- 本地 Next.js 16.2.12 bundled docs：generateMetadata、sitemap、JSON-LD 与 static exports。实现以当前安装版本为准。
- 视觉保留 `DESIGN.md` 的 RPG 羊皮纸系统，仅采用已有 [Notion DESIGN.md](https://github.com/VoltAgent/awesome-design-md/blob/main/design-md/notion/DESIGN.md) 的可读层级与间距。
