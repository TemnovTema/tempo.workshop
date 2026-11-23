(function(){
 const api=TempoMobileTasks,state=TempoFocusState,key='tempo-focus-v1';let session=null,shown=null,externalChange=false;
 const notice=document.createElement('p');notice.setAttribute('role','status');document.querySelector('.next-task').append(notice);
 function persist(){if(externalChange)return false;try{localStorage.setItem(key,JSON.stringify(session));return true;}catch{notice.textContent='Не удалось сохранить таймер. Не закрывайте страницу.';return false;}}
 const resultSheet=document.getElementById('focusResultSheet'),note=document.getElementById('focusResultNote'),status=resultSheet.querySelector('[data-focus-result-status]');
 function result(){
  if(shown===session.id)return;
  shown=session.id;dynamicIsland.classList.remove('expanded');dynamicIsland.setAttribute('aria-expanded','false');
  resultSheet.querySelector('[data-focus-result-title]').textContent=session.name;
  resultSheet.querySelector('[data-focus-result-time]').textContent=`${Math.floor(session.workMs/60000)} мин фокуса`;
  note.value=session.note;status.textContent='';
  resultSheet.querySelectorAll('[data-focus-outcome]').forEach(b=>{b.classList.toggle('active',b.dataset.focusOutcome===session.outcome);b.setAttribute('aria-pressed',String(b.dataset.focusOutcome===session.outcome));});
  openSheet(resultSheet);
 }
 note.addEventListener('input',()=>{if(session){session.note=note.value;if(!persist())status.textContent='Не удалось сохранить черновик.';}});
 resultSheet.querySelectorAll('[data-focus-outcome]').forEach(b=>b.addEventListener('click',()=>{session.outcome=b.dataset.focusOutcome;resultSheet.querySelectorAll('[data-focus-outcome]').forEach(n=>{n.classList.toggle('active',n===b);n.setAttribute('aria-pressed',String(n===b));});if(!persist())status.textContent='Не удалось сохранить черновик.';}));
 resultSheet.querySelector('[data-save-focus-result]').addEventListener('click',()=>{
  if(externalChange){status.textContent='Таймер изменился в другой вкладке. Обновите страницу.';return;}if(!session?.finished)return;
  const task=api.store.all().find(t=>t.id===session.taskId);
  if(!task){status.textContent='Задача удалена. Черновик итога сохранён.';return;}
  const entry={id:session.id,started:session.started,finished:session.finished,seconds:Math.floor(session.workMs/1000),outcome:session.outcome,note:note.value.trim()};
  if(!api.store.save({...task,completed:session.outcome==='completed',focusResults:[...(task.focusResults||[]).filter(r=>r.id!==session.id),entry]})){status.textContent=api.store.error();return;}
  try{localStorage.removeItem(key);}catch{}
  session=null;clearInterval(timerId);dynamicIsland.classList.remove('live','complete','expanded');closeSheets();api.refresh();notice.textContent='Итог фокуса сохранён.';
 });
 function paint(){
  if(!session)return;
  sprintStages=session.durations.map((ms,i)=>({type:i===1?'rest':'work',label:i===1?'Перерыв':'Фокус',seconds:ms/1000}));sprintIndex=session.phase;secondsLeft=Math.ceil(session.remaining/1000);stageDuration=session.durations[session.phase]/1000;timerPaused=!session.running;activeTaskTitle=session.name;islandTask.textContent=session.name;
  dynamicIsland.dataset.taskId=session.taskId;dynamicIsland.classList.add('live');dynamicIsland.classList.toggle('complete',!!session.finished);
  if(session.finished){islandTimer.textContent='Готово';dynamicIsland.setAttribute('aria-label','Фокус завершён');result();}
  else renderIsland();
 }
 function tick(){if(externalChange||!session)return;session=state.advance(session,Date.now());persist();paint();if(session.finished)clearInterval(timerId);}
 startTask=function(minutes,title,taskId){if(externalChange){notice.textContent='Таймер изменился в другой вкладке. Обновите страницу.';return;}
  closeSheets();if(session?.finished){shown=null;result();return;}if(session&&!session.finished){dynamicIsland.classList.add('expanded');return;}
  const task=taskId?api.store.all().find(t=>t.id===taskId):api.store.forDate(TempoMobileFlow.day()).find(t=>t.name===title&&!t.completed&&!t.readonly);
  if(!task||task.readonly){notice.textContent='Сначала сохраните задачу.';return;}
  const total=task.minutes*60000,first=Math.ceil(total/2),now=Date.now();
  session={id:crypto.randomUUID(),taskId:task.id,name:task.name,started:new Date(now).toISOString(),durations:[first,300000,total-first],phase:0,remaining:first,running:true,workMs:0,updated:now,note:'',outcome:'continue'};
  persist();paint();clearInterval(timerId);timerId=setInterval(tick,1000);
 };
 editorStartButton.addEventListener('click',e=>{e.stopImmediatePropagation();const task=api.selected();if(task)startTask(task.minutes,task.name,task.id);},true);
 function toggle(){if(externalChange||!session||session.finished)return;session=session.running?state.pause(session,Date.now()):state.resume(session,Date.now());persist();paint();}
 function skip(){if(externalChange||!session||session.finished)return;session=state.advance(session,Date.now());if(!session.finished){if(session.phase===2){session.finished=new Date().toISOString();session.running=false;session.remaining=0;}else{session.phase++;session.remaining=session.durations[session.phase];session.updated=Date.now();}}persist();paint();}
 dynamicIsland.addEventListener('click',e=>{if(session?.finished){e.stopImmediatePropagation();shown=null;result();return;}if(e.target.closest('[data-island-toggle]')){e.stopImmediatePropagation();toggle();}else if(e.target.closest('[data-island-skip]')){e.stopImmediatePropagation();skip();}},true);
 document.querySelector('[data-start-task]').addEventListener('click',e=>{if(!session||session.finished)return;e.stopImmediatePropagation();if(session.phase===1)skip();else toggle();},true);
 try{const saved=JSON.parse(localStorage.getItem(key));if(state.valid(saved)&&!api.store.all().find(t=>t.id===saved.taskId)?.focusResults?.some(r=>r.id===saved.id)){session=state.advance(saved,Date.now());paint();if(!session.finished){clearInterval(timerId);timerId=setInterval(tick,1000);}}}catch{notice.textContent='Не удалось восстановить таймер.';}
 window.addEventListener('storage',event=>{if(event.key===key){externalChange=true;clearInterval(timerId);notice.textContent='Таймер изменился в другой вкладке. Обновите страницу.';}});
 document.addEventListener('visibilitychange',()=>{if(session&&!session.finished)tick();});
})();
