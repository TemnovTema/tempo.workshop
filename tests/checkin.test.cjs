const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validate, advice } = require('../prototype/checkin-state.js');
const day = '2026-11-17';
const record = { day, energy: 68, attention: 'steady', factors: [] };
test('restores today only and accepts zero energy', () => {
  assert.deepEqual(validate(record, day), record);
  assert.equal(validate(record, '2026-11-18'), null);
  assert.equal(validate({ ...record, energy: 0 }, day).energy, 0);
});
test('rejects invalid saved data instead of rendering it', () => {
  for (const value of [null, {}, { ...record, energy: -1 }, { ...record, energy: 101 },
    { ...record, energy: '68' }, { ...record, attention: 'invalid' },
    { ...record, factors: ['invalid'] }, { ...record, factors: null }]) {
    assert.equal(validate(value, day), null);
  }
});
test('unknown excludes specific factors', () => {
  assert.deepEqual(validate({ ...record, factors: ['sleep', 'unknown'] }, day).factors, ['unknown']);
});
test('low energy takes precedence over steady attention', () => {
  assert.equal(advice({ ...record, energy: 10 }).title, 'Нужна пауза');
  assert.equal(advice({ ...record, energy: 90 }).title, 'Готовы к фокусу');
});
test('attention and selected factors change the recommendation', () => {
  assert.equal(advice({ ...record, attention: 'scattered' }).title, 'Мягкий темп');
  assert.equal(advice({ ...record, attention: 'switching' }).title, 'Плавный старт');
  assert.match(advice({ ...record, factors: ['food', 'noise'] }).copy, /поесть.*тихое/);
});
