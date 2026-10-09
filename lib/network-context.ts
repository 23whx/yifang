/** Browser-side multiplayer requires an authenticated context and Web Crypto
 * for the recovery handshake. Node test runners have no Window. */
export function secureMultiplayerContext():boolean {
  if(typeof window==='undefined')return true;
  return window.isSecureContext===true&&typeof globalThis.crypto?.subtle!=='undefined';
}

export function insecureMultiplayerMessage(locale:'zh'|'en'):string {
  return locale==='zh'
    ? '当前页面不是安全上下文，不能安全建立或恢复好友对局。请双方使用有效 HTTPS 打开网站；localhost 只适用于本机，不能把 http://局域网IP 发给另一台设备。原存档未清除。'
    : 'This page is not a secure context, so a friend match cannot be safely started or restored. Both devices need a valid HTTPS site; localhost works only on the same device, not as an HTTP LAN-IP link. Your existing save was not cleared.';
}
