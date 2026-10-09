# Current design direction · 2026-09-09

## Reference fidelity correction · 2026-09-11

The supplied reference is a full candlelit desktop composition, not just a color palette. Use generated realistic candles, leather books, brass compass, fountain pen and wax seal in the fixed desk-scene-v2.webp background. The sidebar must be an actual illustrated rolled parchment with brass finials and a heraldic banner (menu-scroll-v2.webp); the title uses title-parchment-v2.webp. No flat rectangle substitutes. Paper map edges are irregular, not a rigid picture frame. Desktop composition keeps lower corners visible for the compass and pen. Mobile reflows navigation into a horizontal parchment strip.

Map zoom uses a 380ms eased transform transition; pointer pan and pinch remain direct. Starting a gesture freezes any in-flight transition at its visible matrix to avoid a jump. Reduced-motion disables the transition. Decorative desktop pixels never move with the map and cannot intercept input.

The user explicitly replaced the original editorial direction with a realistic adventure RPG atlas.
This section supersedes the legacy design specification retained below for reference.

- North star: a candlelit strategist’s desk, antique northern-hemisphere parchment atlas, realistic isolated architectural dioramas. Existing Yifang identity and bilingual routes remain.
- Colors: walnut #21170f, parchment #f3e7cd, aged paper #e9d7b6, bronze #ae8550, burgundy #803d2b, ink #392616. Dark brown navigation; parchment reading surfaces. Avoid modern neon/glass UI.
- Typography: retain Noto Serif SC headings and existing readable body fonts; atlas English micro-labels use Georgia. Headings 30–52px; body 14–17px with 1.8–1.9 line-height. No giant compressed headline on map.
- Spacing: 4/8/12/16/24/32/48px scale; minimum 44px main touch targets. Reading width <=68ch. Illustrations support, not replace, text.
- Components: bronze framed controls, burgundy active navigation, parchment destination dialog, eight-building collection, sequential academy index. Text and actions remain real DOM, not baked into images.
- Map: 1–3× zoom limits, pointer panning/pinch, wheel anchored zoom, keyboard +/− and arrows. Initial view and Home/reset align to the right (Asia); desktop starts at 1.2×, narrow viewports at 1×. All eight destinations remain independent; never cluster or hide Go/Mahjong. Map buildings occupy 9% of map width. Artwork pins denote regions; buildings may be offset with leaders. The map texture has no compass; only the desk retains its physical compass.
- Responsive: desktop journal sidebar; under 1000px use top navigation; under 600px use a cropped draggable atlas, destination shortcuts and vertically stacked introduction dialog. Page content must not overflow horizontally.
- Accessibility: native modal focus trap and Escape close; labelled map controls and inputs; reduce decorative motion with prefers-reduced-motion. Map is supplementary to server-rendered collection and academy navigation.
- References: user-provided RPG image is the primary art direction. https://www.inspora.design/ Illustration / 3D categories; https://github.com/MengTo/threeui for layered interaction thinking (no added WebGL requirement); https://github.com/VoltAgent/awesome-design-md/blob/main/design-md/notion/DESIGN.md for readable hierarchy and spacing only, not its brand palette.
- Assets: public/atlas/northern-atlas.webp and buildings.webp; generated using built-in image generation. Prompts and source attribution in docs/implementation-notes.md.

## Legacy specification (superseded)

---
name: 弈方 · Yifang
description: 街头残局招牌 × 棋谱刊物 — 纸白、墨黑硬边、朱红实心色块、巨型招牌字
colors:
  paper: "#ffffff"
  paper-2: "#f3f2ee"
  ink: "#16130f"
  ink-2: "#3d3832"
  ink-3: "#6f6961"
  rule: "rgb(22 19 15 / 0.14)"
  vermilion: "#d8321a"
  vermilion-deep: "#a82412"
  ochre: "#f0b400"
