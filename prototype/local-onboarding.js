(function(){
 const root=document.getElementById('webAuthFlow'),steps=root.querySelectorAll('[data-web-auth-step]');
 root.setAttribute('aria-label','Локальная настройка Tempo');
 root.querySelector('.web-auth-story-copy p').textContent='Настройте имя и сохраните предпочтения в этом браузере.';
 const progress=root.querySelectorAll('.web-auth-progress li');progress[0].querySelector('strong').textContent='Знакомство';progress[0].querySelector('small').textContent='как к вам обращаться';
 steps[0].querySelector('h2').textContent='Начать локально';steps[0].querySelector('p').textContent='Аккаунт не создаётся. Имя и настройки останутся на этом устройстве.';
 const input=root.querySelector('input');input.type='text';input.autocomplete='given-name';input.placeholder='Ваше имя';input.maxLength=80;input.required=true;
 const label=input.closest('label');label.firstChild.textContent='Имя';
 steps[0].querySelector('button[type="submit"]').textContent='Продолжить';
 root.querySelector('.web-social-auth').hidden=true;root.querySelector('.web-auth-divider').hidden=true;root.querySelector('.web-signup-form i')?.remove();
 root.querySelector('.web-auth-legal').textContent='Внешняя авторизация в прототипе недоступна.';
 steps[1].querySelector('p').textContent='Сохраним ваши предпочтения в профиле. Автоматическая адаптация расписания по ним пока не включена.';
 steps[2].querySelector('h2').textContent='Всё готово к работе';steps[2].querySelector('p').textContent='Внешние календари и данные здоровья пока не подключаются. Можно работать с локальными задачами и отмечать состояние вручную.';
 root.querySelectorAll('[data-web-source]').forEach(b=>{b.disabled=true;b.classList.remove('selected');b.setAttribute('aria-pressed','false');});
 root.querySelector('.web-auth-privacy small').textContent='Задачи и личные записи сохраняются в этом браузере. Экспорт доступен в профиле.';
 const message=document.createElement('p');message.setAttribute('role','status');steps[2].append(message);
 let saved=null;try{saved=JSON.parse(localStorage.getItem('tempo-onboarding-v1'));}catch{}
 function display(){if(!saved||typeof saved.name!=='string')return;document.getElementById('todayTitle').textContent=`Ваш день, ${saved.name}`;const profileButton=document.querySelector('.header-profile');if(profileButton)profileButton.setAttribute('aria-label',`Профиль: ${saved.name}`);}
 const edit=document.createElement('button');edit.type='button';edit.className='text-action';edit.textContent='Изменить предпочтения';edit.addEventListener('click',()=>{openWebAuth();showWebAuthStep(2);});document.querySelector('.profile-intro .intro-meta').append(edit);
 const summary=document.createElement('p');document.querySelector('.profile-intro .intro-meta').prepend(summary);
 function summaryText(){summary.textContent=saved?`Ваш ритм: ${saved.work||'не выбран'} · восстановление: ${saved.rest||'не выбрано'}`:'';}
 if(saved&&typeof saved.name==='string'){input.value=saved.name;for(const group of ['work','rest'])root.querySelectorAll(`[data-web-rhythm="${group}"]`).forEach(b=>{const active=b.querySelector('strong').textContent===saved[group];b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});}
 root.querySelectorAll('[data-web-auth-finish]').forEach(b=>b.addEventListener('click',event=>{
  event.stopImmediatePropagation();const name=input.value.trim();if(!name){showWebAuthStep(1);input.focus();return;}
  const data={name,work:root.querySelector('[data-web-rhythm="work"].active strong')?.textContent||'',rest:root.querySelector('[data-web-rhythm="rest"].active strong')?.textContent||''};
  try{localStorage.setItem('tempo-onboarding-v1',JSON.stringify(data));}catch{message.textContent='Не удалось сохранить настройки. Попробуйте ещё раз.';return;}
  saved=data;finishWebAuth();display();summaryText();
 },true));
 const original=openView;openView=function(name){original(name);display();};
 summaryText();display();if(!initialHash&&saved?.name)finishWebAuth();
})();
