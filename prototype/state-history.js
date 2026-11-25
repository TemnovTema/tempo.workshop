function createStateHistory(root, today) {
  const key = 'tempo-mobile-checkin-history-v1';
  const demo = new URLSearchParams(location.search).get('demo') === '1';
  const labels = { sleep: 'Сон', meetings: 'Встречи', mood: 'Настроение', food: 'Голод', noise: 'Шум' };
  const format = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short', timeZone: 'UTC' });
  let period = 7;
  let last = null;
  function read(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
  }
  function entries() {
    const history = read(key, []);
    return (Array.isArray(history) ? history : []).filter(r => typeof r?.day === 'string' && TempoCheckin.validate(r, r.day));
  }
  function render(day = today()) {
    const records = new Map(entries().map(r => [r.day, r]));
    for (const r of [read('tempo-checkin-v1', null), last]) {
      if (r?.day && TempoCheckin.validate(r, r.day)) records.set(r.day, r);
    }
    const chart = root.querySelector('.energy-history-chart');
    chart.replaceChildren();
    const counts = {}, scores = [], dates = [];
    const reading = root.querySelector('.history-reading');
    let selected;
    function select(bar) {
      selected?.setAttribute('aria-pressed', 'false');
      selected = bar;
      bar.setAttribute('aria-pressed', 'true');
      reading.textContent = bar.title;
    }
    for (let offset = period - 1; offset >= 0; offset--) {
      const date = new Date(Date.parse(day + 'T12:00:00Z') - offset * 86400000);
      const id = date.toISOString().slice(0, 10);
      let record = records.get(id);
      if (!record && demo && offset > 0) {
        const index = Math.floor(date.getTime() / 86400000);
        record = { energy: Math.round(62 + 17 * Math.sin(index * .7) + 9 * Math.cos(index * .31)),
          factors: [['sleep'], ['meetings'], ['sleep','mood'], ['noise'], ['mood'], ['meetings','food'], []][index % 7] };
      }
      const bar = document.createElement('button');
      bar.type = 'button';
      bar.setAttribute('aria-pressed', 'false');
      const label = format.format(date);
      dates.push(label);
      bar.title = label + (record ? ' · ' + record.energy + '% энергии' : ' · нет отметки');
      bar.setAttribute('aria-label', bar.title);
      if (record) {
        scores.push(record.energy);
        for (const f of new Set(record.factors)) if (labels[f]) counts[f] = (counts[f] || 0) + 1;
        bar.className = 'has-reading';
        bar.style.setProperty('--energy-height', 'max(3px, ' + record.energy + '%)');
      }
      bar.addEventListener('click', () => select(bar));
      bar.addEventListener('focus', () => select(bar));
      chart.append(bar);
      if (offset === 0) select(bar);
    }
    root.querySelector('[data-energy-summary]').textContent = scores.length
      ? 'В среднем ' + Math.round(scores.reduce((a,b) => a+b, 0) / scores.length) + ' из 100 · дней с отметкой: ' + scores.length
      : 'Пока нет отметок за этот период';
    const axis = root.querySelector('.history-dates');
    if (period === 1) {
      root.querySelector('[data-energy-summary]').textContent = scores.length
        ? 'Сегодня · ' + scores[0] + ' из 100' : 'Сегодня ещё нет отметки';
    }
    root.querySelector('[data-factor-caption]').textContent = period === 1 ? 'Что вы отметили сегодня' : 'Что вы отмечали чаще всего';
    axis.replaceChildren(...(period === 1 ? dates : [dates[0], dates.at(-1)]).map(label => {
      const span = document.createElement('span'); span.textContent = label; return span;
    }));
    const list = root.querySelector('.history-factors');
    list.replaceChildren();
    for (const [factor,count] of Object.entries(counts).sort((a,b) => b[1]-a[1])) {
      const item = document.createElement('li');
      const value = document.createElement('b'); value.textContent = count;
      item.append(labels[factor]);
      if (period > 1) item.append(value);
      list.append(item);
    }
    if (!list.children.length) { const item = document.createElement('li'); item.textContent = 'За этот период факторы не указаны'; list.append(item); }
  }
  root.querySelectorAll('[data-history-days]').forEach(button => button.addEventListener('click', () => {
    period = Number(button.dataset.historyDays);
    root.querySelectorAll('[data-history-days]').forEach(item => {
      item.classList.toggle('active', item === button);
      item.setAttribute('aria-pressed', String(item === button));
    });
    render();
  }));
  render();
  return { render, record(r) {
    last = r;
    try { localStorage.setItem(key, JSON.stringify([...entries().filter(e => e.day !== r.day), r].slice(-365))); } catch {}
    render();
  }};
}
