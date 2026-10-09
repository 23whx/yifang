# 亚洲首屏与独立据点修订

- 建筑宽度从桌面 18%／手机 17% 降至统一 9%；缩小铭牌，调整围棋位置以避开象棋建筑。图鉴和介绍面板的建筑不受影响。
- 取消东方聚合点，围棋和麻将始终独立显示。
- 首次进入及 Home／复位定位最右侧亚洲；宽视口 120%，窄视口 100%，拖拽和 100%–300% 缩放仍保留。
- 地图图片内的大罗盘和四角罗盘移除，桌面背景实体罗盘不变。

图片：imagegen 内置工具 edit 模式（非 CLI）；PNG 转 WebP，旧图和原图保留。
输入：E:/workspace/yifang/public/atlas/northern-atlas.webp
输出：E:/workspace/yifang/public/atlas/northern-atlas-v3.webp
原图：C:/Users/Administrator/.codex/generated_images/01a08600-3c17-7380-94ef-e70d1aa50f33/exec-354cd8f9-9082-41a7-a499-bbdcd9d87434.png

提示词：Edit this existing map only. Remove the large compass rose in the lower-left ocean and all four small compass ornaments in the corners. Fill their areas seamlessly with matching ocean texture / aged parchment border respectively. Preserve all geography, coastlines, land positions, mountains, ships, colors, antique style, framing and exact 2:1 composition. No other changes. Do not add any compass, symbols, text, buildings or labels.

验证：TypeScript、ESLint 与生产构建；浏览器确认八个独立地标、初始亚洲视角及围棋／麻将面板。图片已视觉检查，无罗盘残留。