typography:
  display:
    fontFamily: "Big Shoulders, Noto Serif SC, serif"
    fontSize: "clamp(56px, 8vw, 128px)"
    fontWeight: 800
    lineHeight: 0.92
    letterSpacing: "-0.02em"
  display-cjk:
    fontFamily: "Noto Serif SC, serif"
    fontSize: "clamp(40px, 5.6vw, 88px)"
    fontWeight: 900
    lineHeight: 1.02
    letterSpacing: "0.02em"
  headline:
    fontFamily: "Noto Serif SC, serif"
    fontSize: "clamp(36px, 5vw, 72px)"
    fontWeight: 900
    lineHeight: 1.02
    letterSpacing: "0.02em"
  title:
    fontFamily: "Literata, Noto Sans SC, system-ui, sans-serif"
    fontSize: "28px"
    fontWeight: 700
    lineHeight: 1.25
  body:
    fontFamily: "Literata, Noto Sans SC, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.85
  label:
    fontFamily: "Literata, Noto Sans SC, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 700
    letterSpacing: "0.18em"
  notation:
    fontFamily: "Big Shoulders, monospace"
    fontWeight: 700
    letterSpacing: "0.06em"
rounded:
  none: "0px"
spacing:
  gutter: "20px"
  gutter-sm: "32px"
  gutter-lg: "48px"
  section: "64px"
  section-lg: "96px"
  grid: "48px"
  grid-fine: "24px"
components:
  button-sign:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0.9rem 1.5rem"
  button-sign-hover:
    backgroundColor: "{colors.vermilion}"
    textColor: "{colors.paper}"
  button-sign-outline:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "0.9rem 1.5rem"
  button-sign-outline-hover:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
  button-sign-paper:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "0.9rem 1.5rem"
  button-sign-paper-hover:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
  tag-ochre:
    backgroundColor: "{colors.ochre}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "4px 8px"
  panel-ruled:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "16px"
  nav-item:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink-2}"
    padding: "0 20px"
  nav-item-hover:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
---

# Design System: 弈方 · Yifang

## Overview

**Creative North Star: "街头残局招牌"（Streetside Endgame Poster）**

弈方的视觉世界来自两样印刷品的叠合：街边棋摊挂出的残局招牌（巨字、平涂朱红、墨黑硬边）与一本排版克制的棋谱刊物（纸白、格线、长文阅读）。整个界面只有一种材质——纸——和印在纸上的三种东西：墨、朱、赭。没有玻璃、没有渐变、没有投影、没有圆角。区块之间靠 2px 墨线分隔，而不是靠卡片和间距；整块区域可以被朱红完全占据，而不是给一个小图标点颜色。

密度是"刊物级"的：标题巨大（首页中文标题最大 88px，项目页最大 150px），正文宽度锁在 68ch，行高 1.85。信息以横排条目（`<ol>` + 细格线）而不是卡片网格组织。五种棋具（魔方、国际象棋、中国象棋、将棋、围棋）共用一套 SVG 示意图语法：单色线条 + 实心块，viewBox 统一 100×100。

明确拒绝：深色"俱乐部工具"式 UI；奶油纸 + 意大利体衬线的"书卷气"默认；圆角卡片 + 柔和阴影的通用 SaaS 外观。

**Key Characteristics:**
- 纸白底（纯 `#ffffff`，非奶油色），墨黑 2px 硬边作为唯一的区块分隔手段
- 朱红以整块区域出现（首屏左栏、项目页"实战"段），不做点缀
- 赭黄只做标记：可玩标签、当前步骤序号底色、深色底上的链接 hover
- 中文招牌字 Noto Serif SC 900，拉丁招牌字 Big Shoulders 800–900，正文 Literata / Noto Sans SC
- 印刷格线（48px / 24px）作为棋具承载区的底纹
- 零圆角、零阴影、零渐变；唯一动效是首屏的一次 `rise` 入场

## Colors

