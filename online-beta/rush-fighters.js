// Shared simulation/animation timings. Coordinates use height above the stage.
export const RUSH_FIGHTERS = Object.freeze({
  quickfast: { kind: 'quickRush', duration: 2.5, name: 'Quick Fast', special: 'Quick Fast Rush' },
  sassyt: { kind: 'slime', duration: 3.5, name: 'Sassy T', special: 'SLIIIIME!' },
  jminors: { kind: 'chase', duration: 3.8, name: 'J Minors', special: 'The Chase' }
});
export const RUSH_KINDS = Object.freeze(Object.values(RUSH_FIGHTERS).map(f => f.kind));
const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
const mix = (a, b, t) => a + (b - a) * clamp(t);
export const SLIME_RELEASE = .85;

export function createRushSpecial(f, target) {
  const c = RUSH_FIGHTERS[f.type];
  return { kind: c.kind, owner: f.id, facing: f.facing, age: 0, ttl: c.duration,
    duration: c.duration, active: true, delay: 0, phase: 'prepare', hitCount: 0,
    startX: f.x, focusX: target.x, x: f.x, y: 140, locked: false,
    endX: clamp(f.x + f.facing * Math.max(530, Math.abs(target.x - f.x) + 230), 100, 1180),
    chaserX: f.x - f.facing * 190, chaserPose: 0 };
}

function hit(game, s, owner, target, knock = 450) {
  const connected = game.hit(owner, target, 48, s.kind, knock, .48, target.x - s.facing);
  if (connected) {
    s.hitCount++; s.hitAt = s.age; s.hitX = target.x; s.hitY = target.y;
    if (s.kind !== 'slime' && target.hp > 0) { target.vy = 300; target.grounded = false; }
  }
  return connected;
}

// A swept segment against the fighter's expanded rectangle, avoiding skipped contacts.
function crossed(x0, y0, x1, y1, target, halfWidth = 38, low = 0, high = 200) {
  let enter = 0, leave = 1;
  for (const [a, d, min, max] of [[x0, x1-x0, target.x-halfWidth, target.x+halfWidth],
    [y0, y1-y0, target.y+low, target.y+high]]) {
    if (Math.abs(d) < 1e-9) { if (a < min || a > max) return false; }
    else { const u=(min-a)/d,v=(max-a)/d;enter=Math.max(enter,Math.min(u,v));leave=Math.min(leave,Math.max(u,v)); }
    if (enter > leave) return false;
  }
  return true;
}

