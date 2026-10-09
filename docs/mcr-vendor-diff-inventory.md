# 国标 npm 包本地副本：实质改动清单

核对日期：2026-09-30。基线为当前安装且锁定的 `miaoda-game-mcr-mahjong-analysis-core@0.3.1`、`miaoda-game-mcr-mahjong-rules@0.3.1`。这是逐文件差异盘点，不是许可意见，也不说明原作者已经授权修改或再分发。

`node scripts/audit-mcr-vendor-provenance.cjs` 对 21 份本地 JavaScript 副本与安装包配对并输出 SHA-256：21 份字节均不相同，其中 12 份差异仅为本地来源注释及移除源码映射尾注，另外 **9 份有实质差异**。我又逐份以 `git diff --no-index -- <安装包路径> <本地路径>` 直接核对了这 9 份的当前代码，而非仅凭文件名或先前日志推断。

| 本地文件（相对 `lib/mahjong/vendor/`） | 超出通用注释／源码映射变动的内容 |
|---|---|
| `analysis/associated-fan-research.js` | 为同一组牌被上位关联番吸收的下位候选建立逐候选排除解释；不同牌组的独立同编号候选仍可计入。 |
| `analysis/closed-hand-research.js` | 九莲宝灯从仅看14张成牌形状，增加“去掉实际和牌张后必须是九面听基础形”的判定。 |
| `analysis/complete-hand-research.js` | 将实际和牌张传入上述门清特殊牌形分析。 |
| `analysis/fan-catalog.js` | 更正大／小四喜的名称；移除第15番对第73番的错误排除；撤去原包注释中无法证明的“authorized”措辞。 |
| `analysis/fan-occurrence-research.js` | 绿一色／清幺九与七对同时成立时排除四归一；圈风／门风刻只吸收同一风刻的普通幺九刻，保留其它独立风刻。 |
| `analysis/hand-analysis-research.js` | 补充跨不同拆分方案的排除解释：一色双龙会对七对、四同顺对另一拆分的三节高，以及三节高胜出时对三同顺；仅在替代拆分确实存在时记录。 |
| `analysis/ordinary-hand-research.js` | 把关联番优化器新增的逐候选排除解释并入普通手结果。 |
| `analysis/whole-hand-pattern-research.js` | 推不倒判定允许含杠和牌的14–18张实体牌，而非固定14张；完整手结构有效性仍由调用方验证。 |
| `mcr-rules.js` | 计分入口改经本地分析桥；增加可记录真实开局补花过程的可选构造；和绝张对自摸也从其它公开的实体牌计数，并去重、排除暗杠隐藏牌；原弃牌和牌的公开计数共用该函数。 |

其余 12 份只出现通用注释／源码映射尾注差异：`closed-wait-research.js`、`combination-optimizer.js`、`fan-exclusions.js`、`meld-notation-research.js`、`research-contract.js`、`simple-occurrence-research.js`、`standard-hand-research.js`、`structures.js`、`tile-notation-research.js`、`tiles.js`、`wait-research.js`、`win-event-research.js`，均位于 `lib/mahjong/vendor/analysis/`。`mcr-rules.d.ts` 是项目自行编写的适配声明，不计入21份安装包副本。

上述功能有对应规则回归，最近82项同轮结果见 [归档总表](verification/mcr-suite-2026-09-30-post-six-face/summary.json)。回归证明的是其测试范围内的行为，不提供原代码版权归属、完整许可通知或修改版再分发授权。向可识别的权利人／维护者确认前，仍需取得两份原包的完整版权与许可文本、其适用于这些本地修改的范围，以及是否含需另行保留的第三方通知；用户目前没有此记录，也未授权代发邮件。详情见 [第三方许可审计](third-party-license-audit.md) 与 [依赖说明](mcr-dependencies.md)。