三色印刷：纸白承载、墨黑书写、朱红占块，赭黄只做记号。

### Primary
- **朱红 vermilion** (`{colors.vermilion}`)：招牌的主色。以整块区域出现——首页首屏左栏背景、项目页"实战"段全幅背景、示意图中的"己方"棋子/色块；也是所有 hover 的目标色（按钮 hover、链接 hover、导航语言切换 hover）与文本选区背景。
- **深朱红 vermilion-deep** (`{colors.vermilion-deep}`)：在 `@theme` 中定义、为朱红的按压/深色变体预留；当前页面尚未使用，新表面如需朱红的 active 态请用它，不要另造色值。

### Tertiary
- **赭黄 ochre** (`{colors.ochre}`)：记号色，永远配墨黑文字。用于"可玩"标签（`bg-ochre px-2 py-1 text-xs font-bold text-ink`）、教程当前步骤的巨型序号底色、吸顶魔方板上的当前步号、墨黑页脚里链接的 hover 色、朱红底上示意图的替代强调色（`accent="#f0b400"`）。

### Neutral
- **纸白 paper** (`{colors.paper}`)：页面底色、招牌按钮文字、朱红/墨黑区域上的文字。就是纯白，不发黄。
- **次纸 paper-2** (`{colors.paper-2}`)：极轻的灰白，只用于导航中语言切换项的静止背景与纸白按钮的 hover 底色（`hover:bg-paper-2`）。
- **墨 ink** (`{colors.ink}`)：正文主色、所有 2px 硬边、招牌按钮底色、页脚背景、示意图线条。
- **墨二 ink-2** (`{colors.ink-2}`)：长文正文色（`.prose-yf`）、导航项静止文字、条目描述。
- **墨三 ink-3** (`{colors.ink-3}`)：元信息（步数、分钟、难度）、`dt` 标签、返回链接、提示文字。
- **格线 rule** (`{colors.rule}`)：14% 透明墨。用于印刷格线底纹、条目之间的 1px 分隔线、导航项之间的竖线、三栏说明的栏间线。

### Named Rules
**整块占据规则（The Whole-Field Rule）。** 朱红要么占据一整块区域（一栏、一段、一个按钮），要么不出现。不给图标上色、不给边框上色、不做 10% 透明度的朱红底。
**赭黄只做记号规则（The Marker-Only Rule）。** 赭黄只能出现在小面积的记号位置：标签、序号底、hover 色。不做背景、不做按钮主色、不做大字色。
**深底反白规则（The Reverse-Print Rule）。** 在朱红或墨黑底上，文字与线条统一切到纸白（`text-paper` / `border-paper`）；示意图通过 `currentColor` 自动跟随。不在深底上用 ink-2 / ink-3 灰阶。

## Typography

**Display Font（拉丁）:** Big Shoulders（700 / 800 / 900，`--font-display-latin`）
**Display Font（中文）:** Noto Serif SC（仅 900，`--font-display-cjk`）
**Body Font:** Literata（400 / 500 / 600，`--font-body-latin`）+ Noto Sans SC（400 / 500 / 700，`--font-body-cjk`）
**Notation Font:** Big Shoulders 700 用作记谱字（`.notation`），无独立等宽字体

四款字体由本地 Fontsource Variable 5.3.0 包供应，变量在 `app/globals.css` 定义；保留原有字体角色、字重和视觉规范，不依赖构建时访问 Google Fonts。OFL 通知见 `/licenses/font-ofl-notices.txt`。

**Character:** 中文招牌字用超黑宋体，拉丁招牌字用压缩无衬线；两者在同一标题里并排出现时（项目页 `国际象棋 CHESS`），拉丁字缩到中文的 0.36em 并着朱红。正文是可读的衬线 + 黑体组合，不用意大利体。

