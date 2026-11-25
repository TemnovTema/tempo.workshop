(function(){
 if(!savedCheckin){
  TempoBalanceRing.render(document.querySelector('.desktop-balance-wheel'),0);
  document.querySelector('.desktop-balance-wheel strong').textContent='—';
  document.querySelector('.desktop-balance-wheel').setAttribute('aria-label','Состояние сегодня ещё не отмечено');
  document.querySelector('.desktop-rhythm-copy > span').textContent='Состояние сегодня';
  document.querySelector('.desktop-rhythm-copy h2').textContent='Как вы сейчас?';
  document.querySelector('.desktop-rhythm-copy p').textContent='Обновите состояние, чтобы получить рекомендацию по вашей отметке.';
 }

 let savedProfile;
 try { savedProfile = JSON.parse(localStorage.getItem('tempo-onboarding-v1')); } catch {}
 renderWebHealthPreview(savedProfile?.healthPreview);

 const feature=document.querySelector('.featured-practice');if(feature){feature.querySelectorAll('p').forEach(p=>{if(p.textContent.includes('23 минуты'))p.textContent='Практика для самостоятельного выбора';});}
 document.querySelectorAll('.project-milestones').forEach(n=>{n.textContent='Этапы проекта пока не заданы.';});
 const safeLink=(box,value)=>{box.replaceChildren();let url;try{url=new URL(value);if(!['http:','https:'].includes(url.protocol))url=null;}catch{}if(url){const link=document.createElement('a');link.href=url.href;link.textContent=url.hostname;link.target='_blank';link.rel='noopener noreferrer';box.append(link);}else box.textContent='Ссылки пока не добавлены.';};
 function refreshMeta(){
  for(const data of Object.values(calendarProjectData)){
   data.health='Нет данных';data.moods=[];
   if(!data.deadlineDate){data.deadline='без срока';data.days='без срока';}
   else{data.deadline=new Date(data.deadlineDate+'T12:00:00').toLocaleDateString('ru-RU',{day:'numeric',month:'long'});const days=Math.ceil((new Date(data.deadlineDate+'T00:00:00')-calendarToday)/86400000);data.days=days<0?`Просрочен на ${Math.abs(days)} дн.`:`${days} дн.`;}
  }
 }
 const inline=renderInlineProjectDetails;renderInlineProjectDetails=function(id){refreshMeta();inline(id);document.getElementById('projectInlineTeam').textContent='Состояние участников не подключено.';safeLink(document.querySelector('.project-inline-materials'),calendarProjectData[id]?.link);};
 const peek=renderProjectPeek;renderProjectPeek=function(id){refreshMeta();peek(id);const box=document.querySelector('[data-project-peek-team]');if(box)box.textContent='Нет данных о состоянии команды';};
 const workspace=renderProjectWorkspace;renderProjectWorkspace=function(data){refreshMeta();workspace(data);};
 document.querySelector('[data-project-add-person]').disabled=true;
 document.querySelector('[data-project-add-person]').title='Приглашение участников пока недоступно';
 refreshMeta();renderCalendarPeriod();
})();

function renderWebHealthPreview(requested) {
  const visible = requested || new URLSearchParams(location.search).get('demo') === '1';
  const metrics = document.querySelector('.desktop-day-data');
  const readings = ['45 мин', '6 240', '7 ч 40 мин', '64 уд/мин'];
  metrics.querySelectorAll('dd').forEach((value, i) => {
    value.textContent = visible ? readings[i] : 'Нет данных';
  });
  metrics.setAttribute('aria-label', visible ? 'Демонстрационные данные здоровья' : 'Данные здоровья не подключены');
}
