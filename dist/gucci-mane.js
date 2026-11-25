export const GUCCI=Object.freeze({name:'Gucci Mane',special:'1017! Squad Rush',kind:'gucci1017',duration:3.15,range:1100,color:'#e9be5e',glow:'rgba(233,190,94,.4)'});
export const LANES=Object.freeze([
 {index:16,entry:.76,contact:1.22,start:[-500,0],end:[-90,0],facing:1},
 {index:17,entry:.82,contact:1.32,start:[300,0],end:[90,0],facing:-1},
 {index:18,entry:.88,contact:1.42,start:[0,-340],end:[0,-96],facing:1},
 {index:19,entry:.94,contact:1.52,start:[55,250],end:[18,47],facing:-1}
]);
export const SQUAD_TIMING=Object.freeze({repeat:.40,windup:.11,strikeDuration:.22,retreat:2.05,exitDuration:.52,runFps:24});
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export function gucciPose(f){const t=f.stateTime||0,p=f.attackProgress||0;let i=0;
 if(f.state==='special')i=t<.24?0:t<.48?12:t<.72?13:t<1.2?14:t<2.80?15:0;
 else if(f.state==='punch')i=p<.23?1:p<.44?4:p<.82?5:1;
 else if(f.state==='kick')i=p<.22?1:p<.4?6:p<.78?7:6;
 else if(f.state==='ko')i=t<.18?10:11;
 else if(['hurt','grabbed','beltHeld'].includes(f.state))i=10;
 else if(f.state==='block')i=8;
 else if(!f.grounded||['jump','fall'].includes(f.state))i=9;
 else if(['walk','run'].includes(f.state))i=2+Math.floor(t*9)%2;
 else i=Math.floor(t*4)%2;
 return {key:'guccimane',index:i};}
export function createGucci(f,target){return {kind:GUCCI.kind,owner:f.id,facing:f.facing,originX:f.x,x:target.x,y:target.y,age:0,ttl:GUCCI.duration,duration:GUCCI.duration,active:true,delay:0,hitCount:0,events:LANES.flatMap((l,i)=>[{at:l.contact,lane:i,done:false},{at:l.contact+SQUAD_TIMING.repeat,lane:i,done:false}]).sort((a,b)=>a.at-b.at)};}
export function endGucci(g,a,s){s.active=false;s.ttl=0;if(a){a.vx=0;a.actionRemaining=0;g.setState(a,a.hp>0?'idle':'ko');}}
export function updateGucci(g,s,a,b){if(!a||!b){s.active=false;s.ttl=0;return;}s.x=b.x;s.y=b.y;a.vx=0;a.facing=s.facing;
 if(s.ttl>1e-9){a.state='special';a.actionRemaining=Math.max(a.actionRemaining,s.ttl);}
 for(const e of s.events){if(e.done||s.age+1e-9<e.at)continue;e.done=true;
 const lane=LANES[e.lane],source=b.x+(lane.end[0]||-20);
 if(Math.abs(b.x-s.originX)<=GUCCI.range&&g.hit(a,b,6,GUCCI.kind,55,.15,source))s.hitCount++;}
 if(s.ttl<=1e-9)endGucci(g,a,s);}
