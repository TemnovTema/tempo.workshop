// Extend the shared calendar when a new month enters its twelve-month window.
(function () {
  try {
    const today = new Intl.DateTimeFormat('en-CA', {timeZone:'Europe/Moscow',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
    const first = new Date(today.slice(0, 7) + '-01T12:00:00Z');
    const end = new Date(first);
    end.setUTCMonth(end.getUTCMonth() + 12);
    const horizonKey = 'tempo-pm-calendar-until-v1';
    const until = localStorage.getItem(horizonKey);
    const iso = date => date.toISOString().slice(0, 10);
    if (until && until >= iso(end)) return;
    const tasks = JSON.parse(localStorage.getItem('tempo-tasks-v1') || '[]');
    const ids = new Set(tasks.map(task => task.id));
    const schedule = [
      [['metrics','09:30',60,'tempo','Разобрать метрики воронки'],['planning','14:00',60,'team','Согласовать приоритеты спринта']],
      [['interview','10:00',60,'university','Провести интервью с пользователем'],['insights','14:30',45,'university','Собрать инсайты интервью']],
      [['backlog','09:45',75,'tempo','Уточнить бэклог продукта'],['design','13:00',45,'team','Обсудить прототип с дизайнером'],['hypothesis','15:30',50,'tempo','Описать гипотезу эксперимента']],
      [['experiment','10:30',60,'tempo','Проверить результаты A/B-теста'],['delivery','14:00',45,'team','Разобрать риски релиза']],
      [['demo','11:00',60,'team','Провести демо для команды'],['roadmap','15:00',60,'tempo','Обновить дорожную карту']],
      [['reading','11:00',40,'university','Разобрать продуктовый кейс']],
      [['week','17:00',30,'personal','Наметить цели на неделю']]
    ];
    const start = until && until > iso(first) ? new Date(until + 'T12:00:00Z') : first;
    for (const date = new Date(start); date < end; date.setUTCDate(date.getUTCDate() + 1)) {
      const day = iso(date);
      for (const [series,time,minutes,project,name] of schedule[(date.getUTCDay()+6)%7]) {
        const id = 'pm-' + series + '-' + day;
        if (!ids.has(id)) tasks.push({id, seriesId:'pm-' + series, seriesDate:day, date:day,
          name, time, minutes, project, notes:'', completed:false});
      }
    }
    const projects = {
      tempo:{name:'Разработка Tempo',description:'Планирование, метрики и развитие продукта.',color:'coral',coverIcon:'brackets-curly'},
      university:{name:'Учёба и исследования',description:'Интервью и продуктовые исследования.',color:'lilac',coverIcon:'books'},
      personal:{name:'Здоровье и баланс',description:'Движение, отдых и время для себя.',color:'green',coverIcon:'plant'}
    };
    for (const project of Object.values(projects)) Object.assign(project,{link:'',members:['Артём'],coverMode:'icon'});
    // Task write is last: a failed setup can be retried without duplicating tasks.
    if (localStorage.getItem('tempo-project-settings-v1') === null) localStorage.setItem('tempo-project-settings-v1',JSON.stringify(projects));
    localStorage.setItem('tempo-tasks-v1',JSON.stringify(tasks));
    localStorage.setItem(horizonKey,iso(end));
  } catch {
    const message = document.createElement('p');
    message.setAttribute('role','alert');
    message.textContent = 'Не удалось загрузить расписание. Проверьте доступ к хранилищу браузера.';
    document.body.prepend(message);
  }
})();
