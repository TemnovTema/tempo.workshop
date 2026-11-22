(function(root) {
  const key = 'tempo-tasks-v1';
  function valid(task) {
    if (!task || (task.completed !== undefined && typeof task.completed !== 'boolean') || typeof task.id !== 'string' || typeof task.name !== 'string' || !task.name.trim() ||
        !/^\d{4}-\d{2}-\d{2}$/.test(task.date) || !/^\d{2}:\d{2}$/.test(task.time) ||
        !Number.isInteger(task.minutes) || task.minutes <= 0 || typeof task.notes !== 'string' ||
        (!['tempo','university','personal','none','team'].includes(task.project) && !/^project-[a-f0-9-]+$/.test(task.project))) return false;
    const d = new Date(task.date + 'T12:00:00Z');
    const [h,m] = task.time.split(':').map(Number);
    return !Number.isNaN(+d) && d.toISOString().slice(0,10) === task.date && m < 60 && h >= 8 && h*60+m+task.minutes <= 1260;
  }
  function create(storage, seed) {
    let tasks;
    let error = '';
    try {
      const raw = storage.getItem(key);
      if (raw === null) { tasks = seed; storage.setItem(key, JSON.stringify(tasks)); }
      else {
        tasks = JSON.parse(raw);
        if (!Array.isArray(tasks) || !tasks.every(valid) || new Set(tasks.map(t=>t.id)).size !== tasks.length) throw Error('invalid');
      }
    } catch { tasks = tasks && Array.isArray(tasks) && tasks.every(valid) ? tasks : seed; error = 'Не удалось прочитать или сохранить задачи. Исходные данные не перезаписаны.'; }
    let revision;
    try { revision = storage.getItem(key); } catch {}
    function commit(next) {
      if (!next.every(valid)) return false;
      try {
        if(storage.getItem(key)!==revision){error='Задачи изменились в другой вкладке. Обновите страницу перед сохранением.';return false;}
        const raw=JSON.stringify(next);storage.setItem(key,raw);revision=raw;tasks=next;error='';return true;
      }
      catch { error = 'Не удалось сохранить задачи в браузере. Правки оставлены в форме — попробуйте ещё раз.'; return false; }
    }
    return {
      all: () => tasks.map(t => ({...t})), error: () => error,
      save: task => commit(tasks.some(t=>t.id===task.id) ? tasks.map(t=>t.id===task.id ? {...task} : t) : [...tasks,{...task}]),
      saveMany: changes => changes.every(t=>tasks.some(old=>old.id===t.id)) && commit(tasks.map(t=>changes.find(change=>change.id===t.id)||t)),
      remove: id => commit(tasks.filter(t=>t.id!==id)),
      forDate: (date,project='all') => tasks.filter(t=>t.date===date && (project==='all'||t.project===project)).sort((a,b)=>a.time.localeCompare(b.time)).map(t=>({...t}))
    };
  }
  const api={create,valid};
  if(typeof module!=='undefined'&&module.exports) module.exports=api; else root.TempoTaskStore=api;
})(typeof window!=='undefined'?window:globalThis);
