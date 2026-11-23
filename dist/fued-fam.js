import { charlesPose } from './charles.js';
export const FUED = Object.freeze({name:'Feud Fam', special:'The Board Drop', kind:'boardDrop', duration:2.75, range:1200, color:'#b58aff', glow:'rgba(170,85,255,.4)'});
export function createFuedSpecial(a,b){return {kind:FUED.kind,owner:a.id,facing:a.facing,duration:FUED.duration,ttl:FUED.duration,age:0,delay:0,active:true,phase:'point',focusX:b.x,boardY:310,visible:false,struck:false,hitCount:0};}
export function endFuedSpecial(g,a,s){s.active=false;s.ttl=0;s.visible=false;if(a){a.vx=0;a.actionRemaining=0;g.setState(a,a.hp>0?'idle':'ko');}}
export function updateFuedSpecial(g,s,a,b){
 if(!a||!b){endFuedSpecial(g,a,s);return;}
 const t=s.age;a.facing=s.facing;a.vx=0;
 if(s.ttl>1e-9){a.state='special';a.actionRemaining=Math.max(a.actionRemaining,s.ttl);}
 s.phase=t<.65?'point':t<1.1?'appear':t<1.55?'fall':t<2.35?'impact':'recover';
 s.visible=t>=.65&&t<2.6;
 if(t>=.65&&!s.locked){s.locked=true;s.focusX=b.x;}
 const fall=Math.max(0,Math.min(1,(t-1.1)/.45));s.boardY=310*(1-fall*fall);
 if(t+1e-9>=1.55&&!s.struck){s.struck=true;if(Math.abs(b.x-s.focusX)<190&&b.y<240){if(g.hit(a,b,48,s.kind,390,.55,b.x-s.facing))s.hitCount++;}}
 if(s.ttl<=1e-9)endFuedSpecial(g,a,s);
}
export function fuedPose(f,s){
 if(f.state==='special'&&s)return {key:'fuedfam',index:s.age<.65?12:s.age<1.1?13:s.age<1.65?14:7};
 return {...charlesPose(f,null),key:'fuedfam'};
}
export function drawFuedBoard(ctx,s,frame,ground){
 if(!s.visible)return;const b=frame('fuedfamBoard',0);if(!b)return;
 const z=350/b.w,fade=s.age<1.1?Math.min(1,(s.age-.65)/.2):Math.min(1,s.ttl/.4);
 ctx.save();ctx.globalAlpha=fade;ctx.translate(s.focusX,ground-s.boardY);
 ctx.shadowColor='#7b6bff';ctx.shadowBlur=s.phase==='impact'?10:25;
 ctx.drawImage(b.image,-b.w*z/2,-b.h*z,b.w*z,b.h*z);ctx.restore();
 if(s.struck&&s.age<2.2){const p=(s.age-1.55)/.65;ctx.save();ctx.globalAlpha=Math.max(0,1-p);ctx.strokeStyle='#ffda6d';ctx.lineWidth=6;ctx.beginPath();ctx.ellipse(s.focusX,ground-3,50+p*230,10+p*35,0,0,Math.PI*2);ctx.stroke();for(let i=0;i<14;i++){const angle=i/14*Math.PI*2;ctx.fillStyle=i%2?'#b1a3db':'#ffdc83';ctx.fillRect(s.focusX+Math.cos(angle)*p*220,ground-Math.abs(Math.sin(angle))*p*110,9,9);}ctx.restore();}
}
