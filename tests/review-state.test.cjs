const {test}=require('node:test');const assert=require('node:assert/strict');
const {plan,seconds}=require('../prototype/review-state.js');
const {create}=require('../prototype/task-store.js');
const today='2026-11-17',tomorrow='2026-11-18';
const task={id:'a',name:'A',date:today,time:'10:00',minutes:60,project:'tempo',notes:''};
test('transfer keeps preferred time if available and respects protected blocks',()=>{
 const blocked={...task,id:'b',date:tomorrow,readonly:true};
 const p=plan([task,blocked],['a'],today,tomorrow);
 assert.equal(p.changes[0].time,'08:00');assert.equal(p.changes[0].date,tomorrow);assert.equal(p.changes[0].movedFrom,today);
 assert.equal(plan([task],['a'],today,tomorrow).changes[0].time,'10:00');
});
test('multiple transfers do not overlap; completed and unselected tasks stay',()=>{
 const b={...task,id:'b'},done={...task,id:'c',completed:true};
 const p=plan([task,b,done],['a','b','c'],today,tomorrow);
 assert.equal(p.changes.length,2);assert.deepEqual(p.changes.map(t=>t.time),['10:00','08:00']);
 assert.equal(plan([task],[],today,tomorrow).changes.length,0);
});
test('full tomorrow blocks transfer without changing input',()=>{
 const occupied={...task,id:'b',date:tomorrow,time:'08:00',minutes:780};
 const p=plan([task,occupied],['a'],today,tomorrow);assert.deepEqual(p.blocked,['A']);assert.equal(p.changes.length,0);assert.equal(task.date,today);
});
test('focus totals use Moscow completion day and deduplicate sessions',()=>{
 const r={id:'s',finished:'2026-11-16T22:00:00Z',seconds:65};
 assert.equal(seconds([{focusResults:[r]},{focusResults:[r,{id:'x',finished:'2026-11-16T19:00:00Z',seconds:100}]}],today),65);
});
test('batch transfer is atomic on storage failure and persists on success',()=>{
 let value=null,fail=false;const db={getItem:()=>value,setItem:(k,v)=>{if(fail)throw Error();value=v;}};
 const s=create(db,[task,{...task,id:'b'}]);const changes=plan(s.all(),['a','b'],today,tomorrow).changes;
 fail=true;assert.equal(s.saveMany(changes),false);assert.equal(s.forDate(today).length,2);
 fail=false;assert.equal(s.saveMany(changes),true);assert.equal(create(db,[]).forDate(tomorrow).length,2);
 assert.equal(plan(s.all(),['a','b'],today,tomorrow).changes.length,0);
});
