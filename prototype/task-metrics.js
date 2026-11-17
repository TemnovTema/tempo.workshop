(function(root){
  // Доступное время в сетке 08:00–21:00; защищённые блоки тоже занимают окно.
  function summarize(tasks){
    const pending=tasks.filter(t=>!t.completed);
    const planned=pending.filter(t=>!t.readonly).reduce((sum,t)=>sum+t.minutes,0);
    const intervals=pending.map(t=>{const [h,m]=t.time.split(':').map(Number);return [Math.max(480,h*60+m),Math.min(1260,h*60+m+t.minutes)];}).filter(([a,b])=>b>a).sort((a,b)=>a[0]-b[0]);
    let occupied=0,end=480;
    for(const [from,to] of intervals){occupied+=Math.max(0,to-Math.max(end,from));end=Math.max(end,to);}
    return {planned,free:780-occupied};
  }
  const api={summarize};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.TempoTaskMetrics=api;
})(typeof window!=='undefined'?window:globalThis);
