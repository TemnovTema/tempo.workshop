// Daily demo fixtures only; ordinary local calendars remain untouched.
(function(){
 if(new URLSearchParams(location.search).get('demo')!=='1')return;
 try{
  const day=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Moscow',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const checkin=JSON.parse(localStorage.getItem('tempo-checkin-v1')||'null');
  if(checkin?.day!==day)localStorage.setItem('tempo-checkin-v1',JSON.stringify({day,energy:76,attention:'steady',factors:[]}));
  const key='tempo-demo-today-v1';
  if(localStorage.getItem(key)===day)return;
  const tasks=JSON.parse(localStorage.getItem('tempo-tasks-v1')||'[]');
  const fixtures=[['08:00',20,'personal','Утренний чек-ин',true],['08:30',30,'tempo','Определить приоритеты',true],['18:30',40,'tempo','Собрать идеи для следующего шага',false],['19:30',30,'personal','Прогулка без телефона',false]];
  for(const [time,minutes,project,name,completed] of fixtures){
   const id=`demo-today-${day}-${time}`;
   const start=Number(time.slice(0,2))*60+Number(time.slice(3));
   if(tasks.some(t=>t.id===id||t.date===day&&(()=>{const n=Number(t.time.slice(0,2))*60+Number(t.time.slice(3));return start<n+t.minutes&&start+minutes>n;})()))continue;
   tasks.push({id,date:day,time,minutes,project,name,completed,notes:'Демонстрационная задача'});
  }
  localStorage.setItem('tempo-tasks-v1',JSON.stringify(tasks));localStorage.setItem(key,day);
 }catch{ /* Existing storage error reporting remains available in the calendar. */ }
})();
