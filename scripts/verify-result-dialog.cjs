const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript'),assert=require('node:assert/strict');
const source=ts.transpileModule(fs.readFileSync('components/ui/ResultDialog.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
for(const locale of ['zh','en'])for(const connected of [true,false]){
 const effects=[],refs=[],events=[],exports={};
 const previous={isConnected:connected,focus(){events.push('restore');}};
 const jsx=(type,props)=>({type,props});
 vm.runInNewContext(source,{exports,document:{activeElement:previous},require(name){
  if(name==='react')return {useEffect(fn){effects.push(fn);},useId(){return 'result-test';},useRef(){const r={current:null};refs.push(r);return r;}};
  if(name==='react/jsx-runtime')return {jsx,jsxs:jsx};
  throw new Error(name);
 }});
 const tree=exports.default({title:'Win',reason:'Long explanation\n'.repeat(100),locale});
 const kids=tree.props.children,heading=kids.find(x=>x.type==='h2'),form=kids.find(x=>x.type==='form');
 assert.equal(tree.type,'dialog');assert.ok(tree.props.className.includes('overflow-y-auto'));
 assert.ok(tree.props.className.includes('max-h-[85dvh]'));
 assert.equal(heading.props.tabIndex,-1);assert.equal(form.props.method,'dialog');
 assert.equal(form.props.children.props.autoFocus,undefined,'footer must not automatically scroll past the explanation');
 assert.equal(tree.props['aria-labelledby'],heading.props.id);
 refs[0].current={scrollTop:0,showModal(){events.push('open');this.scrollTop=420;},close(){events.push('close');}};
 refs[1].current={focus(options){assert.equal(options.preventScroll,true);events.push('heading');}};
 const cleanup=effects[0]();assert.equal(refs[0].current.scrollTop,0);assert.deepEqual(events,['open','heading']);
 cleanup();assert.deepEqual(events,connected?['open','heading','close','restore']:['open','heading','close']);
}
console.log('PASS: bilingual modal opens at top with heading focus, native dialog form closure, scroll containment and connected-only focus restoration. Mock lifecycle, not browser layout acceptance.');
