# 桌面场景与缩放修订 · 2026-09-11

## 修改

- 首页使用完整写实木桌背景：旧书、蜡烛、铜罗盘、钢笔、皮革笔记本、蜡封和棋子摆件；不随地图移动。
- 左侧菜单使用透明羊皮卷轴插画，包括真实卷边、铜轴、旗帜；手机端重排为横向羊皮纸导航。
- 标题和地标铭牌采用独立羊皮纸素材；移除地图硬框，保留交互和真实地理轮廓。
- 滚轮／按钮／键盘／复位使用 380ms 缓动；拖动和双指缩放无延迟。按下时从当前显示矩阵继续，避免打断动画时跳跃。
- 支持 prefers-reduced-motion，禁用缩放过渡；100%–300% 上下限不变。

## 资产与生成

imagegen 技能，内置工具 generate 模式；没有使用 CLI，也未指定工具不支持的模型名称。生成 PNG 用 sharp 转成 WebP，原始文件保留，透明通道保留。

| 资产 | 项目保存路径 | 原始文件名 |
| --- | --- | --- |
| 桌面背景 | E:/workspace/yifang/public/atlas/desk-scene-v2.webp | exec-4d9a7bc1-7bf9-437e-84f4-a14d5aa56228.png |
| 羊皮卷轴 | E:/workspace/yifang/public/atlas/menu-scroll-v2.webp | exec-6b8b38b1-cd8b-489e-a412-3e7a69cf8c3b.png |
| 标题羊皮纸 | E:/workspace/yifang/public/atlas/title-parchment-v2.webp | exec-9dfc9308-adf2-4db1-9cdb-b29bde4bafd3.png |

原始目录：C:/Users/Administrator/.codex/generated_images/01a08600-3c17-7380-94ef-e70d1aa50f33/

### 桌面提示词

Use case: stylized-concept. Asset: wide 16:9 production background for a realistic adventure RPG strategist's desk, matching the attached reference's sumptuous dark walnut, amber candlelight, brass, antique books and tactile materials. Top-down slightly oblique view. At upper left, a stack of four worn embossed leather books and two lit ivory candles in bronze holders; more small candles along the TOP edge. At bottom left a LARGE elaborate brass magnetic compass, with a black-and-gold fountain pen lying diagonally over an old dark leather journal extending along bottom edge. At lower right a red wax crown seal and a few old gold coins. Tiny metal knight chess piece at far upper right. IMPORTANT central 75% of canvas must be EMPTY dark rich wooden tabletop, reserved for an interactive map layer. All props restricted to outer 15% top/bottom and outer 12% left/right. No map, no parchment, no buildings, no UI panels, no words, no watermarks. Ultra-detailed realistic game illustration, strong tangible depth and warm shadows, not flat icon art. Full bleed landscape.

### 卷轴提示词

Use case: stylized-concept. Asset: isolated vertical parchment scroll for a functional RPG sidebar menu. Match realistic candlelit antique fantasy strategy desk reference. Single tall unrolled aged golden sheep parchment, portrait 1:2 aspect ratio, wooden roller bars with ornate dark brass pointed finials at top and bottom. Real curl thickness, deeply worn irregular paper edges, mottled grain, creases and softly stained rim. A dark burgundy medieval banner hangs over top fifth with a small embossed gold lion heraldic emblem. The lower 70% is EMPTY fairly light parchment for code-rendered menu links. Entire scroll and finials fully in frame with small transparent margin. GENUINELY TRANSPARENT BACKGROUND, no tabletop, no text, no letters, no menu icons. Refined photorealistic painterly 3D depth, not vector, lit warm from upper left.

### 标题提示词

Use case: stylized-concept. Asset: isolated WIDE horizontal antique parchment title banner, landscape 3:1. Match candlelit realistic medieval strategist RPG desk. One broad warm tan sheep parchment sheet with thick torn uneven deckled edges, subtle curled corners, small rolled under folds, aged stains around rim and fine fibrous grain. Very wide clear pale center for large code-rendered title, no text or symbols. Beautiful irregular silhouette, realistic thickness and soft attached drop shadow. GENUINELY TRANSPARENT BACKGROUND. No desk, no props, no writing, no icons, no UI. High detail realistic illuminated game illustration, warm upper-left light. Fill canvas with slight transparent margin.

## 验收

- ESLint、TypeScript 通过。
- 生产构建通过，129 个静态页面；保留原有 Big Shoulders fallback 非阻断警告。
- 桌面截图已检查：摆件可见，卷轴菜单不遮挡地图主要入口。
- 浏览器缩放中间帧：目标 scale(1.2)，显示矩阵先为 1.19081，再收敛至 1.2；transition 0.38s 生效。
- 390 × 844 手机首屏已检查；文档 scrollWidth 375 <= innerWidth 390，无页面级横向溢出。
- 连续点击放大停在 300% 并禁用按钮；复位后缩小禁用；实际滚轮从 100% 放大到 135%。
- 触控真机和跨浏览器缩放仍需后续设备验收。

参考方向保持用户图片为主。重新查阅 Inspora、awesome-design-md、ThreeUI，没有引入与用户参考冲突的新风格；沿用现有 DESIGN.md 的字阶、阅读性和无障碍约束。
