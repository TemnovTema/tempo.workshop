const {test}=require('node:test');const assert=require('node:assert/strict');const vm=require('node:vm');const fs=require('node:fs');
const source=fs.readFileSync(require.resolve('../prototype/tempo-app.js'),'utf8');
test('timer completes, stops intervals, and repeating resets the player',()=>{
 const nodes=new Map();const node=k=>{if(!nodes.has(k))nodes.set(k,{textContent:'',hidden:false});return nodes.get(k);};
 const classes=new Set();const intervals=new Map();let id=0;
 const context=vm.createContext({practiceTimer:null,breathTimer:null,practiceSeconds:0,lastMeditation:null,reflectionPlayer:{setAttribute(){}},meditationPlayer:{querySelector:node,classList:{add:k=>classes.add(k),remove:k=>classes.delete(k),contains:k=>classes.has(k),toggle:(k,v)=>v?classes.add(k):classes.delete(k)}},document:{querySelector:node},window:{setInterval:fn=>{intervals.set(++id,fn);return id;},clearInterval:i=>intervals.delete(i)}});
 vm.runInContext(source.slice(source.indexOf('function stopPracticeTimers()'),source.indexOf('function renderReflectionQuestion()')),context);
 vm.runInContext("startMeditation('Дыхание 4 × 6',true)",context);
 assert.equal(context.practiceSeconds,240);const tick=intervals.get(context.practiceTimer);
 classes.add('paused');tick();assert.equal(context.practiceSeconds,240);classes.delete('paused');
 for(let i=0;i<240;i++)tick();
 assert.equal(node('strong').textContent,'Готово');assert.equal(intervals.size,0);assert.equal(node('.practice-complete-actions').hidden,false);
 vm.runInContext("startMeditation('Дыхание 4 × 6',true)",context);
 assert.equal(context.practiceSeconds,240);assert.equal(node('.player-pause').hidden,false);assert.equal(node('.practice-complete-actions').hidden,true);assert.equal(intervals.size,2);
});
