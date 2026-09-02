/* Apply before styles; catch up after sleep or returning to the app. */
(() => {
  const key = 'tempo-theme', scheduleKey = 'tempo-theme-schedule';
  const themes = { light: ['Светлая', '#d4d1d8'], dark: ['Тёмная', '#202321'], glass: ['Стеклянная', '#c9c5d7'] };
  const normalize = value => Object.hasOwn(themes, value) ? value : 'light';
  const validTime = value => typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
  const minutes = value => Number(value.slice(0, 2)) * 60 + Number(value.slice(3));
  let preferred = 'light';
  let schedule = { enabled: false, start: '20:00', end: '08:00', dayTheme: 'light' };
  let storageFailed = false;
  function read() {
    try {
      preferred = normalize(localStorage.getItem(key));
      const saved = JSON.parse(localStorage.getItem(scheduleKey) || 'null');
      schedule = {
        enabled: saved?.enabled === true,
        start: validTime(saved?.start) ? saved.start : '20:00',
        end: validTime(saved?.end) ? saved.end : '08:00',
        dayTheme: saved?.dayTheme === 'glass' ? 'glass' : 'light'
      };
      if (schedule.start === schedule.end) schedule.enabled = false;
    } catch { /* Keep safe defaults when storage is blocked or malformed. */ }
  }
  function save() {
    try {
      localStorage.setItem(key, preferred);
      localStorage.setItem(scheduleKey, JSON.stringify(schedule));
      storageFailed = false;
    } catch { storageFailed = true; }
  }
  function refresh() {
    const now = new Date();
    const time = now.getHours() * 60 + now.getMinutes();
    const start = minutes(schedule.start), end = minutes(schedule.end);
    const night = start > end ? time >= start || time < end : time >= start && time < end;
    const current = schedule.enabled ? (night ? 'dark' : schedule.dayTheme) : preferred;
    document.documentElement.dataset.theme = current;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', themes[current][1]);
    document.querySelectorAll('input[name="tempo-theme"]').forEach(input => { input.checked = input.value === current; });
    const toggle = document.querySelector('[data-theme-auto]');
    if (toggle) toggle.checked = schedule.enabled;
    const fields = document.querySelector('[data-theme-hours]');
    if (fields) fields.disabled = !schedule.enabled;
    const status = document.querySelector('[data-theme-status]');
    const message = storageFailed
      ? 'Настройки применены, но браузер не разрешил их сохранить.'
      : schedule.enabled
        ? 'По расписанию: ' + themes[current][0].toLowerCase() + ' тема. Тёмная с ' + schedule.start + ' до ' + schedule.end + '; затем ' + themes[schedule.dayTheme][0].toLowerCase() + '.'
        : themes[current][0] + ' тема. Автоматическое переключение выключено.';
    if (status && status.textContent !== message) status.textContent = message;
  }
  function syncFields() {
    for (const part of ['start', 'end']) {
      const input = document.querySelector('[data-theme-' + part + ']');
      if (input) input.value = schedule[part];
    }
  }
  function clearError() {
    const error = document.querySelector('[data-theme-time-error]');
    if (error) error.textContent = '';
    document.querySelectorAll('[data-theme-hours] input').forEach(input => input.removeAttribute('aria-invalid'));
  }
  read();
  refresh();
  document.addEventListener('DOMContentLoaded', () => {
    syncFields();
    refresh();
    document.querySelectorAll('input[name="tempo-theme"]').forEach(input => input.addEventListener('change', () => {
      if (!input.checked) return;
      preferred = normalize(input.value);
      schedule.enabled = false;
      if (preferred !== 'dark') schedule.dayTheme = preferred;
      clearError();
      syncFields();
      save();
      refresh();
    }));
    document.querySelector('[data-theme-auto]')?.addEventListener('change', event => {
      schedule.enabled = event.target.checked;
      if (schedule.enabled && preferred !== 'dark') schedule.dayTheme = preferred;
      clearError();
      syncFields();
      save();
      refresh();
    });
    document.querySelectorAll('[data-theme-hours] input').forEach(input => input.addEventListener('change', () => {
      const start = document.querySelector('[data-theme-start]').value;
      const end = document.querySelector('[data-theme-end]').value;
      const error = !validTime(start) || !validTime(end) ? 'Укажите время начала и окончания.'
        : start === end ? 'Время начала и окончания должно различаться.' : '';
      document.querySelector('[data-theme-time-error]').textContent = error;
      document.querySelectorAll('[data-theme-hours] input').forEach(field => field.setAttribute('aria-invalid', String(Boolean(error))));
      if (error) return; // Keep the last valid schedule running.
      schedule.start = start;
      schedule.end = end;
      save();
      refresh();
    }));
    setInterval(refresh, 1000);
  });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
  window.addEventListener('focus', refresh);
  window.addEventListener('pageshow', refresh);
  window.addEventListener('storage', event => {
    if (event.key === key || event.key === scheduleKey || event.key === null) {
      read();
      clearError();
      syncFields();
      refresh();
    }
  });
})();
