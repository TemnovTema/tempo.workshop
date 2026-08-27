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

document.querySelectorAll('[data-calendar-mode]').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelectorAll('[data-calendar-mode]').forEach((item) => {
      item.classList.toggle('active', item === button);
      item.setAttribute('aria-selected', item === button ? 'true' : 'false');
    });
    document.querySelectorAll('[data-calendar-panel]').forEach((panel) => panel.classList.toggle('active', panel.dataset.calendarPanel === button.dataset.calendarMode));
  });
});

const alternativesButton = document.querySelector('[data-alternatives]');
const alternativesStack = document.querySelector('.alternative-stack');
alternativesButton?.addEventListener('click', () => {
  const isOpen = alternativesStack.classList.toggle('open');
  alternativesStack.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
  alternativesButton.textContent = isOpen ? 'Скрыть варианты' : 'Другой вариант';
});

const focusOverlay = document.querySelector('.focus-overlay');
document.querySelectorAll('[data-focus-start]').forEach((button) => button.addEventListener('click', () => {
  startPomodoro('Макет главного экрана');
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
  togglePomodoro();
  event.currentTarget.textContent = pomodoroRunning ? 'Пауза' : 'Продолжить';
});

const pomodoroButton = document.querySelector('[data-pomodoro-toggle]');
const pomodoroTime = document.querySelector('[data-pomodoro-time]');
const pomodoroTask = document.querySelector('[data-pomodoro-task]');
let pomodoroSeconds = 25 * 60;
let pomodoroRunning = false;
let pomodoroInterval = null;

function renderPomodoro() {
  const minutes = Math.floor(pomodoroSeconds / 60).toString().padStart(2, '0');
  const seconds = (pomodoroSeconds % 60).toString().padStart(2, '0');
  pomodoroTime.textContent = `${minutes}:${seconds}`;
  pomodoroButton.classList.toggle('running', pomodoroRunning);
  pomodoroButton.classList.toggle('paused', !pomodoroRunning && pomodoroSeconds < 25 * 60);
  pomodoroButton.setAttribute('aria-label', `${pomodoroTask.textContent} — ${minutes}:${seconds}. ${pomodoroRunning ? 'Нажмите, чтобы поставить на паузу' : 'Нажмите, чтобы продолжить'}`);
}

function tickPomodoro() {
  if (pomodoroSeconds <= 0) {
    clearInterval(pomodoroInterval);
    pomodoroRunning = false;
    pomodoroTask.textContent = 'Фокус завершён';
    renderPomodoro();
    return;
  }
  pomodoroSeconds -= 1;
  renderPomodoro();
}

function startPomodoro(taskName) {
  clearInterval(pomodoroInterval);
  pomodoroSeconds = 25 * 60;
  pomodoroRunning = true;
  pomodoroTask.textContent = taskName;
  pomodoroInterval = setInterval(tickPomodoro, 1000);
  renderPomodoro();
}

function togglePomodoro() {
  if (pomodoroSeconds === 25 * 60 && !pomodoroRunning) return;
  pomodoroRunning = !pomodoroRunning;
  clearInterval(pomodoroInterval);
  if (pomodoroRunning) pomodoroInterval = setInterval(tickPomodoro, 1000);
  renderPomodoro();
}

pomodoroButton?.addEventListener('click', togglePomodoro);

function selectPomodoroTask(task) {
  document.querySelectorAll('.pomodoro-task.selected').forEach((item) => {
    item.classList.remove('selected');
    item.querySelector('.event-start-action')?.remove();
  });
  task.classList.add('selected');
  const startButton = document.createElement('button');
  startButton.type = 'button';
  startButton.className = 'event-start-action';
  startButton.textContent = 'Начать · 25:00';
  startButton.addEventListener('click', (event) => {
    event.stopPropagation();
    startPomodoro(task.dataset.pomodoroTaskName);
    task.classList.remove('selected');
    startButton.remove();
  });
  task.append(startButton);
}

document.querySelectorAll('.pomodoro-task').forEach((task) => {
  task.addEventListener('click', () => selectPomodoroTask(task));
  task.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      selectPomodoroTask(task);
    }
  });
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

document.querySelectorAll('[data-practice-filter]').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelectorAll('[data-practice-filter]').forEach((item) => item.classList.toggle('active', item === button));
    document.querySelectorAll('.practice-card').forEach((card) => {
      card.classList.toggle('hidden', button.dataset.practiceFilter !== 'all' && card.dataset.practiceCategory !== button.dataset.practiceFilter);
    });
  });
});

const practicePlayer = document.querySelector('.practice-player');
document.querySelectorAll('[data-practice-start]').forEach((button) => button.addEventListener('click', () => {
  practicePlayer.querySelector('h2').textContent = button.dataset.practiceStart;
  practicePlayer.classList.add('open');
  practicePlayer.setAttribute('aria-hidden', 'false');
}));
document.querySelector('.player-close')?.addEventListener('click', () => {
  practicePlayer.classList.remove('open');
  practicePlayer.setAttribute('aria-hidden', 'true');
});
document.querySelector('.player-pause')?.addEventListener('click', (event) => {
  event.currentTarget.textContent = event.currentTarget.textContent === 'Пауза' ? 'Продолжить' : 'Пауза';
});

const energyRange = document.getElementById('energyRange');
const energyOutput = document.getElementById('energyOutput');
const statePreviewValue = document.getElementById('statePreviewValue');
const statePreviewLabel = document.getElementById('statePreviewLabel');
const stateReading = document.getElementById('stateReading');
const stateReadingCopy = document.getElementById('stateReadingCopy');

energyRange?.addEventListener('input', () => {
  const value = Number(energyRange.value);
  energyOutput.value = value;
  energyOutput.textContent = value;
  statePreviewValue.textContent = value;
  if (value < 35) {
    statePreviewLabel.textContent = 'низкое';
    stateReading.textContent = 'Нагрузку лучше снизить';
    stateReadingCopy.textContent = 'Tempo предложит короткие задачи и сохранит больше свободного времени для восстановления.';
  } else if (value < 72) {
    statePreviewLabel.textContent = 'устойчивое';
    stateReading.textContent = 'Темп можно сохранить';
    stateReadingCopy.textContent = 'Лучшее окно для сложной задачи — до 13:00. После встречи стоит оставить короткую паузу.';
  } else {
    statePreviewLabel.textContent = 'высокое';
    stateReading.textContent = 'Есть ресурс для сложного';
    stateReadingCopy.textContent = 'Можно использовать ближайшее длинное окно для глубокой работы, не уплотняя вечер.';
  }
});

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
