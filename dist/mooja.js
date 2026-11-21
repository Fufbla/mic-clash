export const COW_MODE = Object.freeze({
  crouchAt: .22, cowAt: .50, inhaleAt: .67,
  shots: Object.freeze([.82, 1.12, 1.42]), recoverAt: 1.65,
  restoreAt: 1.92, actorDuration: 2.16, duration: 3.20,
  mouthForward: 80, mouthHeight: 92, speed: 760, range: 900,
  missileWidth: 94, missileHeight: 38, damage: 16, splashDuration: .42
});

export function moojaPose(f, special) {
  if (f.state === 'special' && special?.kind === 'milk') {
    const t = special.age, m = COW_MODE;
    let index;
    if (t < m.crouchAt) index = 8;
    else if (t < m.cowAt) index = 9;
    else if (t < m.inhaleAt) index = 10;
    else if (t + 1e-9 < m.shots[0]) index = 11;
    else if (t < m.recoverAt) index = m.shots.some(at => t + 1e-9 >= at && t < at + .12) ? 12 : 13;
    else if (t < m.restoreAt) index = 14;
    else index = 15;
    return { key: 'mooJaActions', index };
  }
  if (f.state === 'run' && f.grounded) {
    const step = Math.floor(f.stateTime * Math.max(4, Math.min(11, Math.abs(f.vx) / 24))) % 8;
    return { key: 'mooJaActions', index: f.vx * f.facing < 0 ? 7 - step : step };
  }
  let index = 0;
  if (f.state === 'punch') {
    const p = f.attackProgress || 0;
    index = p < .25 ? 4 : p < .50 ? 5 : p < .78 ? 6 : 0;
  } else if (f.state === 'kick') {
    const t = (f.attackProgress || 0) * .58;
    index = t < .08 ? 8 : t < .18 ? 9 : t < .30 ? 10 : t < .40 ? 11 : t < .48 ? 12 : 13;
  } else if (f.state === 'block') index = 7;
  else if (f.state === 'ko') index = 15;
  else if (['hurt', 'grabbed', 'beltHeld'].includes(f.state)) index = 14;
  else if (!f.grounded || f.y > 4) index = f.jumps > 1 ? 3 : 2;
  else index = Math.floor((f.stateTime || 0) * 3) % 2;
  return { key: 'mooja', index };
}
