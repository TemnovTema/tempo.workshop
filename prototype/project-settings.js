(function(){
 const key='tempo-project-settings-v1';let saved={};
 function apply(id,data){
   if(!calendarProjectData[id])calendarProjectData[id]={progress:0,hours:'0 ч 0 мин',health:'Нет данных',moods:[],tasks:[]};
   Object.assign(calendarProjectData[id],data);
   let button=document.querySelector(`[data-calendar-project-filter="${id}"]`);
   if(!button){
     button=document.createElement('button');button.type='button';button.dataset.calendarProjectFilter=id;
     button.className='calendar-project-row';
     const name=document.createElement('strong');button.append(name);
     button.addEventListener('click',()=>filterCalendarByProject(id));
     const edit=document.createElement('span');edit.className='project-edit';edit.setAttribute('role','button');edit.tabIndex=0;edit.textContent='✎';edit.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();openProjectDialog(id);}});edit.setAttribute('aria-label',`Редактировать проект ${data.name}`);
     edit.addEventListener('click',e=>{e.stopPropagation();openProjectDialog(id);});
     button.append(edit);document.querySelector('[data-calendar-project-add]').before(button);
   }
   let glyph=button.querySelector('[data-project-glyph]');
   if(!glyph){glyph=document.createElement('i');glyph.dataset.projectGlyph='';button.prepend(glyph);}
   glyph.className=`project-glyph project-glyph-${data.coverMode||'none'}`;glyph.replaceChildren();
   glyph.style.background=({coral:'#edaa93',blue:'#a8c6e8',green:'#b8d1a5',lilac:'#c8b7dc'})[data.color]||'';
   if(data.coverMode==='image'&&/^(data:image\/|https?:|assets\/)/.test(data.coverImage||'')){const img=document.createElement('img');img.src=data.coverImage;img.alt='';glyph.append(img);}
   else{const icon=document.createElement('span');icon.className=`ph ph-${/^[a-z-]+$/.test(data.coverIcon||'')?data.coverIcon:'folder-notch'}`;glyph.append(icon);}
   button.querySelector('.project-edit')?.setAttribute('aria-label',`Редактировать проект ${data.name}`);
   const label=document.querySelector(`[data-calendar-project-filter="${id}"] strong`);if(label)label.textContent=data.name;
 }
 try{
   const parsed=JSON.parse(localStorage.getItem(key)||'{}');
   for(const id of Object.keys(parsed).filter(id=>Object.hasOwn(calendarProjectData,id)||/^project-[a-f0-9-]+$/.test(id))){
     const d=parsed[id];
     if(d?.deleted){if(detachProjectTasks(id)){saved[id]=d;delete calendarProjectData[id];document.querySelector(`[data-calendar-project-filter="${id}"]`)?.remove();}continue;}
     if(d&&typeof d.name==='string'&&d.name.trim()&&typeof d.description==='string'&&typeof d.link==='string'&&Array.isArray(d.members)){
       saved[id]=d;apply(id,d);
     }
   }
 }catch{}
 function syncOptions(){
   const selects=[document.querySelector('#taskDialog form').querySelectorAll('select')[1],document.getElementById('taskDetailProjectSelect')];
   for(const select of selects){const previous=select.value;select.replaceChildren(new Option('Без проекта','none'));for(const [id,data] of Object.entries(calendarProjectData))select.add(new Option(data.name,id));select.add(new Option('Команда','team'));select.value=previous||'none';}
 }
 document.querySelector('[data-project-delete]').addEventListener('click',event=>{
   event.stopImmediatePropagation();const id=activeProjectKey;if(!id)return;
   try{
     localStorage.setItem(key,JSON.stringify({...saved,[id]:{...calendarProjectData[id],deleted:true}}));
     if(!detachProjectTasks(id)){localStorage.setItem(key,JSON.stringify(saved));throw Error();}
   }catch{let error=calendarProjectForm.querySelector('[data-project-save-error]');if(!error){error=document.createElement('p');error.dataset.projectSaveError='';error.setAttribute('role','alert');calendarProjectForm.append(error);}error.textContent='Не удалось удалить проект. Попробуйте ещё раз.';return;}
   saved[id]={...calendarProjectData[id],deleted:true};delete calendarProjectData[id];document.querySelector(`[data-calendar-project-filter="${id}"]`)?.remove();
   renderRecovery();activeProjectKey=null;calendarProjectDialog.close();closeInlineProjectDetails();syncOptions();filterCalendarByProject('all');
 },true);
 document.querySelector('[data-project-delete]').title='Удалить проект; задачи останутся без проекта';
 syncOptions();renderCalendarPeriod();
 function renderMaterials(id){
   const list=document.getElementById('projectMaterials');list.replaceChildren();
   const value=calendarProjectData[id]?.link;
   let url;try{url=new URL(value);if(!['https:','http:'].includes(url.protocol))url=null;}catch{}
   if(url){const link=document.createElement('a');link.href=url.href;link.textContent=url.hostname;link.target='_blank';link.rel='noopener noreferrer';list.append(link);}
   else{const empty=document.createElement('p');empty.textContent='Ссылки пока не добавлены.';list.append(empty);}
 }
 const recovery=document.createElement('details');
 const summary=document.createElement('summary');summary.textContent='Удалённые проекты';recovery.append(summary);
 const recoveryList=document.createElement('div');recovery.append(recoveryList);document.querySelector('[data-calendar-project-add]').after(recovery);
 function renderRecovery(){
   recoveryList.replaceChildren();const entries=Object.entries(saved).filter(([,d])=>d.deleted);recovery.hidden=!entries.length;
   for(const [id,data] of entries){const button=document.createElement('button');button.type='button';button.className='secondary-action';button.textContent=`Восстановить: ${data.name}`;
     button.addEventListener('click',()=>{
       const restored={...data,deleted:false};
       try{localStorage.setItem(key,JSON.stringify({...saved,[id]:restored}));if(!restoreProjectTasks(id)){localStorage.setItem(key,JSON.stringify(saved));throw Error();}}
       catch{button.textContent='Не удалось восстановить. Повторить';return;}
       saved[id]=restored;apply(id,restored);syncOptions();renderRecovery();filterCalendarByProject(id);
     });recoveryList.append(button);
   }
 }
 renderRecovery();
 const oldOpen=openProjectDialog;
 openProjectDialog=function(id=null){oldOpen(id);renderMaterials(id);document.getElementById('calendarProjectDeadline').value=id?saved[id]?.deadlineDate||'':'';calendarProjectForm.querySelector('[data-project-save-error]')?.remove();};
 calendarProjectForm.addEventListener('submit',event=>{
   if(event.submitter?.value==='cancel')return;
   event.preventDefault();event.stopImmediatePropagation();
   const name=document.getElementById('calendarProjectName').value.trim();
   if(!name){document.getElementById('calendarProjectName').focus();return;}
   const id=activeProjectKey||`project-${crypto.randomUUID()}`;
   const data={name,description:document.getElementById('calendarProjectDescription').value,link:document.getElementById('calendarProjectLink').value,
     members:[...document.querySelectorAll('[data-project-person].active')].map(b=>b.dataset.projectPerson),
     color:document.querySelector('[data-project-color].active')?.dataset.projectColor||'coral',
     coverMode:calendarProjectDialog.dataset.coverMode,coverIcon:calendarProjectDialog.dataset.coverIcon,coverImage:document.getElementById('projectCoverPreview').src,
     deadlineDate:document.getElementById('calendarProjectDeadline').value};
   data.deadline=data.deadlineDate?new Date(data.deadlineDate+'T12:00:00').toLocaleDateString('ru-RU',{day:'numeric',month:'long'}):'без срока';
   data.days=data.deadlineDate?`${Math.ceil((new Date(data.deadlineDate+'T00:00:00')-calendarToday)/86400000)} дн.`:'без срока';
   try{localStorage.setItem(key,JSON.stringify({...saved,[id]:data}));}
   catch{let error=calendarProjectForm.querySelector('[data-project-save-error]');if(!error){error=document.createElement('p');error.dataset.projectSaveError='';error.setAttribute('role','alert');calendarProjectForm.append(error);}error.textContent='Не удалось сохранить проект. Правки остались в форме.';return;}
   saved[id]=data;apply(id,data);syncOptions();calendarProjectDialog.close();filterCalendarByProject(id);renderCalendarPeriod();
 },true);
})();
