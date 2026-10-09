# 国标整场结果：原生双语窄屏验收

2026-09-30，内置浏览器，390×844。正式`McrPractice`、`ResultDialog`和`actMcrMatch`，未修改运行时组件。

开发组件`mcr-final-native-state.ts`从真正`newMcrMatch(42)`用7244个合法规则动作完成十六手；前十五手逐席确认后开下一手，最后一手停在四席尚未确认。没有直接写入分数、假造终局或更改浏览器存档。服务器准备完整规则状态后，由临时本地验收组件接收该状态，正式组件使用remote接口显示座位1；另外三个按钮仅是本页验收用的座位确认控件，不是实际远端玩家或网络。

## 原生操作结果

- 中文和英文各亲自关闭“本手结果”，点击正式座位1确认，再逐个点击三个验收座位确认。
- 两语言第三席确认后`complete:false`、确认数组`[true,true,true,false]`，未提前显示整场结果；第四席后`complete:true`、四席全true，出现新“本场结果 / Match result”弹窗。
- 最后一手由座位3自摸，非花9、花1；整场赢家却是累计79分的座位4。弹窗明确按十六手累计最高分比较，不按最后一手谁胡牌，也不是真钱。
- 确认前后累计始终`[-26,-58,5,79]`、history始终16，未重复入账。关闭整场弹窗后，正式“确认”和“下一手”按钮均禁用；不存在第十七手。
- 两页document clientWidth/scrollWidth均375（390视口含滚动条），dialog宽337、x19；焦点分别在“本场结果”和“Match result”标题。截图中正文与关闭按钮可读，无横溢。
- 截图：`mcr-final-match-zh-mobile-2026-09-30.jpg`、`mcr-final-match-en-mobile-2026-09-30.jpg`。

## 复现与边界

开发组件保留于`scripts/fixtures/`，不属于正式路由。复验时临时建立`app/[locale]/mcr-final-acceptance/page.tsx`：await params得到locale，调用`prepareFinalMcrMatch()`，将返回state/moves交给`FinalMatchAcceptance`。只能用于本地开发；临时路由和本次生成的独立类型文件已删除。静态验证另禁止开发标题进入客户端成品。

测试标签14已关闭、viewport已reset，目录仅保留原用户标签1。没有操作用户原页或读写游戏存档。只证明这一完整规则准备状态下的最终确认与双语弹窗；不证明十六手人工原生实玩、并列赢家原生弹窗、网络同步/刷新恢复或真实双设备LAN。并列赢家仍只有独立文案/SSR回归证据。

清理后TypeScript、两组件与静态检查脚本定向ESLint、152 HTML/2457引用静态成品及开发组件禁入检查、完整16手7244动作回归均实际退出0。临时中英入口HTTP404、正式中文麻将play HTTP200。未重建生产成品：仅测试/文档变化，没有永久运行时改动或部署。
