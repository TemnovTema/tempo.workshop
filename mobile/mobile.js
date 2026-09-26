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

function showScreen(name, updateHistory = true) {
  closeSheets({ immediate: true, restoreFocus: false });
  app.dataset.activeScreen = name;
  screens.forEach((screen) => screen.classList.toggle('active', screen.dataset.screen === name));
  navButtons.forEach((button) => button.classList.toggle('active', button.dataset.nav === name));
  topSlideCards.forEach((card) => card.classList.remove('entering'));
  const activeTopCard = document.querySelector(`[data-screen="${name}"] .top-slide-card`);
  if (activeTopCard) requestAnimationFrame(() => activeTopCard.classList.add('entering'));
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (updateHistory) history.replaceState(null, '', `#${name}`);
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
  document.body.classList.toggle('profile-mode', sheet.id === 'profileSheet');
  requestAnimationFrame(() => setSheetState(sheet, true));
}
function closeSheets({ immediate = false, restoreFocus = true } = {}) {
  window.clearTimeout(sheetCloseTimer);
  if (typeof practiceTimerId !== 'undefined') window.clearInterval(practiceTimerId);
  document.getElementById('practiceSheet')?.classList.remove('running-session');
  document.body.classList.remove('practice-mode');
  document.body.classList.remove('profile-mode');
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
const taskSheetEyebrow = document.getElementById('taskSheetEyebrow');
const taskSaveButton = taskSheet.querySelector('[data-save-task]');
const taskDeleteButton = taskSheet.querySelector('[data-delete-task]');
const participantButtons = [...taskSheet.querySelectorAll('[data-participant]')];
const selectedParticipants = taskSheet.querySelector('.selected-participants');
let taskSource = null;

sheetTaskTitle.contentEditable = 'true';
sheetTaskTitle.setAttribute('role', 'textbox');
sheetTaskTitle.setAttribute('aria-label', 'Название задачи');

function resetParticipants(initials = []) {
  participantButtons.forEach((button) => {
    const selected = initials.includes(button.dataset.participant);
    button.classList.toggle('active', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
  const active = participantButtons.filter((button) => button.classList.contains('active'));
  selectedParticipants.innerHTML = active.length
    ? active.map((button) => `<em>${button.dataset.participant}</em>`).join('')
    : '<span>Пока никого</span>';
}

function setTaskProject(project = 'tempo') {
  taskSheet.querySelectorAll('[data-task-project]').forEach((button) => button.classList.toggle('active', button.dataset.taskProject === project));
  const projectName = { tempo: 'Tempo', univer: 'Универ', health: 'Здоровье' }[project] || 'Tempo';
  taskSheet.dataset.taskProject = project;
  taskSheetEyebrow.textContent = `задача · ${projectName}`;
}

function prepareTaskSheet(mode, title, source = null) {
  taskSheet.dataset.mode = mode;
  taskSource = source;
  sheetTaskTitle.textContent = title;
  taskSaveButton.firstChild.textContent = mode === 'create' ? 'Создать задачу ' : 'Сохранить изменения ';
  taskSaveButton.querySelector('span').textContent = mode === 'create' ? 'добавить' : 'готово';
  if (typeof editorStartButton !== 'undefined') editorStartButton.hidden = mode === 'create';
  taskDeleteButton.hidden = mode === 'create';
  taskDeleteButton.dataset.confirm = 'false';
  taskDeleteButton.innerHTML = '<i class="ph ph-trash"></i>Удалить задачу';
  resetParticipants();
  setTaskProject(source?.dataset.project || 'tempo');
  const projectColor = { tempo: 'violet', univer: 'blue', health: 'lime' }[taskSheet.dataset.taskProject] || 'coral';
  taskSheet.querySelectorAll('[data-task-color]').forEach((button) => button.classList.toggle('active', button.dataset.taskColor === projectColor));
}

document.querySelectorAll('[data-open-task]').forEach((button) => button.addEventListener('click', () => {
  prepareTaskSheet('edit', button.dataset.openTask, button);
  openSheet(taskSheet, button);
}));
document.querySelectorAll('[data-add-task]').forEach((button) => button.addEventListener('click', () => {
  prepareTaskSheet('create', 'Новая задача');
  taskSheet.querySelector('textarea').value = '';
  openSheet(taskSheet, button);
}));

taskSheet.querySelectorAll('[data-task-project]').forEach((button) => button.addEventListener('click', () => setTaskProject(button.dataset.taskProject)));
participantButtons.forEach((button) => button.addEventListener('click', () => {
  button.classList.toggle('active');
  button.setAttribute('aria-pressed', String(button.classList.contains('active')));
  resetParticipants(participantButtons.filter((item) => item.classList.contains('active')).map((item) => item.dataset.participant));
}));
taskSheet.querySelector('[data-add-participant]').addEventListener('click', () => {
  taskSheet.querySelector('.participant-options').classList.toggle('open');
});
taskSaveButton.addEventListener('click', () => {
  const title = sheetTaskTitle.textContent.trim() || 'Без названия';
  sheetTaskTitle.textContent = title;
  if (taskSource) {
    taskSource.dataset.openTask = title;
    const label = taskSource.querySelector('b');
    if (label) label.textContent = title;
    taskSource.dataset.project = taskSheet.dataset.taskProject;
  }
  closeSheets();
});
taskDeleteButton.addEventListener('click', () => {
  if (taskDeleteButton.dataset.confirm !== 'true') {
    taskDeleteButton.dataset.confirm = 'true';
    taskDeleteButton.innerHTML = '<i class="ph ph-warning"></i>Нажмите ещё раз для удаления';
    return;
  }
  taskSource?.remove();
  closeSheets();
});
document.querySelectorAll('[data-open-sheet]').forEach((button) => button.addEventListener('click', () => {
  openSheet(document.getElementById(button.dataset.openSheet), button);
}));

let timerId;
let secondsLeft = 0;
const dynamicIsland = document.getElementById('dynamicIsland');
const islandTimer = document.getElementById('islandTimer');
const islandStage = document.getElementById('islandStage');
const islandTask = document.getElementById('islandTask');
const islandProgress = document.getElementById('islandProgress');
const islandToggle = dynamicIsland.querySelector('[data-island-toggle]');
const islandSkip = dynamicIsland.querySelector('[data-island-skip]');
const editorStartButton = document.createElement('button');
let sprintStages = [];
let sprintIndex = 0;
let stageDuration = 0;
let timerPaused = false;
let activeTaskTitle = '';

editorStartButton.className = 'task-start-secondary';
editorStartButton.type = 'button';
editorStartButton.dataset.startEditor = '';
editorStartButton.innerHTML = '<i class="ph ph-play"></i>Начать задачу';
taskSaveButton.insertAdjacentElement('afterend', editorStartButton);

function formatTimer(value) {
  const minutes = Math.floor(value / 60);
  const seconds = value % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function setButtonLabel(button, label, meta) {
  if (!button) return;
  const textNode = [...button.childNodes].find((node) => node.nodeType === Node.TEXT_NODE);
  if (textNode) textNode.textContent = `${label} `;
  const detail = button.querySelector(':scope > span');
  if (detail) detail.textContent = meta;
}

function syncTaskSurfaces() {
  const stage = sprintStages[sprintIndex];
  const complete = dynamicIsland.classList.contains('complete');
  const status = complete ? 'Готово' : timerPaused ? 'На паузе' : stage?.type === 'rest' ? 'Перерыв' : `Фокус ${sprintIndex === 2 ? 2 : 1}`;
  const time = complete ? 'завершено' : formatTimer(secondsLeft);
  const homeStart = document.querySelector('[data-start-task]');
  const homeCard = homeStart?.closest('.next-task');
  const isHomeTask = homeStart?.dataset.startTask === activeTaskTitle;

  homeCard?.classList.toggle('task-running', Boolean(isHomeTask && !complete));
  if (isHomeTask) {
    homeCard.dataset.liveStatus = `${status} · ${time}`;
    if (complete) setButtonLabel(homeStart, 'Задача завершена', 'готово');
    else if (stage?.type === 'rest') setButtonLabel(homeStart, 'Завершить перерыв', time);
    else setButtonLabel(homeStart, timerPaused ? 'Продолжить задачу' : 'Поставить на паузу', `${status} · ${time}`);
  } else if (homeCard) {
    delete homeCard.dataset.liveStatus;
    setButtonLabel(homeStart, 'Начать задачу', '2 × 25 мин');
  }

  document.querySelectorAll('[data-open-task]').forEach((card) => {
    const active = card.dataset.openTask === activeTaskTitle && !complete;
    card.classList.toggle('task-running', active);
    if (active) card.dataset.liveStatus = `${status} · ${time}`;
    else delete card.dataset.liveStatus;
  });
}

function renderIsland() {
  const stage = sprintStages[sprintIndex];
  if (!stage) return;
  islandTimer.textContent = formatTimer(secondsLeft);
  islandStage.textContent = `${stage.label} · ${sprintIndex + 1} из ${sprintStages.length}`;
  islandProgress.style.width = `${Math.max(0, Math.min(100, (1 - secondsLeft / stageDuration) * 100))}%`;
  islandToggle.querySelector('i').className = timerPaused ? 'ph ph-play' : 'ph ph-pause';
  islandToggle.querySelector('b').textContent = timerPaused ? 'Продолжить' : 'Пауза';
  dynamicIsland.classList.toggle('resting', stage.type === 'rest');
  dynamicIsland.setAttribute('aria-label', `${islandTask.textContent}. ${stage.label}. Осталось ${formatTimer(secondsLeft)}`);
  syncTaskSurfaces();
}

function beginStage(index) {
  sprintIndex = index;
  if (sprintIndex >= sprintStages.length) {
    clearInterval(timerId);
    dynamicIsland.classList.add('complete');
    dynamicIsland.classList.remove('expanded');
    islandTimer.textContent = 'Готово';
    dynamicIsland.setAttribute('aria-label', `${islandTask.textContent}. Задача завершена`);
    syncTaskSurfaces();
    return;
  }
  stageDuration = sprintStages[sprintIndex].seconds;
  secondsLeft = stageDuration;
  timerPaused = false;
  renderIsland();
}

function startTask(minutes, title = 'Текущая задача') {
  closeSheets();
  const workMinutes = Math.max(1, Math.round(Number(minutes || 50) / 2));
  sprintStages = [
    { type: 'work', label: 'Фокус', seconds: workMinutes * 60 },
    { type: 'rest', label: 'Перерыв', seconds: 5 * 60 },
    { type: 'work', label: 'Фокус', seconds: workMinutes * 60 }
  ];
  islandTask.textContent = title;
  activeTaskTitle = title;
  dynamicIsland.classList.add('live');
  dynamicIsland.classList.remove('complete');
  beginStage(0);
  clearInterval(timerId);
  timerId = window.setInterval(() => {
    if (timerPaused) return;
    secondsLeft = Math.max(0, secondsLeft - 1);
    if (!secondsLeft) beginStage(sprintIndex + 1);
    else renderIsland();
  }, 1000);
}
document.querySelectorAll('[data-start-task]').forEach((button) => button.addEventListener('click', () => {
  if (dynamicIsland.classList.contains('live') && button.dataset.startTask === activeTaskTitle && !dynamicIsland.classList.contains('complete')) {
    if (sprintStages[sprintIndex]?.type === 'rest') beginStage(sprintIndex + 1);
    else {
      timerPaused = !timerPaused;
      renderIsland();
    }
    return;
  }
  startTask(button.dataset.minutes, button.dataset.startTask);
}));
editorStartButton.addEventListener('click', () => startTask(50, sheetTaskTitle.textContent.trim() || 'Текущая задача'));
document.addEventListener('click', (event) => {
  const card = event.target.closest('[data-open-task]');
  if (!card || card.dataset.openTask !== activeTaskTitle || !dynamicIsland.classList.contains('live')) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  dynamicIsland.classList.add('expanded');
  dynamicIsland.setAttribute('aria-expanded', 'true');
}, true);
dynamicIsland.addEventListener('click', (event) => {
  if (!dynamicIsland.classList.contains('live')) return;
  if (event.target.closest('[data-island-toggle]')) {
    timerPaused = !timerPaused;
    renderIsland();
    return;
  }
  if (event.target.closest('[data-island-skip]')) {
    beginStage(sprintIndex + 1);
    return;
  }
  const expanded = dynamicIsland.classList.toggle('expanded');
  dynamicIsland.setAttribute('aria-expanded', String(expanded));
});

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
const practiceStageLabel = document.getElementById('practiceStageLabel');
const practiceSession = document.getElementById('practiceSession');
const practiceFeedback = document.getElementById('practiceFeedback');
const practiceStep = document.getElementById('practiceStep');
const practiceFinishEarly = document.getElementById('practiceFinishEarly');
let selectedPracticeMinutes = 4;
let selectedPracticeStages = ['Настройка','Практика','Завершение'];
let selectedPracticeAnimation = 'focus';
let practiceTimerId;

const stagesForPractice = (name, category) => {
  if (name === 'Дыхание 4 × 6' || name === 'Освободить внимание' || name === 'Тихое дыхание') return ['Вдох · 4','Выдох · 6'];
  if (category === 'Рефлексия') return ['Заметьте','Назовите','Выберите'];
  if (category === 'Энергия') return ['Разминка','Движение','Пауза'];
  if (category === 'Спокойствие') return ['Настройка','Замедление','Тишина'];
  if (category === 'Медитация') return ['Настройка','Сканирование','Завершение'];
  return ['Настройка','Наблюдение','Возврат'];
};

const animationForPractice = (name, category) => {
  if (name === 'Дыхание 4 × 6' || name === 'Освободить внимание' || name === 'Тихое дыхание') return 'breathe';
  if (category === 'Медитация') return 'scan';
  if (category === 'Энергия') return 'energy';
  if (category === 'Спокойствие') return 'calm';
  if (category === 'Рефлексия') return 'reflection';
  return 'focus';
};

function renderPracticeStages(activeIndex = 0) {
  practiceStages.innerHTML = selectedPracticeStages.map((stage, index) => `<span class="${index === activeIndex ? 'active' : ''}">${stage}</span>`).join('');
  practiceStageLabel.textContent = selectedPracticeStages[activeIndex];
}

function showPracticeFeedback() {
  window.clearInterval(practiceTimerId);
  practiceSheet.classList.remove('running-session');
  practiceSession.hidden = true;
  practiceFeedback.hidden = false;
  practiceStep.textContent = '2 из 2';
}

document.querySelectorAll('[data-practice]').forEach((button) => button.addEventListener('click', () => {
  const name = button.dataset.practice;
  const [category, minutes, icon, instruction] = practiceLibrary[name] || ['Практика',5,'sparkle','Устройтесь удобно и следуйте подсказкам на экране.'];
  selectedPracticeMinutes = minutes;
  selectedPracticeStages = stagesForPractice(name, category);
  selectedPracticeAnimation = animationForPractice(name, category);
  window.clearInterval(practiceTimerId);
  practiceSheetTitle.textContent = name;
  practiceSheetMeta.textContent = `${category} · ${minutes} минут`;
  practiceInstruction.textContent = instruction;
  practiceTimer.textContent = `${String(minutes).padStart(2,'0')}:00`;
  practicePlayerVisual.querySelector('i').className = `ph ph-${icon}`;
  practicePlayerVisual.dataset.category = category.toLowerCase();
  practicePlayerVisual.dataset.animation = selectedPracticeAnimation;
  practicePlayerVisual.setAttribute('aria-label', `Анимация практики «${name}»`);
  practiceSheet.classList.remove('running-session');
  practiceSession.hidden = false;
  practiceFeedback.hidden = true;
  practiceStep.textContent = '1 из 2';
  renderPracticeStages();
  practiceStartButton.classList.remove('running');
  practiceStartButton.querySelector('i').className = 'ph ph-play';
  document.body.classList.add('practice-mode');
  app.scrollTo({ top: 0, behavior: 'auto' });
  practiceSheet.scrollTop = 0;
  openSheet(practiceSheet, button);
}));

practiceStartButton.addEventListener('click', () => {
  window.clearInterval(practiceTimerId);
  let remaining = selectedPracticeMinutes * 60;
  const totalSeconds = remaining;
  practiceSheet.classList.add('running-session');
  practiceStartButton.classList.add('running');
  practiceStartButton.querySelector('i').className = 'ph ph-pause';
  const renderPracticeTime = () => {
    const elapsed = totalSeconds - remaining;
    if (selectedPracticeAnimation === 'breathe') {
      const breathSecond = elapsed % 10;
      renderPracticeStages(breathSecond < 4 ? 0 : 1);
    } else {
      renderPracticeStages(Math.min(selectedPracticeStages.length - 1, Math.floor(elapsed / Math.max(1, totalSeconds / selectedPracticeStages.length))));
    }
    practiceTimer.textContent = `${String(Math.floor(remaining / 60)).padStart(2,'0')}:${String(remaining % 60).padStart(2,'0')}`;
    if (remaining === 0) {
      showPracticeFeedback();
      return;
    }
    remaining -= 1;
  };
  renderPracticeTime();
  practiceTimerId = window.setInterval(renderPracticeTime, 1000);
});

practiceFinishEarly.addEventListener('click', showPracticeFeedback);
document.querySelectorAll('.soundscape-picker button').forEach((button) => button.addEventListener('click', () => {
  document.querySelectorAll('.soundscape-picker button').forEach((item) => item.classList.toggle('active', item === button));
}));
document.querySelectorAll('.feedback-options button').forEach((button) => button.addEventListener('click', () => button.classList.toggle('active')));
document.getElementById('practiceFeedbackSave').addEventListener('click', closeSheets);
document.getElementById('practiceFeedbackSkip').addEventListener('click', closeSheets);

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
    prepareTaskSheet('edit', button.dataset.dynamicTask, button);
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
  document.querySelectorAll('.state-score-small').forEach((score) => { score.textContent = value; });
}
energySlider.addEventListener('input', updateMood);
const stateSteps = [...document.querySelectorAll('[data-state-step]')];
function showStateStep(step) {
  stateSteps.forEach((panel) => {
    const isActive = Number(panel.dataset.stateStep) === Number(step);
    panel.hidden = !isActive;
    panel.classList.toggle('active', isActive);
  });
  app.scrollTo({ top: 0, behavior: 'smooth' });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
document.querySelectorAll('[data-state-next]').forEach((button) => button.addEventListener('click', () => showStateStep(button.dataset.stateNext)));
document.querySelectorAll('[data-state-back]').forEach((button) => button.addEventListener('click', () => showStateStep(button.dataset.stateBack)));
document.querySelectorAll('.state-factor-grid button').forEach((button) => button.addEventListener('click', () => {
  button.classList.toggle('active');
  button.setAttribute('aria-pressed', String(button.classList.contains('active')));
}));
document.querySelectorAll('.state-note-prompts button').forEach((button) => button.addEventListener('click', () => {
  const note = document.getElementById('stateNote');
  note.value = note.value ? `${note.value}\n${button.textContent} ` : `${button.textContent} `;
  note.focus();
}));
document.querySelector('.save-state').addEventListener('click', (event) => {
  event.currentTarget.firstChild.textContent = 'Состояние сохранено ';
  window.setTimeout(() => {
    event.currentTarget.firstChild.textContent = 'Сохранить состояние ';
    showStateStep(1);
  }, 1200);
});

function applyTheme(theme) {
  app.dataset.theme = theme;
  document.body.dataset.appTheme = theme;
  document.querySelectorAll('[data-theme]').forEach((item) => item.classList.toggle('active', item.dataset.theme === theme));
  localStorage.setItem('tempo-mobile-theme', theme);
}
document.querySelectorAll('[data-theme]').forEach((button) => button.addEventListener('click', () => applyTheme(button.dataset.theme)));
applyTheme(localStorage.getItem('tempo-mobile-theme') || 'light');

const profileSheet = document.getElementById('profileSheet');
const profileTabs = [...document.querySelectorAll('[data-profile-tab]')];
const profilePanels = [...document.querySelectorAll('[data-profile-panel]')];
const profileToast = document.querySelector('.profile-toast');
let profileToastTimer;

function showProfilePanel(name) {
  profileTabs.forEach((button) => button.classList.toggle('active', button.dataset.profileTab === name));
  profilePanels.forEach((panel) => panel.classList.toggle('active', panel.dataset.profilePanel === name));
  profileSheet?.scrollTo({ top: 0, behavior: 'smooth' });
}

function showProfileToast(message) {
  if (!profileToast) return;
  window.clearTimeout(profileToastTimer);
  profileToast.textContent = message;
  profileToast.classList.add('visible');
  profileToastTimer = window.setTimeout(() => profileToast.classList.remove('visible'), 1800);
}

profileTabs.forEach((button) => button.addEventListener('click', () => showProfilePanel(button.dataset.profileTab)));
document.querySelector('.profile-more')?.addEventListener('click', () => showProfilePanel('privacy'));
document.querySelector('[data-profile-sync]')?.addEventListener('click', (event) => {
  event.currentTarget.querySelector('i').classList.add('spin-once');
  showProfileToast('Источники обновлены');
  window.setTimeout(() => event.currentTarget.querySelector('i').classList.remove('spin-once'), 650);
});

const themeAuto = document.querySelector('[data-mobile-theme-auto]');
const themeHours = document.querySelector('.mobile-theme-hours');
themeAuto?.addEventListener('change', () => {
  themeHours.disabled = !themeAuto.checked;
  showProfileToast(themeAuto.checked ? 'Расписание темы включено' : 'Расписание темы выключено');
});

document.querySelectorAll('[data-connect-source]').forEach((button) => button.addEventListener('click', () => {
  const isConnected = button.classList.toggle('connected');
  button.textContent = isConnected ? 'Подключено' : 'Подключить';
  showProfileToast(isConnected ? 'Источник подключён' : 'Источник отключён');
}));

document.querySelector('[data-device-catalog]')?.addEventListener('click', (event) => {
  const catalog = document.querySelector('.device-catalog');
  catalog.hidden = !catalog.hidden;
  event.currentTarget.classList.toggle('active', !catalog.hidden);
});

document.querySelectorAll('.device-catalog button').forEach((button) => button.addEventListener('click', () => {
  button.classList.toggle('connected');
  showProfileToast(button.classList.contains('connected') ? `${button.querySelector('strong').textContent} подключён` : 'Подключение отменено');
}));

document.querySelectorAll('[data-profile-action]').forEach((button) => button.addEventListener('click', () => showProfileToast(button.dataset.profileAction)));

const authFlow = document.getElementById('authFlow');
const authSteps = [...document.querySelectorAll('[data-auth-step]')];
const emailForm = document.querySelector('[data-auth-email-form]');

function showAuthStep(step) {
  authSteps.forEach((item) => {
    const active = Number(item.dataset.authStep) === Number(step);
    item.hidden = !active;
    item.classList.toggle('active', active);
    if (active) item.scrollTop = 0;
  });
}

function openAuth({ syncHash = true } = {}) {
  closeSheets({ immediate: true, restoreFocus: false });
  document.body.classList.add('auth-mode');
  authFlow.hidden = false;
  authFlow.setAttribute('aria-hidden', 'false');
  showAuthStep(1);
  app.scrollTop = 0;
  if (syncHash) history.replaceState(null, '', '#signup');
}

function finishAuth() {
  authFlow.hidden = true;
  authFlow.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('auth-mode');
  showScreen('today');
}

document.querySelectorAll('[data-open-auth]').forEach((button) => button.addEventListener('click', () => openAuth()));
document.querySelectorAll('[data-auth-method]').forEach((button) => button.addEventListener('click', () => {
  if (button.dataset.authMethod === 'email') {
    emailForm.hidden = false;
    emailForm.querySelector('input')?.focus();
    return;
  }
  showAuthStep(2);
}));
emailForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  showAuthStep(2);
});
document.querySelectorAll('[data-auth-next]').forEach((button) => button.addEventListener('click', () => showAuthStep(button.dataset.authNext)));
document.querySelectorAll('[data-auth-back]').forEach((button) => button.addEventListener('click', () => showAuthStep(button.dataset.authBack)));
document.querySelectorAll('[data-rhythm-choice]').forEach((button) => button.addEventListener('click', () => {
  document.querySelectorAll(`[data-rhythm-choice="${button.dataset.rhythmChoice}"]`).forEach((choice) => {
    choice.classList.toggle('active', choice === button);
    choice.setAttribute('aria-pressed', String(choice === button));
  });
}));
document.querySelectorAll('[data-auth-source]').forEach((button) => button.addEventListener('click', () => {
  const selected = button.classList.toggle('selected');
  button.setAttribute('aria-pressed', String(selected));
}));
document.querySelectorAll('[data-auth-finish]').forEach((button) => button.addEventListener('click', finishAuth));

const availableScreens = ['today','calendar','practices','state','liked'];
const initialScreen = location.hash.slice(1);
if (initialScreen === 'signup') {
  showScreen('today', false);
  openAuth({ syncHash: false });
} else {
  showScreen(availableScreens.includes(initialScreen) ? initialScreen : 'today');
}
window.addEventListener('hashchange', () => {
  const screen = location.hash.slice(1);
  if (screen === 'signup') {
    openAuth({ syncHash: false });
    return;
  }
  authFlow.hidden = true;
  authFlow.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('auth-mode');
  showScreen(availableScreens.includes(screen) ? screen : 'today', false);
});
window.addEventListener('pageshow', () => closeSheets({ immediate: true, restoreFocus: false }));