### Hierarchy
- **Display（拉丁）** (`.display`：800，`clamp(56px,8vw,128px)`，行高 0.92，字距 -0.02em，`text-wrap: balance`)：英文首页标题；教程步骤的巨型序号（64px）；站名。
- **Display（中文）** (`.display-cjk`：900，首页 `clamp(40px,5.6vw,88px)`、项目页 `clamp(52px,9vw,150px)`、教程页 `clamp(36px,5.5vw,84px)`，行高 1.02，字距 0.02em)：所有中文页面 h1。也用于小尺寸招牌字：项目格中的单字 glyph（40px）、目录中的项目名（32px）、"实时魔方"这类板块小标（28px）、页脚巨字（64→96px）、站标方块中的"弈"（22px）。
- **Headline** (`.display-cjk`，`clamp(36px,5vw,72px)` 或 `clamp(32px,4vw,56px)`)：页面内二级板块标题（"它是怎么工作的"、"认识它"、"教程"、"实战"）。
- **Title** (700，28px→34px，行高 tight)：教程步骤标题；条目标题为 24px（`text-2xl font-bold`）；三栏说明标题 20px。
- **Body** (`.prose-yf`：1.0625rem，行高 1.85，色 ink-2，`max-width: 68ch`，段间距 1.1em)：所有长文。短说明用 15px / 行高 28px 或 17px / 行高 32px。
- **Label** (700，12px，字距 0.18em，大写)：栏目标签——页脚栏头、目录"CONTENTS"、"算法/ALGORITHM"标签、站名的拉丁副标（11px）。始终着 ink-3 或半透明纸白。
- **Meta** (14px，ink-3)：难度 · 步数 · 分钟、返回链接、`dt` 标签为 12px。
- **Notation** (`.notation`：Big Shoulders 700，字距 0.06em，`tabular-nums`)：魔方公式（28→34px）、两位数步号（`01`…`08`）。

### Named Rules
**双字规则（The Two-Face Rule）。** 中文标题只用 Noto Serif SC 900；拉丁标题只用 Big Shoulders。不在中文标题里混入 Big Shoulders 之外的拉丁字，不给中文用 Literata 做大字。
**无意大利体规则（The No-Italic Rule）。** 整个系统不使用斜体/意大利体，包括引言与强调。强调用字重（`font-bold`）或朱红色。
**两位步号规则（The Two-Digit Rule）。** 步骤序号统一 `padStart(2,"0")`，用 `.notation` 排版。

## Layout

**容器：** 内容区最大宽 1400px，居中（`mx-auto max-w-[1400px]`）；水平内边距 20px → sm 32px → lg 48px（`px-5 sm:px-8 lg:px-12`）。全幅的朱红/格线区块不受 1400px 限制，直接贴到视口边缘，再由 2px 墨线在底部收口。

**区块分隔：** 页面由若干 `<section>` 纵向堆叠，每段以 `border-b-2 border-ink` 或 `border-t-2 border-ink` 分隔。段内纵向留白 64px（`py-16`），lg 起 96px（`lg:py-24`）；首屏与刊头用 40→56px。

**首屏网格：** 首页 `lg:grid-cols-[11fr_9fr]`（左朱红 55%，右纸白格线）；项目页刊头 `lg:grid-cols-[3fr_2fr]`（左巨字，右格线示意图，`lg:border-l-2`）。移动端两栏纵向堆叠。

**五格项目条：** `grid-cols-2 sm:grid-cols-5`，每格 `sm:aspect-[4/5]`，格间 2px 墨线（右边线 + 底线，最后一格去右线）。移动端两列，第五格跨两列。

**条目列表：** 列表顶部 2px 墨线，每行底部 1px 格线（`border-b border-rule`），行内 `py-7`/`py-8`；行内用 `md:grid-cols-[120px_1fr_1fr_auto]`（示意图 / 名称与一句话 / 三项事实 / 操作按钮）。

