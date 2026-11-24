// Authored animation timings and deterministic combat for the three new rivals.
export const GAUNTLET_FIGHTERS = Object.freeze({
  bigmumble: { kind: 'faceShot', duration: 3.2, name: 'Big Mumble', special: 'Face Shot!' },
  djbeigey: { kind: 'royce', duration: 3.8, name: 'DJ Beigey', special: 'Rolls Royce Runover' },
  nobuttons: { kind: 'prizeCrew', duration: 4.1, name: 'No Buttons', special: 'Prize Picks!' }
});
export const GAUNTLET_KINDS = Object.freeze(Object.values(GAUNTLET_FIGHTERS).map(f => f.kind));
export const FACE_SHOT = Object.freeze({ release: .82, faceHeight: 174, hoopHeight: 335 });
export const PRIZE_CREW = Object.freeze({ call: .06, enter: .5, strike: 1.55, interval: .16, hits: 8, leave: 3.02 });
const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
const mix = (a, b, t) => a + (b - a) * clamp(t);

export function createGauntletSpecial(owner, target) {
  const config = GAUNTLET_FIGHTERS[owner.type];
  return { kind: config.kind, owner: owner.id, facing: owner.facing, duration: config.duration,
    age: 0, ttl: config.duration, delay: 0, active: true, phase: 'call', hitCount: 0,
    startX: owner.x, focusX: target.x, x: owner.x, y: 205, strikeIndex: 0,
    endX: clamp(target.x + owner.facing * 245, 100, 1180),
    crew: config.kind === 'prizeCrew' ? Array.from({ length: 4 }, (_, index) => {
      const side = index % 2 ? 1 : -1;
      return { index, side, facing: -side, startX: side < 0 ? -130 : 1410,
        x: side < 0 ? -130 : 1410, y: 0, visible: false, pose: 0,
        offset: side * (index < 2 ? 166 : 82) };
    }) : [] };
}

// Swept contact retains the same hit result at low and high refresh rates.
function crossed(x0, y0, x1, y1, target, halfWidth, low, high) {
  let enter = 0, leave = 1;
  for (const [a, d, min, max] of [[x0, x1-x0, target.x-halfWidth, target.x+halfWidth],
    [y0, y1-y0, target.y+low, target.y+high]]) {
    if (Math.abs(d) < 1e-9) { if (a < min || a > max) return false; }
    else { const u=(min-a)/d,v=(max-a)/d; enter=Math.max(enter,Math.min(u,v)); leave=Math.min(leave,Math.max(u,v)); }
    if (enter > leave) return false;
  }
  return true;
}

function connect(game, s, owner, target, damage, knock, stun) {
  if (!game.hit(owner, target, damage, s.kind, knock, stun, target.x - s.facing)) return false;
  s.hitCount++; s.hitAt = s.age; s.hitX = target.x; s.hitY = target.y;
  if (s.kind === 'royce' && target.hp > 0) { target.vy = 360; target.grounded = false; }
  return true;
}

export function endGauntletSpecial(game, owner, s) {
  s.active = false; s.ttl = 0;
  for (const helper of s.crew) helper.visible = false;
  if (!owner) return;
  owner.inCar = false; owner.actionRemaining = 0; owner.vx = 0;
  owner.x = clamp(owner.x, 100, 1180);
  const target = game.fighters.find(f => f.id !== owner.id);
  if (target && Math.abs(target.x-owner.x)>2) owner.facing = target.x > owner.x ? 1 : -1;
  game.setState(owner, owner.hp > 0 ? 'idle' : 'ko');
}

