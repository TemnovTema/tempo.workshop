(function () {
  window.TempoTaskProjects = function ({ store, makeTask, renderCalendar, report }) {
    const escape = text => String(text).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const dateLabel = date => new Date(`${date}T12:00:00`).toLocaleDateString('ru-RU',{day:'numeric',month:'short'});
    function records(key) {
      return store.all().filter(t => t.project === key && !t.readonly).sort((a,b)=>`${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
    }
    function update() {
      for (const [key,data] of Object.entries(calendarProjectData)) {
        const tasks=records(key), done=tasks.filter(t=>t.completed).length;
        const minutes=tasks.filter(t=>!t.completed).reduce((sum,t)=>sum+t.minutes,0);
        data.progress=tasks.length ? Math.round(done/tasks.length*100) : 0;
        data.hours=`${Math.floor(minutes/60)} ч ${minutes%60} мин`;
        data.tasks=tasks.map(t=>[escape(t.name),'Вы',`${dateLabel(t.date)} · ${t.time}`,t.completed?'Завершено':'Запланировано']);
      }
    }
    function open(task) { openCalendarTask(makeTask(task,'day')); }
    const oldPeek=renderProjectPeek;
    renderProjectPeek=function(key){ update();oldPeek(key); };
    const oldWorkspace=renderProjectWorkspace;
    renderProjectWorkspace=function(data){
      update();oldWorkspace(data);
      const key=Object.keys(calendarProjectData).find(k=>calendarProjectData[k]===data);
      const tasks=records(key);
      document.getElementById('projectWorkspaceDone').textContent=`${tasks.filter(t=>t.completed).length} из ${tasks.length} задач готовы`;
      document.querySelectorAll('#projectTaskRows article').forEach((row,index)=>{
        row.tabIndex=0;row.setAttribute('role','button');row.setAttribute('aria-label',`Открыть задачу ${tasks[index].name}`);
        row.addEventListener('click',()=>open(tasks[index]));
        row.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();open(tasks[index]);}});
      });
    };
    const oldInline=renderInlineProjectDetails;
    renderInlineProjectDetails=function(key){
      update();oldInline(key);
      const list=document.getElementById('projectInlineTasks');list.replaceChildren();
      const tasks=records(key);
      if(!tasks.length){const empty=document.createElement('p');empty.textContent='В проекте пока нет задач. Добавьте первую.';list.append(empty);}
      tasks.forEach(task=>{
        const row=document.createElement('article');
        const check=document.createElement('button');check.type='button';check.className=`project-inline-check${task.completed?' done':''}`;
        check.setAttribute('aria-label',`${task.completed?'Вернуть в работу':'Завершить'}: ${task.name}`);
        check.setAttribute('aria-pressed',String(!!task.completed));
        check.addEventListener('click',event=>{
          event.stopPropagation();
          if(!store.save({...task,completed:!task.completed})){report(list);return;}
          renderCalendar();
        });
        const copy=document.createElement('div'),name=document.createElement('strong'),owner=document.createElement('span');
        name.textContent=task.name;owner.textContent='Вы';copy.append(name,owner);
        const time=document.createElement('time');time.textContent=`${dateLabel(task.date)} · ${task.time}`;
        const state=document.createElement('em');state.textContent=task.completed?'Завершено':'Запланировано';
        const edit=document.createElement('button');edit.type='button';edit.className='project-inline-more';edit.textContent='Открыть';edit.setAttribute('aria-label',`Открыть задачу ${task.name}`);edit.addEventListener('click',()=>open(task));
        row.append(check,copy,time,state,edit);list.append(row);
      });
    };
    return function refresh() {
      update();renderProjectPeek(calendarProjectFilter);
      if(document.querySelector('.calendar-stage').classList.contains('project-details-open')) renderInlineProjectDetails(activeProjectKey);
      if(calendarProjectDialog.open && activeProjectKey) renderProjectWorkspace(calendarProjectData[activeProjectKey]);
    };
  };
})();
