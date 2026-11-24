// Full-body keyframes, shared by the renderer and animation regression checks.
export function cantRapPose(f, crew) {
  let index = 0;
  if (f.state === 'kick') {
    const progress = Number.isFinite(f.attackProgress) ? f.attackProgress : (f.stateTime || 0) / .58;
    const elapsed = Math.max(0, Math.min(1, progress)) * .58;
    // Contact matches the combat window (.18–.30s). The last .10s is grounded
    // recovery, including when holding Kick immediately starts the next attack.
    index = elapsed < .08 ? 8 : elapsed < .18 ? 9 : elapsed < .30 ? 10
      : elapsed < .40 ? 11 : elapsed < .48 ? 12 : 13;
  } else if (f.state === 'punch') {
    const p = f.attackProgress || 0;
    index = p < .25 ? 4 : p < .65 ? 5 : 0;
  } else if (['hurt', 'ko', 'beltHeld', 'grabbed'].includes(f.state)) index = 7;
  else if (f.state === 'block') index = 6;
  else if (f.state === 'special') index = cantRapSpeech(crew) ? (crew.age < .22 ? 14 : 15) : 0;
  else if (!f.grounded || f.y > 4) index = 3;
  else if (f.state === 'run') index = 1 + Math.floor(f.stateTime * 12) % 2;
  return { key: 'cantrap', index };
}

export function cantRapSpeech(crew) {
  return crew?.kind === 'crew' && crew.active && crew.age >= 0 && crew.age < 1.15 ? 'Kids!' : '';
}
