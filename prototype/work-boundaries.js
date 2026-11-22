(function(){
 const panel=document.querySelector('[data-view-panel="onboarding"]'),inputs=panel.querySelectorAll('input[type="time"]'),protect=panel.querySelector('input[type="checkbox"]'),tabs=[...panel.querySelectorAll('.role-tabs button')];
 const defaults=[{start:'09:30',end:'18:30',protect:true},{start:'16:00',end:'20:00',protect:false},{start:'08:00',end:'21:00',protect:false}];
 const valid=r=>r&&/^([01]\d|2[0-3]):[0-5]\d$/.test(r.start)&&/^([01]\d|2[0-3]):[0-5]\d$/.test(r.end)&&r.start<r.end&&typeof r.protect==='boolean';
 let saved=defaults.map(r=>({...r})),draft,role=0;
 try{const value=JSON.parse(localStorage.getItem('tempo-boundaries-v1'));if(Array.isArray(value)&&value.length===3&&value.every(valid))saved=value;}catch{}
 const profileMessage=document.createElement('p');profileMessage.setAttribute('role','status');document.querySelector('.boundary-card').after(profileMessage);
 const message=document.createElement('p');message.setAttribute('role','status');panel.querySelector('.onboarding-actions').before(message);
 panel.querySelector('.onboarding-shell > header > span').textContent='Рабочие границы';
 panel.querySelector('.onboarding-copy > p').textContent='Сохраните предпочтительные часы для каждой роли. Перенос задач из итогов дня учитывает эти часы в пределах сетки 08:00–21:00.';
 panel.querySelector('.onboarding-visual > p').textContent='Предпочтения сохраняются в этом браузере. Уже запланированные задачи останутся на своих местах.';
 panel.querySelector('.protect-evening small').textContent='Отметка защищённого времени для этой роли.';
 const save=panel.querySelector('.onboarding-actions .primary-action');save.textContent='Сохранить границы';
 function profile(){document.querySelectorAll('[data-settings-panel="roles"] .role-row').forEach((row,i)=>row.querySelector('span').textContent=`${saved[i].start}–${saved[i].end}`);document.querySelector('.boundary-card strong').textContent=saved[0].protect?`После ${saved[0].end} — защищённое время`:'Защита вечера выключена';document.querySelector('.boundary-card input').checked=saved[0].protect;}
 function read(){draft[role]={start:inputs[0].value,end:inputs[1].value,protect:protect.checked};}
 function render(){inputs[0].value=draft[role].start;inputs[1].value=draft[role].end;protect.checked=draft[role].protect;tabs.forEach((b,i)=>b.classList.toggle('active',i===role));panel.querySelector('.protect-evening strong').textContent=`Защищать время после ${inputs[1].value}`;const minutes=t=>Number(t.slice(0,2))*60+Number(t.slice(3));panel.querySelector('.day-boundary-viz b').textContent=valid(draft[role])?`${(minutes(inputs[1].value)-minutes(inputs[0].value))/60} ч в границах`:'Проверьте часы';}
 tabs.forEach((b,i)=>b.addEventListener('click',()=>{read();role=i;render();}));
 inputs.forEach(input=>input.addEventListener('input',()=>{read();render();}));
 save.addEventListener('click',event=>{event.stopImmediatePropagation();read();const invalid=draft.findIndex(r=>!valid(r));if(invalid!==-1){role=invalid;render();message.textContent='Укажите начало раньше окончания в пределах одного дня.';return;}try{localStorage.setItem('tempo-boundaries-v1',JSON.stringify(draft));}catch{message.textContent='Не удалось сохранить. Попробуйте ещё раз.';return;}saved=draft.map(r=>({...r}));profile();openView('profile');},true);
 const original=openView;openView=function(name){if(name==='onboarding'){draft=saved.map(r=>({...r}));message.textContent='';render();}original(name);};
 document.querySelectorAll('[data-settings-panel="roles"] .role-row button').forEach((b,i)=>b.addEventListener('click',()=>{role=i;openView('onboarding');}));
 document.querySelector('.boundary-card input').addEventListener('change',event=>{const next=saved.map(r=>({...r}));next[0].protect=event.target.checked;try{localStorage.setItem('tempo-boundaries-v1',JSON.stringify(next));saved=next;profileMessage.textContent='Настройка сохранена.';}catch{profileMessage.textContent='Не удалось сохранить настройку. Прежнее значение восстановлено.';}profile();});
 profile();if(location.hash==='#onboarding')openView('onboarding');
})();
