const app = document.getElementById('mobileApp');
const screens = [...document.querySelectorAll('[data-screen]')];
const navButtons = [...document.querySelectorAll('[data-nav]')];
const backdrop = document.getElementById('sheetBackdrop');
const sheets = [...document.querySelectorAll('.bottom-sheet')];
const topSlideCards = [...document.querySelectorAll('.top-slide-card')];
const devicePicker = document.getElementById('prototypeDevice');
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
    const isProMax = document.body.dataset.device === 'iphone17promax';
    const deviceWidth = isProMax ? 474 : 424;
    const deviceHeight = isProMax ? 960 : 876;
    stage.style.setProperty('--device-width', `${deviceWidth}px`);
    stage.style.setProperty('--device-height', `${deviceHeight}px`);
    const scale = Math.min(1, (window.innerHeight - 28) / deviceHeight, (window.innerWidth - 28) / deviceWidth);
    stage.style.setProperty('--device-scale', String(Math.max(.32, scale)));
  } else {
    stage.style.removeProperty('--device-scale');
  }
}
fitDeviceMockup();
window.addEventListener('resize', fitDeviceMockup);

const savedDevice = window.localStorage.getItem('tempo-prototype-device') || 'iphone17';
document.body.dataset.device = savedDevice;
devicePicker.value = savedDevice;
fitDeviceMockup();
devicePicker.addEventListener('change', () => {
  document.body.dataset.device = devicePicker.value;
  window.localStorage.setItem('tempo-prototype-device', devicePicker.value);
  fitDeviceMockup();
});

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
  if (typeof practiceTimerId !== 'undefined') window.clearInterval(practiceTimerId);
  document.getElementById('practiceSheet')?.classList.remove('running-session');
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
const practiceCatalogCards = [...document.querySelectorAll('.screen[data-screen="practices"] .practice-card')];
filters.forEach((button) => button.addEventListener('click', () => {
  filters.forEach((item) => {
    const isActive = item === button;
    item.classList.toggle('active', isActive);
    item.setAttribute('aria-pressed', String(isActive));
  });
  practiceCatalogCards.forEach((card) => {
    card.hidden = button.dataset.filter !== 'all' && card.dataset.category !== button.dataset.filter;
  });
}));

const practiceLibrary = {
  'Освободить внимание': ['Спокойствие',4,'wind','Следуйте за спокойным вдохом и более длинным выдохом.'],
  'Собрать внимание': ['Фокус',8,'eye','Выберите одну точку перед собой и мягко возвращайте к ней внимание.'],
  'Разбудить тело': ['Энергия',6,'person-simple-run','Медленно разомните плечи, спину и ноги без спортивного усилия.'],
  'Снизить шум': ['Спокойствие',3,'speaker-simple-slash','Заметьте звуки вокруг и постепенно отпускайте каждый из них.'],
  'Оставить день позади': ['Спокойствие',10,'sunset','Назовите завершённые дела и разрешите остальному остаться до завтра.'],
  'Разложить сложное': ['Фокус',12,'stairs','Разделите задачу и выберите только один следующий выполнимый шаг.'],
  'Выйти на свет': ['Энергия',15,'sun-horizon','Пройдитесь в ровном темпе, замечая свет, дыхание и шаги.'],
  'Что со мной сейчас': ['Рефлексия',8,'question','Ответьте: что я чувствую, чего хочу и что поможет прямо сейчас?'],
  'Распутать мысль': ['Рефлексия',10,'path','Отделите наблюдаемый факт от своей интерпретации и следующего действия.'],
  'Три хороших момента': ['Рефлексия',10,'sparkle','Вспомните три момента дня и коротко отметьте, почему они важны.'],
  'Дыхание 4 × 6': ['Медитация',4,'wind','Вдыхайте на четыре счёта и выдыхайте на шесть без задержки.'],
  'Сканирование тела': ['Медитация',7,'person-simple','Переводите внимание от лица к стопам, ничего не оценивая.'],
  'Тихое дыхание': ['Медитация',5,'wind','Наблюдайте естественный ритм дыхания, не меняя его.']
};
const practiceSheet = document.getElementById('practiceSheet');
const practiceSheetTitle = document.getElementById('practiceSheetTitle');
const practiceSheetMeta = document.getElementById('practiceSheetMeta');
const practiceInstruction = document.getElementById('practiceInstruction');
const practiceTimer = document.getElementById('practiceTimer');
const practicePlayerVisual = document.getElementById('practicePlayerVisual');
const practiceStages = document.getElementById('practiceStages');
const practiceStartButton = document.getElementById('practiceStartButton');
let selectedPracticeMinutes = 4;
let selectedPracticeStages = ['Настройка','Практика','Завершение'];
let practiceTimerId;

