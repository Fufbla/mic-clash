// Three authored fighters; all presentation clocks use simulation time.
export const ASCENSION_FIGHTERS = Object.freeze({
  eynakeast: {kind:'ghostAscension', duration:4.3, name:'Eynak East', special:'Ghost Ascension'},
  goat: {kind:'goatSign', duration:2.9, name:'GOAT', special:'The Sign'},
  taytay: {kind:'travy', duration:3.6, name:'TayTay', special:'Travy!!!'}
});
export const ASCENSION_KINDS = Object.freeze(Object.values(ASCENSION_FIGHTERS).map(f=>f.kind));
export const GHOST_ASCENSION = Object.freeze({transform:.48, raise:.85, quake:1.25, summon:1.65, interval:.23, recover:3.8});
export const GOAT_SIGN = Object.freeze({sign:1.05, impact:1.35, whiteStart:1.25, whiteHold:1.35, whiteFade:1.6, whiteEnd:1.98});
export const TRAVY = Object.freeze({call:.05, enter:.65, prepare:1.38, tackle:1.6, exit:2.95});
const clamp = (v,lo=0,hi=1)=>Math.max(lo,Math.min(hi,v));
const mix=(a,b,t)=>a+(b-a)*clamp(t);

export function goatWhiteout(age) {
  return age<GOAT_SIGN.whiteHold ? clamp((age-GOAT_SIGN.whiteStart)/.1)
    : age<=GOAT_SIGN.whiteFade ? 1 : clamp((GOAT_SIGN.whiteEnd-age)/.38);
}

export function createAscensionSpecial(owner,target) {
  const c=ASCENSION_FIGHTERS[owner.type];
  return {kind:c.kind,owner:owner.id,facing:owner.facing,duration:c.duration,ttl:c.duration,
    age:0,delay:0,active:true,phase:'activate',hitCount:0,startX:owner.x,focusX:target.x,
    whiteout:0,hooded:false,ghosts:c.kind==='ghostAscension'?Array.from({length:4},(_,index)=>({index,visible:false,spent:false,x:owner.x,y:100})):[],
    helper:c.kind==='travy'?{x:owner.facing>0?-150:1430,y:0,pose:0,visible:false,facing:owner.facing}:null};
}