export function updateGauntletSpecial(game, s, owner, target, dt) {
  if (!owner || !target) { endGauntletSpecial(game, owner, s); return; }
  const t = s.age;
  owner.facing = s.facing; owner.vx = 0;
  if (s.ttl > 1e-9) { owner.state = 'special'; owner.actionRemaining = Math.max(owner.actionRemaining, s.ttl); }
  if (s.kind === 'faceShot') {
    s.phase = t < .35 ? 'prepare' : t < FACE_SHOT.release ? 'aim' : t < 2.25 ? 'shot' : 'shrug';
    if (!s.released && t + 1e-9 >= FACE_SHOT.release) {
      s.released = true; s.focusX = target.x;
      s.originX = owner.x + s.facing * 44;
      s.flightDuration = clamp(Math.abs(s.focusX-s.originX)/850, .24, 1.4);
      game.events.push({type: 'basketballShot', fighter: owner.id});
    }
    if (s.released && !s.spent) {
      const fly = clamp((t-FACE_SHOT.release)/s.flightDuration);
      const previous = clamp((t-dt-FACE_SHOT.release)/s.flightDuration);
      const point = p => ({ x: mix(s.originX,s.focusX+s.facing*100,p),
        y: mix(205,FACE_SHOT.faceHeight,p) + Math.sin(p*Math.PI)*27 });
      const p0=point(previous),p1=point(fly); s.x=p1.x; s.y=p1.y;
      if (crossed(p0.x,p0.y,p1.x,p1.y,target,40,137,214)) {
        s.spent = true; connect(game,s,owner,target,48,230,.48);
        s.ballImpactX = target.x; s.ballImpactY = s.y; s.spentAt = t;
      }
      if (fly >= 1) { s.spent = true; s.spentAt ??= t; }
    }
  } else if (s.kind === 'royce') {
    s.phase = t < .4 ? 'call' : t < .85 ? 'arrive' : t < 1.05 ? 'enter'
      : t < 2.3 ? 'drive' : t < 2.66 ? 'exit' : 'shrug';
    const boarding = s.startX + s.facing*35;
    const previous = s.x;
    s.x = t < 1.05 ? mix(s.facing>0?-320:1600,boarding,(t-.4)/.45)
      : t < 2.66 ? mix(boarding,s.endX,(t-1.05)/1.25)
      : mix(s.endX,s.facing>0?1650:-370,(t-2.66)/.9);
    owner.inCar = t >= 1.0 && t < 2.46;
    if (owner.inCar) owner.x = clamp(s.x,100,1180);
    else if (t >= 2.46) owner.x = clamp(s.endX-s.facing*86,100,1180);
    // The arrival is cosmetic. Only the drive through the marked opponent hits.
    if (!s.checked && t >= 1.05 && t-dt <= 2.3 && crossed(previous,95,s.x,95,target,195,-40,190)) {
      s.checked = true; connect(game,s,owner,target,48,520,.5);
      game.events.push({type:'royceImpact',fighter:owner.id,hit:s.hitCount>0});
    }
  } else if (s.kind === 'prizeCrew') {
    s.phase = t < PRIZE_CREW.enter ? 'call' : t < PRIZE_CREW.strike ? 'arrive'
      : t < PRIZE_CREW.leave ? 'punch' : 'leave';
    if (!s.called && t >= PRIZE_CREW.call) {
      s.called = true; game.events.push({type:'prizePicks',fighter:owner.id});
    }
    if (!s.locked && t >= PRIZE_CREW.enter) { s.locked = true; s.focusX=target.x; }
    for (const helper of s.crew) {
      helper.visible = t >= PRIZE_CREW.enter && t < 4.02;
      const destination = s.focusX + helper.offset;
      helper.x = t < PRIZE_CREW.leave ? mix(helper.startX,destination,(t-PRIZE_CREW.enter)/.85)
        : mix(destination,helper.startX,(t-PRIZE_CREW.leave)/.86);
      helper.facing = t < PRIZE_CREW.leave ? -helper.side : helper.side;
      helper.pose = Math.floor(t*12)%2;
      helper.y = 0;
      if (t >= 1.35 && t < PRIZE_CREW.leave) {
        const next = PRIZE_CREW.strike+helper.index*PRIZE_CREW.interval;
        const cycle = t >= next+4*PRIZE_CREW.interval-.13 ? next+4*PRIZE_CREW.interval : next;
        helper.pose = t >= cycle && t < cycle+.12 ? 3 : 2;
        // The outer pair leap forward for their own contacts. Between strikes
        // the four distinct faces have separate space around the real opponent.
        if (helper.index < 2) {
          const leap=clamp((t-(cycle-.23))/.43);
          const arc=Math.sin(leap*Math.PI);
          helper.x-=helper.side*66*arc; helper.y=64*arc;
        }
      }
    }
    while (s.strikeIndex < PRIZE_CREW.hits && t+1e-9 >= PRIZE_CREW.strike+s.strikeIndex*PRIZE_CREW.interval) {
      const last = s.strikeIndex === PRIZE_CREW.hits-1;
      if (Math.abs(target.x-s.focusX) <= 72 && target.y < 175)
        connect(game,s,owner,target,6,last?380:0,last?.42:.19);
      s.strikeIndex++;
    }
  }
  if (s.ttl <= 1e-9) endGauntletSpecial(game,owner,s);
}

export function gauntletPose(f, special) {
  if (f.state === 'special' && special) {
    const t=special.age; let index;
    if (f.type==='bigmumble') index=t<.35?8:t<.66?9:t<.82?10:t<1.9?11:t<2.25?12:t<2.75?13:t<3.05?14:15;
    else if (f.type==='djbeigey') index=t<.4?8:t<.85?9:t<1.05?10:t<2.46?11:t<2.66?12:t<2.9?13:t<3.55?14:15;
    else index=t<.7?8:t<1.35?9:t<3.02?13:t<3.8?14:15;
    return { key:f.type+'Actions',index };
  }
  if (f.state==='run' && f.grounded) {
    const step=Math.floor(f.stateTime*Math.max(4,Math.min(12,Math.abs(f.vx)/23)))%8;
    return {key:f.type+'Actions',index:f.vx*f.facing<0?7-step:step};
  }
  let index=0; const p=f.attackProgress||0;
  if (f.state==='punch') index=p<.25?4:p<.5?5:p<.78?6:0;
  else if(f.state==='kick') index=p<.138?8:p<.31?9:p<.518?10:p<.69?11:p<.83?12:13;
  else if(f.state==='ko')index=15;
  else if(['hurt','grabbed','beltHeld'].includes(f.state))index=14;
  else if(f.state==='block')index=7;
  else if(!f.grounded||f.y>4)index=f.jumps>1?3:2;
  else index=Math.floor((f.stateTime||0)*2.5)%2;
  return {key:f.type,index};
}
