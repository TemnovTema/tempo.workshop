(function(){
 window.TempoTaskReview=function({store,dayKey,refresh,report}){
  const panel=document.querySelector('[data-view-panel="review"]'),list=panel.querySelector('.review-list'),note=panel.querySelector('textarea'),save=panel.querySelector('.tomorrow-preview .primary-action');
  const day=dayKey(calendarToday),next=new Date(calendarToday);next.setDate(next.getDate()+1);const tomorrow=dayKey(next),key=`tempo-review-${day}`;
  let selected=new Set(),saved={},proposal;
  const rows=document.createElement('div');list.querySelectorAll('article').forEach(n=>n.remove());list.querySelector('header').after(rows);
  const message=document.createElement('p');message.setAttribute('role','status');save.before(message);
  panel.querySelector('.tomorrow-bars').remove();
  const duration=n=>`${Math.floor(n/60)} ч ${n%60} мин`;
  function persist(){try{localStorage.setItem(key,JSON.stringify(saved));return true;}catch{message.textContent='Не удалось сохранить итог в браузере. Попробуйте ещё раз.';return false;}}
  function preview(){
    proposal=TempoReviewState.plan(store.all(),[...selected],day,tomorrow);
    const total=store.forDate(tomorrow).filter(t=>!t.completed&&!t.readonly).reduce((s,t)=>s+t.minutes,0)+proposal.changes.reduce((s,t)=>s+t.minutes,0);
    panel.querySelector('.tomorrow-preview > strong').textContent=duration(total);
    panel.querySelector('.tomorrow-preview h3').textContent=`К переносу: ${proposal.changes.length}`;
    panel.querySelectorAll('.tomorrow-preview > p')[1].textContent=proposal.blocked.length?`Нет свободного окна: ${proposal.blocked.join(', ')}. Снимите выбор или освободите время в календаре.`:'Время подбирается без пересечений в пределах 08:00–21:00, включая защищённые блоки.';
    save.disabled=proposal.blocked.length>0;
    rows.querySelectorAll('[data-transfer-time]').forEach(span=>{const task=proposal.changes.find(t=>t.id===span.dataset.transferTime);span.textContent=task?`Завтра · ${task.time} · ${task.minutes} мин`:'Оставить на сегодня';});
  }
  function render(){
    try{saved=JSON.parse(localStorage.getItem(key)||'{}');if(!saved||typeof saved!=='object')saved={};}catch{saved={};message.textContent='Не удалось прочитать заметку дня.';}
    note.value=typeof saved.note==='string'?saved.note:'';selected.clear();rows.replaceChildren();
    const tasks=store.all().filter(t=>!t.readonly&&(t.date===day||t.movedFrom===day));
    panel.querySelector('.review-intro .date-line').textContent=`Итог дня · ${calendarToday.toLocaleDateString('ru-RU',{day:'numeric',month:'long'})}`;
    panel.querySelector('#reviewTitle').textContent=saved.closed?'Итог дня сохранён':'Подведём итог дня';
    panel.querySelector('.review-intro .intro-meta p').textContent='Выберите задачи для переноса. Остальные останутся на своей дате. Изменения применятся после сохранения.';
    panel.querySelector('.review-ring strong').textContent=tasks.filter(t=>t.completed).length;
    panel.querySelector('.review-ring span').textContent=`из ${tasks.length} задач завершено`;
    const secs=TempoReviewState.seconds(store.all(),day);
    panel.querySelector('.review-score h2').textContent=`${duration(Math.floor(secs/60))} фокуса`;
    panel.querySelector('.review-score p').textContent='По сохранённым сессиям, завершённым сегодня. Перерывы не учитываются.';
    list.querySelector('header h2').textContent='Задачи и переносы';
    for(const task of tasks){
      const row=document.createElement('article'),copy=document.createElement('div'),name=document.createElement('strong'),meta=document.createElement('span');name.textContent=task.name;
      copy.append(name,meta);
      if(!task.completed&&task.date===day){const check=document.createElement('input');check.type='checkbox';check.setAttribute('aria-label',`Перенести на завтра: ${task.name}`);check.addEventListener('change',()=>{if(check.checked)selected.add(task.id);else selected.delete(task.id);preview();});row.append(check);meta.dataset.transferTime=task.id;}
      else meta.textContent=task.completed?'Завершено':`Перенесено · ${task.date} · ${task.time}`;
      row.append(copy);rows.append(row);
    }
    if(!tasks.length)rows.textContent='На сегодня задач нет. Можно сохранить заметку дня.';
    save.textContent='Сохранить итог дня';preview();
  }
  note.addEventListener('input',()=>{saved.note=note.value;persist();});
  save.addEventListener('click',event=>{
    event.stopImmediatePropagation();preview();if(proposal.blocked.length)return;
    saved.note=note.value;if(!persist())return;
    if(!store.saveMany(proposal.changes)){report(panel);return;}
    saved.closed=new Date().toISOString();if(!persist()){refresh();return;}
    refresh();render();message.textContent='Итог сохранён. Выбранные задачи перенесены в календаре.';
  },true);
  const back=document.createElement('button');back.type='button';back.className='secondary-action';back.textContent='Вернуться к дню';back.addEventListener('click',()=>openView('today'));save.after(back);
  const original=openView;openView=function(name){if(name==='review')render();original(name);};
  if(location.hash==='#review')render();
 };
})();
