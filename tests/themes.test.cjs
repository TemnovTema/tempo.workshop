const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const source = fs.readFileSync(require('node:path').join(__dirname, '../prototype/themes.js'), 'utf8');

function app(time, saved = {}, preferred = 'glass', blocked = false) {
  let clock = time, tick;
  const events = {}, win = {}, nodes = {};
  const node = value => ({ value, checked: false, textContent: '', addEventListener(type, cb) { this[type] = cb; }, setAttribute() {}, removeAttribute() {} });
  const radios = ['light', 'dark', 'glass'].map(node);
  for (const part of ['auto','hours','status','start','end','time-error']) nodes['[data-theme-' + part + ']'] = node('');
  const fields = [nodes['[data-theme-start]'], nodes['[data-theme-end]']];
  const store = new Map([['tempo-theme', preferred], ['tempo-theme-schedule', JSON.stringify(saved)]]);
  const document = {
    documentElement: { dataset: {} }, hidden: false,
    querySelector: s => nodes[s] || null,
    querySelectorAll: s => s.includes('tempo-theme') ? radios : fields,
    addEventListener: (type, cb) => { events[type] = cb; }
  };
  vm.runInNewContext(source, {
    document, window: { addEventListener: (type, cb) => { win[type] = cb; } },
    localStorage: { getItem(k) { if (blocked) throw Error(); return store.get(k); }, setItem(k,v) { if (blocked) throw Error(); store.set(k,v); } },
    Date: class { getHours() { return Math.floor(clock / 60); } getMinutes() { return clock % 60; } },
    setInterval: cb => { tick = cb; }
  });
  events.DOMContentLoaded();
  return { document, nodes, store, radios, win, events, theme: () => document.documentElement.dataset.theme, advance: t => { clock = t; tick(); } };
}
const overnight = { enabled: true, start: '20:00', end: '08:00', dayTheme: 'glass' };
test('overnight schedule switches at exact boundaries and restores glass', () => {
  const a = app(1199, overnight);
  assert.equal(a.theme(), 'glass');
  for (const time of [1200, 1439, 0, 479]) { a.advance(time); assert.equal(a.theme(), 'dark'); }
  a.advance(480); assert.equal(a.theme(), 'glass');
});
test('same-day interval and disabled schedule', () => {
  const a = app(599, { ...overnight, start: '10:00', end: '16:00' });
  assert.equal(a.theme(), 'glass'); a.advance(600); assert.equal(a.theme(), 'dark'); a.advance(960); assert.equal(a.theme(), 'glass');
  assert.equal(app(1300, {...overnight, enabled:false}, 'light').theme(), 'light');
});
test('toggle saves, reload restores, manual choice disables automation', () => {
  const a = app(1300);
  a.nodes['[data-theme-auto]'].change({target:{checked:true}});
  assert.equal(a.theme(), 'dark');
  const saved = JSON.parse(a.store.get('tempo-theme-schedule'));
  assert.equal(app(500, saved).theme(), 'glass');
  a.radios[0].checked = true; a.radios[0].change();
  assert.equal(a.theme(), 'light'); assert.equal(JSON.parse(a.store.get('tempo-theme-schedule')).enabled, false);
});
test('invalid and equal times do not replace last valid schedule', () => {
  const a = app(1300, overnight);
  a.nodes['[data-theme-start]'].value = '08:00'; a.nodes['[data-theme-start]'].change();
  assert.match(a.nodes['[data-theme-time-error]'].textContent, /различаться/);
  a.advance(1301); assert.equal(a.theme(), 'dark');
  a.nodes['[data-theme-start]'].value = ''; a.nodes['[data-theme-start]'].change();
  assert.match(a.nodes['[data-theme-time-error]'].textContent, /Укажите/);
});
test('custom times apply immediately; blocked storage does not break switching', () => {
  const a = app(700, overnight);
  a.nodes['[data-theme-start]'].value = '10:00'; a.nodes['[data-theme-end]'].value = '13:00'; a.nodes['[data-theme-end]'].change();
  assert.equal(a.theme(), 'dark');
  const b = app(1300, {}, 'light', true); b.nodes['[data-theme-auto]'].change({target:{checked:true}});
  assert.equal(b.theme(), 'dark'); assert.match(b.nodes['[data-theme-status]'].textContent, /не разрешил/);
});