export function updateRushSpecial(game, s, owner, target, dt) {
  if (!owner || !target) { s.active = false; return; }
  const t = s.age;
  owner.facing = s.facing;
  if (s.ttl > 1e-9) { owner.state = 'special'; owner.actionRemaining = Math.max(owner.actionRemaining, s.ttl); }
  if (s.kind === 'quickRush') {
    const previous = s.x;
    s.phase = t < .42 ? 'charge' : t < 1.47 ? 'rush' : t < 1.86 ? 'skid' : 'proud';
    s.x = mix(s.startX, s.endX, (t - .42) / 1.05);
    owner.x = s.x; owner.vx = 0;
    if (!s.checked && t >= .42 && t-dt <= 1.47 && crossed(previous, 100, s.x, 100, target, 70, -30, 190)) {
      s.checked = true; hit(game, s, owner, target, 520);
    }
  } else if (s.kind === 'slime') {
    s.phase = t < SLIME_RELEASE ? 'purse' : s.hitCount ? 'coat' : t < 2.3 ? 'throw' : 'recover';
    if (t + 1e-9 >= SLIME_RELEASE && !s.released) {
      s.released = true; s.originX = owner.x + s.facing * 90; s.x = s.originX;
      game.events.push({ type: 'slimeThrow', fighter: owner.id });
    }
    if (s.released && !s.spent) {
      const fly = Math.max(0, t - SLIME_RELEASE), previous = Math.max(0, t-dt-SLIME_RELEASE);
      const x0 = s.originX + s.facing * 820 * previous;
      const y0 = 140 + Math.sin(Math.min(1, previous/1.4) * Math.PI) * 26;
      s.x = s.originX + s.facing * 820 * fly;
      s.y = 140 + Math.sin(Math.min(1, fly/1.4) * Math.PI) * 26;
      if (crossed(x0,y0,s.x,s.y,target,64,-12,225)) {
        s.spent = true; hit(game,s,owner,target,160);
      }
      if (fly >= 1.4 || s.x < -80 || s.x > 1360) s.spent = true;
    }
  } else if (s.kind === 'chase') {
    if (!s.locked && t >= .4) {
      s.locked = true; s.focusX = target.x;
      s.endX = clamp(s.focusX + s.facing * 245,100,1180);
    }
    s.phase = t < .4 ? 'panic' : t < 1.55 ? 'run' : t < 1.78 ? 'windup'
      : t < 2.12 ? 'swing' : t < 2.85 ? 'follow' : 'recover';
    owner.x = mix(s.startX, s.endX, (t-.4)/1.1); owner.vx = 0;
    const start = s.startX - s.facing * 190, strikeX = s.focusX - s.facing * 80;
    s.chaserX = t < 1.55 ? mix(start,strikeX,(t-.48)/1.07)
      : t < 2.12 ? strikeX : mix(strikeX, s.endX-s.facing*130,(t-2.12)/.73);
    s.chaserPose = t < 1.55 ? Math.floor(t*12)%4 : t < 1.78 ? 4 : t < 1.98 ? 5 : t < 2.12 ? 6 : t < 2.85 ? Math.floor(t*12)%4 : 7;
    if (t + 1e-9 >= 1.82 && !s.checked) {
      s.checked = true;
      // The bag reaches the marked position, not an opponent who already dodged it.
      if (Math.abs(target.x-s.focusX) <= 86 && target.y <= 170) hit(game,s,owner,target,440);
    }
  }
  if (s.ttl <= 1e-9) {
    s.active = false; owner.actionRemaining = 0; owner.vx = 0;
    owner.x = clamp(owner.x,100,1180);
    if (Math.abs(target.x-owner.x)>2) owner.facing = target.x > owner.x ? 1 : -1;
    game.setState(owner,owner.hp>0?'idle':'ko');
  }
}

export function rushPose(f, special) {
  if (f.state === 'special' && special) {
    const t = special.age; let index;
    if (f.type === 'quickfast') index = t<.2?8:t<.42?9:t<.55?10:t<1.47?11+Math.floor(t*18)%2:t<1.86?13:t<2.3?14:15;
    else if (f.type === 'sassyt') index = t<.2?8:t<.4?9:t<.6?10:t<.85?11:t<1.05?12:t<2.5?13:t<2.8?14:15;
    else index = t<.4?8:t<1.5?9+Math.floor(t*12)%4:t<1.8?13:t<3.3?14:15;
    if (f.type === 'sassyt' && index === 15) return {key:f.type,index:0};
    return {key:f.type+'Actions',index};
  }
  if (f.state === 'run' && f.grounded) {
    const step = Math.floor(f.stateTime*Math.max(4,Math.min(12,Math.abs(f.vx)/23)))%8;
    return {key:f.type+'Actions',index:f.vx*f.facing<0?7-step:step};
  }
  let index=0;
  if (f.state==='punch') { const p=f.attackProgress||0;index=p<.25?4:p<.5?5:p<.78?6:0; }
  else if (f.state==='kick') {
    const p=f.attackProgress||0;
    index = f.type==='quickfast' ? (p<.15?8:p<.30?9:p<.49?10:p<.68?11:p<.84?12:13)
      : (p<.138?8:p<.31?9:p<.518?10:p<.69?11:p<.83?12:13);
  } else if(f.state==='ko')index=15;
  else if(['hurt','grabbed','beltHeld'].includes(f.state))index=14;
  else if(f.state==='block')index=7;
  else if(!f.grounded||f.y>4)index=f.jumps>1?3:2;
  else index=Math.floor((f.stateTime||0)*2.5)%2;
  return {key:f.type,index};
}
