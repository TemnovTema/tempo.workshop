(function () {
  const form = document.querySelector('.role-boundaries');
  const inputs = form.querySelectorAll('input[type="time"]');
  const protect = form.querySelector('input[type="checkbox"]');
  const tabs = [...form.querySelectorAll('.role-tabs button')];
  const message = form.querySelector('[role="status"]');
  let roles = [
    {start: '09:30', end: '18:30', protect: true},
    {start: '16:00', end: '20:00', protect: false},
    {start: '08:00', end: '21:00', protect: false}
  ];
  const time = /^([01]\d|2[0-3]):[0-5]\d$/;
  const valid = r => r && time.test(r.start) && time.test(r.end) && r.start < r.end && typeof r.protect === 'boolean';
  try {
    const saved = JSON.parse(localStorage.getItem('tempo-boundaries-v1'));
    if (Array.isArray(saved) && saved.length === roles.length && saved.every(valid)) roles = saved;
  } catch {}
  let selected = 0;
  function render() {
    const role = roles[selected];
    inputs[0].value = role.start;
    inputs[1].value = role.end;
    protect.checked = role.protect;
    tabs.forEach((button, index) => {
      button.classList.toggle('active', index === selected);
      button.setAttribute('aria-pressed', String(index === selected));
    });
  }
  tabs.forEach((button, index) => button.addEventListener('click', () => {
    selected = index;
    message.textContent = '';
    render();
  }));
  form.addEventListener('input', () => {
    roles[selected] = {start: inputs[0].value, end: inputs[1].value, protect: protect.checked};
    message.textContent = '';
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    const invalid = roles.findIndex(role => !valid(role));
    if (invalid !== -1) {
      selected = invalid;
      render();
      inputs[1].focus();
      message.textContent = 'Укажите начало раньше окончания в пределах одного дня.';
      return;
    }
    try {
      localStorage.setItem('tempo-boundaries-v1', JSON.stringify(roles));
      message.textContent = 'Границы сохранены.';
    } catch {
      message.textContent = 'Не удалось сохранить настройки. Попробуйте ещё раз.';
    }
  });
  render();
})();