// Each member keeps its approved artwork. Generate independent full-body
// frames once from that artwork; the head stays intact and the limbs articulate.
const squadCache=new WeakMap();
const smooth=(a,b,x)=>{const k=clamp((x-a)/(b-a),0,1);return k*k*(3-2*k);};
const cycles={run:[0,.866,.866,0,-.866,-.866],strike:[-.36,-.2,.55,1,.48,0],air:[-.65,.35,1,.35],guard:[0,.24,0,-.24]};
export function squadSprite(sprite,pose,step){
 if(!sprite?.image)return sprite;
 const seq=cycles[pose]||cycles.guard;
 const k=((step%seq.length)+seq.length)%seq.length;
 let bank=squadCache.get(sprite.image);if(!bank){bank=new Map();squadCache.set(sprite.image,bank);}
 const id=pose+':'+k;if(bank.has(id))return bank.get(id);
 const w=sprite.w,h=sprite.h;
 const c=document.createElement('canvas');c.width=w;c.height=h;
 const g=c.getContext('2d',{willReadFrequently:true});
 g.drawImage(sprite.image,0,0);
 const src=g.getImageData(0,0,w,h),out=g.createImageData(w,h);
 out.data.set(src.data);
 const v=seq[k],run=pose==='run',strike=pose==='strike',air=pose==='air';
 const stride=run? v*29:air? v*23: strike? -v*8:v*7;
 const swing=run? -v*18:air? v*17:strike? v*44:v*5;
 const legLift=run? v*14:air? v*16:0;
 const sx=w/400,sy=h/400;
 // Inverse mesh deformation: independent opposing leg and arm motion,
 // with a broad, smoothly weighted shoulder/fist extension on impact.
 const xSide=new Float32Array(w),xFront=new Float32Array(w);
 for(let x=0;x<w;x++){const u=x/sx;xSide[x]=2*smooth(158,242,u)-1;xFront[x]=smooth(178,265,u);}
 for(let y=Math.floor(174*sy);y<h;y++){
  const yy=y/sy;
  const leg=smooth(281,355,yy);
  const arm=smooth(185,228,yy)*(1-smooth(273,308,yy));
  const trunk=smooth(175,225,yy)*(1-smooth(275,330,yy));
  for(let x=Math.floor(25*sx);x<Math.min(w,Math.ceil(385*sx));x++){
   const side=xSide[x],front=xFront[x];
   const dx=(leg*stride*side+arm*swing*(strike?front:side)+trunk*(strike?5*v:0))*sx;
   const dy=(leg*legLift*side-arm*(strike?12*v*front:run?7*v*side:air?12*v:0))*sy;
   const xx=x-dx,yy2=y-dy,dst=(y*w+x)*4;
   if(xx<0||yy2<0||xx>=w-1||yy2>=h-1){out.data[dst]=out.data[dst+1]=out.data[dst+2]=out.data[dst+3]=0;continue;}
   const x0=Math.floor(xx),y0=Math.floor(yy2),fx=xx-x0,fy=yy2-y0;
   const a=(y0*w+x0)*4,b=a+4,d=a+w*4,e=d+4;
   for(let j=0;j<4;j++)out.data[dst+j]=(src.data[a+j]*(1-fx)+src.data[b+j]*fx)*(1-fy)+(src.data[d+j]*(1-fx)+src.data[e+j]*fx)*fy;
  }
 }
 g.putImageData(out,0,0);
 const result={...sprite,image:c};bank.set(id,result);return result;
}
export function warmSquadSprites(getFrame){
 for(const l of LANES){const s=getFrame(l.index);if(!s)continue;
  for(const [pose,seq] of Object.entries(cycles))for(let i=0;i<seq.length;i++)squadSprite(s,pose,i);
 }
}
export function squadAction(t,l){
 const local=t-l.entry;
 if(t<l.contact-SQUAD_TIMING.windup)return {pose:l.index===18?'air':'run',step:Math.floor(local*SQUAD_TIMING.runFps)};
 for(const contact of [l.contact,l.contact+SQUAD_TIMING.repeat]){
  const p=(t-contact+SQUAD_TIMING.windup)/SQUAD_TIMING.strikeDuration;
  if(p>=0&&p<1)return {pose:'strike',step:Math.min(5,Math.floor(p*6))};
 }
 if(t>=SQUAD_TIMING.retreat)return {pose:l.index===18?'air':'run',step:Math.floor((t-SQUAD_TIMING.retreat)*SQUAD_TIMING.runFps)};
 return {pose:'guard',step:Math.floor(local*16)};
}
export function drawGucci(ctx,s,game,ground,draw){
 const target=game.fighters.find(f=>f.id!==s.owner);const actor=game.fighters.find(f=>f.id===s.owner);if(!target)return;
 const t=s.age,baseY=ground-target.y;
 if(t>=.72&&t<1.35&&actor){ctx.save();ctx.font='900 36px sans-serif';ctx.textAlign='center';ctx.lineWidth=7;ctx.strokeStyle='#28192d';ctx.fillStyle='#ffe27a';ctx.strokeText('1017!',actor.x,ground-actor.y-270);ctx.fillText('1017!',actor.x,ground-actor.y-270);ctx.restore();}
 for(const l of LANES){
  if(t<l.entry||t>=SQUAD_TIMING.retreat+SQUAD_TIMING.exitDuration)continue;
  const entry=clamp((t-l.entry)/(l.contact-l.entry),0,1),exit=clamp((t-SQUAD_TIMING.retreat)/SQUAD_TIMING.exitDuration,0,1);
  const p=entry*(1-exit), action=squadAction(t,l);
  let dx=l.start[0]+(l.end[0]-l.start[0])*p,dy=l.start[1]+(l.end[1]-l.start[1])*p;
  // Strike lunges are synchronized to the existing two contact events.
  const nearest=Math.min(Math.abs(t-l.contact),Math.abs(t-l.contact-SQUAD_TIMING.repeat));
  const impact=Math.max(0,1-nearest/.085);
  const toward=l.end[0]<0?1:l.end[0]>0?-1:l.facing;
  if(action.pose==='strike')dx+=toward*impact*16;
  if(l.index===18&&t>=l.contact){
   const landing=clamp((t-l.contact)/.18,0,1)*(1-exit);dy+=83*landing;dx-=38*landing;
  }
  if(action.pose==='run')dy-=Math.abs(Math.sin((t-l.entry)*Math.PI*12))*5;
  const x=clamp(target.x+dx,30,1250),y=baseY+dy;
  const face=t>=SQUAD_TIMING.retreat?-l.facing:l.facing;
  const depth=l.index===19?1+0.13*(1-entry):1;
  draw(l.index,x,y,face,.8*depth,action.pose,action.step);
 }
}
