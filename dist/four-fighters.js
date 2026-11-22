// Four new Celebrity Gauntlet fighters with deterministic, controller-independent specials.
export const FOUR_FIGHTERS=Object.freeze({
 czr:{kind:'alienStrike',duration:3.3,name:'CZR',special:'Alien Invasion'},
 shannondull:{kind:'giantSmash',duration:3.4,name:'Shannon Dull',special:'Giant Smash'},
 redrolls:{kind:'lowriderCrew',duration:4.15,name:'Red Rolls',special:'Lowrider Takeover'},
 smokelord:{kind:'coneSmash',duration:3.2,name:'Smoke Lord',special:'Giant Cone Smash'}
});
export const FOUR_KINDS=Object.freeze(Object.values(FOUR_FIGHTERS).map(v=>v.kind));
export function createFourSpecial(owner,target) {
 const c=FOUR_FIGHTERS[owner.type];
 return {kind:c.kind,owner:owner.id,facing:owner.facing,age:0,ttl:c.duration,duration:c.duration,
 active:true,delay:0,phase:'windup',hitCount:0,strikeIndex:0,focusX:target.x,startX:owner.x,
 crew:c.kind==='lowriderCrew'?Array.from({length:4},(_,i)=>({index:i,x:owner.facing>0?-220:1500,visible:false,pose:0})):[]};
}
function impact(game,s,owner,target,damage,knock,stun) {
 if(!game.hit(owner,target,damage,s.kind,knock,stun,target.x-s.facing))return false;
 s.hitCount++;s.hitAt=s.age;s.hitX=target.x;s.hitY=target.y;
 if(knock>250&&target.hp>0){target.vy=300;target.grounded=false;}return true;
}
export function endFourSpecial(game,owner,s){
 s.active=false;s.ttl=0;s.phase='ended';for(const c of s.crew)c.visible=false;
 if(owner){owner.vx=0;owner.actionRemaining=0;game.setState(owner,owner.hp>0?'idle':'ko');}
}
export function updateFourSpecial(game,s,owner,target,dt){
 if(!owner||!target){endFourSpecial(game,owner,s);return;}
 const t=s.age;owner.facing=s.facing;owner.vx=0;
 if(s.ttl>1e-9){owner.state='special';owner.actionRemaining=Math.max(owner.actionRemaining,s.ttl);}
 if(s.kind==='alienStrike'){
  s.phase=t<.48?'transform':t<1.15?'reveal':t<1.78?'leap':t<2.4?'attack':'recover';
  if(!s.hitDone&&t>=1.78){s.hitDone=true;impact(game,s,owner,target,48,430,.48);}
 }else if(s.kind==='giantSmash'){
  s.phase=t<.52?'grow':t<1.2?'raise':t<1.7?'windup':t<2.4?'smash':'recover';
  if(!s.hitDone&&t>=1.7){s.hitDone=true;impact(game,s,owner,target,48,520,.55);game.events.push({type:'giantQuake',fighter:owner.id});}
 }else if(s.kind==='lowriderCrew'){
  s.phase=t<.48?'call':t<1.35?'arrival':t<3.25?'crew':'exit';
  for(const h of s.crew){h.visible=t>.7&&t<3.5;h.x=target.x+(h.index-1.5)*75;h.pose=t>1.35?Math.floor(t*13+h.index)%3+8:Math.floor(t*8+h.index)%8;}
  while(s.strikeIndex<4&&t+1e-8>=1.4+s.strikeIndex*.43){
   impact(game,s,owner,target,12,s.strikeIndex===3?460:0,s.strikeIndex===3?.4:.18);s.strikeIndex++;
  }
 }else if(s.kind==='coneSmash'){
  s.phase=t<.5?'windup':t<1.15?'lift':t<1.8?'swing':t<2.5?'smoke':'recover';
  if(!s.hitDone&&t>=1.8){s.hitDone=true;impact(game,s,owner,target,48,410,.43);}
 }
 if(s.ttl<=1e-9)endFourSpecial(game,owner,s);
}
export function fourPose(f,s){
 if(f.state==='special'&&s){
  const t=s.age;const transformed=f.type==='czr'&&t>=.48&&t<2.6;
  const giant=f.type==='shannondull'&&t>=.52&&t<2.65;
  return {key:transformed?'czrAlien':giant?'shannondullGiant':f.type,
   index:t<.26?8:t<.7?9:t<1.15?10:t<2.25?12+Math.floor(t*3)%4:14};
 }
 if(f.state==='run'&&f.grounded)return{key:f.type,index:Math.floor(f.stateTime*Math.max(4,Math.min(12,Math.abs(f.vx)/23)))%8};
 const p=f.attackProgress||0;let index=0;
 if(f.state==='punch')index=p<.35?8:p<.75?9:10;
 else if(f.state==='kick')index=p<.28?8:p<.75?10:11;
 else if(f.state==='ko')index=11;
 else if(f.state==='hurt')index=10;
 else if(f.state==='block')index=7;
 else if(!f.grounded||f.y>4)index=f.jumps>1?3:2;
 else index=Math.floor(f.stateTime*2.5)%2;
 return{key:f.type,index};
}
