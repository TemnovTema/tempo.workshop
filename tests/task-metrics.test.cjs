const {test}=require('node:test');const assert=require('node:assert/strict');
const {summarize}=require('../prototype/task-metrics.js');
test('overlaps count once even when records are unsorted',()=>{
 assert.deepEqual(summarize([{time:'10:30',minutes:60},{time:'10:00',minutes:60}]),{planned:120,free:690});
});
test('protected blocks reduce free time but not planned task workload',()=>{
 assert.deepEqual(summarize([{time:'10:00',minutes:60},{time:'18:00',minutes:120,readonly:true},{time:'12:00',minutes:90,completed:true}]),{planned:60,free:600});
});
test('empty day, nested intervals and full day have bounded free time',()=>{
 assert.deepEqual(summarize([]),{planned:0,free:780});
 assert.deepEqual(summarize([{time:'08:00',minutes:780,readonly:true},{time:'10:00',minutes:60}]),{planned:60,free:0});
});
