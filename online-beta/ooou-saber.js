import {charlesPose} from './charles.js';
export const SABER=Object.freeze({name:'Ooou Saber',special:'Jelly Saber Strike',kind:'jellySaber',duration:2.35,range:340,color:'#f454ff',glow:'rgba(238,65,255,.4)'});
export function createSaberSpecial(a){return {kind:SABER.kind,owner:a.id,facing:a.facing,duration:SABER.duration,ttl:SABER.duration,age:0,delay:0,active:true,struck:false,hitCount:0,phase:'pouch'};}
export function endSaberSpecial(g,a,s){s.active=false;s.ttl=0;if(a){a.vx=0;a.actionRemaining=0;g.setState(a,a.hp>0?'idle':'ko');}}
export function updateSaberSpecial(g,s,a,b){
 if(!a||!b){endSaberSpecial(g,a,s);return;}a.facing=s.facing;a.vx=0;
 if(s.ttl>1e-9){a.state='special';a.actionRemaining=Math.max(a.actionRemaining,s.ttl);}
 s.phase=s.age<.55?'pouch':s.age<1.05?'draw':s.age<1.65?'strike':'recover';
 if(s.age+1e-9>=1.2&&!s.struck){s.struck=true;const d=(b.x-a.x)*s.facing;if(d>=-15&&d<=SABER.range&&Math.abs(b.y-a.y)<195&&g.hit(a,b,48,s.kind,480,.45,b.x-s.facing)){s.hitCount++;if(b.hp>0){b.vy=210;b.grounded=false;}}}
 if(s.ttl<=1e-9)endSaberSpecial(g,a,s);
}
export function saberPose(f,s){if(f.state==='special'&&s)return {key:'ooousaber',index:s.age<.55?12:s.age<1.05?13:s.age<1.65?14:15};return {...charlesPose(f,null),key:'ooousaber'};}
export function drawSaberSlash(ctx,s,g,ground){
 const a=g.fighters.find(f=>f.id===s.owner);if(!a||s.age<1.05||s.age>1.7)return;
 const p=Math.max(0,Math.min(1,(s.age-1.05)/.65));ctx.save();ctx.translate(a.x,ground-a.y-115);ctx.scale(s.facing,1);ctx.globalAlpha=Math.sin(p*Math.PI)*.8;
 ctx.strokeStyle='#ef46ff';ctx.shadowColor='#f43fff';ctx.shadowBlur=25;ctx.lineWidth=18;ctx.beginPath();ctx.ellipse(110,0,225,72,-.18,-1.2,1.1);ctx.stroke();ctx.strokeStyle='#ffe6ff';ctx.lineWidth=4;ctx.stroke();ctx.restore();
}
