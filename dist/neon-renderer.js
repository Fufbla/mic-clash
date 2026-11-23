export function createNeonRenderer(ctx,frame,assets,ground){
 const clamp=v=>Math.max(0,Math.min(1,v));
 function support(index,x,y,size,facing,car=false){const f=frame('redrollsSupport',index);if(!f)return;const z=car?size/f.w:size/assets().redrollsSupport.referenceHeight;ctx.save();ctx.translate(x,ground-y);ctx.scale(facing,1);ctx.drawImage(f.image,car?-size/2:-f.anchorX*z,-f.anchorY*z,f.w*z,f.h*z);ctx.restore();}
 function behind(s,g){const a=g.fighters.find(f=>f.id===s.owner);if(!a)return;
  if(s.kind==='lowrider'){if(s.car?.visible)support(s.car.pose,s.car.x,s.car.y,440,s.facing,true);for(const c of s.crew)if(c.visible)support(c.pose,c.x,0,165,c.facing);}
  if(s.kind==='giantSmash'||s.kind==='alienBurst'){ctx.save();ctx.globalAlpha=.6*clamp(s.age/.3)*clamp((s.duration-s.age)/.35);ctx.strokeStyle=s.kind==='alienBurst'?'#a7ff39':'#ce83ff';ctx.shadowColor=ctx.strokeStyle;ctx.shadowBlur=22;ctx.lineWidth=5;ctx.beginPath();ctx.ellipse(a.x,ground,80*s.scale,17,0,0,7);ctx.stroke();if(s.kind==='giantSmash'&&s.locked){ctx.beginPath();ctx.ellipse(s.focusX,ground,155,18,0,0,7);ctx.stroke();}ctx.restore();}
 }
 function special(s){ctx.save();if(s.kind==='alienBurst'&&s.bolt?.visible){const p=s.bolt;ctx.translate(p.x,ground-p.y);ctx.scale(s.facing,1);ctx.shadowColor='#9cff39';ctx.shadowBlur=25;ctx.fillStyle='#acff42';ctx.beginPath();ctx.ellipse(0,0,44,19,0,0,7);ctx.fill();ctx.strokeStyle='#e8ffb0';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-85,-8);ctx.lineTo(-20,-15);ctx.moveTo(-75,8);ctx.lineTo(-20,15);ctx.stroke();}
 if(s.kind==='giantSmash'&&s.struck&&s.age<2.4){const p=clamp((s.age-1.85)/.55);ctx.globalAlpha=1-p;ctx.strokeStyle='#d092ff';ctx.lineWidth=8;ctx.beginPath();ctx.ellipse(s.focusX,ground,30+p*210,8+p*28,0,0,7);ctx.stroke();for(let i=0;i<12;i++){const a=i/12*Math.PI*2;ctx.fillStyle=i%2?'#c4a69a':'#9d77b0';ctx.fillRect(s.focusX+Math.cos(a)*p*180,ground-Math.abs(Math.sin(a))*p*120,12,12);}}ctx.restore();}
 return{behind,special};
}
