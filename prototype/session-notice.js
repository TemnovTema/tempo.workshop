(function(){
 const banner=document.createElement('aside');banner.hidden=true;banner.setAttribute('role','status');banner.style.cssText='position:fixed;bottom:20px;left:20px;right:20px;z-index:1000;padding:16px;border-radius:14px;background:var(--paper,#fff);box-shadow:0 4px 30px #0003;display:none';
 const copy=document.createElement('span'),button=document.createElement('button');button.type='button';button.className='secondary-action';button.textContent='Обновить страницу';button.style.marginLeft='16px';banner.append(copy,button);document.body.append(banner);
 function notice(text){copy.textContent=text+' Сохраните текущие правки перед обновлением.';banner.hidden=false;banner.style.display='block';}
 button.addEventListener('click',()=>location.reload());
 function day(){return new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Moscow',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());}
 const opened=day();function check(){if(day()!==opened)notice('Начался новый день. Обновите страницу, чтобы увидеть актуальную дату.');}
 setInterval(check,30000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)check();});
 window.addEventListener('storage',event=>{if(['tempo-tasks-v1','tempo-project-settings-v1','tempo-boundaries-v1'].includes(event.key))notice('Данные изменились в другой вкладке. Обновите страницу перед следующими изменениями.');});
})();
