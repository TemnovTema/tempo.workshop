const app = document.getElementById('mobileApp');
const screens = [...document.querySelectorAll('[data-screen]')];
const navButtons = [...document.querySelectorAll('[data-nav]')];
const backdrop = document.getElementById('sheetBackdrop');
const sheets = [...document.querySelectorAll('.bottom-sheet')];
const topSlideCards = [...document.querySelectorAll('.top-slide-card')];
let activeSheet = null;
let sheetCloseTimer = null;
let sheetTrigger = null;

function updateStatusTime() {
  const now = new Date();
  document.getElementById('statusTime').textContent = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
}
updateStatusTime();
window.setInterval(updateStatusTime, 30000);

function fitDeviceMockup() {
  const stage = document.querySelector('.device-stage');
  if (!stage) return;
  if (window.matchMedia('(min-width: 600px)').matches) {
    const scale = Math.min(1, (window.innerHeight - 28) / 876, (window.innerWidth - 28) / 424);
    stage.style.setProperty('--device-scale', String(Math.max(.32, scale)));
  } else {
    stage.style.removeProperty('--device-scale');
  }
}
fitDeviceMockup();
window.addEventListener('resize', fitDeviceMockup);

function showScreen(name) {
  closeSheets({ immediate: true, restoreFocus: false });
  app.dataset.activeScreen = name;
  screens.forEach((screen) => screen.classList.toggle('active', screen.dataset.screen === name));
  navButtons.forEach((button) => button.classList.toggle('active', button.dataset.nav === name));
  topSlideCards.forEach((card) => card.classList.remove('entering'));
  const activeTopCard = document.querySelector(`[data-screen="${name}"] .top-slide-card`);
  if (activeTopCard) requestAnimationFrame(() => activeTopCard.classList.add('entering'));
  window.scrollTo({ top: 0, behavior: 'smooth' });
  history.replaceState(null, '', `#${name}`);
}

navButtons.forEach((button) => button.addEventListener('click', () => showScreen(button.dataset.nav)));
document.querySelectorAll('[data-screen-link]').forEach((button) => button.addEventListener('click', () => showScreen(button.dataset.screenLink)));

function setSheetState(sheet, isOpen) {
  sheet.classList.toggle('open', isOpen);
  sheet.setAttribute('aria-hidden', String(!isOpen));
  sheet.inert = !isOpen;
}

function openSheet(sheet, trigger = document.activeElement) {
  if (!sheet) return;
  window.clearTimeout(sheetCloseTimer);
  sheets.forEach((item) => setSheetState(item, false));
  activeSheet = sheet;
  sheetTrigger = trigger instanceof HTMLElement ? trigger : null;
  backdrop.hidden = false;
  app.classList.add('sheet-open');
  requestAnimationFrame(() => setSheetState(sheet, true));
}
function closeSheets({ immediate = false, restoreFocus = true } = {}) {
  window.clearTimeout(sheetCloseTimer);
  sheets.forEach((sheet) => setSheetState(sheet, false));
  activeSheet = null;
  app.classList.remove('sheet-open');
  const finishClose = () => {
    backdrop.hidden = true;
    if (restoreFocus && sheetTrigger?.isConnected) sheetTrigger.focus();
    sheetTrigger = null;
  };
  if (immediate) finishClose();
  else sheetCloseTimer = window.setTimeout(finishClose, 420);
}
backdrop.addEventListener('click', closeSheets);
document.querySelectorAll('.sheet-close').forEach((button) => button.addEventListener('click', closeSheets));
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && activeSheet) closeSheets();
});
sheets.forEach((sheet) => setSheetState(sheet, false));
backdrop.hidden = true;

const taskSheet = document.getElementById('taskSheet');
const sheetTaskTitle = document.getElementById('sheetTaskTitle');
document.querySelectorAll('[data-open-task]').forEach((button) => button.addEventListener('click', () => {
  sheetTaskTitle.textContent = button.dataset.openTask;
  taskSheet.querySelector('[data-start-task]').dataset.startTask = button.dataset.openTask;
  openSheet(taskSheet, button);
}));
document.querySelectorAll('[data-add-task]').forEach((button) => button.addEventListener('click', () => {
  sheetTaskTitle.textContent = 'Новая задача';
  taskSheet.querySelector('textarea').value = '';
  openSheet(taskSheet, button);
}));

let timerId;
let secondsLeft = 0;
function startTask(minutes) {
  closeSheets();
  secondsLeft = Number(minutes || 25) * 60;
  clearInterval(timerId);
  timerId = window.setInterval(() => {
    secondsLeft = Math.max(0, secondsLeft - 1);
    if (!secondsLeft) clearInterval(timerId);
  }, 1000);
}
document.querySelectorAll('[data-start-task]').forEach((button) => button.addEventListener('click', () => startTask(button.dataset.minutes)));

