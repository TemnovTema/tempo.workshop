(function(root){
  function valid(s){return !!s && typeof s.id==='string' && typeof s.taskId==='string' && typeof s.name==='string' && Number.isFinite(Date.parse(s.started)) && Array.isArray(s.durations) && s.durations.length===3 && s.durations.every(n=>Number.isFinite(n)&&n>=0) && Number.isInteger(s.phase) && s.phase>=0 && s.phase<3 && typeof s.running==='boolean' && Number.isFinite(s.remaining) && s.remaining>=0 && s.remaining<=s.durations[s.phase] && Number.isFinite(s.workMs) && s.workMs>=0 && Number.isFinite(s.updated) && s.updated>0 && typeof s.note==='string' && ['completed','continue','partial'].includes(s.outcome) && (!s.finished || (Number.isFinite(Date.parse(s.finished))&&!s.running));}
  function advance(s,now){
    s={...s};if(!s.running||s.finished)return s;
    let elapsed=Math.max(0,now-s.updated),cursor=s.updated;
    while(elapsed>=s.remaining){
      if(s.phase!==1)s.workMs+=s.remaining;
      elapsed-=s.remaining;cursor+=s.remaining;
      if(s.phase===2){s.remaining=0;s.running=false;s.finished=new Date(cursor).toISOString();s.updated=now;return s;}
      s.phase++;s.remaining=s.durations[s.phase];
    }
    if(s.phase!==1)s.workMs+=elapsed;
    s.remaining-=elapsed;s.updated=Math.max(now,s.updated);return s;
  }
  function pause(s,now){s=advance(s,now);return {...s,running:false};}
  function resume(s,now){return s.finished?s:{...s,running:true,updated:now};}
  const api={valid,advance,pause,resume};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.TempoFocusState=api;
})(typeof window!=='undefined'?window:globalThis);
