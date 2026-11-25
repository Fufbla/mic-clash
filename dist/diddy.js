export const DIDDY=Object.freeze({name:'Diddy',special:'Oil Barrage',kind:'diddyOilBarrage',duration:2.8,range:850,color:'#c29cff',glow:'rgba(194,156,255,.4)'});
export const OIL='diddyOilThrow';
const actions=[['idle',7],['walk',7],['punch',7],['jump',7],['hurt',7],['ko',7],['kick',5],['special',4]];
export async function loadDiddyAssets(base){
 const canvas=document.createElement('canvas');canvas.width=2100;canvas.height=2400;const g=canvas.getContext('2d');
 const read=async name=>{const r=await fetch(new URL('./assets/diddy/'+name+'.json?v=1',base));if(!r.ok)throw Error('Diddy sprites unavailable: '+name);return r.json();};
 const image=src=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=reject;im.src=src;});
 const groups=await Promise.all(actions.map(async ([name,n])=>{const src=await read(name);if(src.length!==n)throw Error('Invalid Diddy sprite count');return Promise.all(src.map(image));}));
 const frames=[];for(let row=0;row<groups.length;row++){for(let col=0;col<groups[row].length;col++){const x=col*300,y=row*300;g.drawImage(groups[row][col],x,y,300,300);frames.push({x,y,w:300,h:300,anchorX:150,anchorY:285});}}
 const [oil]=await Promise.all((await read('effect')).map(image));return {image:canvas,referenceHeight:247.5,frames,oil};
}
export function diddyPose(f){const t=Math.max(0,f.stateTime||0),p=Math.max(0,Math.min(1,f.attackProgress||0));let i=0;
 if(f.state==='special')i=47+Math.min(3,Math.floor(t/2.8*4));
 else if(f.state==='punch')i=14+Math.min(6,Math.floor(p*7));
 else if(f.state==='kick')i=42+Math.min(4,Math.floor(p*5));
 else if(f.state==='ko')i=35+Math.min(6,Math.floor(t*9));
 else if(['hurt','grabbed','beltHeld'].includes(f.state))i=28+Math.min(6,Math.floor(t*14));
 else if(f.state==='block')i=0;
 else if(!f.grounded||['jump','fall'].includes(f.state))i=21+(f.vy>0?Math.min(3,Math.floor(t*10)):Math.min(6,4+Math.floor(t*4)));
 else if(['walk','run'].includes(f.state))i=7+Math.floor(t*10)%7;
 else i=Math.floor(t*5)%7;return {key:'diddy',index:i};}
export function createOil(f){return {kind:OIL,basic:true,owner:f.id,facing:f.facing,originX:f.x,x:f.x+55*f.facing,y:f.y+145,age:0,ttl:1.05,duration:1.05,active:true,delay:0,hitCount:0};}
export function createOilBarrage(f){return {kind:DIDDY.kind,owner:f.id,facing:f.facing,originX:f.x,x:f.x,y:f.y+145,age:0,ttl:DIDDY.duration,duration:DIDDY.duration,active:true,delay:0,hitCount:0,shots:Array.from({length:5},(_,i)=>({x:f.x+50*f.facing,y:f.y+145+(i%3-1)*22,launch:.7+i*.22,hit:false}))};}
export function endOilBarrage(g,a,s){s.active=false;s.ttl=0;if(a){a.vx=0;a.actionRemaining=0;g.setState(a,a.hp>0?'idle':'ko');}}
export function updateDiddy(g,s,a,b,dt){if(!a||!b){s.active=false;s.ttl=0;return;}
 const crosses=(old,x,y)=>b.x>=Math.min(old,x)-35&&b.x<=Math.max(old,x)+35&&Math.abs(b.y+105-y)<100&&(b.x-s.originX)*s.facing>=0;
 if(s.kind===OIL){const old=s.x;s.x+=s.facing*660*dt;if(!s.hitCount&&crosses(old,s.x,s.y)&&g.hit(a,b,10,'punch',175,.22,s.originX)){s.hitCount=1;s.active=false;s.ttl=0;}if(s.ttl<=0)s.active=false;return;}
 a.facing=s.facing;a.vx=0;if(s.ttl>1e-9){a.state='special';a.actionRemaining=Math.max(a.actionRemaining,s.ttl);}
 for(const shot of s.shots){if(s.age<shot.launch||shot.hit)continue;const old=shot.x;shot.x=s.originX+s.facing*(50+(s.age-shot.launch)*720);if(crosses(old,shot.x,shot.y)&&g.hit(a,b,7,DIDDY.kind,85,.18,s.originX)){shot.hit=true;s.hitCount++;}}
 if(s.ttl<=1e-9)endOilBarrage(g,a,s);}
export function drawDiddy(ctx,s,ground,oil){if(!oil)return;ctx.save();const draw=(x,y)=>{ctx.save();ctx.translate(x,ground-y);ctx.scale(s.facing,1);ctx.drawImage(oil,-37,-17,75,34);ctx.restore();};
 if(s.kind===OIL)draw(s.x,s.y);else{if(s.age>.45&&s.age<1.75){ctx.font='900 25px sans-serif';ctx.textAlign='center';ctx.lineWidth=5;ctx.strokeStyle='#23152c';ctx.fillStyle='#fff';ctx.strokeText('TAKE THAT! TAKE THAT!',s.originX,ground-270);ctx.fillText('TAKE THAT! TAKE THAT!',s.originX,ground-270);}for(const shot of s.shots)if(s.age>=shot.launch&&!shot.hit)draw(shot.x,shot.y);}ctx.restore();}