const filters = [...document.querySelectorAll('[data-filter]')];
filters.forEach((button) => button.addEventListener('click', () => {
  filters.forEach((item) => item.classList.toggle('active', item === button));
  document.querySelectorAll('.practice-card').forEach((card) => {
    card.hidden = button.dataset.filter !== 'all' && card.dataset.category !== button.dataset.filter;
  });
}));

const calendarButtons = [...document.querySelectorAll('[data-cal-view]')];
const calendarDay = document.getElementById('calendarDay');
const calendarAlternate = document.getElementById('calendarAlternate');
const calendarPeriod = document.getElementById('calendarPeriod');
const calendarPeriodMeta = document.getElementById('calendarPeriodMeta');
const projectButtons = [...document.querySelectorAll('.project-scroller [data-project]')];
let activeCalendarProject = 'all';
let currentCalendarView = 'day';
const calendarTasks = {
  14: [['09:30','Лекция по экономике','blue','univer'],['16:00','Подготовить конспект','violet','univer']],
  15: [['10:20','Макет главного экрана','coral','tempo'],['14:00','Синхронизация','violet','tempo'],['18:30','Прогулка','lime','health']],
  16: [['11:00','Исследование источников','blue','univer']],
  17: [['09:00','Проверка дня','neutral','health'],['13:00','Обед и прогулка','lime','health'],['15:30','Проверка прототипа','blue','tempo']],
  18: [['12:00','Практика внимания','violet','health'],['17:00','Тренировка','coral','health']],
  19: [['11:30','Разобрать материалы','blue','univer']],
  20: [['10:20','Макет главного экрана','coral','tempo'],['11:30','Синхронизация','violet','tempo'],['13:00','Обед и прогулка','lime','health'],['15:00','Проверка прототипа','blue','univer']],
  24: [['09:00','Утренняя проверка','neutral','health'],['12:30','Проект Tempo','coral','tempo'],['18:00','Практика дыхания','violet','health']]
};

const visibleCalendarTasks = (day) => (calendarTasks[day] || []).filter((task) => activeCalendarProject === 'all' || task[3] === activeCalendarProject);

function selectedDayTasks(day) {
  const tasks = visibleCalendarTasks(day);
  const content = tasks.length ? tasks.map(([time,title,color]) => `<button type="button" data-dynamic-task="${title}"><i class="task-color ${color}"></i><time>${time}</time><b>${title}</b><span>Открыть</span></button>`).join('') : '<p class="calendar-empty">В этом проекте задач нет</p>';
  return `<section class="selected-day-tasks"><header><span>Задачи</span><strong>${day} сентября</strong></header>${content}</section>`;
}

function bindCalendarSelection(defaultDay) {
  const output = calendarAlternate.querySelector('[data-selected-tasks]');
  const selectDay = (button) => {
    calendarAlternate.querySelectorAll('[data-calendar-day]').forEach((item) => item.classList.toggle('active', item === button));
    output.innerHTML = selectedDayTasks(Number(button.dataset.calendarDay));
  };
  calendarAlternate.querySelectorAll('[data-calendar-day]').forEach((button) => button.addEventListener('click', () => selectDay(button)));
  const initial = calendarAlternate.querySelector(`[data-calendar-day="${defaultDay}"]`) || calendarAlternate.querySelector('[data-calendar-day]');
  if (initial) selectDay(initial);
  output.addEventListener('click', (event) => {
    const button = event.target.closest('[data-dynamic-task]');
    if (!button) return;
    sheetTaskTitle.textContent = button.dataset.dynamicTask;
    taskSheet.querySelector('[data-start-task]').dataset.startTask = button.dataset.dynamicTask;
    openSheet(taskSheet, button);
  });
}

