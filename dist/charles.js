export const CHARLES = Object.freeze({
  name: 'Cockeyed Charles', hudName: 'Charles', special: 'Bear Spray Call-Out',
  kind: 'bearSpray', duration: 3.25, range: 1140,
  sprayAt: 1.05, pulseTimes: [1.5, 1.85, 2.2, 2.55],
  color: '#d5ef59', glow: 'rgba(170,230,65,.4)'
});

export function createCharlesSpecial(owner) {
  return { kind: CHARLES.kind, owner: owner.id, facing: owner.facing,
    duration: CHARLES.duration, ttl: CHARLES.duration, age: 0, delay: 0,
    active: true, phase: 'call', pulses: 0, hitCount: 0,
    originX: owner.x, originY: 128, reach: 0 };
}

export function endCharlesSpecial(game, owner, special) {
  special.active = false; special.ttl = 0; special.reach = 0;
  if (owner) {
    owner.vx = 0; owner.actionRemaining = 0;
    game.setState(owner, owner.hp > 0 ? 'idle' : 'ko');
  }
}

export function updateCharlesSpecial(game, s, owner, target) {
  if (!owner || !target) { endCharlesSpecial(game, owner, s); return; }
  owner.facing = s.facing; owner.vx = 0;
  const t = s.age;
  s.originX = owner.x + s.facing * 85;
  s.phase = t < .65 ? 'call' : t < CHARLES.sprayAt ? 'draw' : t < 2.85 ? 'spray' : 'recover';
  s.reach = Math.max(0, Math.min(CHARLES.range, (t - CHARLES.sprayAt) * 2600));
  if (s.ttl > 1e-9) { owner.state = 'special'; owner.actionRemaining = Math.max(owner.actionRemaining, s.ttl); }
  while (s.pulses < CHARLES.pulseTimes.length && t + 1e-9 >= CHARLES.pulseTimes[s.pulses]) {
    s.pulses++;
    const distance = (target.x - owner.x) * s.facing;
    const halfHeight = Math.min(310, 52 + Math.max(0, distance) * .3);
    const inSpray = distance >= -20 && distance <= s.reach + 85
      && target.y < s.originY + halfHeight && target.y + 205 > s.originY - halfHeight;
    if (inSpray && game.hit(owner, target, 12, s.kind, s.pulses === 4 ? 370 : 35, .22, target.x - s.facing)) s.hitCount++;
  }
  if (s.ttl <= 1e-9) endCharlesSpecial(game, owner, s);
}

export function charlesPose(f, special) {
  let index = 0;
  if (f.state === 'special' && special) {
    const t = special.age;
    index = t < .65 ? 12 : t < CHARLES.sprayAt ? 13 : t < 2.85 ? 14 + Math.floor((t - CHARLES.sprayAt) * 10) % 2 : 13;
  } else if (f.state === 'punch') {
    const p = f.attackProgress || 0;
    index = p < .3 ? 8 : p < .56 ? 9 : p < .88 ? 10 : 0;
  } else if (f.state === 'kick') {
    const p = f.attackProgress || 0;
    index = p < .2 ? 5 : p < .75 ? 11 : 0;
  } else if (['ko', 'hurt', 'grabbed', 'beltHeld'].includes(f.state)) index = 6;
  else if (f.state === 'block') index = 5;
  else if (!f.grounded || f.y > 4) index = 4;
  else if (f.state === 'run') {
    const step = Math.floor((f.stateTime || 0) * Math.max(4, Math.min(10, Math.abs(f.vx) / 28))) % 4;
    index = (f.vx * f.facing < 0 ? [2, 1, 3, 1] : [1, 2, 3, 2])[step];
  }
  return { key: 'charles', index };
}

export function drawCharlesSpray(ctx, s, ground) {
  if (s.age < CHARLES.sprayAt || !s.active) return;
  const fade = Math.min(1, (s.age - CHARLES.sprayAt) / .2, Math.max(0, s.ttl / .4));
  const reach = s.reach;
  ctx.save(); ctx.translate(s.originX, ground - s.originY); ctx.scale(s.facing, 1);
  const cloud = ctx.createLinearGradient(0, 0, Math.max(1, reach), 0);
  cloud.addColorStop(0, 'rgba(255,241,105,.8)');
  cloud.addColorStop(.35, 'rgba(246,205,25,.55)');
  cloud.addColorStop(1, 'rgba(255,213,40,.15)');
  ctx.globalAlpha = fade; ctx.fillStyle = cloud;
  ctx.beginPath(); ctx.moveTo(0, -7); ctx.lineTo(reach, -Math.min(310, 52 + reach * .3));
  ctx.quadraticCurveTo(reach + 60, 0, reach, Math.min(310, 52 + reach * .3));
  ctx.lineTo(0, 7); ctx.closePath(); ctx.fill();
  // Continuous drifting puffs keep the spray readable while leaving fighters visible.
  for (let i = 0; i < 68; i++) {
    const travel = (i * .61803398875 + s.age * .7) % 1;
    const x = travel * reach;
    const spread = Math.min(300, 25 + x * .29);
    const y = Math.sin(i * 2.39996 + s.age * 3) * spread;
    const radius = 7 + travel * 38 + (i % 5) * 2;
    ctx.globalAlpha = fade * (.12 + (i % 4) * .035);
    ctx.fillStyle = i % 3 ? '#ffda2d' : '#fff18b';
    ctx.beginPath(); ctx.ellipse(x, y, radius * 1.4, radius, 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}
