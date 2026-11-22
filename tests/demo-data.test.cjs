const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const {valid}=require('../prototype/task-store.js');
const source=fs.readFileSync(require.resolve('../prototype/demo-data.js'),'utf8');
function run(data,search='?demo=1') {
  vm.runInNewContext(source,{URLSearchParams,location:{search},Intl,Date,localStorage:{getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)}});
}
test('demo creates valid twelve-month tasks and preserves edits on subsequent visits',()=>{
  const data=new Map();run(data);
  const tasks=JSON.parse(data.get('tempo-tasks-v1'));
  assert.ok(tasks.length>600 && tasks.length<700);assert.ok(tasks.every(valid));assert.equal(new Set(tasks.map(t=>t.id)).size,tasks.length);
  assert.equal(new Set(tasks.map(t=>t.date.slice(0,7))).size,12);
  tasks[0].name='Моя правка';data.set('tempo-tasks-v1',JSON.stringify(tasks));
  const before=[...data];run(data);assert.deepEqual([...data],before);
});
test('regular visits and existing calendars are never seeded',()=>{
  const data=new Map();run(data,'');assert.equal(data.size,0);
  data.set('tempo-tasks-v1','[]');run(data);assert.deepEqual([...data],[['tempo-tasks-v1','[]']]);
});
