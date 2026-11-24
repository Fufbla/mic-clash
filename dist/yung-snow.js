import {charlesPose} from './charles.js';
export const SNOW=Object.freeze({name:'Yung Snow',special:'Blizzard Snowmen',kind:'snowmen',duration:3.5,range:1100,color:'#9eeaff',glow:'rgba(120,215,255,.4)'});
export function createSnowSpecial(a){return {kind:SNOW.kind,owner:a.id,facing:a.facing,originX:a.x,duration:SNOW.duration,ttl:SNOW.duration,age:0,delay:0,active:true,hitCount:0,men:Array.from({length:4},(_,i)=>({launch:.8+i*.26,x:a.x,hit:false,visible:false}))};}
export function endSnowSpecial(g,a,s){s.active=false;s.ttl=0;for(const m of s.men)m.visible=false;if(a){a.vx=0;a.actionRemaining=0;g.setState(a,a.hp>0?'idle':'ko');}}
export function updateSnowSpecial(g,s,a,b){
 if(!a||!b){endSnowSpecial(g,a,s);return;}a.facing=s.facing;a.vx=0;if(s.ttl>1e-9){a.state='special';a.actionRemaining=Math.max(a.actionRemaining,s.ttl);}
 for(const [i,m] of s.men.entries()){const t=s.age-m.launch,prev=m.x;m.x=s.originX+s.facing*Math.max(0,t)*950;m.visible=t>=0&&t<1.45;
 if(m.visible&&!m.hit&&(b.x-s.originX)*s.facing>=-15&&b.x>=Math.min(prev,m.x)-50&&b.x<=Math.max(prev,m.x)+50&&b.y<200&&g.hit(a,b,12,s.kind,i===3?380:70,.2,b.x-s.facing)){m.hit=true;s.hitCount++;}}
 if(s.ttl<=1e-9)endSnowSpecial(g,a,s);
}
export function createSnowball(a){return {kind:'lowSnowball',basic:true,owner:a.id,facing:a.facing,x:a.x+45*a.facing,age:0,ttl:.85,delay:0,active:true};}
export function updateSnowball(g,s,a,b,dt){const prev=s.x;s.x+=s.facing*700*dt;if(!a||!b||a.hp<=0){s.active=false;s.ttl=0;return;}if(b.y<65&&b.x>=Math.min(prev,s.x)-24&&b.x<=Math.max(prev,s.x)+24){g.hit(a,b,15,'kick',230,.22,s.x-s.facing*30);s.active=false;s.ttl=0;}if(s.ttl<=1e-9)s.active=false;}
export function snowPose(f,s){if(f.state==='special'&&s)return {key:'yungsnow',index:s.age<.8?12:13};return {...charlesPose(f,null),key:'yungsnow'};}
export function drawSnowSpecial(ctx,s,frame,ground){
 if(s.kind==='lowSnowball'){ctx.save();ctx.translate(s.x,ground-22);ctx.rotate(s.age*12*s.facing);ctx.fillStyle='#f3fcff';ctx.strokeStyle='#9acfe8';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,22,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#b5def0';ctx.beginPath();ctx.arc(-7,-5,5,0,Math.PI*2);ctx.fill();ctx.restore();return;}
 for(const [i,m] of s.men.entries()){if(!m.visible)continue;const b=frame('snowmen',Math.floor((s.age-m.launch)*9)%2);if(!b)continue;const z=150/b.h;ctx.save();ctx.translate(m.x,ground-i%2*8);ctx.scale(s.facing,1);ctx.globalAlpha=Math.min(1,(s.age-m.launch)*7,Math.max(0,(1.45-s.age+m.launch)*5));ctx.drawImage(b.image,-b.w*z/2,-b.h*z,b.w*z,b.h*z);ctx.restore();}
}
export function drawBlizzard(ctx,s,width,height){ctx.save();ctx.globalAlpha=Math.min(1,s.age/.5,s.ttl/.5);ctx.fillStyle='rgba(145,205,240,.12)';ctx.fillRect(0,0,width,height);ctx.strokeStyle='rgba(235,251,255,.8)';ctx.lineWidth=2;for(let i=0;i<150;i++){const x=((i*137.5+s.age*320)%width+width)%width,y=(i*79+s.age*180)%height;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-6-i%6,y+5+i%5);ctx.stroke();}ctx.restore();}
