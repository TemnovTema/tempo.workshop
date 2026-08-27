const viewButtons = document.querySelectorAll('[data-view]');
const viewPanels = document.querySelectorAll('[data-view-panel]');

function openView(name) {
  viewButtons.forEach((button) => button.classList.toggle('active', button.dataset.view === name));
  viewPanels.forEach((panel) => panel.classList.toggle('active', panel.dataset.viewPanel === name));
  const viewNames = { today: 'Сегодня', projects: 'Проекты', calendar: 'Календарь', practices: 'Практики', checkin: 'Состояние', profile: 'Профиль', conflict: 'Изменение плана', review: 'Итог дня', onboarding: 'Настройка', 'focus-result': 'Результат фокуса' };
  const headerTitle = document.querySelector('[data-header-title]');
  if (headerTitle) headerTitle.textContent = viewNames[name] || 'Tempo';
  history.replaceState(null, '', `#${name}`);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

viewButtons.forEach((button) => button.addEventListener('click', () => openView(button.dataset.view)));
document.querySelectorAll('[data-open-view]').forEach((button) => button.addEventListener('click', () => openView(button.dataset.openView)));
document.querySelectorAll('[data-route]').forEach((link) => link.addEventListener('click', (event) => { event.preventDefault(); openView(link.dataset.route); }));

const initialView = location.hash.slice(1) === 'tasks' ? 'projects' : location.hash.slice(1);
if ([...viewPanels].some((panel) => panel.dataset.viewPanel === initialView)) openView(initialView);

document.querySelectorAll('[data-header-panel]').forEach((button) => button.addEventListener('click', () => {
  const target = button.dataset.headerPanel;
  document.querySelectorAll('[data-header-popover]').forEach((panel) => {
    const isTarget = panel.dataset.headerPopover === target;
    const shouldOpen = isTarget && !panel.classList.contains('open');
    panel.classList.toggle('open', shouldOpen);
    panel.setAttribute('aria-hidden', shouldOpen ? 'false' : 'true');
  });
}));
document.querySelectorAll('[data-close-header-panel]').forEach((button) => button.addEventListener('click', () => {
  const panel = button.closest('[data-header-popover]');
  panel.classList.remove('open');
  panel.setAttribute('aria-hidden', 'true');
}));

const calendarToday = new Date(2026, 7, 26);
let calendarDate = new Date(calendarToday);
let calendarMode = 'day';
const monthNames = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];
const monthNamesTitle = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
const monthNamesGenitive = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const weekdayNames = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
const weekdayShort = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];

