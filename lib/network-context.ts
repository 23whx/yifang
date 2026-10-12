/** Browser-side multiplayer requires an authenticated context and Web Crypto
 * for the recovery handshake. Node test runners have no Window. */
export function secureContextAvailable():boolean {
  if(typeof window==='undefined')return true;
  return window.isSecureContext===true&&typeof globalThis.crypto?.subtle!=='undefined';
}

/** Some in-app browsers (e.g. chat apps), privacy modes and managed browsers
 * remove WebRTC entirely; friend play cannot work there, so say so up front. */
export function webrtcAvailable():boolean {
  if(typeof window==='undefined')return true;
  return typeof globalThis.RTCPeerConnection==='function';
}

export function secureMultiplayerContext():boolean {
  return secureContextAvailable()&&webrtcAvailable();
}

export function insecureMultiplayerMessage(locale:'zh'|'en'):string {
  if(secureContextAvailable()&&!webrtcAvailable())return locale==='zh'
    ? '这个浏览器不支持网页直连（WebRTC），无法建立好友对局。请改用最新版的 Chrome、Edge、Safari 或 Firefox 打开本页；微信等应用内置的浏览器通常不支持，请选择“在浏览器中打开”。原存档未清除。'
    : 'This browser does not support direct web connections (WebRTC), so friend play cannot start here. Open this page in a current Chrome, Edge, Safari or Firefox; browsers built into chat apps usually lack it, so choose “Open in browser”. Your existing save was not cleared.';
  return locale==='zh'
    ? '当前页面不是安全上下文，不能安全建立或恢复好友对局。请双方使用有效 HTTPS 打开网站；localhost 只适用于本机，不能把 http://局域网IP 发给另一台设备。原存档未清除。'
    : 'This page is not a secure context, so a friend match cannot be safely started or restored. Both devices need a valid HTTPS site; localhost works only on the same device, not as an HTTP LAN-IP link. Your existing save was not cleared.';
}
