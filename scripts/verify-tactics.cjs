const fs = require('node:fs'), assert = require('node:assert/strict'), ts = require('typescript');
require.extensions['.ts'] = (m,f) => m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,f);
(async () => {
  const {tacticalLessons} = require('../content/board/tactics.ts');
  const {TacticsSession} = require('../lib/board/tactics-session.ts');
  const {default:create} = await import('../node_modules/ffish-es6/ffish.js');
  const f = await create({wasmBinary:fs.readFileSync(require.resolve('ffish-es6/ffish.wasm'))});
  for(const lesson of tacticalLessons) {
    const b = new f.Board(lesson.game,lesson.fen), initial=b.fen();
    assert.equal(f.validateFen(lesson.fen,lesson.game),1,lesson.id);
    assert.equal(b.isGameOver(),false);
    for(const step of lesson.line) {
      assert.ok(b.legalMoves().split(' ').includes(step.move),`${lesson.id}: legal move`);
      assert.ok(b.push(step.move));
      for(const locale of ['zh','en']) assert.ok(step.explanation[locale].trim(),`${lesson.id}: missing ${locale} explanation`);
    }
    assert.equal(b.isCheck(),true,`${lesson.id}: check, not stalemate`);
    assert.equal(b.legalMoves().trim(),'');
    assert.equal(b.isGameOver(),true);
    assert.equal(b.result(),lesson.result);
    for(let i=0;i<lesson.line.length;i++) b.pop();
    assert.equal(b.fen(),initial,`${lesson.id}: replay rewind restores exact state`);
    b.delete();
    const session=new TacticsSession(new f.Board(lesson.game,lesson.fen),lesson);
    const baseline=session.snapshot();
    assert.equal(session.attempt('invalid'),false);
    assert.equal(session.snapshot().fen,baseline.fen);
    let mates=0, failures=0;
    if(!lesson.replayOnly) {
    for(const move of baseline.legal) {
      session.reset();
      assert.equal(session.attempt(move),true);
      const snapshot=session.snapshot();
      assert.equal(session.attempt(move),false,'one attempt only until reset');
      if(!snapshot.won && snapshot.legal.length) {
        const proof=new f.Board(lesson.game,snapshot.fen);
        assert.ok(proof.push(snapshot.legal[0]));
        assert.equal(session.showReply(),true);
        assert.equal(session.snapshot().replyVisible,true);
        assert.equal(session.snapshot().fen,proof.fen(),'reply uses actual legal engine position');
        assert.equal(session.snapshot().lastMove,snapshot.legal[0]);
        assert.equal(session.showReply(),false,'no automatic or duplicate continuation');
        assert.equal(session.attempt(session.snapshot().legal[0]),false);
        assert.equal(session.hideReply(),true);
        assert.deepEqual(session.snapshot(),snapshot,'return restores entire attempted state');
        assert.equal(session.hideReply(),false);
        assert.equal(session.showReply(),true);
        session.reset();
        assert.deepEqual(session.snapshot(),baseline,'reset from reply restores original puzzle');
        proof.delete();
      } else assert.equal(session.showReply(),false,'no reply to mate or terminal position');
      if(snapshot.won) mates++; else failures++;
    }
    assert.ok(mates>0 && failures>0,'both winning and nonwinning legal choices covered');
    if(lesson.game==='xiangqi') assert.ok(mates>1,'alternate correct mates must be accepted');
    } else {
      assert.equal(session.snapshot().mode,'replay');
      session.reset('practice'); assert.equal(session.snapshot().mode,'replay');
      assert.equal(session.attempt(baseline.legal[0]),false,'replay-only lessons must never behave as mate-in-one puzzles');
    }
    session.reset('replay');
    assert.equal(session.showReply(),false,'no reply demonstration in authored replay');
    assert.equal(session.attempt(lesson.line[0].move),false);
    assert.equal(session.step(-1),false);
    for(const step of lesson.line) { assert.equal(session.step(1),true); assert.equal(session.snapshot().lastMove,step.move); }
    const final=session.snapshot().fen;
    assert.equal(session.step(1),false); assert.equal(session.snapshot().fen,final,'finished board retained');
    for(const step of lesson.line) { void step; assert.equal(session.step(-1),true); }
    assert.equal(session.snapshot().fen,baseline.fen);
    session.close(); session.close(); assert.equal(session.step(1),false); assert.equal(session.attempt(lesson.line[0].move),false); assert.equal(session.showReply(),false); assert.equal(session.hideReply(),false);
  }
  console.log(`PASS: ${tacticalLessons.length} tactical positions, all legal first-move attempts, alternate mates, invalid/duplicate guards, replay boundaries, retained finish, rewind and disposal verified. Browser acceptance pending.`);
})().catch(e=>{console.error(e);process.exitCode=1;});
