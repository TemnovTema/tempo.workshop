// Единое локальное хранилище для трёх представлений календаря.
(function () {
  const createDialog = document.getElementById('taskDialog');
  const createForm = createDialog.querySelector('form');
  const detailForm = document.querySelector('#taskDetailDialog form');
  const title = createForm.querySelector('input[type="text"]');
  const date = createForm.querySelector('input[type="date"]');
  const start = createForm.querySelector('input[type="time"]');
  const duration = createForm.querySelector('select');
  const startEdit = document.getElementById('taskDetailStartTime');
  const endEdit = document.getElementById('taskDetailEndTime');
  const durationEdit = document.getElementById('taskDetailDuration');
  const notes = document.getElementById('taskDetailNotes');
  const dayKey = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const minutes = time => Number(time.slice(0,2))*60 + Number(time.slice(3));
  const clock = n => `${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;
  function length(text) {
    const hours = text.match(/(\d+)\s*(?:ч|час)/);
    const mins = text.match(/(\d+)\s*мин/);
    return (hours ? Number(hours[1])*60 : 0) + (mins ? Number(mins[1]) : 0);
  }
  function selectLength(n) {
    let option = [...durationEdit.options].find(o => length(o.textContent) === n);
    if (!option) { option = new Option(`${n} минут`, `${n} минут`); durationEdit.add(option); }
    durationEdit.value = option.value;
  }
  const seed = [...document.querySelectorAll('.day-track .calendar-event')].map((node,i) => ({
    id: `demo-${i}`, name: node.querySelector('strong').textContent,
    date: dayKey(calendarToday), time: node.querySelector(':scope > span').textContent,
    minutes: Number(node.dataset.focusMinutes || (i === 3 ? 50 : 60)),
    project: node.dataset.calendarProject || 'personal', notes: '',
    readonly: !node.classList.contains('pomodoro-task')
  }));
  let storage;
  try { storage = localStorage; } catch { storage = {getItem(){throw Error();},setItem(){throw Error();}}; }
  const store = TempoTaskStore.create(storage, seed);
  window.detachProjectTasks = id => store.saveMany(store.all().filter(t=>t.project===id).map(t=>({...t,project:'none',deletedProject:id})));
  window.restoreProjectTasks = id => store.saveMany(store.all().filter(t=>t.deletedProject===id&&t.project==='none').map(t=>({...t,project:id,deletedProject:undefined})));
  let refreshProjects = () => {};
  let refreshToday = () => {};
  let createProjectContext = null;
  const status = document.createElement('p');
  status.setAttribute('role','status'); status.className = 'task-storage-status';
  document.querySelector('.calendar-intro').after(status);
  function report(form) {
    let message = form.querySelector('[data-task-error]');
    if (!message) { message = document.createElement('p'); message.dataset.taskError=''; message.setAttribute('role','alert'); form.append(message); }
    message.textContent = store.error() || 'Проверьте дату, название и время задачи.';
  }
  function makeTask(task, kind) {
    const node = document.createElement(kind === 'month' ? 'button' : 'article');
    node.className = kind === 'day' ? 'calendar-event event-project pomodoro-task' : kind === 'week' ? 'w-event blue pomodoro-task' : 'month-task month-task-blue';
    const color = calendarProjectData[task.project]?.color || ({team:'blue',none:'neutral'})[task.project] || 'neutral';
    const palette = {coral:'var(--coral-soft)',blue:'var(--blue)',green:'var(--green)',lilac:'var(--lilac)',neutral:'var(--theme-control, #e9e8e2)'};
    node.style.background = palette[color] || palette.neutral;
    node.dataset.projectColor = color;
    if (kind === 'month') node.type='button';
    node.tabIndex=0; node.setAttribute('role','button');
    Object.assign(node.dataset, { taskId:task.id, pomodoroTaskName:task.name, taskDate:task.date, taskTime:task.time, focusMinutes:String(task.minutes), calendarProject:task.project, notes:task.notes });
    const time=document.createElement('span'); time.textContent=task.time;
    const name=document.createElement('strong'); name.textContent=task.name;
    const meta=document.createElement('small'); meta.textContent=task.completed ? 'Завершено' : `${task.minutes} мин`;
    node.classList.toggle('task-completed', !!task.completed);
    node.append(time,name,meta);
    const top=(minutes(task.time)-480)/780*100, height=task.minutes/780*100;
    node.style.setProperty('--start',`${top}%`); node.style.setProperty('--duration',`${height}%`);
    node.style.setProperty('--y',`${top}%`); node.style.setProperty('--h',`${height}%`);
    if (!task.readonly) {
      node.addEventListener('click',e=>{e.stopPropagation();openCalendarTask(node);});
      if (kind !== 'month') node.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();openCalendarTask(node);}});
    } else { node.removeAttribute('role'); node.removeAttribute('tabindex'); if(kind==='month') node.disabled=true; }
    return node;
  }
  getMonthTasks = date => store.forDate(dayKey(date), calendarProjectFilter);
  createMonthTaskButton = task => makeTask(task,'month');
  // Use rendered bounds: short tasks can occupy more height than their duration.
  function layoutTaskColumns(track) {
    if (!track.clientWidth) return;
    const cards = [...track.querySelectorAll(':scope > [data-task-id]')];
    for (const card of cards) {
      card.style.removeProperty('left');
      card.style.removeProperty('right');
    }
    const items = cards.map(card => ({card, bounds: card.getBoundingClientRect()}))
      .filter(item => item.bounds.height > 0)
      .sort((a, b) => a.bounds.top - b.bounds.top || b.bounds.bottom - a.bounds.bottom);
    if (!items.length) return;
    const style = getComputedStyle(items[0].card);
    const left = parseFloat(style.left), right = parseFloat(style.right);
    const available = track.clientWidth - left - right;
    let group = [], ends = [], bottom = -Infinity;
    function placeGroup() {
      if (ends.length < 2) return;
      const gap = Math.min(6, available / (2 * ends.length));
      const stride = (available + gap) / ends.length;
      for (const {card, lane} of group) {
        card.style.left = (left + lane * stride) + 'px';
        card.style.right = (right + (ends.length - lane - 1) * stride) + 'px';
      }
    }
    for (const item of items) {
      if (item.bounds.top >= bottom) {
        placeGroup();
        group = [];
        ends = [];
        bottom = -Infinity;
      }
      let lane = ends.findIndex(end => end <= item.bounds.top);
      if (lane < 0) lane = ends.length;
      ends[lane] = item.bounds.bottom;
      bottom = Math.max(bottom, item.bounds.bottom);
      group.push({card: item.card, lane});
    }
    placeGroup();
  }
  const taskTracks = document.querySelectorAll('.day-track, .week-day');
  const trackObserver = new ResizeObserver(entries => {
    for (const entry of entries) layoutTaskColumns(entry.target);
  });
  taskTracks.forEach(track => trackObserver.observe(track));
  function renderTasks() {
    const track=document.querySelector('.day-track');
    track.querySelectorAll('.calendar-event').forEach(node=>node.remove());
    store.forDate(dayKey(calendarDate),calendarProjectFilter).forEach(task=>track.append(makeTask(task,'day')));
    const week=getWeekStart(calendarDate);
    document.querySelectorAll('.week-day').forEach((column,i)=>{
      column.replaceChildren(); const date=new Date(week); date.setDate(date.getDate()+i);
      store.forDate(dayKey(date),calendarProjectFilter).forEach(task=>column.append(makeTask(task,'week')));
    });
    taskTracks.forEach(layoutTaskColumns);
    const totals=TempoTaskMetrics.summarize(store.forDate(dayKey(calendarDate)));
    const metricRows=document.querySelectorAll('.calendar-context-metrics .day-metric');
    const formatTotal=n=>`${Math.floor(n/60)} ч ${n%60} мин`;
    metricRows[0].querySelector('strong').textContent=formatTotal(totals.planned);
    metricRows[1].querySelector('strong').textContent=formatTotal(totals.free);
    metricRows[0].querySelector('span').textContent='В плане · все проекты';
    metricRows[1].querySelector('span').textContent='Свободно · 08–21';
    const metrics=document.querySelector('.calendar-context-metrics');
    metrics.title='За выбранный день, по всем проектам. Свободное время исключает задачи и защищённые блоки.';
    let caption=document.querySelector('[data-calendar-metrics-date]');
    if(!caption){caption=document.createElement('p');caption.dataset.calendarMetricsDate='';caption.className='calendar-metrics-date';metrics.before(caption);}
    caption.textContent=`За ${calendarDate.toLocaleDateString('ru-RU',{day:'numeric',month:'long'})}`;
    const count=document.querySelector('[data-calendar-project-filter="all"]');
    const badge=count.querySelector('small');
    if(badge){ const start=getWeekStart(calendarDate), end=new Date(start);end.setDate(end.getDate()+7);badge.textContent=store.all().filter(t=>t.date>=dayKey(start)&&t.date<dayKey(end)).length;count.title='Задачи выбранной недели'; }
    status.textContent = store.error() || '';
    status.hidden = !status.textContent;
    refreshProjects();
    refreshToday();
  }
  const editDate = document.getElementById('taskDetailEditDate');
  function validWindow(field, time, n) {
    const ok = /^\d{2}:\d{2}$/.test(time) && n > 0 && minutes(time) >= 480 && minutes(time)+n <= 1260;
    field.setCustomValidity(ok ? '' : 'Выберите время с 08:00 до 21:00 и положительную длительность.');
    if (!ok) field.reportValidity();
    return ok;
  }
  [createForm, detailForm].forEach(form => {
    form.querySelectorAll('[value="cancel"]').forEach(button => { button.type = 'button'; button.addEventListener('click', () => form.closest('dialog').close()); });
    form.addEventListener('input', () => form.querySelectorAll('input').forEach(input => input.setCustomValidity('')));
  });
  document.querySelectorAll('[data-new-task]').forEach(button => button.addEventListener('click', () => {
    createProjectContext = button.closest('[data-project-inline-view], [data-project-task-board]') ? activeProjectKey : null;
    createForm.reset();
    if(createProjectContext) createForm.querySelectorAll('select')[1].value=createProjectContext;
    title.required = true; date.required = true; start.required = true;
    date.value = dayKey(calendarDate);
    createForm.querySelector('[data-task-error]')?.remove();
    title.setCustomValidity(''); start.setCustomValidity('');
  }));
  const originalOpen = openCalendarTask;
  openCalendarTask = function(task) {
    originalOpen(task);
    editDate.value=task.dataset.taskDate || dayKey(calendarDate);
    detailForm.querySelector('[data-task-error]')?.remove();
    selectLength(Number(task.dataset.focusMinutes || 50));
    const label=calendarProjectData[task.dataset.calendarProject]?.name||({team:'Команда',none:'Без проекта'})[task.dataset.calendarProject];
    document.getElementById('taskDetailProjectSelect').value=task.dataset.calendarProject;
    document.getElementById('taskDetailProject').textContent=label;
    const record=store.all().find(t=>t.id===task.dataset.taskId);
    document.getElementById('taskDetailDone').checked = !!record?.completed;
    document.querySelector('.task-detail-status').textContent=record?.completed ? 'Завершено' : 'Запланировано';
    document.getElementById('taskDetailStart').disabled=!!record?.completed;
    let resultNote=detailForm.querySelector('[data-last-focus-result]');
    if(!resultNote){resultNote=document.createElement('p');resultNote.dataset.lastFocusResult='';notes.parentElement.after(resultNote);}
    const last=record?.focusResults?.at(-1);
    resultNote.hidden=!last;
    if(last)resultNote.textContent=`Последний фокус: ${Math.floor(last.seconds/60)} мин · ${({completed:'завершено',continue:'нужно продолжить',partial:'частично'})[last.outcome]}. ${last.note}`;
    if (task.dataset.notes !== undefined) notes.value = task.dataset.notes;
    document.getElementById('taskDetailDate').textContent = new Date(`${task.dataset.taskDate || dayKey(calendarDate)}T12:00:00`).toLocaleDateString('ru-RU', {day:'numeric',month:'long',year:'numeric'});
    startEdit.setCustomValidity(''); endEdit.setCustomValidity('');
  };
  function syncEnd() {
    const n = length(durationEdit.value);
    if (minutes(startEdit.value)+n < 1440) endEdit.value = clock(minutes(startEdit.value)+n);
  }
  durationEdit.addEventListener('change', syncEnd);
  startEdit.addEventListener('change', syncEnd);
  endEdit.addEventListener('change', () => {
    const n = minutes(endEdit.value)-minutes(startEdit.value);
    if (n > 0) selectLength(n);
  });
  createForm.addEventListener('submit', event => {
    event.preventDefault();
    const n = length(duration.value);
    title.setCustomValidity(title.value.trim() ? '' : 'Введите название задачи.');
    if (!createForm.reportValidity() || !validWindow(start, start.value, n)) return;
    const project = createForm.querySelectorAll('select')[1].value;
    const record={id:crypto.randomUUID(),name:title.value.trim(),date:date.value,time:start.value,minutes:n,
      notes:createForm.querySelector('textarea').value,
      project:project || 'none'};
    if (!store.save(record)) { report(createForm); return; }
    calendarDate = new Date(`${date.value}T12:00:00`);
    filterCalendarByProject('all');
    document.querySelector('[data-calendar-mode="day"]').click();
    createDialog.close();
    if(createProjectContext){
      if(calendarProjectDialog.open) calendarProjectDialog.close();
      filterCalendarByProject(record.project);renderInlineProjectDetails(record.project);
    }
  });
  detailForm.addEventListener('submit', event => {
    event.preventDefault();
    const n = minutes(endEdit.value)-minutes(startEdit.value);
    if (!activeCalendarTask || !validWindow(startEdit, startEdit.value, n)) return;
    const previous=store.all().find(t=>t.id===activeCalendarTask.dataset.taskId);
    if(!previous || !detailForm.reportValidity()) return;
    const changed = previous.date !== editDate.value || previous.time !== startEdit.value || previous.minutes !== n;
    if (changed && !previous.completed) {
      const begin = minutes(startEdit.value);
      const clash = store.forDate(editDate.value).find(task =>
        task.id !== previous.id && !task.completed &&
        begin < minutes(task.time) + task.minutes && begin + n > minutes(task.time)
      );
      if (clash) {
        startEdit.setCustomValidity(`Пересечение: ${clash.name} · ${clash.time}. Выберите другое время.`);
        startEdit.reportValidity();
        return;
      }
    }
    const project=document.getElementById('taskDetailProjectSelect').value || 'none';
    if(!store.save({...previous,completed:document.getElementById('taskDetailDone').checked,date:editDate.value,time:startEdit.value,minutes:n,notes:notes.value,project})) {report(detailForm);return;}
    calendarDate=new Date(`${editDate.value}T12:00:00`);
    taskDetailDialog.close(); renderCalendarPeriod();
  });
  // Перехватываем старое удаление DOM: сначала сохраняем удаление в хранилище.
  document.querySelector('.task-delete').addEventListener('click', event=>{
    event.stopImmediatePropagation();
    if(!activeCalendarTask) return;
    if(!store.remove(activeCalendarTask.dataset.taskId)){report(detailForm);return;}
    taskDetailDialog.close(); activeCalendarTask=null; renderCalendarPeriod();
  },true);
  const originalPeriod = renderCalendarPeriod;
  renderCalendarPeriod = function () { originalPeriod(); renderTasks(); };
  const originalFilter=filterCalendarByProject;
  filterCalendarByProject=function(key){originalFilter(key);renderCalendarPeriod();};
  refreshProjects=TempoTaskProjects({store,makeTask,renderCalendar:()=>renderCalendarPeriod(),report});
  TempoTaskFocus({store,refresh:()=>renderCalendarPeriod(),report});
  refreshToday=TempoTaskToday({store,makeTask,dayKey});
  TempoTaskReview({store,dayKey,refresh:()=>renderCalendarPeriod(),report});
  renderCalendarPeriod();
  createForm.querySelector('.task-dialog-footer p').textContent = 'Задача сохраняется в этом браузере. Проверка пересечений и повторение появятся позже.';
  const repeat = createForm.querySelectorAll('select')[2]; repeat.disabled = true;
  duration.querySelectorAll('option').forEach(option => { if (!length(option.textContent)) option.disabled = true; });
})();