**三栏说明：** `md:grid-cols-3`，栏间用 1px 格线（`md:border-l border-rule`），不是卡片；每栏顶端一条 64×8px 朱红短横（`h-2 w-16 bg-vermilion`）作为视觉锚点。

**教程页双栏：** `lg:grid-cols-[minmax(0,1fr)_minmax(400px,480px)]`，左长文、右吸顶棋具板（`sticky top-0 lg:top-6`）。移动端棋具板置顶（`order-first`）并吸顶（`z-30`），高度 240px；sm 起 400px。

**格线底纹：** `.ruled` 48px 网格、`.ruled-fine` 24px 网格，颜色为 `rule`。凡放置 3D 魔方或示意图的区域都用格线底，示意图本身放在格线上、不加卡片。

**响应式断点：** 使用 Tailwind 默认 sm 640 / md 768 / lg 1024。导航在 md 以下改为顶栏下方可横向滚动的一行。

### Named Rules
**墨线分隔规则（The Ink-Rule Rule）。** 区块之间用 2px 墨线，条目之间用 1px 格线。不用留白、不用背景色差、不用卡片去区分区块。
**贴边规则（The Bleed Rule）。** 首屏与刊头这类整块色区一律通到视口边缘；只有文字内容受 1400px 容器约束。

## Elevation & Depth

系统是完全平面的。没有任何 `box-shadow` 出现在页面上；深度只靠三件事表达：2px 墨线勾出的边框（`border-2 border-ink`）、区域间的实色对比（纸白 / 朱红 / 墨黑）、以及格线底纹暗示的"纸面"。吸顶魔方板在滚动时依靠自身的 2px 墨边和纸白底与下方内容分离，不加阴影。

`@theme` 中定义了 `--shadow-print`（`0 14px 40px -18px rgb(22 19 15 / 0.35)`），当前无任何使用处；视为预留，不作为系统规则。

### Named Rules
**无阴影规则（The No-Shadow Rule）。** 任何表面在任何状态下都不加阴影。需要强调"浮起"的元素（吸顶板、弹层）用 2px 墨边 + 纸白底。

## Shapes

零圆角。所有元素——按钮、标签、面板、站标方块、示意图色块——都是直角矩形（`border-radius: 0`）。边框只有两种粗细：2px 墨黑（区块边、面板边、按钮边、列表顶线）与 1px 格线色（条目分隔、栏间线、导航竖线）。示意图中的棋子是圆形（国际象棋/中国象棋/围棋）或五边形（将棋），是内容形状而非 UI 形状。

站标是一个 40×40 的朱红方块，中央反白"弈"字（`display-cjk` 22px）。

### Named Rules
**直角规则（The Square-Corner Rule）。** 不使用任何 `rounded-*`。圆只出现在棋子里。
**两种线宽规则（The Two-Weight Rule）。** UI 线条只有 2px 墨黑与 1px 格线两种；不出现 3px、不出现虚线、不出现彩色边框（朱红底上的边框切为纸白，仍是 2px）。

## Components

### 招牌按钮 Buttons（`.btn-sign`）
像招牌上刷出来的实心色块，按下会真的"陷"下去。
- **Shape：** 直角，2px 边框与底色同色；`inline-flex`，图标与文字间距 0.5rem；内边距 0.9rem × 1.5rem；字 0.95rem / 700 / 字距 0.01em。
- **Primary（默认）：** 墨黑底、纸白字。Hover 切朱红底与朱红边（0.2s）。Active `translateY(2px)`（0.28s expo）。Disabled 40% 不透明并禁用指针。
- **Outline（`.btn-sign-outline`）：** 透明底、墨黑字、墨黑 2px 边；hover 反转为墨黑底纸白字。在深底上（`onDark`）改为纸白字纸白边，hover 反转为纸白底墨黑字。
- **Paper（`.btn-sign-paper`）：** 纸白底、墨黑字、纸白边；用于朱红或墨黑底上；hover 反转为墨黑底纸白字。
- **成对使用：** 主行动 + 次行动并排，间距 12px（`gap-3`），主行动带 `→` 尾符。
- **内嵌操作条（非 `.btn-sign`）：** 面板底部的双按钮用 `grid-cols-2` 铺满整宽，左键纸白底 `hover:bg-paper-2`，右键墨黑底 `hover:bg-vermilion`，之间 1px 格线；文字 14px / 700。