const stagesForPractice = (name, category) => {
  if (name === 'Дыхание 4 × 6' || name === 'Освободить внимание' || name === 'Тихое дыхание') return ['Вдох','Выдох','Повтор'];
  if (category === 'Рефлексия') return ['Заметьте','Назовите','Выберите'];
  if (category === 'Энергия') return ['Разминка','Движение','Пауза'];
  if (category === 'Спокойствие') return ['Настройка','Замедление','Тишина'];
  if (category === 'Медитация') return ['Настройка','Сканирование','Завершение'];
  return ['Настройка','Наблюдение','Возврат'];
};

function renderPracticeStages(activeIndex = 0) {
  practiceStages.innerHTML = selectedPracticeStages.map((stage, index) => `<span class="${index === activeIndex ? 'active' : ''}">${stage}</span>`).join('');
}

document.querySelectorAll('[data-practice]').forEach((button) => button.addEventListener('click', () => {
  const name = button.dataset.practice;
  const [category, minutes, icon, instruction] = practiceLibrary[name] || ['Практика',5,'sparkle','Устройтесь удобно и следуйте подсказкам на экране.'];
  selectedPracticeMinutes = minutes;
  selectedPracticeStages = stagesForPractice(name, category);
  window.clearInterval(practiceTimerId);
  practiceSheetTitle.textContent = name;
  practiceSheetMeta.textContent = `${category} · ${minutes} минут`;
  practiceInstruction.textContent = instruction;
  practiceTimer.textContent = `${String(minutes).padStart(2,'0')}:00`;
  practicePlayerVisual.querySelector('i').className = `ph ph-${icon}`;
  practicePlayerVisual.dataset.category = category.toLowerCase();
  practiceSheet.classList.remove('running-session');
  renderPracticeStages();
  practiceStartButton.classList.remove('running');
  practiceStartButton.firstChild.textContent = 'Начать практику ';
  practiceStartButton.querySelector('span').textContent = `${minutes} мин`;
  openSheet(practiceSheet, button);
}));

practiceStartButton.addEventListener('click', () => {
  window.clearInterval(practiceTimerId);
  let remaining = selectedPracticeMinutes * 60;
  const totalSeconds = remaining;
  practiceSheet.classList.add('running-session');
  practiceStartButton.classList.add('running');
  practiceStartButton.firstChild.textContent = 'Практика идёт ';
  const renderPracticeTime = () => {
    const elapsed = totalSeconds - remaining;
    renderPracticeStages(Math.min(2, Math.floor(elapsed / Math.max(1, totalSeconds / 3))));
    practiceTimer.textContent = `${String(Math.floor(remaining / 60)).padStart(2,'0')}:${String(remaining % 60).padStart(2,'0')}`;
    if (remaining === 0) {
      window.clearInterval(practiceTimerId);
      practiceStartButton.firstChild.textContent = 'Практика завершена ';
      practiceStartButton.querySelector('span').textContent = 'готово';
      return;
    }
    remaining -= 1;
  };
  renderPracticeTime();
  practiceTimerId = window.setInterval(renderPracticeTime, 1000);
});

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
