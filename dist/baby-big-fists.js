// Shared strike timing keeps the fists, damage, voice and bubbles in sync.
export const GIANT_FISTS = Object.freeze({
  growAt: .22, readyAt: .42, punches: Object.freeze([.68, 1.24]),
  retractAt: .86, shrinkAt: 1.47, restoreAt: 1.85, duration: 2.05,
  bubbleDuration: .40, range: 205, damage: 24, knock: 680, lift: 420
});

export function babyBigFistsSpeech(s) {
  return s?.kind === 'giantFists' && s.active
    && GIANT_FISTS.punches.some(t => s.age + 1e-9 >= t && s.age < t + GIANT_FISTS.bubbleDuration)
    ? 'mmm' : '';
}

export function babyBigFistsPose(f, special) {
  if (f.state === 'special' && special?.kind === 'giantFists') {
    const t = special.age, m = GIANT_FISTS;
    return { key: 'babyBigFistsActions', index: t < m.growAt ? 8 : t < m.readyAt ? 9
      : t + 1e-9 < m.punches[0] ? 10 : t < m.retractAt ? 11
      : t + 1e-9 < m.punches[1] ? 12 : t < m.shrinkAt ? 13 : t < m.restoreAt ? 14 : 15 };
  }
  if (f.state === 'run' && f.grounded) {
    const step = Math.floor(f.stateTime * Math.max(4, Math.min(11, Math.abs(f.vx) / 24))) % 8;
    return { key: 'babyBigFistsActions', index: f.vx * f.facing < 0 ? 7 - step : step };
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
  else index = Math.floor((f.stateTime || 0) * 4) % 2;
  return { key: 'babybigfists', index };
}
