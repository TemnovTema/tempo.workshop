(function () {
  window.TempoTaskToday = function ({store, makeTask, dayKey}) {
    let selectedId;
    const agenda = document.querySelector('.mini-agenda');
    const start = document.querySelector('[data-focus-start]');
    const alternatives = document.querySelector('.alternative-stack');
    const duration = n => `${Math.floor(n/60)} ч ${n%60} мин`;
    const clock = n => `${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;
    const toMinutes = time => Number(time.slice(0,2))*60+Number(time.slice(3));
    const todayTasks = () => store.forDate(dayKey(calendarToday),'all');
    const available = () => todayTasks().filter(t=>!t.readonly&&!t.completed);
    function choose() {
      const tasks=available();
      return tasks.find(t=>t.id===selectedId)||tasks[0];
    }
    function render() {
      const tasks=todayTasks(), next=choose();
      document.querySelector('.today-intro .date-line').textContent=calendarToday.toLocaleDateString('ru-RU',{weekday:'long',day:'numeric',month:'long'});
      document.getElementById('todayTitle').textContent='Ваш день, Артём';
      selectedId=next?.id;
      document.getElementById('timelineTitle').textContent=`События: ${tasks.length} · готово: ${tasks.filter(t=>t.completed).length}`;
      agenda.replaceChildren();
      if(!tasks.length){const empty=document.createElement('li');empty.textContent='На сегодня ничего не запланировано.';agenda.append(empty);}
      tasks.forEach(task=>{
        const row=document.createElement('li');row.className=task.completed?'done':task.id===selectedId?'current':'';
        const time=document.createElement('time');time.textContent=task.time;
        const copy=document.createElement('div'), name=document.createElement('strong'), meta=document.createElement('span');
        name.textContent=task.name;meta.textContent=task.completed?'завершено':`${task.minutes} мин${task.readonly?' · свободный блок':''}`;
        copy.append(name,meta);row.append(time,copy);
        if(!task.readonly){row.tabIndex=0;row.setAttribute('role','button');row.setAttribute('aria-label',`Открыть задачу ${task.name}`);row.addEventListener('click',()=>openCalendarTask(makeTask(task,'day')));row.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();row.click();}});}
        agenda.append(row);
      });
      const totals=TempoTaskMetrics.summarize(tasks);
      const metrics=document.querySelectorAll('.desktop-balance-metrics strong');
      metrics[0].textContent=duration(totals.planned);metrics[1].textContent=duration(totals.free);
      metrics[1].parentElement.querySelector('span').textContent='свободно · 08–21';
      metrics[1].parentElement.title='Без незавершённых задач и защищённых блоков. Пересечения учитываются один раз.';
      document.getElementById('nextActionTitle').textContent=next?.name || (tasks.length?'Все задачи на сегодня завершены':'На сегодня задач нет');
      document.querySelector('.time-window').textContent=next?`${next.time}–${clock(toMinutes(next.time)+next.minutes)}`:'';
      start.disabled=!next;start.replaceChildren(document.createTextNode(next?'Начать фокус ':'Нет задач для фокуса'));
      if(next){const span=document.createElement('span');span.textContent=`${next.minutes} мин`;start.append(span);}
      alternatives.replaceChildren();
      const options=available().filter(t=>t.id!==selectedId);
      options.forEach(task=>{const button=document.createElement('button');button.type='button';button.className='secondary-action';button.textContent=`${task.name} · ${task.minutes} мин`;button.addEventListener('click',()=>{selectedId=task.id;render();});alternatives.append(button);});
      document.querySelector('[data-alternatives]').disabled=!options.length;
    }
    start.addEventListener('click',event=>{
      event.stopImmediatePropagation();
      const task=choose();if(task) startFocusPlan(task.name,task.minutes,task.id);
    },true);
    document.querySelector('.today-timeline [data-open-view="calendar"]').addEventListener('click',()=>{
      calendarDate=new Date(calendarToday);filterCalendarByProject('all');document.querySelector('[data-calendar-mode="day"]').click();
    });
    const originalOpen=openView;
    openView=function(name){if(name==='today')render();originalOpen(name);};
    return render;
  };
})();
