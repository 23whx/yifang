const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (m, f) => m._compile(ts.transpileModule(fs.readFileSync(f, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, f);
const { newPokerSession, pokerView, applyPokerRequest, validPokerRequest, validPokerView } = require('../lib/holdem-remote.ts');
const deck = Array.from({ length: 52 }, (_, i) => i);
const request = (s, action) => ({ hand: s.hand, revision: s.revision, action });
let s = newPokerSession(deck);
for (const seat of [0, 1]) {
  const view = pokerView(s, seat);
  assert.ok(validPokerView(view));
  assert.equal(validPokerView({...view, ownCards:[99, 100]}), false);
  assert.equal(validPokerView({...view, opponentCards:[30, 31]}), false);
  assert.equal(validPokerView({...view, log:[null]}), false);
  assert.equal('deck' in view, false);
  assert.equal('table' in view, false);
  assert.equal('hole' in view, false);
  assert.deepEqual(view.ownCards, s.table.hole[seat]);
  assert.deepEqual(view.opponentCards, []);
  view.ownCards[0] = 999;
  view.stacks[0] = 999;
  view.next[0] = true;
  view.log[0].zh = 'changed';
  assert.notEqual(s.table.hole[seat][0], 999);
  assert.notEqual(s.table.stacks[0], 999);
  assert.equal(s.next[0], false);
  assert.notEqual(s.table.log[0].zh, 'changed');
}
for (const malformed of [null, {}, { hand: 1, revision: 0, action: { kind: 'hack' } }, { hand: 1, revision: 0, action: { kind: 'raise', to: Infinity } }]) {
  assert.equal(validPokerRequest(malformed), false);
  assert.throws(() => applyPokerRequest(s, 0, malformed));
}
assert.throws(() => applyPokerRequest(s, 1, request(s, { kind: 'call' })));
assert.throws(() => applyPokerRequest(s, 0, request(s, { kind: 'next' })));
const first = request(s, { kind: 'call' });
s = applyPokerRequest(s, 0, first);
assert.throws(() => applyPokerRequest(s, 0, first), /Stale/);
assert.equal(pokerView(s, 0).legal, null);
while (!s.table.over) {
  const view = pokerView(s, s.table.actor);
  assert.deepEqual(view.opponentCards, []);
  s = applyPokerRequest(s, s.table.actor, request(s, { kind: view.legal.canCheck ? 'check' : 'call' }));
}
assert.ok(s.table.showdown);
assert.ok(validPokerView(pokerView(s, 0)));
assert.ok(validPokerView(pokerView(s, 1)));
for (const seat of [0, 1]) assert.deepEqual(pokerView(s, seat).opponentCards, s.table.hole[1 - seat]);
assert.equal(s.table.stacks.reduce((a, b) => a + b), 400);
const previous = s, oldRequest = request(s, { kind: 'next' });
s = applyPokerRequest(s, 0, oldRequest);
assert.equal(s.hand, 1);
assert.equal(s.table, previous.table);
assert.equal(applyPokerRequest(s, 0, request(s, { kind: 'next' })), s);
s = applyPokerRequest(s, 1, request(s, { kind: 'next' }), deck);
assert.equal(s.hand, 2);
assert.equal(s.table.button, 1);
assert.deepEqual(s.table.start, previous.table.stacks);
assert.throws(() => applyPokerRequest(s, 0, oldRequest), /Stale/);
s = applyPokerRequest(s, 1, request(s, { kind: 'fold' }));
assert.ok(s.table.over);
assert.equal(s.table.showdown, false);
assert.deepEqual(pokerView(s, 0).opponentCards, []);
assert.deepEqual(pokerView(s, 1).opponentCards, []);
assert.equal(s.table.stacks.reduce((a, b) => a + b), 400);
console.log('PASS: seat redaction, detached snapshots, payload/turn guards, duplicate and stale requests, showdown-only reveal, two-party next hand, alternating blinds and stack continuity.');
for(let hand=0;hand<100;hand++) {
  let current=newPokerSession();
  for(let step=0;!current.table.over && step<100;step++) {
    for(const seat of [0,1]) {
      const snapshot=JSON.parse(JSON.stringify(pokerView(current,seat)));
      assert.ok(validPokerView(snapshot));
      assert.equal(snapshot.stacks[0]+snapshot.stacks[1]+snapshot.committed[0]+snapshot.committed[1],400);
      assert.equal(snapshot.opponentCards.length,0);
    }
    const actor=current.table.actor, options=pokerView(current,actor).legal;
    const action=step===0&&hand%3===0 ? {kind:'raise',to:options.maxTo} : {kind:options.canCheck?'check':'call'};
    current=applyPokerRequest(current,actor,request(current,action));
  }
  assert.ok(current.table.over);
  assert.ok(validPokerView(pokerView(current,0)));
  assert.ok(validPokerView(pokerView(current,1)));
  assert.equal(current.table.stacks[0]+current.table.stacks[1],400);
}
console.log('PASS: 100 serialized two-seat hands, including all-in runouts, view validation and chip conservation.');
