# 国标麻将 83 项同轮回归（2026-10-01）

执行 `node scripts/run-mcr-suite.cjs`，实际进程退出码为 0。`summary.json` 记录 83/83 项完成、0 项失败、`sourceUnchanged=true`、`changed=[]`；运行耗时 1113.094 秒。`source-before.json` 与 `source-after.json` 各记录 389 个源码及配置文件的 SHA-256。83 份逐项日志均非空，且每项的 `exitCode` 都为 0。

本目录的 `summary.json`、两份源码清单和 83 份日志共 86 个原始文件，从本次临时输出目录复制并逐文件核对名称和 SHA-256，86/86 相同；没有覆盖此前 82 项的归档。新增的 `verify-mcr-robbing-kong-ui.cjs` 包含在本轮第 57 项。

这些是当前脚本覆盖范围的同轮回归证据，不证明 81 番所有合法组合、所有随机牌局、原生浏览器交互、真实双设备 WebRTC 或第三方再分发许可。详细覆盖边界见 [国标81番验收映射](../../mcr-fan-coverage.md)，当前待办见 [剩余工作](../../remaining-work.md)。
