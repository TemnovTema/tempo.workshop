const {test}=require('node:test');const assert=require('node:assert/strict');const vm=require('node:vm');const fs=require('node:fs');
test('day change and external task edits show notices without forced reload',()=>{
 let date='2026-11-18',tick,reloads=0;const nodes=[],events={};
 const document={hidden:false,body:{append(){}},createElement(){const n={style:{},setAttribute(){},append(){},addEventListener(t,fn){this[t]=fn;}};nodes.push(n);return n;},addEventListener(t,fn){events[t]=fn;}};
 vm.runInNewContext(fs.readFileSync(require.resolve('../prototype/session-notice.js'),'utf8'),{document,window:{addEventListener(t,fn){events[t]=fn;}},location:{reload(){reloads++;}},Date,Intl:{DateTimeFormat:class{format(){return date;}}},setInterval(fn){tick=fn;}});
 date='2026-11-19';tick();assert.match(nodes[1].textContent,/новый день/);assert.equal(reloads,0);
 events.storage({key:'tempo-tasks-v1'});assert.match(nodes[1].textContent,/другой вкладке/);assert.equal(reloads,0);nodes[2].click();assert.equal(reloads,1);
});
