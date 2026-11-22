const {test}=require('node:test');const assert=require('node:assert/strict');
const {layout}=require('../prototype/balance-ring.js');
test('rounded segments have equal 4-unit gaps at every integer energy value',()=>{
 const r=59,c=2*Math.PI*r;
 assert.deepEqual(layout(0),[]);
 for(let value=1;value<=100;value++){
  const arcs=layout(value);assert.ok(arcs.length>=1&&arcs.length<=5);
  for(let i=1;i<arcs.length;i++){
   const previous=arcs[i-1],current=arcs[i];
   const distance=(-current.offset+previous.offset-previous.length)/100*c;
   const visibleGap=2*r*Math.sin(distance/(2*r))-current.width;
   assert.ok(Math.abs(visibleGap-4)<1e-8,`gap at ${value}`);
  }
  const first=arcs[0],last=arcs.at(-1);
  const closingDistance=(100+last.offset-last.length-first.offset)/100*c;
  if(arcs.length>1 && closingDistance<Math.PI*r) assert.ok(2*r*Math.sin(closingDistance/(2*r))>=first.width-1e-6,`no overlap at ${value}`);
 }
});
