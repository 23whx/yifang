const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (m, f) => m._compile(ts.transpileModule(fs.readFileSync(f, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, f);
const peers = [];
global.RTCPeerConnection = class {
  constructor(config) { assert.deepEqual(config, { iceServers: [] }); peers.push(this); }
  createDataChannel() {
    return this.channel = { readyState: 'open', bufferedAmount: 0, send: text => { this.sent = text; }, close: () => { this.channel.readyState = 'closed'; this.channel.onclose?.(); } };
  }
  close() { this.closed = true; }
};
const { ManualBoardConnection } = require('../lib/board/manual-connection.ts');
for (const game of ['chess', 'xiangqi', 'shogi', 'go']) {
  const c = new ManualBoardConnection(game, true), pc = peers.at(-1);
  let opens = 0, closes = 0, errors = 0, received;
  c.on('open', () => opens++);
  c.on('close', () => closes++);
  c.on('error', () => errors++);
  c.on('data', value => received = value);
  pc.channel.onopen(); assert.equal(opens, 1);
  const wire = { v: 3, game, round: 1, kind: 'hello', seq: 0 };
  c.send(wire); assert.deepEqual(JSON.parse(pc.sent), wire);
  pc.channel.onmessage({ data: JSON.stringify(wire) }); assert.deepEqual(received, wire);
  pc.channel.bufferedAmount = 300000;
  c.send(wire); assert.equal(errors, 1); assert.equal(closes, 1); assert.equal(c.open, false);
  c.close(); assert.equal(closes, 1); assert.equal(pc.closed, true);
  pc.channel.onerror();pc.channel.onopen();
  assert.equal(errors,1);assert.equal(opens,1,'Late events from a closed adapter must not notify its old UI');
  const throwing = new ManualBoardConnection(game, true), failedPeer = peers.at(-1);
  let failedCloses=0;
  throwing.on('error',()=>{throw Error('UI error handler failed');});throwing.on('close',()=>failedCloses++);
  failedPeer.channel.bufferedAmount=300000;
  assert.throws(()=>throwing.send(wire),/UI error handler failed/);
  assert.equal(throwing.open,false);assert.equal(failedPeer.closed,true);assert.equal(failedCloses,1);
  throwing.close();assert.equal(failedCloses,1);
}
console.log('PASS: all four board-game adapters forward wire messages and lifecycle events; congestion closes once even if an error listener throws, and late closed-channel events do not notify the old UI. Mock transport, not browser connectivity evidence.');
