(function(){
 const bell=document.querySelector('[data-header-panel="notifications"]');bell.setAttribute('aria-label','Оповещения');bell.querySelector('b')?.remove();
 const popover=document.querySelector('[data-header-popover="notifications"]');popover.querySelectorAll('article').forEach(n=>n.remove());
 const empty=document.createElement('p');empty.textContent='Новых оповещений нет. Внешние уведомления в локальной версии пока не подключены.';popover.querySelector('header').after(empty);
 const all=popover.querySelector(':scope > button');all.textContent='Настройки уведомлений';all.addEventListener('click',()=>{popover.classList.remove('open');popover.setAttribute('aria-hidden','true');openView('profile');document.querySelector('[data-settings-tab="notifications"]').click();});

 const descriptions={calendars:'Внешние календари пока не подключаются. Задачи сохраняются только в этом браузере.',health:'Данные здоровья не подключены. Показатели ниже — демонстрационные.',notifications:'Уведомления пока не отправляются. Настройки станут доступны после реализации напоминаний.',privacy:'Задачи, настройки и записи практик сохраняются в localStorage этого браузера. Экспорт содержит ваши локальные записи.'};
 for(const [name,copy] of Object.entries(descriptions)){
  const panel=document.querySelector(`[data-settings-panel="${name}"]`);panel.querySelector('header p').textContent=copy;
  if(name!=='privacy')panel.querySelectorAll('input,button').forEach(control=>{control.disabled=true;control.title='Пока недоступно';});
 }
 document.querySelectorAll('[data-settings-panel="calendars"] .source-list article span').forEach(span=>span.textContent='Пример источника · не подключён');
 const roles=document.querySelector('[data-settings-aside="roles"]');roles.querySelector('.section-label').textContent='Внешние источники';roles.querySelectorAll('article').forEach(row=>{row.querySelector('div span').textContent='Не подключено';const status=row.querySelector('b');if(status)status.textContent='';const button=row.querySelector('button');if(button){button.disabled=true;button.textContent='Скоро';}});
 function aside(name,title,copy){const box=document.querySelector(`[data-settings-aside="${name}"]`);box.replaceChildren();const h=document.createElement('h3'),p=document.createElement('p');h.textContent=title;p.textContent=copy;box.append(h,p);}
 aside('calendars','Локальный календарь','Синхронизации с Google и Apple пока нет.');
 aside('health','Демонстрационные показатели','Сон, шаги и пульс не получены с устройства и не используются для расчёта плана.');
 aside('notifications','Напоминания не включены','Системные и групповые уведомления пока не реализованы.');
 aside('privacy','Хранение в браузере','Данные остаются в текущем профиле браузера. Очистка данных сайта удалит локальные записи. Автоматический срок хранения не настроен.');
 const privacy=document.querySelector('[data-settings-panel="privacy"]');privacy.querySelector('.privacy-status strong').textContent='Локальные данные';privacy.querySelector('.privacy-status small').textContent='Без внешних подключений';privacy.querySelector('.data-map').hidden=true;
 const buttons=privacy.querySelectorAll('.privacy-actions button');buttons[0].querySelector('strong').textContent='Скачать локальные данные в JSON';
 buttons.forEach((b,i)=>{if(i){b.disabled=true;b.querySelector('b').textContent='Пока недоступно';}});
 const status=document.createElement('p');status.setAttribute('role','status');privacy.append(status);
 buttons[0].addEventListener('click',()=>{
  try{const data={version:1,exportedAt:new Date().toISOString(),records:{}};for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);if(!key.startsWith('tempo-'))continue;const value=localStorage.getItem(key);try{data.records[key]=JSON.parse(value);}catch{data.records[key]=value;}}
   const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const link=document.createElement('a');link.href=url;link.download='tempo-local-export.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);status.textContent='Экспорт подготовлен. Файл содержит задачи, настройки и личные записи практик.';
  }catch{status.textContent='Не удалось прочитать локальные данные для экспорта.';}
 });
})();
