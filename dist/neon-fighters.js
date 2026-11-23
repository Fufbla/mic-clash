// Original generated sprite sheets, with simulation-clock choreography.
export const NEON_FIGHTERS=Object.freeze({
 czr:{name:'CZR',special:'Alien Transformation',kind:'alienBurst',duration:3.15,range:1200},
 shannondull:{name:'Shannon Dull',special:'The Giant Smash',kind:'giantSmash',duration:3.4,range:1200},
 smokelord:{name:'Smoke Lord',special:'The Giant Cone',kind:'giantCone',duration:2.5,range:195},
 redrolls:{name:'Red Rolls',special:'Lowrider Takeover',kind:'lowrider',duration:4.7,range:1200}
});
export const NEON_KINDS=Object.values(NEON_FIGHTERS).map(f=>f.kind);
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),mix=(a,b,t)=>a+(b-a)*clamp(t);
export function createNeonSpecial(a,b){const c=NEON_FIGHTERS[a.type];return{kind:c.kind,owner:a.id,facing:a.facing,duration:c.duration,ttl:c.duration,age:0,delay:0,active:true,phase:'charge',hitCount:0,startX:a.x,focusX:b.x,scale:1,alien:false,crew:[],car:null,bolt:null};}
function hit(g,s,a,b,damage,knock=400,lift=0){if(!g.hit(a,b,damage,s.kind,knock,.3,b.x-s.facing))return;s.hitCount++;s.hitAt=s.age;s.hitX=b.x;s.hitY=b.y;if(lift&&b.hp>0){b.vy=lift;b.grounded=false;}}
export function endNeonSpecial(g,a,s){s.active=false;s.ttl=0;s.alien=false;s.scale=1;s.bolt=null;s.car=null;s.crew.forEach(c=>c.visible=false);if(a){a.vx=0;a.actionRemaining=0;g.setState(a,a.hp>0?'idle':'ko');}}
export function updateNeonSpecial(g,s,a,b,dt){
 if(!a||!b){endNeonSpecial(g,a,s);return;}const t=s.age;a.facing=s.facing;a.vx=0;if(s.ttl>1e-9){a.state='special';a.actionRemaining=Math.max(a.actionRemaining,s.ttl);}
 if(s.kind==='alienBurst'){
  s.phase=t<.5?'charge':t<1.25?'transform':t<2.7?'blast':'recover';s.alien=t>=.5&&t<2.7;
  if(t>=1.25&&!s.fired){s.fired=true;s.bolt={x:a.x+s.facing*96,y:136,visible:true};}
  if(s.bolt?.visible){const p=s.bolt,old=p.x;p.x+=s.facing*900*dt;if(Math.min(old,p.x)<=b.x+46&&Math.max(old,p.x)>=b.x-46&&p.y>=b.y+15&&p.y<=b.y+205){hit(g,s,a,b,48,420,180);p.visible=false;}if(p.x<-150||p.x>1430||t>2.65)p.visible=false;}
 }else if(s.kind==='giantSmash'){
  s.phase=t<.55?'charge':t<1.05?'grow':t<1.85?'windup':t<2.65?'smash':'recover';s.scale=1+.75*clamp((t-.55)/.5)*clamp((3.1-t)/.45);
  if(t>=1.05&&!s.locked){s.locked=true;s.focusX=b.x;s.destination=clamp(b.x-s.facing*155,65,1215);}if(s.locked)a.x=mix(s.startX,s.destination,(t-1.05)/.45);
  if(t>=1.85&&!s.struck){s.struck=true;if(Math.abs(b.x-s.focusX)<=155&&b.y<125)hit(g,s,a,b,48,420,300);}
 }else if(s.kind==='giantCone'){
  s.phase=t<.65?'draw':t<1.05?'windup':t<1.65?'strike':'recover';if(t>=1.05&&!s.struck){s.struck=true;const d=(b.x-a.x)*s.facing;if(d>=0&&d<=195&&Math.abs(b.y-a.y)<180)hit(g,s,a,b,48,480,180);}
 }else if(s.kind==='lowrider'){
  s.phase=t<.45?'call':t<1.5?'hop':t<1.65?'doors':t<2.3?'exit':t<3.55?'crew':'depart';const park=clamp(a.x-s.facing*50,220,1060),start=s.facing>0?-300:1580;
  s.car={visible:t>=.45&&t<4.65,x:t<3.95?mix(start,park,(t-.45)/.5):mix(park,start,(t-3.95)/.7),y:t>=.95&&t<1.5?Math.sin((t-.95)/.55*Math.PI)*45:0,pose:t<.95?0:t<1.5?1:t<3.95?2:3};
  if(t>=1.65&&!s.locked){s.locked=true;s.focusX=b.x;s.crew=Array.from({length:4},(_,index)=>({index,x:park,visible:false,pose:4,facing:s.facing,hits:0}));}
  for(const c of s.crew){const launch=1.65+c.index*.08,arrival=2.14+c.index*.04,dest=s.focusX+s.facing*[-100,100,-45,45][c.index];c.visible=t>=launch&&t<3.95;c.x=t<3.55?mix(park,dest,(t-launch)/(arrival-launch)):mix(dest,park,(t-3.55)/.4);c.facing=t<3.55?(s.focusX>=c.x?1:-1):(park>=c.x?1:-1);const first=2.3+c.index*.14,second=first+.6;c.pose=t<arrival||t>=3.55?4+Math.floor(t*12)%4:t<first?8:t<first+.14?9:t<second-.15?12:t<second?10:t<second+.14?11:13;
   for(let n=0;n<2;n++)if(t>=(n?second:first)&&c.hits<=n){c.hits=n+1;if(Math.abs(b.x-s.focusX)<160&&b.y<180)hit(g,s,a,b,6,c.index===3&&n===1?400:0);}
  }
 }if(s.ttl<=1e-9)endNeonSpecial(g,a,s);
}
export function neonPose(f,s){
 if(f.state==='special'&&s){const t=s.age;let index=15;
  if(f.type==='czr')index=t<.25?8:t<.5?9:t<.85?10:t<1.15?11:t<1.4?12:t<2.3?13:t<2.7?14:15;
  if(f.type==='shannondull')index=t<.3?8:t<.55?9:t<1.05?10:t<1.45?11:t<1.85?12:t<2.65?13:t<3.1?14:15;
  if(f.type==='smokelord')index=t<.3?8:t<.65?9:t<.9?10:t<1.05?11:t<1.3?12:t<1.65?13:t<2?14:15;
  if(f.type==='redrolls')index=t<.2?8:t<.45?9:t<1?10:t<2.3?11:t<3?12:t<3.55?13:t<4.3?14:15;return{key:f.type+'Actions',index};
 }
 if(f.state==='run'&&f.grounded){const step=Math.floor(f.stateTime*Math.max(4,Math.min(12,Math.abs(f.vx)/23)))%8;return{key:f.type+'Actions',index:f.vx*f.facing<0?7-step:step};}
 let index=0;const p=f.attackProgress||0;
 if(f.state==='punch')index=p<.25?4:p<.5?5:p<.78?6:0;else if(f.state==='kick')index=p<.138?8:p<.31?9:p<.518?10:p<.69?11:p<.83?12:13;else if(f.state==='ko')index=15;else if(['hurt','grabbed','beltHeld'].includes(f.state))index=14;else if(f.state==='block')index=7;else if(!f.grounded||f.y>4)index=f.jumps>1?3:2;else index=Math.floor((f.stateTime||0)*2.5)%2;return{key:f.type,index};
}
