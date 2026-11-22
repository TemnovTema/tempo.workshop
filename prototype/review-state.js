(function(root){
 const minute=t=>Number(t.slice(0,2))*60+Number(t.slice(3));
 const clock=n=>`${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;
 function plan(tasks,ids,day,tomorrow,boundaries){
   const occupied=tasks.filter(t=>t.date===tomorrow&&!t.completed).map(t=>[minute(t.time),minute(t.time)+t.minutes]);
   const changes=[],blocked=[];
   for(const task of tasks.filter(t=>ids.includes(t.id)&&t.date===day&&!t.completed&&!t.readonly).sort((a,b)=>a.time.localeCompare(b.time))){
     const role=task.project==='university'?1:['personal','none'].includes(task.project)?2:0;
     const boundary=boundaries?.[role];
     const start=boundary?Math.max(480,minute(boundary.start)):480;
     const end=boundary?Math.min(1260,minute(boundary.end)):1260;
     const preferred=minute(task.time);
     const slots=[preferred,...Array.from({length:Math.max(0,end-start+1)},(_,i)=>start+i)].filter((n,i,a)=>a.indexOf(n)===i);
     const from=slots.find(n=>n>=start&&n+task.minutes<=end&&occupied.every(([a,b])=>n+task.minutes<=a||n>=b));
     if(from===undefined){blocked.push(task.name);continue;}
     occupied.push([from,from+task.minutes]);changes.push({...task,date:tomorrow,time:clock(from),movedFrom:day});
   }
   return {changes,blocked};
 }
 function seconds(tasks,day){
   const seen=new Set();let total=0;
   for(const task of tasks)for(const r of task.focusResults||[]){
     if(seen.has(r.id)||!Number.isFinite(r.seconds)||r.seconds<0||!Number.isFinite(Date.parse(r.finished)))continue;
     seen.add(r.id);
     const date=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Moscow',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(r.finished));
     if(date===day)total+=r.seconds;
   }
   return total;
 }
 const api={plan,seconds};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.TempoReviewState=api;
})(typeof window!=='undefined'?window:globalThis);
