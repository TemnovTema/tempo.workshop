(function(){
 const api=TempoMobileTasks,originalPrepare=prepareTaskSheet;
 const block=taskSheet.querySelector('.sheet-time');
 const details=document.createElement('details'),summary=document.createElement('summary');
 summary.className=block.className;summary.innerHTML=block.innerHTML;
 const fields=document.createElement('div');fields.className='auth-email-form';
 const inputs={};
 for(const [id,label,type] of [['date','Дата','date'],['time','Начало','time'],['minutes','Длительность, мин','number']]){
  const row=document.createElement('label');row.textContent=label;const input=document.createElement('input');input.type=type;input.required=true;input.setAttribute('aria-label',label);
  if(id==='minutes'){input.min='1';input.max='780';input.step='1';}if(id==='time'){input.min='08:00';input.max='20:59';}
  inputs[id]=input;row.append(input);fields.append(row);
 }
 details.append(summary,fields);block.replaceWith(details);
 prepareTaskSheet=function(mode,title,source){
  originalPrepare(mode,title,source);const task=mode==='edit'?api.selected():null;
  inputs.date.value=task?.date||api.date();inputs.time.value=task?.time||'10:00';inputs.minutes.value=task?.minutes||50;details.open=false;
  taskSheet.dataset.taskColor=task?.mobileColor||({tempo:'coral',university:'blue',personal:'lime',team:'violet'})[task?.project]||'coral';
  taskSheet.querySelectorAll('[data-task-color]').forEach(b=>b.classList.toggle('active',b.dataset.taskColor===taskSheet.dataset.taskColor));
  if(!task){summary.querySelector('b').textContent=inputs.date.value+', 10:00';summary.querySelector('small').textContent='50 минут · изменить';}
 };
 const save=api.store.save;
 api.store.save=function(record){
  // Only the task editor supplies participants; focus-result writes bypass this adapter.
  if(activeSheet!==taskSheet)return save(record);
  if(!Object.values(inputs).every(n=>n.checkValidity())){details.open=true;Object.values(inputs).find(n=>!n.checkValidity()).reportValidity();return false;}
  const edited={...record,date:inputs.date.value,time:inputs.time.value,minutes:Number(inputs.minutes.value)};
  const ok=save(edited);if(!ok)details.open=true;else api.setDate(edited.date);return ok;
 };
})();
