export const SMACK_UPGRADE = Object.freeze({
  suitAt: .30, poseAt: .55, windupAt: .90, strikeAt: 1.14,
  recoverAt: 1.40, restoreAt: 1.85, duration: 2.10,
  range: 185, damage: 48, knock: 660, lift: 400
});

export function smackPrincePose(f, special) {
  if (f.state === 'special' && special?.kind === 'spotlight') {
    const t = special.age, s = SMACK_UPGRADE;
    return { key: 'smackPrinceActions', index: t < s.suitAt ? 8 : t < s.poseAt ? 9
      : t < s.windupAt ? 10 : t < s.strikeAt ? 11 : t < 1.25 ? 12
      : t < s.recoverAt ? 13 : t < s.restoreAt ? 14 : 15 };
  }
  if (f.state === 'run' && f.grounded) {
    const step = Math.floor(f.stateTime * Math.max(5, Math.min(12, Math.abs(f.vx) / 22))) % 8;
    return { key: 'smackPrinceActions', index: f.vx * f.facing < 0 ? 7 - step : step };
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
  return { key: 'smackprince', index };
}
