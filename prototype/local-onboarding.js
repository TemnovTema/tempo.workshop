(function () {
  const root = webAuthFlow;
  const key = 'tempo-onboarding-v1';
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(key)) || {}; } catch {}
  const contact = root.querySelector('[data-web-signup-form] input');
  const note = root.querySelector('#intro-note');
  const fields = ['name', 'occupation', 'goal'];
  const skipped = new Set();
  let previewHealth = false;

  function restore() {
    skipped.clear();
    previewHealth = false;
    contact.value = '';
    note.value = saved.dayNote || '';
    for (const key of fields) {
      const field = root.querySelector('#intro-' + key);
      const initial = field.defaultValue ?? Array.from(field.options).find(option => option.defaultSelected)?.value;
      field.value = key === 'name' && !saved.editableIntroName ? initial : (saved[key] ?? initial);
    }
    root.querySelectorAll('[data-web-rhythm]').forEach(button => {
      const active = saved[button.dataset.webRhythm] === button.querySelector('span').textContent;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
  }

  const open = openWebAuth;
  openWebAuth = function (options) { restore(); open(options); };
  restore();
  const fillContact = () => { contact.value = 'demp@tempo.ru'; };
  contact.addEventListener('focus', fillContact);
  contact.addEventListener('click', fillContact);
  root.querySelectorAll('[data-web-auth-next]').forEach(button => button.addEventListener('click', () => {
    const step = button.closest('[data-web-auth-step]').dataset.webAuthStep;
    if (button.classList.contains('web-auth-skip')) skipped.add(step);
    else skipped.delete(step);
    if (step === '3') previewHealth = button.hasAttribute('data-health-preview');
  }));
  root.querySelectorAll('.note-examples button').forEach(button => button.addEventListener('click', () => {
    const example = button.textContent.trim();
    if (!note.value.split('\n').some(line => line.trim() === example)) {
      note.value = [note.value.trimEnd(), example].filter(Boolean).join('\n');
    }
  }));

  function display() {
    document.getElementById('profileName').textContent = saved.name || 'Сергей';
  }
  const status = document.createElement('p');
  status.setAttribute('role', 'status');
  webAuthSteps.at(-1).append(status);
  root.querySelector('[data-web-auth-finish]').addEventListener('click', () => {
    const data = {...saved, healthPreview: previewHealth, dayNote: note.value.trim()};
    if (!skipped.has('2')) {
      for (const field of fields) data[field] = root.querySelector('#intro-' + field).value.trim();
      data.name ||= 'Сергей';
      data.editableIntroName = true;
    }
    data.name ||= 'Гость';
    root.querySelectorAll('[data-web-rhythm].active').forEach(button => {
      if (!skipped.has(button.closest('[data-web-auth-step]').dataset.webAuthStep)) {
        data[button.dataset.webRhythm] = button.querySelector('span').textContent;
      }
    });
    try { localStorage.setItem(key, JSON.stringify(data)); }
    catch { status.textContent = 'Не удалось сохранить настройки. Попробуйте ещё раз.'; return; }
    saved = data;
    renderWebHealthPreview(previewHealth);
    finishWebAuth();
    if (previewHealth) document.querySelector('.desktop-day-data')?.scrollIntoView({block:'nearest'});
  });
  const original = openView;
  openView = function (name) { original(name); display(); };
  display();
  if (!initialHash && saved.name) finishWebAuth();
})();
