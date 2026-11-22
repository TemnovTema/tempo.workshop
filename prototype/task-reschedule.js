(function(){
 window.TempoTaskReschedule=function({store,dayKey,refresh}){
  const panel=document.querySelector('[data-view-panel="conflict"]');
  panel.querySelector('#conflictTitle').textContent='Изменить план';
  panel.querySelector('.date-line').textContent='Перенос задачи';
  panel.querySelector('.intro-meta p').textContent='Выберите задачу и новое время. Изменения появятся в календаре после сохранения.';
  const layout=panel.querySelector('.conflict-layout');layout.replaceChildren();
  const form=document.createElement('form');form.className='task-dialog';form.style.padding='32px';
  function field(label,type){const wrapper=document.createElement('label');wrapper.textContent=label;const input=document.createElement(type==='select'?'select':'input');if(type!=='select')input.type=type;input.required=true;wrapper.append(input);form.append(wrapper);return input;}
  const taskSelect=field('Задача','select'),date=field('Новая дата','date'),time=field('Начало','time');
  const preview=document.createElement('p');form.append(preview);
  const message=document.createElement('p');message.setAttribute('role','status');form.append(message);
  const save=document.createElement('button');save.type='submit';save.className='primary-action';save.textContent='Сохранить перенос';form.append(save);layout.append(form);
  const minutes=t=>Number(t.slice(0,2))*60+Number(t.slice(3));
  function selected(){return store.all().find(t=>t.id===taskSelect.value);}
  function details(){const task=selected();if(!task)return;date.value=task.date;time.value=task.time;preview.textContent=`Сейчас: ${task.date} · ${task.time} · ${task.minutes} мин`;message.textContent='';}
  function render(){taskSelect.replaceChildren();store.all().filter(t=>!t.completed&&!t.readonly).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time)).forEach(t=>taskSelect.add(new Option(`${t.name} · ${t.date} ${t.time}`,t.id)));save.disabled=!taskSelect.options.length;if(save.disabled){preview.textContent='Нет незавершённых задач для переноса.';date.value=dayKey(calendarToday);time.value='09:30';}else details();}
  taskSelect.addEventListener('change',details);
  form.addEventListener('submit',event=>{
    event.preventDefault();const task=selected();if(!task)return;
    const start=minutes(time.value),end=start+task.minutes;
    if(start<480||end>1260){message.textContent='Задача должна помещаться в календарь с 08:00 до 21:00.';return;}
    const clash=store.forDate(date.value).find(t=>t.id!==task.id&&!t.completed&&start<minutes(t.time)+t.minutes&&end>minutes(t.time));
    if(clash){message.textContent=`Пересечение: ${clash.name} · ${clash.time}. Выберите другое время.`;return;}
    if(!store.save({...task,date:date.value,time:time.value})){message.textContent=store.error();return;}
    calendarDate=new Date(date.value+'T12:00:00');refresh();render();taskSelect.value=task.id;details();message.textContent='Перенос сохранён в календаре.';
  });
  const original=openView;openView=function(name){if(name==='conflict')render();original(name);};
  if(location.hash==='#conflict')render();
 };
})();
