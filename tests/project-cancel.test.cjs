const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');
const source=fs.readFileSync(require.resolve('../prototype/tempo-app.js'),'utf8');
const section=source.slice(source.indexOf('calendarProjectForm?.querySelectorAll'),source.indexOf("document.querySelector('[data-project-delete]')",source.indexOf('calendarProjectForm?.querySelectorAll')));
function setup(){
 let submit,closed=0,prevented=0;const buttons=[{},{}];buttons.forEach(b=>b.addEventListener=(type,fn)=>b.click=fn);
 const data={tempo:{name:'Original'}};const fields={calendarProjectName:{value:'Edited',focus(){}},calendarProjectDescription:{value:'Description'},calendarProjectLink:{value:''},projectCoverPreview:{src:''}};
 const label={textContent:'Original'};
 vm.runInNewContext(section,{calendarProjectForm:{querySelectorAll:()=>buttons,addEventListener:(t,fn)=>submit=fn},calendarProjectDialog:{close:()=>closed++,dataset:{}},calendarProjectData:data,activeProjectKey:'tempo',document:{getElementById:id=>fields[id],querySelector:selector=>selector.endsWith(' strong')?label:null}});
 return {buttons,data,fields,label,closed:()=>closed,submit:value=>submit({submitter:{value},preventDefault:()=>prevented++}),prevented:()=>prevented};
}
test('cancel and close are non-submit buttons and leave project untouched',()=>{const s=setup();for(const b of s.buttons){assert.equal(b.type,'button');b.click();}assert.equal(s.closed(),2);assert.equal(s.data.tempo.name,'Original');s.submit('cancel');assert.equal(s.data.tempo.name,'Original');});
test('explicit save applies edits, empty name keeps editor open',()=>{const s=setup();s.submit('confirm');assert.equal(s.data.tempo.name,'Edited');assert.equal(s.label.textContent,'Edited');s.fields.calendarProjectName.value=' ';s.submit('confirm');assert.equal(s.prevented(),1);assert.equal(s.data.tempo.name,'Edited');});
