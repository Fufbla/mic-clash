export const ELEVATOR_DROP = Object.freeze({
  inhaleAt: .22, shoutAt: .42, commandAt: .72, dropAt: .96,
  landAt: 1.52, exhaleAt: 1.62, recoverAt: 1.82,
  actorDuration: 2.10, fadeAt: 1.92, duration: 2.36,
  startBottom: 610, width: 235, height: 340,
  damage: 48, knock: 450, lift: 240, stun: .48, impactDuration: .60
});

export function cranesPose(f, special) {
  if (f.state === 'special' && special?.kind === 'elevator') {
    const t = special.age, e = ELEVATOR_DROP;
    const index = t < e.inhaleAt ? 8 : t < e.shoutAt ? 9 : t < e.commandAt ? 10
      : t < e.dropAt ? 11 : t < e.exhaleAt ? 12 : t < e.recoverAt ? 13
      : t < e.actorDuration ? 14 : 15;
    return { key: 'cranesActions', index };
  }
  if (f.state === 'run' && f.grounded) {
    const step = Math.floor(f.stateTime * Math.max(4, Math.min(9, Math.abs(f.vx) / 28))) % 8;
    return { key: 'cranesActions', index: f.vx * f.facing < 0 ? 7 - step : step };
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
  else index = Math.floor((f.stateTime || 0) * 2.5) % 2;
  return { key: 'cranes', index };
}
