// Opt-in seed for an empty browser origin. Existing calendars are never replaced.
(function () {
  if (new URLSearchParams(location.search).get('demo') !== '1') return;
  try {
    const previous=localStorage.getItem('tempo-tasks-v1');
    if(previous !== null && (localStorage.getItem('tempo-demo-layout-v2') || !JSON.parse(previous).some(t=>t.id.startsWith('showcase-')))) return;
    if(previous !== null) localStorage.setItem('tempo-demo-backup-v1',previous);
    const today = new Intl.DateTimeFormat('en-CA', {timeZone:'Europe/Moscow',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
    const base = new Date(today + 'T12:00:00Z');
    const monday = new Date(base); monday.setUTCDate(base.getUTCDate() - (base.getUTCDay() + 6) % 7);
    const tasks = [];
    const titles = ['Исследование сценариев','Макет главного экрана','Детали календаря','Собрать прототип','Подготовить презентацию'];
    function add(date, time, minutes, project, name, notes = '') {
      tasks.push({id:`showcase-${tasks.length}`,date,time,minutes,project,name,notes,completed:false});
    }
    const schedule=[
      [['09:15',120,'university','Исследование'],['15:00',90,'team','Созвон']],
      [['10:15',150,'tempo','Прототип'],['16:00',120,'university','Учёба']],
      [['10:30',120,'tempo','Главный экран'],['13:00',60,'team','Синхронизация'],['15:15',150,'tempo','Проверка']],
      [['09:30',90,'personal','Планирование дня'],['12:00',180,'university','Курсовая']],
      [['10:00',90,'team','Команда'],['14:00',120,'tempo','Сборка']],
      [['12:30',90,'personal','Прогулка']],
      [['15:30',90,'personal','Растяжка и восстановление']]
    ];
    const first=new Date(Date.UTC(base.getUTCFullYear(),base.getUTCMonth(),1,12));
    const end=new Date(Date.UTC(base.getUTCFullYear(),base.getUTCMonth()+12,1,12));
    for(let date=new Date(first);date<end;date.setUTCDate(date.getUTCDate()+1)){
      const day=(date.getUTCDay()+6)%7;
      for(const [time,minutes,project,name] of schedule[day]) add(date.toISOString().slice(0,10),time,minutes,project,name);
    }
    const retained=previous?JSON.parse(previous).filter(t=>!t.id.startsWith('showcase-')):[];
    const projects = {
      tempo:{name:'Разработка Tempo',description:'Спокойный рабочий день: от идеи до готового прототипа.',color:'coral',coverIcon:'brackets-curly'},
      university:{name:'Учёба и исследования',description:'Материалы исследования и работа над курсовой.',color:'lilac',coverIcon:'books'},
      personal:{name:'Здоровье и баланс',description:'Движение, отдых и время для себя.',color:'green',coverIcon:'plant'}
    };
    for (const project of Object.values(projects)) Object.assign(project,{link:'',members:['Артём'],coverMode:'icon'});
    // Task write is last: a failed setup can be retried without duplicating tasks.
    if (localStorage.getItem('tempo-project-settings-v1') === null) localStorage.setItem('tempo-project-settings-v1',JSON.stringify(projects));
    localStorage.setItem('tempo-tasks-v1',JSON.stringify([...retained,...tasks]));
    localStorage.setItem('tempo-demo-layout-v2','1');
  } catch (error) {
    const message = document.createElement('p'); message.setAttribute('role','alert');
    message.textContent = 'Не удалось подготовить демонстрационные данные. Проверьте доступ к хранилищу браузера.';
    document.body.prepend(message);
  }
})();
