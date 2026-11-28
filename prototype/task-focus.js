(function () {
  window.TempoTaskFocus = function ({store, refresh, report}) {
    let session=null;
    const key='tempo-focus-v1';
    const state=TempoFocusState;
    const notice=document.createElement('p');notice.setAttribute('role','status');focusPlan.append(notice);
    function persist(){
      try{if(session)localStorage.setItem(key,JSON.stringify(session));else localStorage.removeItem(key);notice.textContent='';}
      catch{notice.textContent='Не удалось сохранить сессию. Не закрывайте страницу до сохранения результата.';}
    }
    function sync(){
      if(!session)return;
      focusTaskName=session.name;focusTotalMinutes=(session.durations[0]+session.durations[2])/60000;
      focusSprintOne=session.durations[0]/60000;focusSprintTwo=session.durations[2]/60000;focusBreakMinutes=session.durations[1]/60000;
      focusPhase=session.phase===1?'rest':'work';focusSprint=session.phase===2?2:1;focusSeconds=Math.ceil(session.remaining/1000);focusRunning=session.running;
    }
    const result=document.querySelector('[data-view-panel="focus-result"]');
    const choices=[...result.querySelectorAll('.outcome-options button')];
    const note=result.querySelector('textarea');
    const save=result.querySelector('.focus-result-impact .primary-action');
    const finish=document.createElement('button');finish.type='button';finish.className='focus-plan-pause';finish.textContent='Завершить сессию';focusPlan.append(finish);
    function showPlan(){focusCardDismissed=false;focusPlan.classList.add('open');focusPlan.setAttribute('aria-hidden','false');}
    function account(){if(session){session=state.advance(session,Date.now());sync();}}
    function stop(){account();clearInterval(focusInterval);if(session)session.running=false;focusRunning=false;persist();}
    function finishSession(){
      if(!session)return;
      if(!session.finished){stop();session.finished=new Date().toISOString();}
      choices.forEach((b,i)=>{const selected=['completed','continue','partial'][i]===session.outcome;b.classList.toggle('active',selected);b.setAttribute('aria-pressed',String(selected));});note.value=session.note;persist();
      focusPlan.classList.remove('open');focusPlan.setAttribute('aria-hidden','true');
      result.querySelector('[data-task-error]')?.remove();
      result.querySelector('header .section-label').textContent='Сессия остановлена · сохраните результат';
      result.querySelector('.result-orbit strong').textContent=Math.floor(session.workMs/60000);
      result.querySelector('.result-orbit span').textContent='минут работы';
      result.querySelector('.focus-result-summary > p').textContent=session.name;
      result.querySelector('.focus-result-impact h2').textContent='Итог сессии';
      result.querySelector('.focus-result-impact > p').textContent='Время фокуса сохранится в итогах дня.';
      result.querySelector('.impact-timeline')?.remove();
      result.querySelector('#focusResultTitle').textContent='Что получилось?';
      workRestSwitch.setAttribute('aria-label','Открыть результат фокуса');
      choices[1].querySelector('small').textContent='Оставим в плане';
      choices[2].querySelector('small').textContent='Оставим в плане с заметкой';
      openView('focus-result');
    }
    function tick(){
      account();persist();
      if(session?.finished){clearInterval(focusInterval);finishSession();}else renderFocusPlan();
    }
    runFocusTimer=function(){
      clearInterval(focusInterval);session=state.resume(session,Date.now());sync();persist();
      focusInterval=setInterval(tick,1000);renderFocusPlan();
    };
    const oldRender=renderFocusPlan;
    renderFocusPlan=function(){oldRender();workRestSwitch.setAttribute('aria-label',session?'Открыть текущую фокус-сессию':'Начать фокус по плану');};
    startFocusPlan=function(name,totalMinutes,id){
      if(session){if(session.finished)finishSession();else showPlan();return;}
      const task=store.all().find(t=>t.id===id);
      if(!task||task.completed||task.readonly)return;
      session={id:crypto.randomUUID(),taskId:task.id,name:task.name,started:new Date().toISOString(),workMs:0,durations:[Math.ceil(task.minutes/2)*60000,(task.minutes>60?10:5)*60000,Math.floor(task.minutes/2)*60000],phase:0,remaining:Math.ceil(task.minutes/2)*60000,running:false,updated:Date.now(),note:'',outcome:'continue'};
      focusTaskName=task.name;focusTotalMinutes=task.minutes;focusSprintOne=Math.ceil(task.minutes/2);focusSprintTwo=Math.floor(task.minutes/2);focusBreakMinutes=task.minutes>60?10:5;focusSprint=1;focusCardDismissed=false;
      runFocusTimer();showPlan();
    };
    [focusPlanPause,document.querySelector('[data-focus-pause]')].forEach(button=>button.addEventListener('click',event=>{
      event.stopImmediatePropagation();if(!session||session.finished)return;
      if(focusRunning)stop();else runFocusTimer();renderFocusPlan();
    },true));
    workRestSwitch.addEventListener('click',event=>{
      event.stopImmediatePropagation();
      if(session){if(session.finished)finishSession();else showPlan();}
      else {const task=store.forDate(new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Moscow',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())).find(t=>!t.completed&&!t.readonly);if(task)startFocusPlan(task.name,task.minutes,task.id);}
    },true);
    finish.addEventListener('click',finishSession);
    document.querySelector('[data-focus-complete]').addEventListener('click',event=>{event.stopImmediatePropagation();finishSession();},true);
    save.addEventListener('click',event=>{
      event.stopImmediatePropagation();if(!session)return;
      const task=store.all().find(t=>t.id===session.taskId);
      if(!task){report(result);return;}
      const outcome=['completed','continue','partial'][choices.findIndex(b=>b.classList.contains('active'))]||'continue';
      const entry={id:session.id,started:session.started,finished:session.finished,seconds:Math.floor(session.workMs/1000),outcome,note:note.value.trim()};
      const history=(task.focusResults||[]).filter(item=>item.id!==entry.id);
      if(!store.save({...task,completed:outcome==='completed',focusResults:[...history,entry]})){report(result);return;}
      session=null;persist();focusTaskName='';focusSeconds=0;focusPhase='rest';renderFocusPlan();refresh();openView('today');
    },true);

    note.addEventListener('input',()=>{if(session?.finished){session.note=note.value;persist();}});
    choices.forEach((button,i)=>button.addEventListener('click',()=>{choices.forEach(b=>b.setAttribute('aria-pressed',String(b===button)));if(session?.finished){session.outcome=['completed','continue','partial'][i];persist();}}));
    window.addEventListener('pagehide',()=>{account();persist();});
    document.addEventListener('visibilitychange',()=>{if(session){account();persist();}});
    try{
      const raw=localStorage.getItem(key);
      if(raw){
        const saved=JSON.parse(raw);
        if(!state.valid(saved))throw Error('invalid');
        const task=store.all().find(t=>t.id===saved.taskId);
        if(!task || task.focusResults?.some(r=>r.id===saved.id)){localStorage.removeItem(key);}
        else{
          session=state.advance(saved,Date.now());sync();persist();
          if(session.finished)finishSession();
          else{renderFocusPlan();showPlan();if(session.running)focusInterval=setInterval(tick,1000);}
        }
      }
    }catch{notice.textContent='Не удалось восстановить сохранённую сессию.';showPlan();}
  };
})();
