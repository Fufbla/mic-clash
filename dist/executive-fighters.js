// Authored sprites and deterministic timelines for the three new fighters.
export const EXECUTIVE_FIGHTERS = Object.freeze({
  president: { kind: 'airstrike', duration: 3.2, name: 'The President', special: 'Executive Airstrike', security: true },
  owhinny: { kind: 'moneyRain', duration: 3.5, name: 'O’whinny', special: 'Money Rain', security: false },
  roboking: { kind: 'cybertruck', duration: 4.0, name: 'RoboKing', special: 'Cybertruck Protocol', security: true }
});
export const EXECUTIVE_KINDS = Object.freeze(Object.values(EXECUTIVE_FIGHTERS).map(f => f.kind));
const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
const mix = (a, b, t) => a + (b - a) * clamp(t);

export function createExecutiveSpecial(f, target) {
  const config = EXECUTIVE_FIGHTERS[f.type];
  return { kind: config.kind, owner: f.id, facing: f.facing, age: 0,
    ttl: config.duration, active: true, delay: 0, duration: config.duration,
    focusX: target.x, locked: false, hitCount: 0, strikeIndex: 0,
    phase: 'call', truckX: f.facing > 0 ? -230 : 1510,
    robotX: f.x - f.facing * 75, robotY: 0, robotPose: 0 };
}

function strike(game, s, owner, target, damage, reach, height, knock, stun, sourceX = s.focusX - s.facing) {
  const connected = Math.abs(target.x - s.focusX) <= reach && target.y <= height
    && game.hit(owner, target, damage, s.kind, knock, stun, sourceX);
  if (connected) s.hitCount++;
  return Boolean(connected);
}

export function updateExecutiveSpecial(game, s, owner, target) {
  if (!owner || !target) { s.active = false; return; }
  const t = s.age;
  if (!s.locked && t >= .65) { s.focusX = target.x; s.locked = true; }
  if (!s.locked) s.focusX = target.x;

  if (s.kind === 'airstrike') {
    s.phase = t < .65 ? 'call' : t < 1.2 ? 'jet' : t < 1.85 ? 'bomb' : t < 2.7 ? 'impact' : 'recover';
    s.jetX = mix(s.focusX - s.facing * 1050, s.focusX + s.facing * 1050, (t - .55) / 1.3);
    s.bombY = mix(230, 15, (t - 1.2) / .65);
    if (t >= 1.85 && !s.strikeIndex) {
      s.strikeIndex = 1;
      const connected = strike(game, s, owner, target, 48, 165, 340, 480, .52);
      game.events.push({ type: 'executiveImpact', kind: s.kind, x: s.focusX, connected });
    }
  } else if (s.kind === 'moneyRain') {
    s.phase = t < .65 ? 'call' : t < 1.3 ? 'rain' : t < 2.65 ? 'pile' : 'recover';
    // Four separate bundles: the fixed landing area gives the opponent time to evade.
    while (s.strikeIndex < 4 && t + 1e-9 >= 1.3 + s.strikeIndex * .32) {
      const last = ++s.strikeIndex === 4;
      const connected = strike(game, s, owner, target, 12, 145, 390, last ? 430 : 0, last ? .48 : .22);
      game.events.push({ type: 'executiveImpact', kind: s.kind, x: s.focusX, connected, final: last });
    }
  } else if (s.kind === 'cybertruck') {
    const start = s.facing > 0 ? -230 : 1510;
    const parked = clamp(s.focusX - s.facing * 142, 90, 1190);
    const previous = s.truckX;
    s.phase = t < .65 ? 'call' : t < 1.5 ? 'charge' : t < 1.9 ? 'exit'
      : t < 2.55 ? 'punch' : t < 3.05 ? 'return' : 'depart';
    s.truckX = t < 1.5 ? mix(start, parked, (t - .65) / .85)
      : t < 3.05 ? parked : mix(parked, s.facing > 0 ? 1590 : -310, (t - 3.05) / .95);
    // Swept front-bumper collision: an opponent crossing the truck between frames is still hit once.
    if (!s.truckChecked && t >= .65 && t < 1.65) {
      const front0 = previous + s.facing * 150, front1 = s.truckX + s.facing * 150;
      if (target.y < 145 && target.x >= Math.min(front0, front1) - 30 && target.x <= Math.max(front0, front1) + 30) {
        s.truckChecked = true;
        if (game.hit(owner, target, 24, s.kind, 110, .3, target.x - s.facing)) s.hitCount++;
        game.events.push({ type: 'executiveImpact', kind: s.kind, x: target.x, truck: true });
      }
    }
    const doorX = parked - s.facing * 25;
    const punchX = s.focusX - s.facing * 70;
    s.robotX = t < 1.9 ? mix(doorX, punchX, (t - 1.5) / .4)
      : t < 2.55 ? punchX : mix(punchX, doorX, (t - 2.55) / .5);
    s.robotY = t >= 1.5 && t < 1.9 ? Math.sin(clamp((t - 1.5) / .4) * Math.PI) * 105 : 0;
    s.robotPose = t >= 2.08 && t < 2.45 ? 2 : 1;
    if (t + 1e-9 >= 2.22 && !s.strikeIndex) {
      s.strikeIndex = 1;
      const connected = strike(game, s, owner, target, 24, 78, 180, 460, .48, s.robotX);
      game.events.push({ type: 'executiveImpact', kind: s.kind, x: target.x, connected, final: true });
    }
  }
  if (s.ttl <= 1e-9) {
    s.active = false;
    owner.actionRemaining = 0;
    game.setState(owner, owner.hp > 0 ? 'idle' : 'ko');
  }
}

export function executivePose(f, special) {
  const actions = f.type + 'Actions';
  if (f.state === 'special' && special) {
    const t = special.age;
    let index;
    if (f.type === 'president') index = t < .2 ? 8 : t < .65 ? 9 : t < .85 ? 10 : t < 1.2 ? 11 : t < 2.2 ? 12 : t < 2.7 ? 13 : t < 3 ? 14 : 15;
    else if (f.type === 'owhinny') index = t < .2 ? 8 : t < .45 ? 9 : t < .65 ? 10 : t < 1.3 ? 11 : t < 2.25 ? 12 : t < 2.65 ? 13 : t < 3.1 ? 14 : 15;
    else index = t < .2 ? 8 : t < .65 ? 9 : t < 1 ? 10 : t < 1.5 ? 11 : t < 2.55 ? 12 : t < 3.05 ? 13 : t < 3.5 ? 14 : 15;
    return { key: actions, index };
  }
  if (f.state === 'run' && f.grounded) {
    const step = Math.floor(f.stateTime * Math.max(4, Math.min(12, Math.abs(f.vx) / 23))) % 8;
    return { key: actions, index: f.vx * f.facing < 0 ? 7 - step : step };
  }
  let index = 0;
  if (f.state === 'punch') { const p = f.attackProgress || 0; index = p < .25 ? 4 : p < .5 ? 5 : p < .78 ? 6 : 0; }
  else if (f.state === 'kick') { const t = (f.attackProgress || 0) * .58; index = t < .08 ? 8 : t < .18 ? 9 : t < .3 ? 10 : t < .4 ? 11 : t < .48 ? 12 : 13; }
  else if (f.state === 'ko') index = 15;
  else if (['hurt', 'grabbed', 'beltHeld'].includes(f.state)) index = 14;
  else if (f.state === 'block') index = 7;
  else if (!f.grounded || f.y > 4) index = f.jumps > 1 ? 3 : 2;
  else index = Math.floor((f.stateTime || 0) * 2.5) % 2;
  return { key: f.type, index };
}
