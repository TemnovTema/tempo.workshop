const app = document.getElementById('mobileApp');
const screens = [...document.querySelectorAll('[data-screen]')];
const navButtons = [...document.querySelectorAll('[data-nav]')];
const backdrop = document.getElementById('sheetBackdrop');
const sheets = [...document.querySelectorAll('.bottom-sheet')];

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
  screens.forEach((screen) => screen.classList.toggle('active', screen.dataset.screen === name));
  navButtons.forEach((button) => button.classList.toggle('active', button.dataset.nav === name));
  window.scrollTo({ top: 0, behavior: 'smooth' });
  history.replaceState(null, '', `#${name}`);
}

navButtons.forEach((button) => button.addEventListener('click', () => showScreen(button.dataset.nav)));
document.querySelectorAll('[data-screen-link]').forEach((button) => button.addEventListener('click', () => showScreen(button.dataset.screenLink)));

function openSheet(sheet) {
  sheets.forEach((item) => { item.classList.remove('open'); item.setAttribute('aria-hidden', 'true'); });
  backdrop.hidden = false;
  requestAnimationFrame(() => { sheet.classList.add('open'); sheet.setAttribute('aria-hidden', 'false'); });
}
function closeSheets() {
  sheets.forEach((sheet) => { sheet.classList.remove('open'); sheet.setAttribute('aria-hidden', 'true'); });
  window.setTimeout(() => { backdrop.hidden = true; }, 380);
}
backdrop.addEventListener('click', closeSheets);
document.querySelectorAll('.sheet-close').forEach((button) => button.addEventListener('click', closeSheets));

const taskSheet = document.getElementById('taskSheet');
const sheetTaskTitle = document.getElementById('sheetTaskTitle');
document.querySelectorAll('[data-open-task]').forEach((button) => button.addEventListener('click', () => {
  sheetTaskTitle.textContent = button.dataset.openTask;
  taskSheet.querySelector('[data-start-task]').dataset.startTask = button.dataset.openTask;
  openSheet(taskSheet);
}));
document.querySelectorAll('[data-add-task]').forEach((button) => button.addEventListener('click', () => {
  sheetTaskTitle.textContent = 'Новая задача';
  taskSheet.querySelector('textarea').value = '';
  openSheet(taskSheet);
}));

const modeSwitch = document.getElementById('modeSwitch');
let timerId;
let secondsLeft = 0;
let timerPaused = false;
function timerLabel() {
  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const seconds = String(secondsLeft % 60).padStart(2, '0');
  modeSwitch.innerHTML = `<span>Фокус</span><i></i><span>${minutes}:${seconds}</span>`;
}
function startTask(name, minutes) {
  closeSheets();
  modeSwitch.classList.add('work');
  timerPaused = false;
  secondsLeft = Number(minutes || 25) * 60;
  timerLabel();
  clearInterval(timerId);
  timerId = window.setInterval(() => {
    if (timerPaused) return;
    secondsLeft = Math.max(0, secondsLeft - 1);
    timerLabel();
    if (!secondsLeft) clearInterval(timerId);
  }, 1000);
  modeSwitch.setAttribute('aria-label', `${name}: идёт рабочий спринт`);
}
document.querySelectorAll('[data-start-task]').forEach((button) => button.addEventListener('click', () => startTask(button.dataset.startTask, button.dataset.minutes)));
modeSwitch.addEventListener('click', () => {
  if (secondsLeft) {
    modeSwitch.classList.toggle('work');
    timerPaused = !modeSwitch.classList.contains('work');
    if (timerPaused) modeSwitch.innerHTML = '<span>Работа</span><i></i><span>Пауза</span>';
    else timerLabel();
  } else {
    openSheet(taskSheet);
  }
});

const practiceSheet = document.getElementById('practiceSheet');
document.querySelectorAll('[data-practice]').forEach((button) => button.addEventListener('click', () => {
  document.getElementById('practiceSheetTitle').textContent = button.dataset.practice;
  openSheet(practiceSheet);
}));
let practiceRunning = true;
practiceSheet.querySelector('.practice-toggle').addEventListener('click', (event) => {
  practiceRunning = !practiceRunning;
  event.currentTarget.firstChild.textContent = practiceRunning ? 'Пауза ' : 'Продолжить ';
  practiceSheet.querySelector('.practice-breathe i').style.animationPlayState = practiceRunning ? 'running' : 'paused';
});

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
function renderCalendar(view) {
  calendarButtons.forEach((button) => button.classList.toggle('active', button.dataset.calView === view));
  calendarDay.hidden = view !== 'day';
  calendarAlternate.hidden = view === 'day';
  if (view === 'week') {
    calendarPeriod.textContent = '14–20 сентября';
    calendarPeriodMeta.textContent = 'эта неделя';
    calendarAlternate.innerHTML = `<div class="mobile-week">${['Пн 14','Вт 15','Ср 16','Чт 17','Пт 18','Сб 19','Вс 20'].map((day,index)=>`<button class="${index===6?'active':''}"><span>${day.split(' ')[0]}</span><b>${day.split(' ')[1]}</b><i style="--load:${[42,68,54,77,63,28,51][index]}%"></i></button>`).join('')}</div><h3>Неделя устойчивая</h3><p>Четверг плотнее остальных. В воскресенье остаётся 1 ч 40 мин свободного времени.</p>`;
  } else if (view === 'month') {
    calendarPeriod.textContent = 'Сентябрь 2026';
    calendarPeriodMeta.textContent = '12 задач · 8 практик';
    calendarAlternate.innerHTML = `<div class="mobile-month">${Array.from({length:35},(_,i)=>`<button class="${i===25?'active':''}">${i<2||i>31?'':i-1}<i></i></button>`).join('')}</div><h3>Ритм месяца</h3><p>Самая высокая нагрузка приходится на третью неделю. Два вечера сохранены свободными.</p>`;
  } else {
    calendarPeriod.textContent = '20 сентября';
    calendarPeriodMeta.textContent = 'воскресенье · сегодня';
  }
}
calendarButtons.forEach((button) => button.addEventListener('click', () => renderCalendar(button.dataset.calView)));

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

const initialScreen = location.hash.slice(1);
showScreen(['today','calendar','practices','state'].includes(initialScreen) ? initialScreen : 'today');
