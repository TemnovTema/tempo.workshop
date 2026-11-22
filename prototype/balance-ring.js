(function(root){
  function layout(value, radius=59, thickness=14, gap=4){
    const energy=Math.max(0,Math.min(100,Number(value)||0));
    if(!energy)return [];
    const circumference=2*Math.PI*radius;
    // Distance between rounded endpoint centres gives an exact visible gap.
    const separation=2*radius*Math.asin((thickness+gap)/(2*radius));
    const extent=energy/100*(circumference-separation+2*radius*Math.asin(thickness/(2*radius)));
    const width=Math.min(thickness,extent);
    const cap=2*radius*Math.asin(width/(2*radius));
    const count=Math.min(5,Math.max(1,Math.floor((extent+separation-cap)/separation)));
    const length=Math.max(0.001,(extent-cap-(count-1)*separation)/count);
    return Array.from({length:count},(_,i)=>({
      length:length/circumference*100,
      offset:-(cap/2+i*(length+separation))/circumference*100,
      width
    }));
  }
  function render(wheel,value){
    const segments=layout(value);
    wheel.querySelectorAll('.balance-segment').forEach((node,i)=>{
      const segment=segments[i];node.style.opacity=segment?'1':'0';
      if(!segment)return;
      node.style.strokeWidth=String(segment.width);
      node.style.strokeDasharray=`${segment.length} ${100-segment.length}`;
      node.style.strokeDashoffset=String(segment.offset);
    });
  }
  if(typeof module==='object'&&module.exports)module.exports={layout};
  else root.TempoBalanceRing={layout,render};
})(typeof window==='undefined'?globalThis:window);
