const {test}=require('node:test');
const assert=require('node:assert/strict');
const {create,valid}=require('../prototype/task-store.js');
const base={id:'a',name:'Задача',date:'2026-11-17',time:'10:00',minutes:60,notes:'',project:'tempo'};
function storage(){const data=new Map();return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)}}
test('create, edit date and notes, reload, delete and reload empty without reseeding',()=>{
 const db=storage();let s=create(db,[base]);
 assert.ok(s.save({...base,date:'2026-11-18',notes:'Новый результат'}));
 s=create(db,[base]);assert.equal(s.forDate('2026-11-17').length,0);
 assert.equal(s.forDate('2026-11-18')[0].notes,'Новый результат');
 assert.ok(s.remove('a'));assert.deepEqual(create(db,[base]).all(),[]);
});
test('all calendar views query the same filtered sorted records',()=>{
 const s=create(storage(),[base]);s.save({...base,id:'b',time:'09:00',project:'personal'});
 assert.deepEqual(s.forDate(base.date).map(t=>t.id),['b','a']);
 assert.deepEqual(s.forDate(base.date,'tempo').map(t=>t.id),['a']);
});
test('failed storage write keeps the original record',()=>{
 const db=storage();const s=create(db,[base]);db.setItem=()=>{throw Error('quota')};
 assert.equal(s.save({...base,notes:'lost'}),false);assert.equal(s.all()[0].notes,'');assert.ok(s.error());
});
test('invalid dates and time windows are rejected',()=>{
 for(const change of [{date:'2026-02-30'},{time:'10:99'},{time:'07:00'},{time:'20:30',minutes:60},{minutes:0}]) assert.equal(valid({...base,...change}),false);
});
test('corrupt data is preserved rather than overwritten',()=>{
 const db=storage();db.setItem('tempo-tasks-v1','broken');const s=create(db,[base]);
 assert.ok(s.error());assert.equal(db.getItem('tempo-tasks-v1'),'broken');
});
test('completion and project reassignment survive reload, reopening remains possible',()=>{
 const db=storage();let s=create(db,[base]);
 assert.ok(s.save({...base,completed:true,project:'university'}));
 s=create(db,[base]);assert.equal(s.forDate(base.date,'tempo').length,0);
 assert.equal(s.forDate(base.date,'university')[0].completed,true);
 assert.ok(s.save({...s.all()[0],completed:false}));
 assert.equal(create(db,[base]).all()[0].completed,false);
 assert.equal(valid({...base,completed:'yes'}),false);
});
test('focus result persists independently of task notes and continuation keeps task open',()=>{
 const db=storage();let s=create(db,[base]);
 const result={id:'session-1',seconds:75,outcome:'continue',note:'Продолжить со второго пункта'};
 assert.ok(s.save({...base,completed:false,focusResults:[result]}));
 s=create(db,[base]);assert.equal(s.all()[0].completed,false);assert.deepEqual(s.all()[0].focusResults,[result]);assert.equal(s.all()[0].notes,'');
 assert.ok(s.save({...s.all()[0],completed:true,focusResults:[result,{...result,id:'session-2',outcome:'completed'}]}));
 assert.equal(create(db,[base]).all()[0].completed,true);
});
