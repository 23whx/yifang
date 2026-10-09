# 弈方接手记录 · 2026-09-11

## 本版范围

- 首页北半球探险地图、图鉴、规则学堂和游戏入口统一羊皮纸／铜金／酒红 RPG 视觉；保留内页的阅读与棋盘可用性。
- 八个游戏入口按起源地区定位；存在争议时使用地区级解释，不声称精确发明地点。地图是插画，不是测绘地图：地标使用与画面校准的百分比坐标。
- 拖拽、100%–300% 滚轮缩放、触控双指缩放、键盘导航、原生介绍对话框、手机快捷入口。
- 八种游戏均有中英文第一课，包含棋子／牌／部件功能和基本规则；围棋增加数气、提子、禁自杀交互练习。
- 国际象棋、中国象棋、日本将棋补齐规则演示；三棋及围棋加入术语、历史概览、规则问答。
- 围棋提供 9／13／19 路、人机／同屏双人、悔棋、停一手、死子确认、面积计分及 SGF 导出。
- 三棋及围棋提供 PeerJS 房间码联机、回合和合法走法校验、断线保护。

## 已完成验证

- `npm run lint` 通过。
- `npm run build` 通过：129 个静态页面。Big Shoulders 字体 fallback 元数据产生非阻断警告。
- `node scripts/verify-rules.cjs`：34 个教程局面、60 步演示合法；围棋提子、自杀、超级劫、停手、计分及各尺寸 AI 检查通过。
- 浏览器：地图介绍面板／关闭与焦点回归、300% 上限、重置、390px 手机布局无横向页面溢出。
- 浏览器两页面：创建国际象棋房间、加入、白 e2–e4、黑 e7–e5，双方棋盘及轮次同步；客方离开后主方冻结并保留棋谱。
- 浏览器围棋第一课：A9 数气为 2；A8 提走白 A9；禁自杀练习拒绝黑 A9，均有正确反馈。

## 尚有限制（不能视为整个路线图全部完成）

- 联机只实测了同机双页面国际象棋；跨网络 NAT 穿透及其他三种游戏完整联机对局尚未逐项实测。公共 PeerJS 服务不保证所有网络可达，无账号、持久房间或自动重连。
- 围棋联机两次停手保留终局棋盘，尚无双方死子协商计分；本地围棋支持人工死子确认。AI 为轻量入门陪练，不是专业围棋引擎。
- 新增题库是规则选择题，历史内容为概览，不是完整战术题库／可回放名局档案。
- 八种游戏均增加零基础双语文字章节与同页操作入口。麻将已有固定摸打成形案例，德州扑克已有单挑盲注到摊牌教学，百家乐已有五种教学结算案例和认花色练习；按用户新要求提供不可购买、不可兑换的模拟筹码与余额，重开重置。它们是带引导的固定案例，不是完整麻将／扑克自由对局引擎。原有进阶内容尚需继续逐案例审校，不应把第一课扩充当成所有高级教程已完整验证。
- 地图轮廓为生成式绘制、地标地区级校准，不应作为精确地理教材。移动双指手势已实现，未在真机完整验收。

## 图片资产与生成方式

使用 imagegen 技能的内置图片生成工具（generate），不是 CLI；工具未暴露精确模型选择，因此不声称使用了指定的 image2.5。透明建筑保留 alpha，使用 sharp 转为 WebP。参考图仅作为风格依据，按钮、文案、地标和交互均为独立代码层。

- 最终地图：`E:/workspace/yifang/public/atlas/northern-atlas.webp`
- 最终建筑图集：`E:/workspace/yifang/public/atlas/buildings.webp`
- 原始图片目录：`C:/Users/Administrator/.codex/generated_images/01a08600-3c17-7380-94ef-e70d1aa50f33/`
- 地图原图：`exec-1a78956b-63a9-4cf4-9bb6-39ab6c36d3f5.png`
- 建筑原图：`exec-1dd0b2fe-a6d5-48ef-9b9c-514b044425fa.png`

地图最终提示词要点（按会话保留的摘要记录，非逐字原始请求）：

> Production background illustration, ONLY Northern Hemisphere, full longitude -180 to 180, latitude 90 to 0, equirectangular. Faithful coastlines, antique sepia parchment, mountains and forests, muted teal sea, tiny sailing ships and compass. No text, labels, buildings or UI.

建筑最终提示词：

> A transparent sprite sheet of eight highly detailed realistic fantasy RPG miniature buildings in exactly 4 columns and 2 rows, evenly sized cells with generous transparent margins. Top row: Hungarian clockwork workshop with Rubik cube; ancient Indian chess palace; Chinese xiangqi fortress; Japanese shogi castle. Bottom row: Chinese Go pavilion; Chinese mahjong teahouse; Texas playing-card saloon; French baccarat manor. Isometric dioramas, warm candlelit windows, aged wood stone bronze, refined realistic painterly game concept art. Each sits on a small isolated island base. Genuinely transparent background, no text, no UI, no labels, no shadows outside cells. Consistent scale and camera. Landscape 2:1.

## 设计参考

- 用户提供的冒险 RPG 参考图为主方向；DESIGN.md 保存当前规范及旧版历史。
- https://www.inspora.design/ ：参考分类浏览，未将无法验证的具体案例当成已查阅案例。
- https://github.com/VoltAgent/awesome-design-md ：选取 Notion 的清晰层级和可读性作为兼容参考，不复制品牌。
- https://github.com/MengTo/threeui ：参考空间交互思路；地图用轻量 DOM/CSS，未引入重型 3D 场景。
- 规则交叉核对：FIDE Laws、GNU Shogi rules、British Go Association introduction。本站围棋计分约定独立明示为面积计分、白贴 7.5。

## 本地运行

开发：`npm run dev`。生产预览：`npm run build` 后 `npm run start -- --port 3000`。
入口：`http://localhost:3000/zh`。现有工作区含接手前未提交内容，未执行提交或清理。
