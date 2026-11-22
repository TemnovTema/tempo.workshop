const {test}=require('node:test');const assert=require('node:assert/strict');const vm=require('node:vm');const fs=require('node:fs');
test('failed Back save keeps the visible question and subsequent input belongs to it',()=>{
 const nodes={};function node(key){return nodes[key]||=( {value:'',hidden:false,textContent:'',setAttribute(){},append(){},prepend(){},replaceChildren(){},addEventListener(t,fn){this[t]=fn;}});}
 let fail=true,last;const saved={answers:['first','second'],index:1,complete:false};
 const ctx={document:{getElementById:node,querySelector:node,createElement:()=>node('created'+Object.keys(nodes).length)},reflectionPlayer:{append(){}},activePrompts:['a','b'],reflectionIndex:0,renderReflectionQuestion(){},startReflection(){},closePractice(){},localStorage:{},TempoReflectionState:{create(){return {read:()=>({...saved,answers:[...saved.answers]}),error:()=> 'write failed',save(s){if(fail)return false;last=JSON.parse(JSON.stringify(s));return true;}};}}};
 vm.createContext(ctx);vm.runInContext(fs.readFileSync(require.resolve('../prototype/reflection-flow.js'),'utf8'),ctx);ctx.startReflection('test');
 const back=Object.values(nodes).find(n=>n.textContent==='Назад');back.click();assert.equal(ctx.reflectionIndex,1);
 fail=false;nodes.reflectionAnswer.value='changed second';nodes.reflectionAnswer.input();assert.deepEqual(last.answers,['first','changed second']);assert.equal(last.index,1);
});
