# 六牌面七对组合：四归一排除修正

2026-09-30。采用本项目既定WMO/EMA规则，不切换到MIL。

## 原文依据与范围

已从公开镜像读取《Explanation of Mahjong Competition Rules (Some Discussional Words)》Word文件的实际字节，而非仅搜索摘要：

https://ooyamaneko.net/download/mahjong/mcr/Explanation_of_Mahjong_Competition_Rules_en.doc

文件1820160字节，SHA-256 `da606a8f52f951996ddf31d3bf134dbf1ee0fedecb5d2901824a0b369ba063ed`。镜像在无Referer请求时可能返回HTML下载说明页；本次带下载目录Referer及application/msword Accept取得真正Word响应。未把文档作为本站教学内容复制或重新分发。

文件Item 1中六牌面特殊规则、Item 2绿一色及清幺九说明，分别明确七对出现时不追加四归一。原文短句：“Seven Pairs can be added, but Tile Hog can not be.” Item 2还明确清幺九的相同组合限制。公开书目将该解释归于WMCC 2007；镜像不是发行者官方域名，本次未独立验证发布者签名或取得中文原本。与WMO2021示例仅列七对、混一色、不求人相符，但不能仅凭示例遗漏就推断规则。

WMO2021规则书：https://www.mindmahjong.com/adobe/ZC2021.pdf 。本次官方索引可读绿一色牌例3的组合说明；PDF直取超时，不声称重新完整阅读。民间“仅扣一组、其它组继续计”的解释与这里原文不一致，未采用。MIL补充细则另有不同口径，不能混入本项目。

## 实现

`fan-occurrence-research.js`对已通过全局排除的候选番做组合排除：必须同时有七对及绿一色/清幺九，才移除所有四归一occurrence。记录两项组合原因及每项被移除的key。不是把绿一色或七对单独设为四归一全局排除；普通拆分仍与特殊拆分分别计分择优。

旧`verify-mcr-all-green-session.cjs`绿一色七对案例错误期待四归一+2，现改为不出现；其它普通七对的四归一仍+2。

## 实际回归证据

- 新`verify-mcr-six-face-pairs-exclusion.cjs`在旧实现实际exit1：绿一色/七对的一项四归一仍存在（1而非0）。
- 修正后exit0：组合候选中的1/2/3项四归一均排除，分别去掉任意一个必要原因后均保留。
- 全入口各126种合法0/2/4张实体组合、现存和牌面×两来源各1152例。绿一色1128例最终选七对，其余24例由普通拆分择优；清幺九1152例均选七对。所选七对均无四归一并保留组合原因，输入不变/付款算术通过。
- 48条绿一色真实session编排终局、154项特殊牌型边界、完整`verify-mcr-score.cjs`、1152正例/32256禁止牌面反例及三个修改文件定向ESLint均实际exit0。

这不是其它81番组合的全真值、原生浏览器/LAN证据；82个验证文件也不表示82项已经整套同轮执行。运行时改变后须重新静态构建并验成品，结果记录在当前唯一清单中。

交付收尾：静态构建exit0、152 HTML/2457引用及组合排除编译表达式/原因断言exit0，最终脚本ESLint exit0；基础番、幺九家族、四归一真实终局和特殊session也通过。预览初次编译超时且曾JSON解析500，未重启/清缓存，随后中文首页及英文麻将remote均HTTP200。该恢复不证明最初错误的永久根因已确定。
