export const NAIL_PIERCE = Object.freeze({
  gatherAt: .24, reachAt: .46, extendAt: .64, fullAt: 1.00,
  retractAt: 1.26, shrinkEnd: 1.62, recoverAt: 1.82, duration: 2.06,
  strikeAt: .78, hitEnd: 1.12, length: 290, range: 400, damage: 48, knock: 570, lift: 330,
  // Measured fingertip positions in the held, two-hand thrust pose, relative
  // to the planted fighter. x is forward; y is height above the ground.
  fingertips: Object.freeze([
    [78, 143, -.13, .78], [87, 143, -.06, .94], [94, 136, 0, 1],
    [95, 127, .05, .92], [88, 118, .13, .72],
    [76, 108, -.12, .76], [87, 104, -.05, .93], [93, 97, 0, 1],
    [91, 90, .06, .90], [83, 84, .14, .70]
  ].map(Object.freeze))
});

const clamp = (n, low, high) => Math.max(low, Math.min(high, n));

export function nailExtension(age) {
  const m = NAIL_PIERCE;
  if (age < m.extendAt || age >= m.shrinkEnd) return 0;
  if (age < m.fullAt) return clamp((age - m.extendAt) / (m.fullAt - m.extendAt), 0, 1);
  if (age < m.retractAt) return 1;
  return clamp(1 - (age - m.retractAt) / (m.shrinkEnd - m.retractAt), 0, 1);
}

// Rendering and hit detection use the very same ten growing nail segments.
export function nailSegments(s, owner, age = s.age) {
  const extension = nailExtension(age);
  if (s.active === false || extension <= 0) return [];
  return NAIL_PIERCE.fingertips.map(([x, y, angle, reach], index) => {
    const length = 7 + NAIL_PIERCE.length * extension * reach;
    const rootX = owner.x + s.facing * x, rootY = owner.y + y;
    return { index, rootX, rootY, tipX: rootX + s.facing * Math.cos(angle) * length,
      tipY: rootY - Math.sin(angle) * length, length, angle, width: 3 + extension * 4 };
  });
}

export function ocrrrrrPose(f, special) {
  if (f.state === 'special' && special?.kind === 'nailPierce') {
    const t = special.age, m = NAIL_PIERCE;
    // Hold the authored thrust while the attached nails grow and retract.
    const index = t < m.gatherAt ? 8 : t < m.reachAt ? 9 : t < m.extendAt ? 10
      : t < m.shrinkEnd ? 11 : t < m.recoverAt ? 14 : 15;
    return { key: 'ocrrrrrActions', index };
  }
  if (f.state === 'run' && f.grounded) {
    const step = Math.floor(f.stateTime * Math.max(4, Math.min(10, Math.abs(f.vx) / 26))) % 8;
    return { key: 'ocrrrrrActions', index: f.vx * f.facing < 0 ? 7 - step : step };
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
  return { key: 'ocrrrrr', index };
}
