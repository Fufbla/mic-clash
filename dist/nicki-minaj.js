export const NICKI=Object.freeze({name:'Nicki Minaj',special:'Barbie Squad',kind:'barbieSquad',duration:3.35,range:1100,color:'#ff51ae',glow:'rgba(255,45,160,.45)'});
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export const DOLL_LANES=Object.freeze(Array.from({length:6},(_,i)=>{
 const face=i%2===0?1:-1,contact=0.98+i*.35;
 return {from:[-face*370,0],to:[-face*(i%3===2?92:105),0],entry:contact-.48,contact,face,air:i===2||i===3};
}));
export const NICKI_MOTION=Object.freeze({"hurt":[30,32,33,39],"heavyHurt":[31,32,33,39],"airHurt":[37,31,33],"block":[34],"jump":[35,36],"fall":[36,37,39],"land":[38,39,0],"ko":[40,41,42,43,44],"getup":[45,39,0]});
const poseAt=(name,t,fps=18)=>{const seq=NICKI_MOTION[name];return seq[Math.min(seq.length-1,Math.max(0,Math.floor(t*fps)))];};
const poseProgress=(name,p)=>{const seq=NICKI_MOTION[name];return seq[Math.min(seq.length-1,Math.max(0,Math.floor(clamp(p,0,1)*seq.length)))];};
export function nickiPose(f){
 const t=f.stateTime||0,p=f.attackProgress||0;let index=0;
 if(f.state==='ko'||f.hp===0)index=poseAt('ko',t,8);
 else if(['hurt','grabbed','beltHeld'].includes(f.state)){
  const span=Math.max(.12,f.nickiHurtSpan||.26),progress=t/span;
  const heavy=f.nickiHurtHeavy||f.state!=='hurt';
  if(f.grounded===false)index=poseProgress('airHurt',progress);
  else if(heavy&&span>=.42&&progress>=.65)index=poseProgress('getup',(progress-.65)/.35);
  else index=poseProgress(heavy?'heavyHurt':'hurt',heavy&&span>=.42?progress/.65:progress);
 }
 else if(f.state==='special')index=26+Math.min(3,Math.floor(t/.15));
 else if(f.state==='punch')index=nickiSlapIndex(p);
 else if(f.state==='kick')index=20+Math.min(5,Math.floor(p*6));
 else if(f.state==='block')index=NICKI_MOTION.block[0];
 else if(f.grounded===false||['jump','fall'].includes(f.state)){
  index=(f.vy||0)<-25||f.state==='fall'?poseProgress('fall',clamp((-(f.vy||0)-25)/500,0,1)):poseAt('jump',t,18);
 }
 else if((f.nickiLandRemaining||0)>0)index=poseProgress('land',1-f.nickiLandRemaining/.22);
 else if(['walk','run'].includes(f.state)){const k=Math.floor(t*10)%12;index=3+(f.vx*f.facing<0?11-k:k);}
 else index=Math.floor(t*5)%3;
 return {key:'nickiminaj',index};
}
// The match simulation can freeze immediately at zero HP. This clock lets
// the illustrated knockout finish visually without delaying the match rules.
export function nickiDefeatPose(f,game,age){
 if(f.state==='ko'||f.hp===0||(game.over&&game.winner!=='draw'&&game.winner&&game.winner!==f.id)){
  return nickiPose({...f,state:'ko',stateTime:Math.max(f.state==='ko'?f.stateTime||0:0,age||0)});
 }
 return nickiPose(f);
}
export function createNicki(f,b){return {kind:NICKI.kind,owner:f.id,facing:f.facing,originX:f.x,x:b.x,y:b.y,age:0,ttl:NICKI.duration,duration:NICKI.duration,active:true,delay:0,hitCount:0,strikeIndex:0};}
export function endNicki(g,a,s){s.active=false;s.ttl=0;if(a){a.vx=0;a.actionRemaining=0;g.setState(a,a.hp>0?'idle':'ko');}}
export function updateNicki(g,s,a,b){
 if(!a||!b){endNicki(g,a,s);return;}
 a.vx=0;a.facing=s.facing;s.x=b.x;s.y=b.y;
 if(s.ttl>1e-9){a.state='special';a.actionRemaining=Math.max(a.actionRemaining,s.ttl);}
 while(s.strikeIndex<DOLL_LANES.length&&s.age+1e-9>=DOLL_LANES[s.strikeIndex].contact){
  const l=DOLL_LANES[s.strikeIndex++];if(Math.abs(b.x-s.originX)<=NICKI.range&&g.hit(a,b,8,s.kind,35,.18,b.x+l.to[0]))s.hitCount++;
 }
 if(s.ttl<=1e-9)endNicki(g,a,s);
}
// A short, independently animated attack pass; never park the whole squad on the target.
export function dollAction(t,l){
 if(t<l.entry||t>=l.contact+.32)return null;
 const age=t-l.entry,delta=t-l.contact;
 if(delta<-.15)return {pose:'run',step:Math.floor(age*24),phase:'entry',p:clamp(age/.33,0,1)};
 if(delta<.08)return {pose:l.air&&delta<-.045?'air':'strike',step:l.air&&delta<-.045?Math.floor((delta+.15)*36):Math.min(5,Math.max(0,Math.floor((delta+.15)/.23*6))),phase:'attack',p:clamp((delta+.15)/.23,0,1)};
 return {pose:'run',step:Math.floor((delta-.08)*24),phase:'exit',p:clamp((delta-.08)/.24,0,1)};
}
export function drawNicki(ctx,s,g,ground,draw){
 const b=g.fighters.find(f=>f.id!==s.owner);if(!b)return;
 const t=s.age;
 DOLL_LANES.forEach((l,i)=>{
  const a=dollAction(t,l);if(!a)return;
  const delta=t-l.contact,impact=Math.max(0,1-Math.abs(delta)/.085);
  const near=b.x+l.to[0],far=b.x+l.from[0],ease=p=>p*p*(3-2*p);
  let x,y=ground,face=l.face,alpha=1;
  if(a.phase==='entry'){
   x=far+(near-far)*ease(a.p);
   y-=Math.abs(Math.sin((t-l.entry)*24))*5;
   alpha=Math.min(1,(t-l.entry)/.08);
  }else if(a.phase==='attack'){
   x=near+l.face*impact*28;
   if(l.air)y-=Math.sin(a.p*Math.PI)*55+Math.min(Math.max(b.y||0,0),75)*Math.sin(a.p*Math.PI);
  }else{
   x=near+(far-near)*ease(a.p);face=-face;
   y-=Math.abs(Math.sin((delta-.08)*24))*5;
   alpha=Math.min(1,(1-a.p)*3);
  }
  draw(i,x,y,face,impact,a.pose,a.step,alpha);
  if(impact>.1){ctx.save();ctx.globalAlpha=impact*.65;ctx.strokeStyle='#ff7cce';ctx.lineWidth=3;ctx.beginPath();ctx.arc(b.x,ground-(b.y||0)-100,14+15*(1-impact),0,Math.PI*2);ctx.stroke();ctx.restore();}
 });
}

// Use the original purse-carrying stance for windup/recovery, and the corrected
// full-body strike artwork for contact. Never overlay a second striking arm.
export function nickiSlapIndex(p){return p<.24?15:p<.70?17:19;}
