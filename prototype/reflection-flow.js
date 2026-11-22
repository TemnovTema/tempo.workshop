(function(){
 let store,state;
 const answer=document.getElementById('reflectionAnswer'),next=document.querySelector('.reflection-next'),skip=document.querySelector('.reflection-skip');
 const message=document.createElement('p');message.setAttribute('role','status');reflectionPlayer.append(message);
 const summary=document.createElement('div');summary.hidden=true;reflectionPlayer.append(summary);
 const back=document.createElement('button');back.type='button';back.textContent='Назад';back.className='secondary-action';document.querySelector('.reflection-actions').prepend(back);
 function save(){if(store.save(state)){message.textContent='Ответы сохранены в этом браузере.';return true;}message.textContent=store.error();return false;}
 function navigate(index,complete=false){const previous={index:state.index,complete:state.complete};state.index=index;state.complete=complete;if(save())render();else Object.assign(state,previous);}
 function render(){
   reflectionIndex=state.index;renderReflectionQuestion();answer.value=state.answers[state.index];
   answer.hidden=state.complete;next.hidden=state.complete;skip.hidden=state.complete;back.hidden=state.complete||!state.index;
   document.getElementById('reflectionPrompt').hidden=state.complete;summary.hidden=!state.complete;summary.replaceChildren();
   if(state.complete){
     const title=document.createElement('h3');title.textContent='Рефлексия завершена';summary.append(title);
     activePrompts.forEach((prompt,i)=>{const h=document.createElement('strong'),p=document.createElement('p');h.textContent=prompt;p.textContent=state.answers[i]||'Без ответа';summary.append(h,p);});
     const edit=document.createElement('button');edit.type='button';edit.className='secondary-action';edit.textContent='Вернуться к ответам';edit.onclick=()=>navigate(0);
     const done=document.createElement('button');done.type='button';done.className='primary-action';done.textContent='К практикам';done.onclick=closePractice;summary.append(edit,done);
   }
 }
 const original=startReflection;
 startReflection=function(name){original(name);let storage;try{storage=localStorage;}catch{storage={getItem(){throw Error();},setItem(){throw Error();}};}store=TempoReflectionState.create(storage,name,activePrompts.length);state=store.read();message.textContent=store.error();render();};
 answer.addEventListener('input',()=>{state.answers[state.index]=answer.value;save();});
 back.addEventListener('click',()=>{state.answers[state.index]=answer.value;navigate(Math.max(0,state.index-1));});
 [next,skip].forEach(button=>button.addEventListener('click',event=>{event.stopImmediatePropagation();const previousIndex=state.index,previousComplete=state.complete;state.answers[state.index]=answer.value;if(state.index<activePrompts.length-1)state.index++;else state.complete=true;if(save())render();else{state.index=previousIndex;state.complete=previousComplete;}},true));
})();