### 赭黄标签 Tag
- **Style：** 赭黄底、墨黑字、12px / 700，内边距 4×8px，直角。仅表示"可玩"这类二元状态或当前步号。不做筛选 chip，不做多色变体。

### 格线面板 Ruled Panel
承载棋具与示意图的"纸面"。
- **Corner Style：** 直角。
- **Background：** 纸白 + `.ruled`（48px）或 `.ruled-fine`（24px）格线。
- **Border：** 2px 墨黑（`border-2 border-ink`）；作为全幅区块出现时只保留区块的下/左墨线。
- **Internal Padding：** 16px（`p-4`），sm 起 32px；放示意图时 40px（`p-10`）。
- **变体：** 吸顶魔方板 = 2px 墨边面板 + 顶栏（步号赭黄标记 + 步名，`border-b-2`）+ 24px 细格线区（240→400px 高）+ 双按钮操作条 + 提示行 + 前后步导航（`border-t-2`）。

### 五格棋具示意图 GameDiagram（signature）
五种棋具共用一套印刷语法，`viewBox 0 0 100 100`，`fill="none"`。
- **线条：** `stroke={ink}`，默认 `currentColor`，随容器文字色切换（纸白底为墨黑，朱红/墨黑底为纸白）。线宽按棋盘密度递减：国际象棋边框 1.6、魔方 1.4、中国象棋/将棋 1.1、围棋 0.7。
- **实心块：** 己方棋子/高亮块用 `accent`（默认朱红 `#d8321a`；在朱红底上传 `#f0b400` 赭黄），对方棋子用 `ink`。国际象棋的深格是实心墨块。
- **尺寸：** 项目格内 `max-w-[180px]`，目录行 96px，项目页刊头 `max-w-[380px]`，实战页 `max-w-[360px]`。始终放在格线底或深色底上，不加卡片、不加边框。
- **新增棋具或棋盘 UI（真实可下的棋盘）应沿用同一语法：** 单色线 + 实心圆/多边形棋子，两方以朱红 / 墨黑区分，不做拟真木纹与棋子贴图。

### 条目行 List Row
- **Style：** `<ol>` 顶部 2px 墨线，每行 `border-b border-rule`，`py-7`~`py-8`。行内网格：示意图 / 标题（`display-cjk` 32px 或 24px 700）+ 一句话（14~15px，ink-3/ink-2）/ 三项事实（`dl`，`dt` 12px ink-3、`dd` 700）/ 按钮组。
- **Hover：** 标题切朱红（`hover:text-vermilion` 或 `group-hover:text-vermilion`），无背景变化。

### 导航 Navigation
- **顶栏：** 纸白底，底部 2px 墨线；站标（朱红方块 + `display` 22px 站名 + 11px 大写拉丁副标）。桌面导航项 14px / 600 / ink-2，项间 1px 格线竖线，`px-5`，hover 整项反转为墨黑底纸白字；语言切换项静止底 paper-2，hover 朱红底。
- **移动端：** 顶栏只留站标与语言切换；项目导航另起一行，横向滚动，项间 1px 格线，`px-4 py-2.5`。
- **页脚：** 墨黑底纸白字，顶部 2px 墨线；左栏 `display-cjk` 巨字"弈方"（64→96px），右两栏 12px 大写标签 + 14px 链接列表，链接 hover 切赭黄；辅助文字用 `text-paper/70` `/50` `/40` 三档透明纸白。

