(function (root) {
  const attentionValues = ['scattered', 'switching', 'steady'];
  const factorValues = ['sleep', 'meetings', 'food', 'noise', 'mood', 'unknown'];
  function validate(record, day) {
    if (!record || record.day !== day || !Number.isInteger(record.energy) ||
        record.energy < 0 || record.energy > 100 || !attentionValues.includes(record.attention) ||
        !Array.isArray(record.factors) || record.factors.some(f => !factorValues.includes(f))) return null;
    const factors = [...new Set(record.factors)];
    return { day, energy: record.energy, attention: record.attention,
      factors: factors.includes('unknown') ? ['unknown'] : factors };
  }
  function advice(record) {
    let result;
    if (record.energy < 35) result = {
      title: 'Нужна пауза',
      copy: 'Сейчас энергии мало. Дайте себе время восстановиться перед сложной работой.',
      next: 'Перед запланированной задачей сделайте паузу. После неё оцените, готовы ли начать работу.'
    };
    else if (record.attention === 'scattered' || record.energy < 60) result = {
      title: 'Мягкий темп',
      copy: 'Начните с одного небольшого шага и оставьте время на перерыв.',
      next: 'Для задачи выберите одну небольшую часть. Необязательно выполнять весь блок за один подход.'
    };
    else if (record.attention === 'switching') result = {
      title: 'Плавный старт',
      copy: 'Энергия есть, но вниманию нужно время на переключение. Начните с подготовки.',
      next: 'Откройте материалы задачи и определите первый шаг, прежде чем начинать фокус.'
    };
    else result = {
      title: 'Готовы к фокусу',
      copy: 'По вашей отметке энергии и внимания достаточно для сосредоточенной работы.',
      next: 'Можно начать выбранную задачу. Сохраните перерыв после рабочего блока.'
    };
    const hints = { sleep: 'Учитывайте потребность в отдыхе.', meetings: 'Оставьте паузу между встречами.',
      food: 'Сначала найдите время поесть.', noise: 'По возможности выберите более тихое место.',
      mood: 'Выберите комфортный для себя темп.' };
    const hint = record.factors.map(f => hints[f]).filter(Boolean).join(' ');
    return { ...result, copy: result.copy + (hint ? ` ${hint}` : '') };
  }
  const api = { validate, advice };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.TempoCheckin = api;
})(typeof window !== 'undefined' ? window : globalThis);
