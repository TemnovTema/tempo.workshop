(function(root){
 function valid(s,count){return s&&Array.isArray(s.answers)&&s.answers.length===count&&s.answers.every(a=>typeof a==='string')&&Number.isInteger(s.index)&&s.index>=0&&s.index<count&&typeof s.complete==='boolean';}
 function create(storage,name,count){
  const key='tempo-reflection-v1:'+name;let state={answers:Array(count).fill(''),index:0,complete:false},error='';
  try{const raw=storage.getItem(key);if(raw){const parsed=JSON.parse(raw);if(!valid(parsed,count))throw Error();state=parsed;}}catch{error='Не удалось восстановить ответы.';}
  return {read:()=>({...state,answers:[...state.answers]}),error:()=>error,save(next){if(!valid(next,count))return false;try{storage.setItem(key,JSON.stringify(next));state={...next,answers:[...next.answers]};error='';return true;}catch{error='Не удалось сохранить ответы. Не закрывайте практику и попробуйте ещё раз.';return false;}}};
 }
 const api={create,valid};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.TempoReflectionState=api;
})(typeof window!=='undefined'?window:globalThis);
