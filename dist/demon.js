export const DEMON_CREW = Object.freeze({
  pointAt: .16, chinAt: .48, lookAwayAt: .64, enterAt: .84,
  lockAt: 1.25, attackAt: 1.70, interval: .11, strikes: 12,
  retreatAt: 3.12, exitAt: 3.78, duration: 4.10,
  damage: 4, range: 205, targetRadius: 90, knock: 510, lift: 360
});

export function demonPose(f, special) {
  if (f.state === 'special' && special?.kind === 'maskedCrew') {
    const t = special.age, c = DEMON_CREW;
    const index = t < c.pointAt ? 8 : t < c.chinAt ? 9 : t < c.lookAwayAt ? 10
      : t < c.enterAt ? 11 : t < c.retreatAt ? 12 : t < c.exitAt ? 13
      : t < c.duration - .14 ? 14 : 15;
    // The authored chin-up poses turn the entire fighter away from his target.
    return { key: 'demonActions', index, lookAway: t >= c.lookAwayAt && t < c.exitAt };
  }
  if (f.state === 'run' && f.grounded) {
    const step = Math.floor(f.stateTime * Math.max(4, Math.min(10, Math.abs(f.vx) / 26))) % 8;
    return { key: 'demonActions', index: f.vx * f.facing < 0 ? 7 - step : step, lookAway: false };
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
  return { key: 'demon', index, lookAway: false };
}

export function maskedCrewPose(member, age) {
  const c = DEMON_CREW;
  if (age >= c.retreatAt) return member.entry === 'top' ? 15 : Math.floor(age * 14 + member.index) % 4;
  if (age < member.arriveAt) return member.entry === 'top' ? (member.y > 190 ? 4 : 5) : Math.floor(age * 14 + member.index) % 4;
  if (age < member.arriveAt + .08) return member.entry === 'top' ? 6 : 11;
  if (age < member.arriveAt + .14) return member.entry === 'top' ? 7 : 11;
  for (const round of [0, 1]) {
    const contact = c.attackAt + (member.index + round * 6) * c.interval;
    const dt = age - contact, kick = round === 1 && member.index % 2 === 1;
    if (dt >= -.09 && dt < .075) return dt < 0 ? (kick ? 12 : 8) : (kick ? 13 : 9);
    if (dt >= .075 && dt < .19) return kick ? 14 : 10;
  }
  return 11;
}
