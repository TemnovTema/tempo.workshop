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
test('regular visits populate empty calendars and preserve custom tasks',()=>{
  for (const existing of [[],[{id:'custom'}]]) {
    const data=new Map([['tempo-tasks-v1',JSON.stringify(existing)]]);
    run(data,'');
    const tasks=JSON.parse(data.get('tempo-tasks-v1'));
    assert.ok(tasks.some(t=>t.seriesId));
    assert.deepEqual(tasks.filter(t=>!t.seriesId),existing);
  }
});
test('finishing one occurrence stops only its future weekly copies, also after reload',()=>{
  const data=new Map();run(data,'');
  const db={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};
  const {create}=require('../prototype/task-store.js');
  let store=create(db,[]);
  const first=store.all().find(t=>t.seriesId==='pm-metrics'), series=store.all().filter(t=>t.seriesId===first.seriesId);
  assert.equal(Date.parse(series[1].date)-Date.parse(first.date),7*86400000);
  assert.ok(store.save({...series[1],completed:true}));
  run(data,'');store=create(db,[]);
  assert.equal(store.all().filter(t=>t.seriesId===first.seriesId).length,2);
  assert.ok(!store.forDate(series[2].date).some(t=>t.seriesId===first.seriesId));
  assert.ok(store.forDate(series[2].date).some(t=>t.seriesId!==first.seriesId));
});
