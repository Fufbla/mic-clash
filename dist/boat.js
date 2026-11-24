import {charlesPose} from './charles.js';
export const BOAT=Object.freeze({name:'Boat',special:'Boat Run Over',kind:'boatRush',duration:2.8,range:1100,color:'#ff5757',glow:'rgba(255,65,65,.4)'});
export function createBoatSpecial(a){return {kind:BOAT.kind,owner:a.id,facing:a.facing,originX:a.x,x:a.x,duration:BOAT.duration,ttl:BOAT.duration,age:0,delay:0,active:true,visible:false,hitCount:0};}
export function endBoatSpecial(g,a,s){s.active=false;s.visible=false;s.ttl=0;if(a){a.x=Math.max(100,Math.min(1180,s.x));a.y=0;a.vy=0;a.grounded=true;a.vx=0;a.actionRemaining=0;g.setState(a,a.hp>0?'idle':'ko');}}
export function updateBoatSpecial(g,s,a,b){
 if(!a||!b){endBoatSpecial(g,a,s);return;}a.facing=s.facing;a.vx=0;
 if(s.ttl>1e-9){a.state='special';a.actionRemaining=Math.max(a.actionRemaining,s.ttl);}
 s.visible=s.age>=.65&&s.age<2.5;
 const previous=s.x;s.x=Math.max(100,Math.min(1180,s.originX+s.facing*Math.max(0,Math.min(1.6,s.age-.9))*950));
 a.x=s.x;a.y=s.age>=.3&&s.age<.65?Math.sin((s.age-.3)/.35*Math.PI)*85:0;a.vy=0;a.grounded=true;
 if(s.age>=.9&&s.age<2.5&&!s.hitCount&&(b.x-s.originX)*s.facing>=-15&&b.x>=Math.min(previous,s.x)-140&&b.x<=Math.max(previous,s.x)+140&&b.y<190){if(g.hit(a,b,48,s.kind,490,.5,b.x-s.facing)){s.hitCount++;if(b.hp>0){b.vy=580;b.grounded=false;}}}
 if(s.ttl<=1e-9)endBoatSpecial(g,a,s);
}
export function boatPose(f,s){
 if(f.state==='special'&&s)return {key:'boat',index:s.age<.3?12:s.age<.65?13:0};
 if(f.state==='punch'){const p=f.attackProgress||0;return {key:'boat',index:p<.3?8:p<.56?9:p<.87?10:0};}
 return {...charlesPose(f,null),key:'boat'};
}
export function drawBoatSpecial(ctx,s,frame,ground){
 if(!s.visible)return;const b=frame('boatVehicle',s.age<.9?0:1);if(!b)return;const z=320/b.w;
 ctx.save();ctx.translate(s.x,ground);ctx.scale(s.facing,1);ctx.globalAlpha=Math.min(1,(s.age-.65)/.12,(2.5-s.age)/.15);
 ctx.drawImage(b.image,-160,-b.h*z,320,b.h*z);
 if(s.age>=.9){ctx.strokeStyle='#96e8ff';ctx.lineWidth=3;for(let i=0;i<7;i++){const t=(s.age*2+i/7)%1;ctx.globalAlpha=(1-t)*.7;ctx.beginPath();ctx.moveTo(-125-t*150,-5);ctx.quadraticCurveTo(-150-t*150,-25-Math.sin(t*Math.PI)*30,-180-t*150,-2);ctx.stroke();}}
 ctx.restore();
}
