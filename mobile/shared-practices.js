(function(){
 const F=TempoMobileFlow,key='tempo-mobile-practice-v1';let current=null,tickId;
 const reflection=F.sheet('reflectionSheet','Рефлексия');let reflectionStore,state,prompts;
 function renderReflection(){
  reflection.body.replaceChildren();
  if(state.complete){const h=document.createElement('h3');h.textContent='Рефлексия завершена';reflection.body.append(h);prompts.forEach((q,i)=>{const p=document.createElement('p');p.textContent=q+'\n'+(state.answers[i]||'Без ответа');reflection.body.append(p);});reflection.body.append(F.button('Вернуться к ответам',()=>navigate(0,false)),F.button('К практикам',()=>closeSheets(),true));return;}
  const p=document.createElement('p');p.textContent=`${state.index+1} из ${prompts.length} · ${prompts[state.index]}`;reflection.body.append(p);
  const answer=F.field(reflection.body,'Ваш ответ','textarea',state.answers[state.index]);answer.oninput=()=>{state.answers[state.index]=answer.value;saveReflection();};
  if(state.index)reflection.body.append(F.button('Назад',()=>navigate(state.index-1)));
  reflection.body.append(F.button(state.index===prompts.length-1?'Завершить':'Следующий вопрос',()=>navigate(Math.min(prompts.length-1,state.index+1),state.index===prompts.length-1),true));
 }
 function saveReflection(){const ok=reflectionStore.save(state);reflection.status.textContent=ok?'Ответы сохранены':reflectionStore.error();return ok;}
 function navigate(index,complete=false){const old={...state};state={...state,index,complete};if(saveReflection())renderReflection();else state=old;}
 function save(){return F.write(key,current,practiceStatus);}
 const practiceStatus=document.createElement('p');practiceStatus.setAttribute('role','status');practiceSheet.append(practiceStatus);
 function advance(){if(current)current=TempoPracticeSession.advance(current,Date.now());}
 function paint(){if(!current)return;const seconds=Math.ceil(current.remaining/1000);practiceTimer.textContent=`${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;practiceStartButton.querySelector('i').className='ph ph-'+(current.running?'pause':'play');practiceStartButton.setAttribute('aria-label',current.running?'Приостановить практику':'Продолжить практику');practiceSheet.classList.toggle('running-session',current.running);practiceStartButton.classList.toggle('running',current.running);const elapsed=Math.floor((current.total-current.remaining)/1000);renderPracticeStages(selectedPracticeAnimation==='breathe'?(elapsed%10<4?0:1):Math.min(selectedPracticeStages.length-1,Math.floor(elapsed/(current.total/1000/selectedPracticeStages.length))));if(current.finished){showPracticeFeedback();}}
 function timer(){clearInterval(tickId);tickId=setInterval(()=>{if(!current?.running)return;advance();if(!save())current.running=false;paint();},1000);}
 document.querySelectorAll('[data-practice]').forEach(b=>b.addEventListener('click',e=>{
  const name=b.dataset.practice;
  if(TempoReflectionPrompts[name]){e.stopImmediatePropagation();prompts=TempoReflectionPrompts[name];reflectionStore=TempoReflectionState.create(localStorage,name,prompts.length);state=reflectionStore.read();reflection.el.querySelector('h2').textContent=name;reflection.status.textContent=reflectionStore.error();renderReflection();reflection.open();return;}
  // Runs after the original click has configured the approved player.
  queueMicrotask(()=>{const saved=F.read(key,null);current=TempoPracticeSession.valid(saved)&&saved.name===name?saved:{id:crypto.randomUUID(),name,total:selectedPracticeMinutes*60000,remaining:selectedPracticeMinutes*60000,updated:Date.now(),running:false,finished:false,note:'',feedback:[]};advance();practiceFeedback.querySelector('textarea').value=current.note||'';document.querySelectorAll('.feedback-options button').forEach(n=>n.classList.toggle('active',(current.feedback||[]).includes(n.textContent)));practiceStatus.textContent='';paint();timer();});
 },true));
 practiceStartButton.addEventListener('click',e=>{e.stopImmediatePropagation();if(!current)return;advance();current.running=!current.running;current.updated=Date.now();if(save()){paint();timer();}else current.running=false;},true);
 practiceFinishEarly.addEventListener('click',e=>{e.stopImmediatePropagation();if(!current)return;advance();current.running=false;current.finished=true;if(save())paint();},true);
 practiceFeedback.addEventListener('input',()=>{if(!current)return;current.note=practiceFeedback.querySelector('textarea').value;save();});
 document.querySelectorAll('.feedback-options button').forEach(b=>b.addEventListener('click',()=>{current.feedback=[...document.querySelectorAll('.feedback-options button.active')].map(n=>n.textContent);save();}));
 for(const id of ['practiceFeedbackSave','practiceFeedbackSkip'])document.getElementById(id).addEventListener('click',e=>{e.stopImmediatePropagation();if(!current)return;const history=F.read('tempo-practice-history-v1',[]);const entry={...current,finished:new Date().toISOString(),seconds:Math.floor((current.total-current.remaining)/1000)};if(!Array.isArray(history)){practiceStatus.textContent='Не удалось прочитать историю. Экспортируйте данные в профиле.';return;}if(!F.write('tempo-practice-history-v1',[...history.filter(r=>r.id!==entry.id),entry],practiceStatus))return;if(!F.write(key,null,practiceStatus))return;current=null;clearInterval(tickId);closeSheets();},true);
 // Closing pauses the session rather than losing progress or silently running another practice.
 const originalClose=closeSheets;closeSheets=function(options){if(current?.running){advance();current.running=false;save();}return originalClose(options);};
 document.addEventListener('click',e=>{if((e.target.closest('.sheet-close')||e.target===backdrop)&&current?.running){advance();current.running=false;save();paint();}},true);
 document.addEventListener('visibilitychange',()=>{advance();if(current){save();paint();}});
 document.querySelectorAll('.soundscape-picker button,.practice-controls button[aria-label="Звук"]').forEach(b=>{b.disabled=true;b.title='Аудио пока недоступно';});
})();
