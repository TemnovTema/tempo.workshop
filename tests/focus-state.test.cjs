const {test}=require('node:test');
const assert=require('node:assert/strict');
const {advance,pause,resume,valid}=require('../prototype/focus-state.js');
const start=1700000000000;
const base={id:'s',taskId:'t',name:'Task',started:new Date(start).toISOString(),durations:[60000,30000,60000],phase:0,remaining:60000,running:true,updated:start,workMs:0,note:'draft',outcome:'partial'};
test('reload advances across rest and counts only working time',()=>{
 const s=advance(JSON.parse(JSON.stringify(base)),start+100000);
 assert.equal(s.phase,2);assert.equal(s.remaining,50000);assert.equal(s.workMs,70000);
 assert.equal(s.note,'draft');assert.equal(s.outcome,'partial');assert.ok(valid(s));
});
test('offline completion caps work and preserves actual finish time',()=>{
 const s=advance(base,start+999999);
 assert.equal(s.workMs,120000);assert.equal(s.running,false);assert.equal(s.finished,new Date(start+150000).toISOString());
 assert.deepEqual(advance(s,start+2000000),s);
});
test('paused timer survives reload without counting closed time',()=>{
 const s=pause(base,start+10000), restored=advance(s,start+100000);
 assert.equal(restored.remaining,50000);assert.equal(restored.workMs,10000);
 const next=advance(resume(restored,start+100000),start+110000);
 assert.equal(next.remaining,40000);assert.equal(next.workMs,20000);
});
test('clock rollback does not duplicate elapsed work and invalid records are rejected',()=>{
 const s=advance(base,start+10000);assert.deepEqual(advance(s,start),s);
 for(const patch of [{remaining:-1},{phase:3},{running:'yes'},{updated:null},{outcome:'bad'}])assert.equal(valid({...base,...patch}),false);
});
