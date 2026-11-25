export const GUCCI=Object.freeze({name:'Gucci Mane',special:'1017! Squad Rush',kind:'gucci1017',duration:4.32,range:1100,color:'#e9be5e',glow:'rgba(233,190,94,.4)'});
export const LANES=Object.freeze([
 {index:16,entry:.85,contact:1.55,start:[-500,0],end:[-90,0],facing:1},
 {index:17,entry:.95,contact:1.70,start:[300,0],end:[90,0],facing:-1},
 {index:18,entry:1.06,contact:1.85,start:[0,-340],end:[0,-96],facing:1},
 {index:19,entry:1.15,contact:2.02,start:[55,250],end:[18,47],facing:-1}
]);
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export function gucciPose(f){const t=f.stateTime||0,p=f.attackProgress||0;let i=0;
 if(f.state==='special')i=t<.24?0:t<.48?12:t<.72?13:t<1.2?14:t<3.95?15:0;
 else if(f.state==='punch')i=p<.23?1:p<.44?4:p<.82?5:1;
 else if(f.state==='kick')i=p<.22?1:p<.4?6:p<.78?7:6;
 else if(f.state==='ko')i=t<.18?10:11;
 else if(['hurt','grabbed','beltHeld'].includes(f.state))i=10;
 else if(f.state==='block')i=8;
 else if(!f.grounded||['jump','fall'].includes(f.state))i=9;
 else if(['walk','run'].includes(f.state))i=2+Math.floor(t*9)%2;
 else i=Math.floor(t*4)%2;
 return {key:'guccimane',index:i};}
export function createGucci(f,target){return {kind:GUCCI.kind,owner:f.id,facing:f.facing,originX:f.x,x:target.x,y:target.y,age:0,ttl:GUCCI.duration,duration:GUCCI.duration,active:true,delay:0,hitCount:0,events:LANES.flatMap((l,i)=>[{at:l.contact,lane:i,done:false},{at:l.contact+.48,lane:i,done:false}]).sort((a,b)=>a.at-b.at)};}
export function endGucci(g,a,s){s.active=false;s.ttl=0;if(a){a.vx=0;a.actionRemaining=0;g.setState(a,a.hp>0?'idle':'ko');}}
export function updateGucci(g,s,a,b){if(!a||!b){s.active=false;s.ttl=0;return;}s.x=b.x;s.y=b.y;a.vx=0;a.facing=s.facing;
 if(s.ttl>1e-9){a.state='special';a.actionRemaining=Math.max(a.actionRemaining,s.ttl);}
 for(const e of s.events){if(e.done||s.age+1e-9<e.at)continue;e.done=true;
 const lane=LANES[e.lane],source=b.x+(lane.end[0]||-20);
 if(Math.abs(b.x-s.originX)<=GUCCI.range&&g.hit(a,b,6,GUCCI.kind,55,.15,source))s.hitCount++;}
 if(s.ttl<=1e-9)endGucci(g,a,s);}
export function drawGucci(ctx,s,game,ground,draw){const target=game.fighters.find(f=>f.id!==s.owner);const actor=game.fighters.find(f=>f.id===s.owner);if(!target)return;
 const t=s.age,baseY=ground-target.y;
 if(t>=.72&&t<1.35&&actor){ctx.save();ctx.font='900 36px sans-serif';ctx.textAlign='center';ctx.lineWidth=7;ctx.strokeStyle='#28192d';ctx.fillStyle='#ffe27a';ctx.strokeText('1017!',actor.x,ground-actor.y-270);ctx.fillText('1017!',actor.x,ground-actor.y-270);ctx.restore();}
 for(const l of LANES){if(t<l.entry||t>=3.65)continue;let p=clamp((t-l.entry)/(l.contact-l.entry),0,1);let q=clamp((t-2.9)/.75,0,1);p=p*(1-q);const dx=l.start[0]+(l.end[0]-l.start[0])*p,dy=l.start[1]+(l.end[1]-l.start[1])*p;const x=clamp(target.x+dx,30,1250),y=baseY+dy;const strike=Math.min(Math.abs(t-l.contact),Math.abs(t-l.contact-.48));const pulse=strike<.12?1+.12*(1-strike/.12):1;draw(l.index,x,y,l.facing,.8*pulse);}}
