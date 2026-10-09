# 无应用后端的静态发布

运行 `npm run build:static`。发布目录是 **`.next-static/`**，不是 `.next/`。只上传导出目录里的静态文件，无需 Node.js、Next 服务、数据库或账号系统。此次已成功导出 144 个页面；这不是线上发布或真实设备联机验收。

注意 Next 16 的静态导出仍使用 `.next` 作为内部构建目录，不能与生产预览构建同时运行。先停止 `next start`；导出后若需要本地生产预览，重新执行 `npm run build` 和 `npm run start`。导出的 `.next-static/` 会保留。

## 静态托管要求

导出后运行 `node scripts/verify-static-export.cjs` 检查实际产物中的页面、直接引用资源、最新中英文课程、对战入口与 WASM。该检查不启动服务器，不能证明托管响应头正确或浏览器游戏可玩。

- 使用 HTTPS；localhost 可用于本机测试，但手机访问局域网 HTTP 地址不是同一种安全上下文。
- 支持目录 `index.html`，例如 `/zh/mahjong/play/` 对应其中的 `index.html`。保留所有 `_next` 文件和资源目录。不要把所有资源请求统一改写成首页 HTML。
- 所有页面统一返回 `Cross-Origin-Opener-Policy: same-origin` 与 `Cross-Origin-Embedder-Policy: require-corp`。这是静态主机的响应头设置，不是游戏后端；多线程棋类 WASM 依赖它们。
- `.wasm` 返回 `application/wasm`，JavaScript 返回有效 JS MIME。静态导出不能携带 Next `headers()`；务必在所选静态托管服务上配置。
- 根入口 `/` 由浏览器按首选语言跳到 `/zh/` 或 `/en/`；禁用 JavaScript 仍有两个可点击的语言链接。原请求时语言代理 `proxy.ts` 已被替换，不再运行。深层链接必须含语言前缀，不再承诺无前缀 `/cube` 自动重定向。

## 对战边界

推荐手动交换 WebRTC 邀请与答复，默认 `iceServers: []`，无应用信令服务、STUN 或 TURN。交换文本本身需要玩家自行沟通。兼容旧房间号模式若使用 PeerJS 公共信令，必须明确披露它并非完全无外部服务。

同局域网也可能受防火墙、访客 Wi-Fi 隔离或浏览器策略限制；跨网络在没有中继时不保证连通。房主浏览器负责规则与发牌，不提供服务器级反作弊。关闭或刷新页面不保证恢复牌局。没有账号、真实资金、充值或提现。