function isSameDate(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function getWeekStart(date) {
  const start = new Date(date);
  start.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  return start;
}

function renderMonthGrid() {
  const grid = document.querySelector('[data-month-grid]');
  if (!grid) return;
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const first = new Date(year, month, 1);
  const start = new Date(year, month, 1 - ((first.getDay() + 6) % 7));
  grid.innerHTML = '';
  for (let index = 0; index < 42; index += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const button = document.createElement('button');
    button.type = 'button';
    if (date.getMonth() !== month) button.classList.add('outside');
    if (isSameDate(date, calendarToday)) button.classList.add('selected');
    const number = document.createElement('span');
    number.textContent = date.getDate();
    button.append(number);
    if (date.getMonth() === month && date.getDay() !== 0 && date.getDay() !== 6) {
      const load = document.createElement('i');
      load.className = `load ${['low', 'mid', 'high'][(date.getDate() * 7 + month) % 3]}`;
      button.append(load);
    }
    if (isSameDate(date, calendarToday)) {
      const today = document.createElement('small');
      today.textContent = 'сегодня';
      button.append(today);
    }
    grid.append(button);
  }
  grid.setAttribute('aria-label', `${monthNamesTitle[month]} ${year}`);
}

function renderCalendarPeriod() {
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const day = calendarDate.getDate();
  const periodLabel = document.querySelector('[data-calendar-period-label]');
  if (calendarMode === 'day') periodLabel.textContent = `${day} ${monthNamesGenitive[month]} ${year}`;
  if (calendarMode === 'week') {
    const start = getWeekStart(calendarDate);
    const end = new Date(start); end.setDate(start.getDate() + 6);
    periodLabel.textContent = start.getMonth() === end.getMonth() ? `${start.getDate()}–${end.getDate()} ${monthNamesGenitive[end.getMonth()]} ${year}` : `${start.getDate()} ${monthNamesGenitive[start.getMonth()]} – ${end.getDate()} ${monthNamesGenitive[end.getMonth()]}`;
  }
  if (calendarMode === 'month') periodLabel.textContent = `${monthNames[month]} ${year}`;
  document.querySelector('[data-context-date]').textContent = `${day} ${monthNamesGenitive[month]}`;
  document.querySelector('[data-context-day]').textContent = day;
  document.querySelector('[data-context-weekday]').textContent = weekdayNames[calendarDate.getDay()];
  document.querySelector('[data-day-heading]').textContent = `${weekdayNames[calendarDate.getDay()]}, ${day}`;
  document.querySelector('[data-day-plan-label]').textContent = isSameDate(calendarDate, calendarToday) ? 'План на сегодня' : 'План на день';
  document.querySelector('[data-month-name]').textContent = monthNamesTitle[month];
  const weekStart = getWeekStart(calendarDate);
  const weekHead = document.querySelector('[data-week-head]');
  [...weekHead.querySelectorAll('div')].forEach((cell, index) => {
    const date = new Date(weekStart); date.setDate(weekStart.getDate() + index);
    cell.querySelector('small').textContent = weekdayShort[date.getDay()];
    cell.querySelector('strong').textContent = date.getDate();
    cell.classList.toggle('active', isSameDate(date, calendarToday));
  });
  document.querySelector('[data-calendar-previous]').setAttribute('aria-label', `Предыдущ${calendarMode === 'day' ? 'ий день' : calendarMode === 'week' ? 'ая неделя' : 'ий месяц'}`);
  document.querySelector('[data-calendar-next]').setAttribute('aria-label', `Следующ${calendarMode === 'day' ? 'ий день' : calendarMode === 'week' ? 'ая неделя' : 'ий месяц'}`);
  renderMonthGrid();
  const shell = document.querySelector('.calendar-shell');
  shell.classList.remove('period-shift');
  requestAnimationFrame(() => shell.classList.add('period-shift'));
}

function shiftCalendarPeriod(direction) {
  if (calendarMode === 'day') calendarDate.setDate(calendarDate.getDate() + direction);
  if (calendarMode === 'week') calendarDate.setDate(calendarDate.getDate() + (7 * direction));
  if (calendarMode === 'month') calendarDate.setMonth(calendarDate.getMonth() + direction, 1);
  renderCalendarPeriod();
}

document.querySelectorAll('[data-calendar-mode]').forEach((button) => {
  button.addEventListener('click', () => {
    calendarMode = button.dataset.calendarMode;
    document.querySelectorAll('[data-calendar-mode]').forEach((item) => {
      item.classList.toggle('active', item === button);
      item.setAttribute('aria-selected', item === button ? 'true' : 'false');
    });
    document.querySelectorAll('[data-calendar-panel]').forEach((panel) => panel.classList.toggle('active', panel.dataset.calendarPanel === button.dataset.calendarMode));
    renderCalendarPeriod();
  });
});
document.querySelector('[data-calendar-previous]')?.addEventListener('click', () => shiftCalendarPeriod(-1));
document.querySelector('[data-calendar-next]')?.addEventListener('click', () => shiftCalendarPeriod(1));
document.querySelector('[data-calendar-today]')?.addEventListener('click', () => { calendarDate = new Date(calendarToday); renderCalendarPeriod(); });
renderCalendarPeriod();

const alternativesButton = document.querySelector('[data-alternatives]');
const alternativesStack = document.querySelector('.alternative-stack');
alternativesButton?.addEventListener('click', () => {
  const isOpen = alternativesStack.classList.toggle('open');
  alternativesStack.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
  alternativesButton.textContent = isOpen ? 'Скрыть варианты' : 'Другой вариант';
});

const focusOverlay = document.querySelector('.focus-overlay');
const workRestSwitch = document.querySelector('[data-work-rest-toggle]');
const focusPlan = document.querySelector('[data-focus-plan]');
const focusCountdown = document.querySelector('[data-focus-countdown]');
const focusTaskNameElement = document.querySelector('[data-focus-task-name]');
const focusPhaseElement = document.querySelector('[data-focus-phase]');
const focusTotalElement = document.querySelector('[data-focus-total]');
const focusPlanPause = document.querySelector('[data-focus-plan-pause]');
let focusTaskName = '';
let focusTotalMinutes = 0;
let focusSprintOne = 25;
let focusSprintTwo = 25;
let focusBreakMinutes = 5;
let focusSprint = 1;
let focusPhase = 'rest';
let focusSeconds = 0;
let focusRunning = false;
let focusInterval = null;
let focusCardDismissed = false;

function formatFocusTime(seconds) {
  return `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
}

function renderFocusPlan() {
  focusCountdown.textContent = formatFocusTime(focusSeconds);
  focusTaskNameElement.textContent = focusTaskName || 'Следующая задача';
  focusTotalElement.textContent = `${focusTotalMinutes} минут в календаре`;
  focusPhaseElement.textContent = focusPhase === 'work' ? `Работа · спринт ${focusSprint} из 2` : `Отдых · ${focusBreakMinutes} минут`;
  document.querySelector('[data-sprint-one]').textContent = focusSprintOne;
  document.querySelector('[data-sprint-two]').textContent = focusSprintTwo;
  document.querySelector('[data-break-duration]').textContent = focusBreakMinutes;
  document.querySelector('[data-sprint-one]').classList.toggle('active', focusPhase === 'work' && focusSprint === 1);
  document.querySelector('[data-sprint-two]').classList.toggle('active', focusPhase === 'work' && focusSprint === 2);
  document.querySelector('[data-break-duration]').classList.toggle('active', focusPhase === 'rest');
  workRestSwitch.classList.toggle('work', focusPhase === 'work');
  workRestSwitch.setAttribute('aria-pressed', focusPhase === 'work' ? 'true' : 'false');
  workRestSwitch.setAttribute('aria-label', focusPhase === 'work' ? 'Переключить на отдых' : 'Переключить на работу');
  document.querySelector('[data-work-switch-label]').textContent = focusPhase === 'work' && focusTaskName ? formatFocusTime(focusSeconds) : 'Работа';
  document.querySelector('[data-rest-switch-label]').textContent = focusPhase === 'rest' && focusTaskName ? formatFocusTime(focusSeconds) : 'Отдых';
  focusPlanPause.textContent = focusRunning ? 'Пауза' : 'Продолжить';
}

function runFocusTimer() {
  clearInterval(focusInterval);
  focusRunning = true;
  focusInterval = setInterval(() => {
    focusSeconds -= 1;
    if (focusSeconds <= 0) {
      clearInterval(focusInterval);
      if (focusPhase === 'work' && focusSprint === 1) {
        setFocusPhase('rest');
        return;
      }
      if (focusPhase === 'rest') {
        focusSprint = 2;
        setFocusPhase('work');
        return;
      }
      focusRunning = false;
      focusSeconds = 0;
      focusPhaseElement.textContent = 'Задача завершена';
    }
    renderFocusPlan();
  }, 1000);
  renderFocusPlan();
}

function setFocusPhase(phase) {
  focusPhase = phase;
  if (phase === 'rest') focusSeconds = focusBreakMinutes * 60;
  if (phase === 'work') focusSeconds = (focusSprint === 1 ? focusSprintOne : focusSprintTwo) * 60;
  if (!focusCardDismissed) {
    focusPlan.classList.add('open');
    focusPlan.setAttribute('aria-hidden', 'false');
  }
  runFocusTimer();
}

function startFocusPlan(taskName, totalMinutes = 50) {
  focusTaskName = taskName;
  focusTotalMinutes = totalMinutes;
  focusSprintOne = Math.ceil(totalMinutes / 2);
  focusSprintTwo = Math.floor(totalMinutes / 2);
  focusBreakMinutes = totalMinutes > 60 ? 10 : 5;
  focusSprint = 1;
  focusCardDismissed = false;
  setFocusPhase('work');
}

workRestSwitch?.addEventListener('click', () => {
  if (!focusTaskName) {
    startFocusPlan('Макет главного экрана', 50);
    return;
  }
  if (focusPhase === 'work') {
    setFocusPhase('rest');
    return;
  }
  focusSprint = Math.min(2, focusSprint + 1);
  setFocusPhase('work');
});

focusPlanPause?.addEventListener('click', () => {
  focusRunning = !focusRunning;
  clearInterval(focusInterval);
  if (focusRunning) runFocusTimer();
  renderFocusPlan();
});
document.querySelector('[data-focus-plan-close]')?.addEventListener('click', () => {
  focusCardDismissed = true;
  focusPlan.classList.remove('open');
  focusPlan.setAttribute('aria-hidden', 'true');
});
document.addEventListener('click', (event) => {
  if (!focusPlan.classList.contains('open')) return;
  if (focusPlan.contains(event.target) || workRestSwitch.contains(event.target)) return;
  focusCardDismissed = true;
  focusPlan.classList.remove('open');
  focusPlan.setAttribute('aria-hidden', 'true');
});

document.querySelectorAll('[data-focus-start]').forEach((button) => button.addEventListener('click', (event) => {
  event.stopPropagation();
  startFocusPlan('Макет главного экрана', 50);
  focusOverlay.classList.add('open');
  focusOverlay.setAttribute('aria-hidden', 'false');
}));
document.querySelector('.focus-close')?.addEventListener('click', () => {
  focusOverlay.classList.remove('open');
  focusOverlay.setAttribute('aria-hidden', 'true');
});
document.querySelector('[data-focus-complete]')?.addEventListener('click', () => {
  focusOverlay.classList.remove('open');
  focusOverlay.setAttribute('aria-hidden', 'true');
  openView('focus-result');
});
document.querySelector('[data-focus-pause]')?.addEventListener('click', (event) => {
  focusPlanPause.click();
  event.currentTarget.textContent = focusRunning ? 'Пауза' : 'Продолжить';
});

const taskDetailDialog = document.getElementById('taskDetailDialog');
let activeCalendarTask;

const calendarProjectDialog = document.getElementById('calendarProjectDialog');
const calendarProjectForm = document.getElementById('calendarProjectForm');
const calendarProjectData = {
  tempo: { name: 'Разработка Tempo', description: 'Собрать цельный продуктовый прототип Tempo: календарь, состояние, практики и совместная работа.', link: 'https://www.figma.com/design/lBBGerWEOGtd2V0yDqxkpw/Tempo.Remake', members: ['Артём', 'Марина', 'Кирилл'], color: 'coral' },
  university: { name: 'Универ', description: 'Учебные задачи, исследования и подготовка курсовой работы.', link: '', members: ['Артём'], color: 'blue' },
  personal: { name: 'Личное', description: 'Личные планы, восстановление и небольшие дела вне работы.', link: '', members: ['Артём'], color: 'green' }
};
let activeProjectKey = null;

const weekProjectMap = {
  'Исследование': 'university', 'Созвон': 'tempo', 'Прототип': 'tempo', 'Учёба': 'university',
  'Главный экран': 'tempo', 'Синхронизация': 'tempo', 'Проверка': 'university', 'Планирование': 'tempo',
  'Курсовая': 'university', 'Команда': 'tempo', 'Сборка': 'tempo', 'Прогулка': 'personal', 'План недели': 'personal'
};
document.querySelectorAll('.w-event[data-pomodoro-task-name]').forEach((task) => {
  task.dataset.calendarProject = weekProjectMap[task.dataset.pomodoroTaskName] || 'personal';
});

function filterCalendarByProject(projectKey) {
  document.querySelectorAll('[data-calendar-project-filter]').forEach((button) => button.classList.toggle('active', button.dataset.calendarProjectFilter === projectKey));
  document.querySelectorAll('[data-calendar-project]').forEach((task) => task.classList.toggle('project-filtered', projectKey !== 'all' && task.dataset.calendarProject !== projectKey));
}

function openProjectDialog(projectKey = null) {
  activeProjectKey = projectKey;
  const data = projectKey ? calendarProjectData[projectKey] : { name: '', description: '', link: '', members: ['Артём'], color: 'coral' };
  document.getElementById('calendarProjectEyebrow').textContent = projectKey ? 'Настройки проекта' : 'Новый проект';
  document.getElementById('calendarProjectDialogTitle').textContent = projectKey ? 'Детали проекта' : 'Собрать задачи в проект';
  document.getElementById('calendarProjectName').value = data.name;
  document.getElementById('calendarProjectDescription').value = data.description;
  document.getElementById('calendarProjectLink').value = data.link;
  document.querySelectorAll('[data-project-person]').forEach((button) => button.classList.toggle('active', data.members.includes(button.dataset.projectPerson)));
  document.querySelectorAll('[data-project-color]').forEach((button) => button.classList.toggle('active', button.dataset.projectColor === data.color));
  document.querySelector('[data-project-delete]').hidden = !projectKey;
  calendarProjectDialog.showModal();
}

document.querySelectorAll('[data-calendar-project-filter]').forEach((button) => button.addEventListener('click', (event) => {
  if (event.target.closest('[data-project-edit]')) return;
  filterCalendarByProject(button.dataset.calendarProjectFilter);
}));
document.querySelectorAll('[data-project-edit]').forEach((button) => {
  const open = (event) => { event.stopPropagation(); openProjectDialog(button.dataset.projectEdit); };
  button.addEventListener('click', open);
  button.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open(event); }
  });
});
document.querySelector('[data-calendar-project-add]')?.addEventListener('click', () => openProjectDialog());
document.querySelectorAll('[data-project-color], [data-project-person]').forEach((button) => button.addEventListener('click', () => {
  if (button.hasAttribute('data-project-color')) document.querySelectorAll('[data-project-color]').forEach((item) => item.classList.toggle('active', item === button));
  else button.classList.toggle('active');
}));
document.querySelector('[data-project-add-person]')?.addEventListener('click', (event) => {
  event.currentTarget.querySelector('span').textContent = 'Нина';
  event.currentTarget.querySelector('i').textContent = 'НГ';
  event.currentTarget.classList.add('active');
});
document.querySelector('[data-project-add-link]')?.addEventListener('click', () => {
  const link = document.getElementById('calendarProjectLink');
  link.focus();
  if (!link.value) link.placeholder = 'Вставьте первую рабочую ссылку';
});
calendarProjectForm?.addEventListener('submit', () => {
  const name = document.getElementById('calendarProjectName').value.trim();
  if (!name) return;
  if (activeProjectKey) {
    calendarProjectData[activeProjectKey].name = name;
    calendarProjectData[activeProjectKey].description = document.getElementById('calendarProjectDescription').value;
    calendarProjectData[activeProjectKey].link = document.getElementById('calendarProjectLink').value;
    document.querySelector(`[data-calendar-project-filter="${activeProjectKey}"] strong`).textContent = name;
  }
});
document.querySelector('[data-project-delete]')?.addEventListener('click', () => {
  if (!activeProjectKey) return;
  document.querySelector(`[data-calendar-project-filter="${activeProjectKey}"]`)?.remove();
  filterCalendarByProject('all');
  calendarProjectDialog.close();
});

function openCalendarTask(task) {
  activeCalendarTask = task;
  const name = task.dataset.pomodoroTaskName;
  const totalMinutes = Number(task.dataset.focusMinutes || 50);
  const visibleTime = task.querySelector(':scope > span')?.textContent?.trim() || '10:00';
  const [hours, minutes] = /^\d{2}:\d{2}$/.test(visibleTime) ? visibleTime.split(':').map(Number) : [10, 0];
  const endTotal = hours * 60 + minutes + totalMinutes;
  const endTime = `${String(Math.floor(endTotal / 60) % 24).padStart(2, '0')}:${String(endTotal % 60).padStart(2, '0')}`;
  const isMeeting = task.classList.contains('group-event') || name.toLowerCase().includes('созвон') || name.toLowerCase().includes('синхронизац');
  document.getElementById('calendarTaskTitle').textContent = name;
  const projectName = isMeeting ? 'Команда' : name.includes('Курсов') || name.includes('Учёб') ? 'Курсовая работа' : 'Tempo Remake';
  document.getElementById('taskDetailProject').textContent = projectName;
  document.getElementById('taskDetailProjectSelect').value = projectName;
  document.getElementById('taskDetailStartTime').value = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  document.getElementById('taskDetailEndTime').value = endTime;
  const durationSelect = document.getElementById('taskDetailDuration');
  const matchingDuration = [...durationSelect.options].find((option) => Number.parseInt(option.textContent, 10) === totalMinutes);
  if (matchingDuration) durationSelect.value = matchingDuration.value;
  document.getElementById('taskDetailNotes').value = isMeeting
    ? 'Сверить прогресс, зафиксировать решения и определить следующие шаги команды.'
    : `Подготовить результат по задаче «${name}» и сохранить материалы в проекте.`;
  document.getElementById('taskDetailLinks').classList.toggle('is-empty', !isMeeting);
  taskDetailDialog.showModal();
}

document.querySelectorAll('.pomodoro-task').forEach((task) => {
  task.addEventListener('click', () => openCalendarTask(task));
  task.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openCalendarTask(task);
    }
  });
});

document.getElementById('taskDetailStart')?.addEventListener('click', () => {
  if (!activeCalendarTask) return;
  const totalMinutes = Number(activeCalendarTask.dataset.focusMinutes || 50);
  startFocusPlan(activeCalendarTask.dataset.pomodoroTaskName, totalMinutes);
  taskDetailDialog.close();
});

document.querySelectorAll('.person-chip').forEach((button) => button.addEventListener('click', () => button.classList.toggle('active')));
document.querySelector('.person-add')?.addEventListener('click', (event) => {
  if (document.querySelector('.person-chip[data-added-person]')) return;
  const person = document.createElement('button');
  person.type = 'button';
  person.className = 'person-chip active';
  person.dataset.addedPerson = 'true';
  person.innerHTML = '<i>НГ</i> Нина';
  person.addEventListener('click', () => person.classList.toggle('active'));
  event.currentTarget.before(person);
});
document.querySelector('.task-link-list>button')?.addEventListener('click', (event) => {
  const list = event.currentTarget.closest('.task-link-list');
  list.classList.remove('is-empty');
  const link = list.querySelector('a');
  link.querySelector('strong').textContent = 'Материалы задачи';
  link.querySelector('small').textContent = 'Рабочая ссылка добавлена';
});
document.querySelectorAll('.task-member-editor button:not(.member-add)').forEach((button) => button.addEventListener('click', () => button.classList.toggle('is-removed')));
document.querySelector('.task-member-editor .member-add')?.addEventListener('click', (event) => {
  if (document.querySelector('.task-member-editor [data-added-member]')) return;
  const member = document.createElement('button');
  member.type = 'button';
  member.dataset.addedMember = 'true';
  member.innerHTML = '<i>НГ</i><span>Нина</span>';
  member.addEventListener('click', () => member.classList.toggle('is-removed'));
  event.currentTarget.before(member);
});
document.querySelector('.task-delete')?.addEventListener('click', () => {
  activeCalendarTask?.remove();
  taskDetailDialog.close();
  activeCalendarTask = null;
});

document.querySelectorAll('.outcome-options button').forEach((button) => button.addEventListener('click', () => {
  document.querySelectorAll('.outcome-options button').forEach((item) => item.classList.toggle('active', item === button));
}));

const projectComposer = document.querySelector('.project-composer');
document.querySelector('[data-new-project]')?.addEventListener('click', () => {
  projectComposer.hidden = false;
  const isOpen = projectComposer.classList.toggle('open');
  projectComposer.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
  if (isOpen) projectComposer.querySelector('input')?.focus();
});
document.querySelector('[data-close-project]')?.addEventListener('click', () => {
  projectComposer.classList.remove('open');
  projectComposer.setAttribute('aria-hidden', 'true');
  projectComposer.hidden = true;
});

document.querySelectorAll('[data-project-filter]').forEach((button) => button.addEventListener('click', () => {
  document.querySelectorAll('[data-project-filter]').forEach((item) => item.classList.toggle('active', item === button));
  document.querySelectorAll('.project-index-row').forEach((row) => row.classList.toggle('hidden', row.dataset.projectStatus !== button.dataset.projectFilter));
  const hasProjects = [...document.querySelectorAll('.project-index-row')].some((row) => !row.classList.contains('hidden'));
  document.querySelector('.project-filter-empty')?.classList.toggle('hidden', hasProjects);
}));

document.querySelectorAll('.project-index-row').forEach((row) => row.addEventListener('click', () => {
  document.querySelectorAll('.project-index-row').forEach((item) => item.classList.toggle('active', item === row));
}));

const taskDialog = document.getElementById('taskDialog');
document.querySelectorAll('[data-new-task]').forEach((button) => button.addEventListener('click', () => taskDialog.showModal()));

document.querySelectorAll('[data-task-filter]').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelectorAll('[data-task-filter]').forEach((item) => item.classList.toggle('active', item === button));
    document.querySelectorAll('.task-row').forEach((row) => {
      const filter = button.dataset.taskFilter;
      row.classList.toggle('hidden', filter !== 'all' && !row.dataset.taskKind.includes(filter));
    });
  });
});

document.querySelectorAll('.task-check').forEach((button) => button.addEventListener('click', () => {
  button.classList.toggle('done');
  button.closest('.task-row').classList.toggle('completed', button.classList.contains('done'));
}));

document.querySelectorAll('.task-open').forEach((button) => button.addEventListener('click', () => {
  const row = button.closest('.task-row');
  const title = row.dataset.taskDetail;
  document.getElementById('taskInspectorTitle').textContent = title;
  document.querySelectorAll('.task-row').forEach((item) => item.classList.toggle('featured', item === row));
}));

document.querySelectorAll('.role-tabs button').forEach((button) => button.addEventListener('click', () => {
  document.querySelectorAll('.role-tabs button').forEach((item) => item.classList.toggle('active', item === button));
}));

document.querySelectorAll('[data-settings-tab]').forEach((button) => button.addEventListener('click', () => {
  const section = button.dataset.settingsTab;
  document.querySelectorAll('[data-settings-tab]').forEach((item) => item.classList.toggle('active', item === button));
  document.querySelectorAll('[data-settings-panel]').forEach((panel) => panel.classList.toggle('active', panel.dataset.settingsPanel === section));
  document.querySelectorAll('[data-settings-aside]').forEach((panel) => panel.classList.toggle('active', panel.dataset.settingsAside === section));
}));

document.querySelectorAll('[data-practice-filter]').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelectorAll('[data-practice-filter]').forEach((item) => item.classList.toggle('active', item === button));
    document.querySelectorAll('.practice-card').forEach((card) => {
      card.classList.toggle('hidden', button.dataset.practiceFilter !== 'all' && card.dataset.practiceCategory !== button.dataset.practiceFilter);
    });
  });
});

const practicePlayer = document.querySelector('.practice-player');
const meditationPlayer = practicePlayer?.querySelector('.player-meditation');
const reflectionPlayer = practicePlayer?.querySelector('.reflection-player');
const reflectionPrompts = {
  'Что со мной сейчас': ['Что вы замечаете в теле прямо сейчас?', 'Какая эмоция занимает больше всего места?', 'Чего вам сейчас не хватает?', 'Какой небольшой следующий шаг поддержит вас?'],
  'Распутать мысль': ['Какая мысль возвращается снова и снова?', 'Что здесь является фактом, а что вашей интерпретацией?', 'На какую часть ситуации вы можете повлиять?', 'Что можно отпустить хотя бы до завтра?'],
  'Три хороших момента': ['Что сегодня прошло хорошо, даже если это мелочь?', 'Как вы чувствовали себя в этот момент?', 'Благодаря чему это событие стало возможным?', 'Какие ещё два хороших момента вы хотите сохранить?']
};
let practiceTimer;
let breathTimer;
let practiceSeconds = 240;
let reflectionIndex = 0;
let activePrompts = [];

function stopPracticeTimers() {
  window.clearInterval(practiceTimer);
  window.clearInterval(breathTimer);
}

function formatPracticeTime(seconds) {
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

function startMeditation(name, breathing = false) {
  reflectionPlayer.hidden = true;
  reflectionPlayer.setAttribute('aria-hidden', 'true');
  meditationPlayer.hidden = false;
  meditationPlayer.querySelector('h2').textContent = name;
  meditationPlayer.classList.toggle('is-breathing', breathing);
  meditationPlayer.classList.remove('paused');
  practiceSeconds = name === 'Сканирование тела' ? 420 : name === 'Дыхание 4 × 6' ? 240 : 180;
  meditationPlayer.querySelector('strong').textContent = formatPracticeTime(practiceSeconds);
  meditationPlayer.querySelector('.breath-cue').textContent = breathing ? 'Медленный вдох' : 'Оставайтесь с ощущением';
  document.querySelector('.player-pause').textContent = 'Пауза';
  let cycleSeconds = 0;
  practiceTimer = window.setInterval(() => {
    if (meditationPlayer.classList.contains('paused')) return;
    practiceSeconds = Math.max(0, practiceSeconds - 1);
    meditationPlayer.querySelector('strong').textContent = formatPracticeTime(practiceSeconds);
    if (!practiceSeconds) stopPracticeTimers();
  }, 1000);
  if (breathing) breathTimer = window.setInterval(() => {
    if (meditationPlayer.classList.contains('paused')) return;
    cycleSeconds = (cycleSeconds + 1) % 10;
    meditationPlayer.querySelector('.breath-cue').textContent = cycleSeconds < 4 ? 'Медленный вдох' : 'Длинный выдох';
  }, 1000);
}

function renderReflectionQuestion() {
  document.getElementById('reflectionStep').textContent = reflectionIndex + 1;
  document.getElementById('reflectionTotal').textContent = activePrompts.length;
  document.getElementById('reflectionPrompt').textContent = activePrompts[reflectionIndex];
  document.querySelector('.reflection-progress i').style.setProperty('--progress', `${((reflectionIndex + 1) / activePrompts.length) * 100}%`);
  document.getElementById('reflectionAnswer').value = '';
  document.querySelector('.reflection-next').innerHTML = reflectionIndex === activePrompts.length - 1 ? 'Завершить <span>✓</span>' : 'Следующий вопрос <span>→</span>';
}

function startReflection(name) {
  meditationPlayer.hidden = true;
  reflectionPlayer.hidden = false;
  reflectionPlayer.setAttribute('aria-hidden', 'false');
  document.getElementById('reflectionTitle').textContent = name;
  activePrompts = reflectionPrompts[name] || reflectionPrompts['Что со мной сейчас'];
  reflectionIndex = 0;
  renderReflectionQuestion();
}

document.querySelectorAll('[data-practice-start]').forEach((button) => button.addEventListener('click', () => {
  stopPracticeTimers();
  practicePlayer.classList.add('open');
  practicePlayer.setAttribute('aria-hidden', 'false');
  if (button.dataset.practiceType === 'reflection') startReflection(button.dataset.practiceStart);
  else startMeditation(button.dataset.practiceStart, button.dataset.practiceType === 'breathing');
}));
document.querySelector('.player-close')?.addEventListener('click', () => {
  stopPracticeTimers();
  practicePlayer.classList.remove('open');
  practicePlayer.setAttribute('aria-hidden', 'true');
});
document.querySelector('.player-pause')?.addEventListener('click', (event) => {
  meditationPlayer.classList.toggle('paused');
  event.currentTarget.textContent = event.currentTarget.textContent === 'Пауза' ? 'Продолжить' : 'Пауза';
});
document.querySelectorAll('.reflection-next,.reflection-skip').forEach((button) => button.addEventListener('click', () => {
  if (reflectionIndex < activePrompts.length - 1) { reflectionIndex += 1; renderReflectionQuestion(); return; }
  practicePlayer.classList.remove('open');
  practicePlayer.setAttribute('aria-hidden', 'true');
}));

const energyRange = document.getElementById('energyRange');
const energyOutput = document.getElementById('energyOutput');
const energyHelp = document.getElementById('energyHelp');
const statePreviewLabel = document.getElementById('statePreviewLabel');
const stateReading = document.getElementById('stateReading');
const stateReadingCopy = document.getElementById('stateReadingCopy');
const moodStage = document.getElementById('moodStage');
const moodFace = document.getElementById('moodFace');
const moodLevels = [
  { value: 10, style: 'angry', label: 'Напряжение', reading: 'Нагрузку лучше снизить', copy: 'Сейчас полезнее оставить только необходимое и создать пространство для восстановления.' },
  { value: 23, style: 'irritated', label: 'Раздражение', reading: 'Лучше убрать лишние стимулы', copy: 'Tempo сократит переключения и предложит начать с одной короткой понятной задачи.' },
  { value: 34, style: 'sad', label: 'Грустно', reading: 'Сегодня нужен мягкий темп', copy: 'Tempo предложит знакомые задачи без лишнего давления и сохранит больше пауз.' },
  { value: 42, style: 'tired', label: 'Усталость', reading: 'Стоит беречь внимание', copy: 'Длинные задачи лучше разделить, а между спринтами оставить полноценное восстановление.' },
  { value: 52, style: 'surprised', label: 'Удивление', reading: 'Нужна короткая сверка плана', copy: 'Сначала стоит понять, что изменилось, и только потом выбирать следующий фокус.' },
  { value: 68, style: 'calm', label: 'Спокойно', reading: 'Темп можно сохранить', copy: 'Лучшее окно для сложной задачи - до 13:00. После встречи стоит оставить короткую паузу.' },
  { value: 82, style: 'energized', label: 'Бодро', reading: 'Есть ресурс для сложного', copy: 'Можно использовать ближайшее длинное окно для глубокой работы, не уплотняя вечер.' },
  { value: 96, style: 'delighted', label: 'В восторге', reading: 'Энергию можно направить в важное', copy: 'Хороший момент для задачи, которую давно хотелось сдвинуть с места.' }
];

function renderMood(value) {
  const mood = moodLevels.reduce((closest, item) => Math.abs(item.value - value) < Math.abs(closest.value - value) ? item : closest);
  moodStage.className = `mood-stage mood-${mood.style} is-changing`;
  moodFace.className = `face face-${mood.style}`;
  statePreviewLabel.textContent = mood.label;
  stateReading.textContent = mood.reading;
  stateReadingCopy.textContent = mood.copy;
  window.clearTimeout(renderMood.timeout);
  renderMood.timeout = window.setTimeout(() => moodStage.classList.remove('is-changing'), 180);
}

energyRange?.addEventListener('input', () => {
  const value = Number(energyRange.value);
  energyOutput.value = value;
  energyOutput.textContent = value;
  energyHelp.textContent = value < 35
    ? 'Энергии мало: лучше уменьшить нагрузку и оставить время на восстановление.'
    : value < 72
      ? 'Устойчивая энергия: можно работать, если сохранять паузы.'
      : 'Энергии много: можно выбрать сложную задачу, не уплотняя весь день.';
  renderMood(value);
});

renderMood(Number(energyRange?.value || 68));

let stateStep = 1;
const stateSteps = document.querySelectorAll('.state-step');
const stateBack = document.getElementById('stateBack');
const stateNext = document.getElementById('stateNext');
const stateProgress = document.querySelectorAll('.step-progress i');

function renderStateStep() {
  stateSteps.forEach((step) => step.classList.toggle('active', Number(step.dataset.step) === stateStep));
  stateProgress.forEach((dot, index) => dot.classList.toggle('active', index < stateStep));
  stateBack.disabled = stateStep === 1;
  stateNext.innerHTML = stateStep === 3 ? 'Сохранить <span>готово</span>' : `Продолжить <span>${stateStep} / 3</span>`;
  document.querySelector('.step-progress').setAttribute('aria-label', `Шаг ${stateStep} из 3`);
}

stateBack?.addEventListener('click', () => { if (stateStep > 1) { stateStep -= 1; renderStateStep(); } });
stateNext?.addEventListener('click', () => {
  if (stateStep < 3) { stateStep += 1; renderStateStep(); return; }
  document.querySelector('.checkin-layout').style.display = 'none';
  const success = document.querySelector('.checkin-success');
  success.classList.add('open');
  success.setAttribute('aria-hidden', 'false');
});

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  focusOverlay?.classList.remove('open');
  practicePlayer?.classList.remove('open');
});
