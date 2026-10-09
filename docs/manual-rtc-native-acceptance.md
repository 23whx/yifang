# ManualRTC 原生边界验收

实测：2026-09-30，Codex内置浏览器，`http://127.0.0.1:3000`。

清理后TypeScript、两文件定向ESLint、模拟RTC回归与已有静态成品检查均退出0；没有再次静态构建。开发组件未进入现有成品，新增禁入断言通过。

`scripts/fixtures/manual-rtc-native.tsx`保留可复现的开发验收组件，不属于正式路由。需要复验时在本地开发模式建立临时`app/rtc-acceptance/page.tsx`，内容为：

```tsx
export {default} from '../../scripts/fixtures/manual-rtc-native';
```

用浏览器打开并点击“Run native checks”。不要用该入口构建或发布；完成后删除临时路由及其单独产生的残留类型文件。当前入口已经删除并返回404，正式中国象棋remote返回200。静态成品验证脚本另禁止验收组件的结果标记进入客户端包。

## 本次实际结果

两端使用正式`ManualRTC`，没有替换`RTCPeerConnection`、注入假的数据通道或访问类的私有成员。邀请／回应由真实SDP通过同一页面内存传递，双方`iceServers: []`；无STUN、TURN、信令服务器、账号或存档读写。

- 中文、emoji、JSON转义孤立代理字符各组成恰好65536 UTF-8字节的帧；三类各两个方向，共6次实际接收，内容完全相等。验收组件使用`Blob.size`算字节，与生产`TextEncoder`不同的API。
- 三类超限值分别从两端发送，共6次明确返回`Message limit exceeded`；之后两端的有序哨兵消息正常收到，未误断开或交付超限数据。
- 两端重复close仍各只通知一次。
- 三个另外建立的原生连接，用原始RTC发送端绕过发送包装器，分别发送超限中文、超限emoji及坏JSON。正式接收端各错误通知一次、关闭一次，未交付数据；随后重复close不追加通知。
- 所有连接在finally关闭。测试标签12已关闭，浏览器仅留原用户标签1，没有改变viewport。

实际页面输出以`COMPLETE: native same-page transport boundary acceptance`结束，未出现FAIL。截图：`manual-rtc-native-boundary-2026-09-30.jpg`。

## 不代表什么

这是同一浏览器、同一页面的真实原生传输检查，不是跨标签刷新、不同设备/LAN、完整游戏同步或网络抖动证据。拥塞阈值、迟到事件和五秒断连宽限仍沿用各自受控模拟测试，不因本轮检查成为原生网络验收。测试没有声明不同浏览器实现均通过。没有永久改变游戏运行时，也没有部署。

## 同日可靠性修复与原生复验

新增独立断言先复现：旧实现接受`ordered:false`的同名`yifang`通道，测试退出1（open而非closed）。接收端现在除标签/重复/关闭检查外，还要求`ordered===true`、`maxRetransmits===null`且`maxPacketLifeTime===null`，否则只关闭不兼容通道、不挂正式回调。正式房主的默认可靠有序创建方式未变。依据：[W3C RTCDataChannel](https://www.w3.org/TR/webrtc/#rtcdatachannel)。这是防止接受不兼容传输能力，不代表反作弊或恶意远端无法干扰网络。

修复后内置浏览器标签15亲自点击运行：原始对端在正式通道建立前依次创建同名无序、maxRetransmits为0/5、maxPacketLifeTime为0/20，共五类；各实际关闭，正式端没有open/error/close通知。随后正确通道打开一次、双向收发有效，重复通道仍关闭；此前65536字节、非文本/坏JSON拒绝和32768协商上限全部PASS，最终COMPLETE，无FAIL。截图`manual-rtc-native-reliability-2026-09-30.jpg`可读。

全部测试peer/channel在finally关闭，标签15关闭、原用户标签1保留，无viewport/存档改变；临时入口及本次独立类型文件删除。新增五类替身断言、TypeScript和三文件定向ESLint均退出0。它新增了运行时修改，生产成品重建与清理后正式HTTP结果另见当前工作清单；不能沿用早期“不改运行时”的记录描述本轮。

修复现已进入成功重建的静态成品：154生成路由、152 HTML/2457引用及compiled可靠性条件检查退出0，测试组件未交付。开发预览恢复原127.0.0.1:3000/webpack参数，临时页404、正式中文首页/英文象棋remote200。四棋种适配器、五牌局恢复、围棋及三棋种大历史恢复均退出0；这些恢复脚本的模拟通道/真WebCrypto（棋类另有真WASM）范围未变。三棋种测试外层5秒曾两次先于生产30秒超时；只将外层watchdog调至35秒，正式超时和失败断言保持，完整9握手/9攻击拒绝及定向ESLint通过。没有部署或真实LAN/网络抖动验收。

## 同日补验：二进制、通道选择与较小协商上限

扩展同一个开发组件后，内置浏览器标签13亲自点击运行；原有全部检查及新增检查均出现PASS，页面以COMPLETE结束，无FAIL。完整可读截图：`manual-rtc-native-extended-2026-09-30.jpg`。

清理后TypeScript、组件定向ESLint、模拟传输回归和已有静态成品检查均退出0，临时入口HTTP404、正式象棋remote HTTP200；未重新构建生产成品，开发组件仍不属于正式页面。

- 原始RTC发送端分别发送ArrayBuffer和Blob（内容为合法JSON的UTF-8字节）。正式接收端拒绝非文本帧，错误和关闭各一次、零数据交付；没有把二进制内容偷偷当作JSON接受。这是两种发送类型的检查，不声明覆盖所有浏览器的binaryType实现。
- 原始端先建立错误标签`not-yifang`，正式端关闭该通道但不打开或关闭整个peer、不报错误；随后在同一真实连接建立`yifang`，正式端打开一次。
- 再建立第二条`yifang`通道，重复通道实际被关闭，原通道仍双向可用，正式端open通知仍一次。没有访问私有成员或替换RTC API。
- 原始端正常createOffer/ICE收集后，将提供给正式端的SDP中`a=max-message-size`改为32768。正式端依据真实浏览器协商状态发送：中文JSON帧恰好32768字节收到且内容相同，32769字节明确`Message limit exceeded`，随后有序哨兵收到。改动的是开发测试对端声明的接收能力，不是生产信令解析、浏览器私有状态或类成员；证明这一种较小上限，不代表全部SCTP参数组合。
- 全部连接finally关闭；标签13已关闭，目录只保留原用户标签1，未改viewport或读写游戏存档。临时路由再次删除，清理后检查另见当前工作清单。