function renderCalendar(view) {
  currentCalendarView = view;
  calendarButtons.forEach((button) => button.classList.toggle('active', button.dataset.calView === view));
  calendarDay.hidden = view !== 'day';
  calendarAlternate.hidden = view === 'day';
  calendarDay.querySelectorAll('.mobile-event[data-project]').forEach((event) => {
    event.hidden = activeCalendarProject !== 'all' && event.dataset.project !== activeCalendarProject;
  });
  if (view === 'week') {
    calendarPeriod.textContent = '14–20 сентября';
    calendarPeriodMeta.textContent = 'эта неделя';
    calendarAlternate.innerHTML = `<div class="mobile-week">${['Пн 14','Вт 15','Ср 16','Чт 17','Пт 18','Сб 19','Вс 20'].map((label) => { const day=Number(label.split(' ')[1]); const tasks=visibleCalendarTasks(day); return `<button type="button" data-calendar-day="${day}"><span>${label.split(' ')[0]}</span><b>${day}</b><i class="week-task-stack">${tasks.map((task)=>`<em class="${task[2]}"></em>`).join('')}</i></button>`; }).join('')}</div><div data-selected-tasks></div>`;
    bindCalendarSelection(20);
  } else if (view === 'month') {
    calendarPeriod.textContent = 'Сентябрь 2026';
    calendarPeriodMeta.textContent = '12 задач · 8 практик';
    calendarAlternate.innerHTML = `<div class="mobile-month">${Array.from({length:35},(_,i)=>{ const day=i<2||i>31?0:i-1; const tasks=visibleCalendarTasks(day); return `<button type="button" ${day?`data-calendar-day="${day}"`: 'disabled'}>${day||''}<i>${tasks.slice(0,3).map((task)=>`<em class="${task[2]}"></em>`).join('')}</i></button>`; }).join('')}</div><div data-selected-tasks></div>`;
    bindCalendarSelection(24);
  } else {
    calendarPeriod.textContent = '20 сентября';
    calendarPeriodMeta.textContent = 'воскресенье · сегодня';
  }
}
calendarButtons.forEach((button) => button.addEventListener('click', () => renderCalendar(button.dataset.calView)));
projectButtons.forEach((button) => button.addEventListener('click', () => {
  activeCalendarProject = button.dataset.project;
  projectButtons.forEach((item) => item.classList.toggle('active', item === button));
  renderCalendar(currentCalendarView);
}));

document.querySelectorAll('[data-task-color]').forEach((button) => button.addEventListener('click', () => {
  document.querySelectorAll('[data-task-color]').forEach((item) => item.classList.toggle('active', item === button));
  taskSheet.dataset.taskColor = button.dataset.taskColor;
}));

const moodLevels = [
  [8,'angry','Напряжение','Лучше снять нагрузку и дать телу паузу.'],
  [22,'irritated','Раздражение','Сначала стоит убрать один источник напряжения.'],
  [36,'tired','Усталость','Подойдёт короткое восстановление без экрана.'],
  [50,'sad','Мало сил','Оставьте только необходимое и попросите поддержки.'],
  [62,'calm','Спокойно','Темп ровный, можно двигаться без спешки.'],
  [74,'energized','Бодро','Энергии достаточно, чтобы начать с важного.'],
  [86,'surprised','Открыто','Есть ресурс для новой идеи или разговора.'],
  [97,'delighted','В восторге','Хороший момент для творчества и общения.']
];
const energySlider = document.getElementById('energySlider');
const moodOrb = document.getElementById('moodOrb');
const moodFace = document.getElementById('moodFace');
function updateMood() {
  const value = Number(energySlider.value);
  const mood = moodLevels.reduce((closest,item)=>Math.abs(item[0]-value)<Math.abs(closest[0]-value)?item:closest);
  moodOrb.className = `mood-orb mood-${mood[1]}`;
  moodFace.className = `face face-${mood[1]}`;
  document.getElementById('moodLabel').textContent = mood[2];
  document.getElementById('moodCopy').textContent = mood[3];
  document.getElementById('stateScore').textContent = value;
}
energySlider.addEventListener('input', updateMood);
document.querySelectorAll('.factor-card button').forEach((button) => button.addEventListener('click', () => button.classList.toggle('active')));
document.querySelector('.save-state').addEventListener('click', (event) => {
  event.currentTarget.firstChild.textContent = 'Состояние сохранено ';
  window.setTimeout(() => { event.currentTarget.firstChild.textContent = 'Сохранить состояние '; }, 1600);
});

function applyTheme(theme) {
  app.dataset.theme = theme;
  document.body.dataset.appTheme = theme;
  document.querySelectorAll('[data-theme]').forEach((item) => item.classList.toggle('active', item.dataset.theme === theme));
  localStorage.setItem('tempo-mobile-theme', theme);
}
document.querySelectorAll('[data-theme]').forEach((button) => button.addEventListener('click', () => applyTheme(button.dataset.theme)));
applyTheme(localStorage.getItem('tempo-mobile-theme') || 'light');

const availableScreens = ['today','calendar','practices','state','liked'];
const initialScreen = location.hash.slice(1);
showScreen(availableScreens.includes(initialScreen) ? initialScreen : 'today');
window.addEventListener('hashchange', () => {
  const screen = location.hash.slice(1);
  showScreen(availableScreens.includes(screen) ? screen : 'today');
});
window.addEventListener('pageshow', () => closeSheets({ immediate: true, restoreFocus: false }));
