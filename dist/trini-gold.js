import {charlesPose} from './charles.js';
export const TRINI=Object.freeze({name:'Trini-Gold',special:'Chain Barrage',kind:'goldChains',duration:3.15,range:1100,color:'#ffd05c',glow:'rgba(255,194,60,.4)'});
export function createTriniSpecial(a){return {kind:TRINI.kind,owner:a.id,facing:a.facing,originX:a.x,duration:TRINI.duration,ttl:TRINI.duration,age:0,delay:0,active:true,hitCount:0,chains:Array.from({length:6},(_,i)=>({launch:.75+i*.18,x:a.x+a.facing*65,hit:false,visible:false,height:95+(i%3)*30}))};}
export function endTriniSpecial(g,a,s){s.active=false;s.ttl=0;for(const c of s.chains)c.visible=false;if(a){a.vx=0;a.actionRemaining=0;g.setState(a,a.hp>0?'idle':'ko');}}
export function updateTriniSpecial(g,s,a,b){
 if(!a||!b){endTriniSpecial(g,a,s);return;}a.facing=s.facing;a.vx=0;
 if(s.ttl>1e-9){a.state='special';a.actionRemaining=Math.max(a.actionRemaining,s.ttl);}
 for(const [i,c] of s.chains.entries()){
  const elapsed=s.age-c.launch,previous=c.x;c.x=s.originX+s.facing*(65+Math.max(0,elapsed)*1200);c.visible=elapsed>=0&&elapsed<1.05;
  if(c.visible&&!c.hit&&b.x>=Math.min(previous,c.x)-24&&b.x<=Math.max(previous,c.x)+24&&b.y<190){if(g.hit(a,b,8,s.kind,i===5?360:65,.18,b.x-s.facing)){c.hit=true;s.hitCount++;}}
 }
 if(s.ttl<=1e-9)endTriniSpecial(g,a,s);
}
export function triniPose(f,s){
 if(f.state==='special'&&s)return {key:'trinigold',index:s.age<.35?12:s.age<.75?13:s.age<2.6?14:15};
 if(f.state==='punch'){const p=f.attackProgress||0;return {key:'trinigold',index:p<.32?8:p<.56?9:p<.86?10:0};}
 return {...charlesPose(f,null),key:'trinigold'};
}
function chain(ctx,x,y,length,angle=0){
 ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.shadowColor='#ffcc40';ctx.shadowBlur=6;
 for(let n=0;n<length;n+=12){ctx.beginPath();ctx.ellipse(n,0,8,n%24?3:5,0,0,Math.PI*2);ctx.strokeStyle='#966116';ctx.lineWidth=4;ctx.stroke();ctx.strokeStyle='#ffe780';ctx.lineWidth=2;ctx.stroke();}ctx.restore();
}
export function drawTriniWhip(ctx,f,ground){
 if(f.type!=='trinigold'||f.state!=='punch')return;const p=f.attackProgress||0;if(p<.12||p>.86)return;
 const reach=p<.32?65+180*(p-.12)/.2:p<.56?245:245-180*(p-.56)/.3;
 ctx.save();ctx.translate(f.x,ground-f.y-112);ctx.scale(f.facing,1);chain(ctx,65,0,reach-65,p<.32?-.45*(1-(p-.12)/.2):0);ctx.restore();
}
export function drawTriniSpecial(ctx,s,ground){
 ctx.save();ctx.globalAlpha=Math.min(1,s.ttl/.25);
 for(const c of s.chains){if(!c.visible)continue;ctx.save();ctx.translate(c.x,ground-c.height);ctx.scale(s.facing,1);chain(ctx,-180,0,180);ctx.fillStyle='#fff1ad';ctx.beginPath();ctx.moveTo(12,0);ctx.lineTo(-5,-7);ctx.lineTo(-2,0);ctx.lineTo(-5,7);ctx.closePath();ctx.fill();ctx.restore();}ctx.restore();
}