// Segment against an expanded hurtbox: fast summons cannot skip a contact.
function crossed(x0,y0,x1,y1,target,halfWidth,low,high) {
  let enter=0,leave=1;
  for(const[a,d,min,max]of[[x0,x1-x0,target.x-halfWidth,target.x+halfWidth],[y0,y1-y0,target.y+low,target.y+high]]){
    if(Math.abs(d)<1e-9){if(a<min||a>max)return false;}
    else {const u=(min-a)/d,v=(max-a)/d;enter=Math.max(enter,Math.min(u,v));leave=Math.min(leave,Math.max(u,v));}
    if(enter>leave)return false;
  }
  return true;
}
function connect(game,s,owner,target,damage,knock,stun,lift=0) {
  if(!game.hit(owner,target,damage,s.kind,knock,stun,target.x-s.facing))return false;
  s.hitCount++;s.hitAt=s.age;s.hitX=target.x;s.hitY=target.y;
  if(lift&&target.hp>0){target.vy=lift;target.grounded=false;}
  return true;
}
export function endAscensionSpecial(game,owner,s) {
  s.active=false;s.ttl=0;s.whiteout=0;s.hooded=false;
  for(const g of s.ghosts)g.visible=false;
  if(s.helper)s.helper.visible=false;
  if(!owner)return;
  owner.vx=0;owner.actionRemaining=0;
  game.setState(owner,owner.hp>0?'idle':'ko');
}
export function updateAscensionSpecial(game,s,owner,target,dt) {
  if(!owner||!target){endAscensionSpecial(game,owner,s);return;}
  const t=s.age;
  owner.facing=s.facing;owner.vx=0;
  if(s.ttl>1e-9){owner.state='special';owner.actionRemaining=Math.max(owner.actionRemaining,s.ttl);}
  if(s.kind==='ghostAscension') {
    s.phase=t<.48?'charge':t<.85?'transform':t<1.25?'raise':t<1.65?'quake':t<3.8?'ghosts':'recover';
    s.hooded=t>=.48&&t<3.92;
    if(!s.quaked&&t>=GHOST_ASCENSION.quake){s.quaked=true;game.events.push({type:'ghostQuake',fighter:owner.id});}
    if(!s.locked&&t>=GHOST_ASCENSION.summon){s.locked=true;s.focusX=target.x;s.focusY=target.y+115;}
    for(const g of s.ghosts){
      const launch=GHOST_ASCENSION.summon+g.index*GHOST_ASCENSION.interval;
      if(t<launch)continue;
      if(!g.launched){g.launched=true;g.originX=owner.x+s.facing*72;g.originY=105+g.index*19;
        g.flight=clamp(Math.abs(s.focusX-g.originX)/900,.25,1.12);}
      const p=clamp((t-launch)/g.flight),prev=clamp((t-dt-launch)/g.flight);
      const point=k=>({x:mix(g.originX,s.focusX+s.facing*65,k),y:mix(g.originY,s.focusY,k)+Math.sin(k*Math.PI)*(g.index%2?28:-22)});
      const a=point(prev),b=point(p);g.x=b.x;g.y=b.y;g.visible=!g.spent&&p<1;
      g.pose=g.index===0?9:g.index===1?11:g.index===2?13:9;
      if(!g.spent&&crossed(a.x,a.y,b.x,b.y,target,46,25,205)){
        g.spent=true;g.visible=false;
        connect(game,s,owner,target,12,g.index===3?340:0,g.index===3?.4:.24);
      }
      if(p>=1){g.spent=true;g.visible=false;}
    }
  } else if(s.kind==='goatSign') {
    s.phase=t<.45?'activate':t<GOAT_SIGN.sign?'raise':t<GOAT_SIGN.whiteStart?'sign':t<GOAT_SIGN.whiteEnd?'whiteout':'recover';
    s.whiteout=goatWhiteout(t);
    if(!s.fired&&t+1e-9>=GOAT_SIGN.impact){
      s.fired=true;connect(game,s,owner,target,48,420,.5,250);
      game.events.push({type:'goatWhiteout',fighter:owner.id});
    }
  } else if(s.kind==='travy') {
    s.phase=t<TRAVY.enter?'call':t<TRAVY.prepare?'arrive':t<TRAVY.tackle?'prepare':t<TRAVY.exit?'tackle':'recover';
    if(!s.called&&t>=TRAVY.call){s.called=true;game.events.push({type:'travyCall',fighter:owner.id});}
    if(!s.locked&&t>=TRAVY.enter){s.locked=true;s.focusX=target.x;}
    const h=s.helper,start=s.facing>0?-150:1430,prepare=s.focusX-s.facing*170;
    const path=time=>time<TRAVY.tackle?mix(start,prepare,(time-TRAVY.enter)/(TRAVY.prepare-TRAVY.enter))
      :mix(prepare,s.facing>0?1510:-230,(time-TRAVY.tackle)/(TRAVY.exit-TRAVY.tackle));
    const prev=path(t-dt);h.x=path(t);h.visible=t>=TRAVY.enter&&t<3.15;
    h.pose=t<TRAVY.prepare?1+Math.floor(t*12)%3:t<TRAVY.tackle?4:t<2.65?5:7;
    h.y=t>=TRAVY.tackle&&t<2.65?20:0;
    if(!s.checked&&t>=TRAVY.tackle&&t-dt<TRAVY.exit&&crossed(prev,105,h.x,105,target,88,-10,190)){
      s.checked=true;connect(game,s,owner,target,48,560,.5,300);
    }
  }
  if(s.ttl<=1e-9)endAscensionSpecial(game,owner,s);
}

export function ascensionPose(f,s) {
  if(f.state==='special'&&s){
    const t=s.age;let index=15,key=f.type+'Actions';
    if(f.type==='eynakeast') {
      if(s.hooded){key='eynakeastSupport';index=t<.66?0:t<.85?1:t<1.05?2:t<1.65?3:t<1.9?4:t<3.5?5:t<3.8?6:7;}
      else index=t<.22?8:t<.48?9:t<4.06?12:t<4.2?13:15;
    } else if(f.type==='goat')index=t<.2?8:t<.45?9:t<.75?10:t<1.05?11:t<1.35?12:t<2.1?13:t<2.5?14:15;
    else index=t<.15?8:t<.75?9:t<1.05?10:t<1.6?11:t<2.4?12:t<2.9?13:t<3.4?14:15;
    return {key,index};
  }
  if(f.state==='run'&&f.grounded){const step=Math.floor(f.stateTime*Math.max(4,Math.min(12,Math.abs(f.vx)/23)))%8;return{key:f.type+'Actions',index:f.vx*f.facing<0?7-step:step};}
  let index=0;const p=f.attackProgress||0;
  if(f.state==='punch')index=p<.25?4:p<.5?5:p<.78?6:0;
  else if(f.state==='kick')index=p<.138?8:p<.31?9:p<.518?10:p<.69?11:p<.83?12:13;
  else if(f.state==='ko')index=15;
  else if(['hurt','grabbed','beltHeld'].includes(f.state))index=14;
  else if(f.state==='block')index=7;
  else if(!f.grounded||f.y>4)index=f.jumps>1?3:2;
  else index=Math.floor((f.stateTime||0)*2.5)%2;
  return {key:f.type,index};
}
