/* Apply before styles; catch up after sleep or returning to the app. */
(() => {
  const key = 'tempo-theme', scheduleKey = 'tempo-theme-schedule', customKey = 'tempo-custom-theme';
  const themes = { light: ['Светлая', '#d4d1d8'], dark: ['Тёмная', '#202321'], glass: ['Свой вариант', '#c9c5d7'] };
  const customDefaults = { accent:'#6b5e78', task:'#ef7656', rest:'#8ba6df', practice:'#82aa72', opacity:64, blur:55, radius:28, finish:'soft', background:'assets/wallpapers/calm-dawn.png' };
  const customPalette = ['#6b5e78','#ef7656','#8ba6df','#82aa72','#e2c95d','#b887a6','#65706a','#d39a72'];
  const normalize = value => Object.hasOwn(themes, value) ? value : 'light';
  const validTime = value => typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
  const minutes = value => Number(value.slice(0, 2)) * 60 + Number(value.slice(3));
  let preferred = 'light';
  let schedule = { enabled: false, start: '20:00', end: '08:00', dayTheme: 'light' };
  let custom = { ...customDefaults };
  let storageFailed = false;
  function read() {
    try {
      preferred = normalize(localStorage.getItem(key));
      const saved = JSON.parse(localStorage.getItem(scheduleKey) || 'null');
      const savedCustom = JSON.parse(localStorage.getItem(customKey) || 'null');
      if (savedCustom && typeof savedCustom === 'object') {
        custom = { ...customDefaults, ...savedCustom };
        if (Number(custom.blur) <= 40) custom.blur = Math.round(Number(custom.blur) / 40 * 100);
      }
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
      localStorage.setItem(customKey, JSON.stringify(custom));
      storageFailed = false;
    } catch { storageFailed = true; }
  }
  const hexToRgba = (hex, alpha) => {
    const value = /^#[\da-f]{6}$/i.test(hex) ? hex.slice(1) : '6b5e78';
    return `rgba(${parseInt(value.slice(0,2),16)},${parseInt(value.slice(2,4),16)},${parseInt(value.slice(4,6),16)},${alpha})`;
  };
  function applyCustom() {
    const root = document.documentElement;
    const alpha = Math.max(.35, Math.min(.92, Number(custom.opacity) / 100));
    root.style.setProperty('--custom-accent', custom.accent);
    root.style.setProperty('--custom-task', custom.task);
    root.style.setProperty('--custom-accent-soft', hexToRgba(custom.accent,.52));
    root.style.setProperty('--custom-task-soft', hexToRgba(custom.task,.5));
    root.style.setProperty('--custom-rest-soft', hexToRgba(custom.rest,.52));
    root.style.setProperty('--custom-practice-soft', hexToRgba(custom.practice,.5));
    root.style.setProperty('--custom-panel', `rgba(255,255,255,${(alpha * .46).toFixed(2)})`);
    root.style.setProperty('--custom-control', `rgba(255,255,255,${(alpha * .54).toFixed(2)})`);
    root.style.setProperty('--custom-raised', `rgba(255,255,255,${(alpha * .86).toFixed(2)})`);
    const blurStrength = Math.round(Math.max(0,Math.min(100,Number(custom.blur))) * .32);
    root.style.setProperty('--custom-blur', `${blurStrength}px`);
    root.style.setProperty('--custom-radius', `${Number(custom.radius)}px`);
    root.style.setProperty('--custom-background-image', custom.background ? `linear-gradient(rgba(35,29,39,.18),rgba(35,29,39,.18)),url("${custom.background}")` : 'none');
    root.dataset.customFinish = custom.finish;
  }
  function refresh() {
    const now = new Date();
    const time = now.getHours() * 60 + now.getMinutes();
    const start = minutes(schedule.start), end = minutes(schedule.end);
    const night = start > end ? time >= start || time < end : time >= start && time < end;
    const current = schedule.enabled ? (night ? 'dark' : schedule.dayTheme) : preferred;
    document.documentElement.dataset.theme = current;
    applyCustom();
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', themes[current][1]);
    document.querySelectorAll('input[name="tempo-theme"]').forEach(input => { input.checked = input.value === current; });
    const editor = document.querySelector('[data-custom-theme-editor]');
    if (editor) { editor.hidden = current !== 'glass'; editor.setAttribute('aria-hidden', String(current !== 'glass')); }
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
  applyCustom();
  refresh();
  document.addEventListener('DOMContentLoaded', () => {
    const syncCustomFields = () => {
      document.querySelectorAll('[data-custom-color-choice]').forEach(button => {
        const active = custom[button.dataset.customColorChoice] === button.dataset.color;
        button.classList.toggle('active', active); button.setAttribute('aria-checked', String(active));
      });
      document.querySelectorAll('[data-custom-range]').forEach(input => {
        const name = input.dataset.customRange; input.value = custom[name];
        const output = document.querySelector(`[data-custom-output="${name}"]`);
        if (output) output.textContent = custom[name] + '%';
      });
      const finish = document.querySelector('[data-custom-finish]'); if (finish) finish.value = custom.finish;
      const preview = document.querySelector('[data-custom-background-preview]');
      if (preview) preview.style.backgroundImage = custom.background ? `linear-gradient(rgba(30,25,32,.16),rgba(30,25,32,.16)),url("${custom.background}")` : '';
      document.querySelectorAll('[data-custom-wallpaper]').forEach(button => {
        const active = custom.background === button.dataset.customWallpaper;
        button.classList.toggle('active', active); button.setAttribute('aria-checked', String(active));
      });
    };
    const commitCustom = () => { applyCustom(); syncCustomFields(); save(); refresh(); };
    syncFields();
    document.querySelectorAll('[data-custom-color-group]').forEach(group => {
      const name = group.dataset.customColorGroup;
      customPalette.forEach((color,index) => {
        const button = document.createElement('button'); button.type = 'button'; button.className = 'custom-color-choice';
        button.dataset.customColorChoice = name; button.dataset.color = color; button.style.setProperty('--choice-color',color);
        button.setAttribute('role','radio'); button.setAttribute('aria-label',`Цвет ${index + 1}`); group.append(button);
      });
    });
    syncCustomFields();
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
    document.querySelectorAll('[data-custom-color-choice]').forEach(button => button.addEventListener('click', () => { custom[button.dataset.customColorChoice] = button.dataset.color; commitCustom(); }));
    document.querySelectorAll('[data-custom-wallpaper]').forEach(button => button.addEventListener('click', () => { custom.background = button.dataset.customWallpaper; commitCustom(); }));
    document.querySelectorAll('[data-custom-range]').forEach(input => input.addEventListener('input', () => { custom[input.dataset.customRange] = Number(input.value); commitCustom(); }));
    document.querySelector('[data-custom-finish]')?.addEventListener('change', event => { custom.finish = event.target.value; commitCustom(); });
    document.querySelector('[data-custom-theme-reset]')?.addEventListener('click', () => { custom = { ...customDefaults }; commitCustom(); });
    document.querySelector('[data-custom-background-remove]')?.addEventListener('click', () => { custom.background = ''; commitCustom(); });
    document.querySelector('[data-custom-background]')?.addEventListener('change', event => {
      const file = event.target.files?.[0]; if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const image = new Image();
        image.onload = () => {
          const scale = Math.min(1, 1600 / Math.max(image.width,image.height));
          const canvas = document.createElement('canvas'); canvas.width = Math.round(image.width * scale); canvas.height = Math.round(image.height * scale);
          canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);
          custom.background = canvas.toDataURL('image/jpeg',.78); commitCustom(); event.target.value = '';
        };
        image.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
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
