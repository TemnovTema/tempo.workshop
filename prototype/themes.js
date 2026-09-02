/* Runs before styles to avoid a flash of the wrong theme on reload. */
(() => {
  const key = 'tempo-theme';
  const themes = { light: ['Светлая', '#efeeec'], dark: ['Тёмная', '#202321'], glass: ['Стеклянная', '#c9c5d7'] };
  const normalize = value => Object.hasOwn(themes, value) ? value : 'light';
  let current = 'light';
  try { current = normalize(localStorage.getItem(key)); } catch { /* Storage may be unavailable. */ }
  const apply = value => {
    current = normalize(value);
    document.documentElement.dataset.theme = current;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', themes[current][1]);
    document.querySelectorAll('input[name="tempo-theme"]').forEach(input => { input.checked = input.value === current; });
  };
  apply(current);
  document.addEventListener('DOMContentLoaded', () => {
    apply(current);
    document.querySelectorAll('input[name="tempo-theme"]').forEach(input => input.addEventListener('change', () => {
      if (!input.checked) return;
      apply(input.value);
      let saved = true;
      try { localStorage.setItem(key, current); } catch { saved = false; }
      document.querySelector('[data-theme-status]').textContent = saved
        ? `${themes[current][0]} тема включена. Выбор сохранён в этом браузере.`
        : `${themes[current][0]} тема включена. Браузер не разрешил сохранить выбор.`;
    }));
  });
  window.addEventListener('storage', event => { if (event.key === key || event.key === null) apply(event.newValue); });
})();