### 目录 Contents（教程页）
- 顶部 2px 墨线 + 12px 大写标签；两列 `<ol>`，每项 `border-b border-rule py-2`，14px，前置两位 `.notation` 步号；当前项 700 + 朱红，其余 ink-2；hover 朱红。

### 公式块 Algorithm Block
- 2px 墨边，`sm:grid-cols-[1fr_auto]`：左侧 12px 大写标签 + `.notation` 28→34px 公式 + 14px 注释；右侧墨黑实心播放按钮（`bg-ink px-8 py-4 text-sm font-bold`，hover 朱红），带 12×12 三角形 `PlayIcon`（`fill="currentColor"`，唯一的图标）。

### 动效 Motion
- **入场：** 仅首页首屏使用 `.rise`（0→1 透明度，`translateY(18px)`→0，0.9s，`--ease-out-expo` = `cubic-bezier(0.16,1,0.3,1)`，`animation-fill-mode: both`），交错延迟 `.rise-2` 0.12s、`.rise-3` 0.24s。`prefers-reduced-motion` 下关闭。
- **状态过渡：** 颜色 0.2s 线性；按钮位移 0.28s expo。Tailwind `transition` 默认用于导航与列表的颜色切换。
- **不做：** 滚动触发动画、悬浮放大、骨架屏闪烁、页面转场。3D 魔方的转动是内容动效，不属于 UI 动效系统。

### 状态 States
- **Hover：** 反转（纸白↔墨黑）或切朱红。两种之一，不做变亮/变暗。
- **Active：** 按钮 `translateY(2px)`。
- **Disabled：** `opacity-40`（面板操作条）或 `opacity-30`（前后步导航），`pointer-events: none`（招牌按钮）。
- **Selected / Current：** 赭黄底墨字（步号）或朱红 700 文字（目录项）。
- **Selection：** 文本选区朱红底纸白字。
- **Focus：** 当前依赖浏览器默认 focus ring，系统未定义自定义样式。

## Do's and Don'ts

### Do:
- **Do** 用 2px 墨线（`border-ink`）分隔区块，用 1px 格线（`border-rule`）分隔条目。
- **Do** 让朱红整块出现：一栏、一段、一个按钮。朱红底上的文字与边框全部切纸白。
- **Do** 中文大字只用 `.display-cjk`（Noto Serif SC 900），拉丁大字只用 `.display`（Big Shoulders）；标题尺寸用 `clamp()`，最小 32px、最大 150px。
- **Do** 长文套 `.prose-yf`（68ch / 1.85 行高 / ink-2）。
- **Do** 棋具与示意图放在 `.ruled` / `.ruled-fine` 格线纸面上，不加卡片。
- **Do** 新棋盘（国际象棋 / 中国象棋 / 将棋 / 围棋）沿用 GameDiagram 语法：单色线 + 朱红 / 墨黑实心棋子，`currentColor` 跟随容器。
- **Do** 序号用两位 `.notation`（`01`），当前步用赭黄底墨字标记。
- **Do** 新表面（谜题、术语、名局）复用条目行结构：`<ol>` 顶 2px 墨线 + 行间 1px 格线，标题 hover 切朱红。

### Don't:
- **Don't** 使用任何圆角、阴影、渐变、毛玻璃或半透明白色底。
- **Don't** 用奶油/米色做底色（底色是纯 `#ffffff`），不用意大利体。
- **Don't** 做深色主题或深色工具面板；墨黑只作页脚底与按钮底。
- **Don't** 用赭黄做背景、大字或按钮主色；它只是记号。
- **Don't** 用图标库（Lucide / Heroicons）；系统只有一个内联 `PlayIcon`，其余用文字与 `→` `←` `·`。
- **Don't** 给示意图或棋盘加木纹、贴图、拟真阴影。
- **Don't** 用卡片网格排列内容条目；用横排条目行。
- **Don't** 增加新的入场动画或滚动触发动效；`rise` 只属于首页首屏。
