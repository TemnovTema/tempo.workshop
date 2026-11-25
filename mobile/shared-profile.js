(function(){
 const F=TempoMobileFlow,panel=F.sheet('settingsEditorSheet','Настройки');
 const nameField = document.getElementById('intro-name');
 const fields = ['occupation', 'goal'];
 const status = document.createElement('p');
 document.querySelectorAll('.note-examples button').forEach(button => {
   button.addEventListener('click', () => {
     const example = button.textContent.trim();
     const lines = note.value.split('\n');
     if (!lines.some(line => line.trim() === example)) {
       note.value = [note.value.trimEnd(), example].filter(Boolean).join('\n');
     }
   });
 });
 status.setAttribute('role','status');
 const note = document.getElementById("intro-note");
 document.querySelector('[data-auth-step="6"]').append(status);
 document.querySelectorAll('[data-auth-next]').forEach(button => button.addEventListener('click', () => {
     button.closest('.auth-step').dataset.skipped = String(button.classList.contains('auth-skip'));
 }));
 let previewHealth = false;
 document.querySelectorAll('[data-auth-next="4"]').forEach(button => button.addEventListener('click', () => {
   previewHealth = button.hasAttribute('data-health-preview');
 }));
 function identity(data) {
   if (!data?.name) return;
   nameField.value = data.editableIntroName ? data.name : nameField.defaultValue;
   note.value = data.dayNote || '';
   for (const key of fields) {
     const select = document.getElementById('intro-' + key);
     if (data[key] && !Array.from(select.options).some(option => option.value === data[key])) {
       select.add(new Option(data[key], data[key]));
     }
     if (typeof data[key] === 'string') select.value = data[key];
   }
   document.querySelectorAll('[data-rhythm-choice]').forEach(button => {
     const selected = data[button.dataset.rhythmChoice] === button.querySelector('span').textContent;
     button.classList.toggle('active', selected);
     button.setAttribute('aria-pressed', String(selected));
   });
   document.querySelector('.profile-identity h2').textContent = data.name;
   document.querySelector('.profile-identity p').textContent = [data.occupation,data.goal,data.work,data.rest].filter(Boolean).join(' · ');
   document.querySelector('.profile-avatar').firstChild.textContent = data.name.slice(0,1).toUpperCase();
   document.getElementById('todayTitle').textContent = 'Ваш день, ' + data.name;
 }
 identity(F.read('tempo-onboarding-v1',null));
 document.querySelectorAll('[data-auth-finish]').forEach(button => button.addEventListener('click', event => {
   event.stopImmediatePropagation();
   const data = {...F.read('tempo-onboarding-v1', {})};
   if (document.querySelector('[data-auth-step="2"]').dataset.skipped !== 'true') {
     data.name = nameField.value.trim() || nameField.defaultValue;
     data.editableIntroName = true;
     for (const key of fields) data[key] = document.getElementById('intro-' + key).value;
   }
   if (button.dataset.authFinish === 'save') {
     document.querySelectorAll('.auth-step:not([data-skipped="true"]) [data-rhythm-choice].active').forEach(choice => {
       data[choice.dataset.rhythmChoice] = choice.querySelector('span').textContent;
     });
   }
   data.dayNote = note.value.trim();
   data.name ||= 'Гость';
   if (!F.write('tempo-onboarding-v1',data,status)) return;
   finishAuth();
   identity(data);
   if (previewHealth) {
     document.querySelector('.energy-card').scrollIntoView({block:'center'});
     showProfileToast('Показаны демонстрационные показатели');
   }
 }, true));
 document.querySelector('[data-profile-panel="roles"] .profile-secondary-action').onclick=()=>{openAuth();showAuthStep(2);};
 // The local prototype must never report a successful external connection.
 document.querySelector('.profile-sync strong').textContent='Данные в этом браузере';document.querySelector('.profile-sync small').textContent='Общие для веба и мобильной версии';
 document.querySelector('[data-profile-sync]').addEventListener('click',e=>{e.stopImmediatePropagation();showProfileToast('Облачная синхронизация пока недоступна');},true);
 document.querySelectorAll('[data-connect-source],.device-catalog button').forEach(b=>{b.addEventListener('click',e=>{e.stopImmediatePropagation();showProfileToast('Внешние подключения пока недоступны');},true);});
 document.querySelectorAll('.connected-list article').forEach(a=>{const input=a.querySelector('input');if(input){input.checked=false;input.disabled=true;}const em=a.querySelector('em');if(em)em.textContent='Не подключено';});
 document.querySelector('[data-profile-panel="calendars"] header>span').textContent='Локальный календарь';
 document.querySelector('.privacy-ok strong').textContent='Хранится на этом устройстве';document.querySelector('.privacy-ok small').textContent='Данные доступны вебу и мобильной версии этого сайта';
 document.querySelectorAll('.mobile-data-map em').forEach(n=>n.textContent='Локально');document.querySelector('.profile-storage small').textContent='Хранилище браузера';
 document.querySelector('.profile-storage strong').textContent=`${Math.ceil(new Blob(Object.keys(localStorage).filter(k=>k.startsWith('tempo-')).map(k=>localStorage.getItem(k))).size/1024)} КБ`;
 const boundsKey='tempo-boundaries-v1',defaults=[{start:'09:30',end:'18:30',protect:true},{start:'16:00',end:'20:00',protect:true},{start:'08:00',end:'21:00',protect:true}];let bounds=F.read(boundsKey,defaults);if(!Array.isArray(bounds)||bounds.length!==3)bounds=defaults;
 const roleButtons=[...document.querySelectorAll('.profile-role-list button')];function renderBounds(){roleButtons.forEach((b,i)=>b.querySelector('small').textContent=`${bounds[i].start}–${bounds[i].end}`);document.querySelector('[data-profile-panel="roles"] .profile-rule-card strong').textContent='Перенос задач учитывает часы роли';}
 roleButtons.forEach((b,i)=>b.onclick=()=>{panel.body.replaceChildren();panel.status.textContent='';panel.el.querySelector('h2').textContent=b.querySelector('strong').textContent;const start=F.field(panel.body,'Начало','time',bounds[i].start),end=F.field(panel.body,'Окончание','time',bounds[i].end);panel.body.append(F.button('Сохранить границы',()=>{if(!start.value||!end.value||start.value>=end.value||start.value<'08:00'||end.value>'21:00'){panel.status.textContent='Укажите интервал внутри 08:00–21:00, начало раньше окончания.';return;}const next=bounds.map((v,j)=>j===i?{...v,start:start.value,end:end.value}:v);if(F.write(boundsKey,next,panel.status)){bounds=next;renderBounds();closeSheets();}},true));panel.open();});renderBounds();
 const protect=document.querySelector('[data-profile-panel="roles"] .profile-rule-card input');protect.checked=bounds[0].protect!==false;protect.onchange=()=>{const next=bounds.map(b=>({...b,protect:protect.checked}));if(F.write(boundsKey,next,panel.status))bounds=next;else{protect.checked=!protect.checked;showProfileToast('Не удалось сохранить границы');}};
 const prefsKey='tempo-mobile-preferences-v1';let prefs=F.read(prefsKey,{});
 document.querySelector('[data-profile-panel="notifications"] header p').textContent='Предпочтения сохраняются локально. Фоновые уведомления пока не отправляются.';
 const inputs=[...document.querySelectorAll('.notification-list input,[data-profile-panel="health"] .profile-rule-card input,[data-profile-panel="calendars"] .profile-rule-card input')];inputs.forEach((input,i)=>{if(typeof prefs[i]==='boolean')input.checked=prefs[i];input.onchange=()=>{const next={...prefs,[i]:input.checked};if(F.write(prefsKey,next,panel.status))prefs=next;else{input.checked=!input.checked;showProfileToast('Не удалось сохранить настройку');}};});
 document.querySelector('.quiet-time button').onclick=()=>{panel.body.replaceChildren();panel.el.querySelector('h2').textContent='Тихие часы';const start=F.field(panel.body,'С','time',prefs.quietStart||'19:30'),end=F.field(panel.body,'До','time',prefs.quietEnd||'08:30');panel.body.append(F.button('Сохранить',()=>{if(!start.value||!end.value||start.value===end.value){panel.status.textContent='Укажите разные часы начала и окончания.';return;}const next={...prefs,quietStart:start.value,quietEnd:end.value};if(F.write(prefsKey,next,panel.status)){prefs=next;document.querySelector('.quiet-time strong').textContent=start.value+' — '+end.value;closeSheets();}},true));panel.open();};document.querySelector('.quiet-time strong').textContent=(prefs.quietStart||'19:30')+' — '+(prefs.quietEnd||'08:30');
 // Apply the evening schedule using the existing theme renderer.
 const scheduleKey='tempo-mobile-theme-schedule-v1',hours=[...themeHours.querySelectorAll('input')];let schedule=F.read(scheduleKey,{enabled:false,start:'20:00',end:'08:00'});themeAuto.checked=!!schedule.enabled;themeHours.disabled=!themeAuto.checked;hours[0].value=schedule.start;hours[1].value=schedule.end;
 function applySchedule(){if(!schedule.enabled)return;const now=new Date().toLocaleTimeString('en-GB',{timeZone:'Europe/Moscow',hour:'2-digit',minute:'2-digit'});const dark=schedule.start>schedule.end?now>=schedule.start||now<schedule.end:now>=schedule.start&&now<schedule.end;applyTheme(dark?'dark':'light');}
 for(const input of [themeAuto,...hours])input.addEventListener('change',()=>{if(!hours[0].value||!hours[1].value||hours[0].value===hours[1].value){showProfileToast('Укажите разные часы начала и окончания');return;}const next={enabled:themeAuto.checked,start:hours[0].value,end:hours[1].value};if(F.write(scheduleKey,next,panel.status)){schedule=next;applySchedule();}});applySchedule();setInterval(applySchedule,60000);
 document.querySelectorAll('[data-theme]').forEach(b=>b.addEventListener('click',()=>{schedule.enabled=false;themeAuto.checked=false;themeHours.disabled=true;F.write(scheduleKey,schedule,panel.status);}));
 document.querySelectorAll('[data-profile-action]').forEach((b,i)=>b.addEventListener('click',e=>{e.stopImmediatePropagation();if(i===0){try{const data=Object.fromEntries(Object.keys(localStorage).filter(k=>k.startsWith('tempo-')).map(k=>{let v=localStorage.getItem(k);try{v=JSON.parse(v);}catch{}return[k,v];}));const url=URL.createObjectURL(new Blob([JSON.stringify({exportedAt:new Date().toISOString(),data},null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='tempo-'+F.day()+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);showProfileToast('Файл JSON передан браузеру');}catch{showProfileToast('Не удалось экспортировать данные');}return;}panel.body.replaceChildren();panel.status.textContent='';panel.el.querySelector('h2').textContent=i===1?'История практик':'Удаление локальных данных';if(i===1){const history=F.read('tempo-practice-history-v1',[]);if(!history.length)panel.body.textContent='Завершённых практик пока нет.';for(const r of history.slice().reverse()){const p=document.createElement('p');p.textContent=`${r.name} · ${Math.floor(r.seconds/60)} мин · ${new Date(r.finished).toLocaleDateString('ru-RU')}\n${r.note||''}`;panel.body.append(p);}}else{const p=document.createElement('p');p.textContent='Будут удалены задачи, проекты, состояние, ответы и настройки этого браузера — для веба и мобильной версии. Сначала можно сделать экспорт.';panel.body.append(p);const confirmation=F.field(panel.body,'Введите УДАЛИТЬ');panel.body.append(F.button('Удалить локальные данные',()=>{if(confirmation.value!=='УДАЛИТЬ'){panel.status.textContent='Для удаления введите УДАЛИТЬ.';return;}try{Object.keys(localStorage).filter(k=>k.startsWith('tempo-')).forEach(k=>localStorage.removeItem(k));location.replace(location.pathname+'#signup');}catch{panel.status.textContent='Не удалось удалить все данные.';}},true));}panel.open();},true));
 document.querySelectorAll('[data-profile-action] small')[0].textContent='Файл JSON';document.querySelectorAll('[data-profile-action] strong')[1].textContent='История практик';document.querySelectorAll('[data-profile-action] small')[1].textContent='Результаты и заметки';
})();
