// Small mobile presentation helpers. Sheets use the approved editor components.
(function(){
 const day=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Moscow',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{return fallback;}};
 function write(key,value,status){try{localStorage.setItem(key,JSON.stringify(value));return true;}catch{if(status)status.textContent='Не удалось сохранить. Данные остались в форме — попробуйте снова.';return false;}}
 function button(text,action,primary=false){const b=document.createElement('button');b.type='button';b.className=primary?'primary-button':'profile-secondary-action';b.textContent=text;b.onclick=action;return b;}
 function sheet(id,title){const el=document.createElement('aside');el.id=id;el.className='bottom-sheet task-editor';el.innerHTML='<div class="sheet-handle"></div><button type="button" class="sheet-close" aria-label="Закрыть"><i class="ph ph-x"></i></button><h2></h2><div class="flow-content"></div><p role="status"></p>';el.querySelector('h2').textContent=title;el.querySelector('.sheet-close').onclick=()=>closeSheets();app.append(el);sheets.push(el);setSheetState(el,false);return{el,body:el.querySelector('.flow-content'),status:el.querySelector('[role=status]'),open:()=>openSheet(el)};}
 function field(parent,label,type='text',value=''){const wrap=document.createElement('label');wrap.textContent=label;const input=document.createElement(type==='textarea'?'textarea':'input');if(type!=='textarea')input.type=type;input.value=value;wrap.append(input);parent.append(wrap);return input;}
 window.TempoMobileFlow={day,read,write,button,sheet,field};
})();
