(function(root){
 function valid(s){return !!s&&typeof s.id==='string'&&typeof s.name==='string'&&Number.isFinite(s.total)&&s.total>0&&Number.isFinite(s.remaining)&&s.remaining>=0&&s.remaining<=s.total&&Number.isFinite(s.updated)&&typeof s.running==='boolean'&&typeof s.finished==='boolean';}
 function advance(s,now){if(!s.running||s.finished)return {...s};const remaining=Math.max(0,s.remaining-Math.max(0,now-s.updated));return {...s,remaining,updated:Math.max(now,s.updated),running:remaining>0,finished:remaining===0};}
 const api={valid,advance};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.TempoPracticeSession=api;
})(typeof window!=='undefined'?window:globalThis);
