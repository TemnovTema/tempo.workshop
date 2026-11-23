(function(){
 const day=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Moscow',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 const buttons=[...document.querySelectorAll('.state-factor-grid button')];
 const factors=['sleep','body','focus','people','work','home','environment','breaks'];
 const save=document.querySelector('.save-state'),note=document.getElementById('stateNote');
 const status=document.createElement('p');status.setAttribute('role','status');save.before(status);
 function apply(record){
  const advice=TempoCheckin.advice(record);
  const card=document.querySelector('.energy-overview');card.querySelector('.energy-orbit strong').textContent=record.energy;
  card.setAttribute('aria-label',`Энергия ${record.energy} из 100. ${advice.title}`);
  card.querySelector('.energy-summary strong').textContent=advice.title;
  card.querySelector('.energy-summary>span').textContent='Состояние сегодня';
  const arcs=TempoBalanceRing.layout(record.energy);card.querySelectorAll('.energy-segment').forEach((node,i)=>{const a=arcs[i];node.style.opacity=a?'1':'0';if(a){node.style.strokeWidth=a.width;node.style.strokeDasharray=`${a.length} ${100-a.length}`;node.style.strokeDashoffset=a.offset;}});
  document.querySelector('.next-task>p').textContent=advice.next;
 }
 try{const raw=JSON.parse(localStorage.getItem('tempo-checkin-v1'));const record=TempoCheckin.validate(raw,day());if(!record){document.querySelector('.energy-orbit strong').textContent='—';document.querySelector('.energy-summary strong').textContent='Как вы сейчас?';document.querySelectorAll('.energy-segment').forEach(n=>n.style.opacity='0');}if(record){energySlider.value=record.energy;updateMood();note.value=typeof raw.note==='string'?raw.note:'';buttons.forEach((b,i)=>{const active=Array.isArray(raw.mobileFactors)?raw.mobileFactors.includes(factors[i]):i===0&&record.factors.includes('sleep');b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});apply(record);}}catch{status.textContent='Не удалось прочитать сохранённое состояние.';}
 save.addEventListener('click',event=>{
  event.stopImmediatePropagation();const selected=factors.filter((_,i)=>buttons[i].classList.contains('active'));
  const record={day:day(),energy:Number(energySlider.value),attention:'switching',factors:selected.includes('sleep')?['sleep']:[],mobileFactors:selected,note:note.value};
  if(!TempoCheckin.validate(record,day())){status.textContent='Проверьте значение энергии.';return;}
  try{localStorage.setItem('tempo-checkin-v1',JSON.stringify(record));}catch{status.textContent='Не удалось сохранить. Ответы остались в форме — попробуйте снова.';return;}
  try{const history=JSON.parse(localStorage.getItem('tempo-mobile-checkin-history-v1')||'[]');if(Array.isArray(history))localStorage.setItem('tempo-mobile-checkin-history-v1',JSON.stringify([...history.filter(r=>r.day!==record.day),record].slice(-365)));}catch{}
  status.textContent='Состояние сохранено в этом браузере.';apply(record);showStateStep(1);showScreen('today');
 },true);
})();
