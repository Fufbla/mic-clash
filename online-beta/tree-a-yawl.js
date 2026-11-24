import {charlesPose} from './charles.js';
export const TREE=Object.freeze({name:'Tree-a Yawl',special:'Orb Dragon Rush',kind:'orbDragon',duration:3,range:1100,color:'#a4ee41',glow:'rgba(137,236,46,.4)'});
export function createTreeSpecial(a){return {kind:TREE.kind,owner:a.id,facing:a.facing,originX:a.x,dragonX:a.x,duration:TREE.duration,ttl:TREE.duration,age:0,delay:0,active:true,visible:false,hitCount:0};}
export function endTreeSpecial(g,a,s){s.active=false;s.visible=false;s.ttl=0;if(a){a.vx=0;a.actionRemaining=0;g.setState(a,a.hp>0?'idle':'ko');}}
export function updateTreeSpecial(g,s,a,b,dt){
 if(!a||!b){endTreeSpecial(g,a,s);return;}a.facing=s.facing;a.vx=0;
 if(s.ttl>1e-9){a.state='special';a.actionRemaining=Math.max(a.actionRemaining,s.ttl);}
 s.visible=s.age>=.9&&s.age<2.65;
 const previous=s.dragonX;s.dragonX=s.originX+s.facing*Math.max(0,s.age-1.15)*850;
 if(s.age>=1.15&&s.age<2.65&&!s.hitCount){const low=Math.min(previous,s.dragonX)-55,high=Math.max(previous,s.dragonX)+55;if(b.x>=low&&b.x<=high&&b.y<240&&g.hit(a,b,48,s.kind,500,.5,b.x-s.facing))s.hitCount++;}
 if(s.ttl<=1e-9)endTreeSpecial(g,a,s);
}
export function treePose(f,s){if(f.state==='special'&&s)return {key:'treeyawl',index:s.age<.9?12:13};return {...charlesPose(f,null),key:'treeyawl'};}
export function drawTreeSpecial(ctx,s,g,frame,ground){
 const a=g.fighters.find(f=>f.id===s.owner);if(!a)return;
 ctx.save();ctx.globalAlpha=Math.min(1,s.age/.25,s.ttl/.3);
 for(let i=0;i<7;i++){const angle=i*Math.PI*2/7+s.age*3,x=a.x+Math.cos(angle)*82,y=ground-190+Math.sin(angle)*50;ctx.beginPath();ctx.fillStyle='#ff9419';ctx.strokeStyle='#ffe77b';ctx.lineWidth=3;ctx.shadowColor='#ffb11d';ctx.shadowBlur=13;ctx.arc(x,y,11,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.shadowBlur=0;ctx.fillStyle='#e64218';ctx.fillRect(x-2,y-2,4,4);}
 ctx.restore();if(!s.visible)return;
 const attacking=s.age>=1.15,d=frame('treeyawlDragon',attacking?1:0);if(!d)return;
 const width=attacking?460:300,z=width/d.w;ctx.save();ctx.translate(s.dragonX,ground-130);ctx.scale(s.facing,1);ctx.globalAlpha=Math.min(1,(s.age-.9)/.18,(2.65-s.age)/.2);ctx.shadowColor='#92f534';ctx.shadowBlur=22;
 ctx.drawImage(d.image,attacking?-width+45:-width/2,-d.h*z/2,width,d.h*z);ctx.restore();
}
