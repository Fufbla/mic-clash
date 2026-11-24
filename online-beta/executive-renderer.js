import { EXECUTIVE_FIGHTERS } from './executive-fighters.js';
const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));

// The callback uses only the generated atlas. World coordinates are shared with combat.
export function createExecutiveRenderer(ctx, frame, assets, ground) {
  function prop(key, index, x, y, width, facing = 1, alpha = 1) {
    const f = frame(key, index); if (!f) return;
    const scale = width / f.w;
    ctx.save(); ctx.translate(x, ground - y); ctx.scale(facing, 1); ctx.globalAlpha *= clamp(alpha);
    ctx.drawImage(f.image, -width / 2, -f.h * scale, width, f.h * scale); ctx.restore();
  }
  function person(key, index, x, y, height, facing, alpha = 1) {
    const f = frame(key, index); if (!f) return;
    const scale = height / assets()[key].referenceHeight;
    ctx.save(); ctx.translate(x, ground - y); ctx.scale(facing, 1); ctx.globalAlpha *= clamp(alpha);
    ctx.drawImage(f.image, -f.anchorX * scale, -f.anchorY * scale, f.w * scale, f.h * scale); ctx.restore();
  }
  function security(f, game) {
    if (!EXECUTIVE_FIGHTERS[f.type]?.security || f.hp <= 0) return;
    const special = game.specials.find(s => s.owner === f.id && s.kind === 'cybertruck');
    if (special && special.age >= .65) return; // This robot rides in, exits, then leaves with its truck.
    const block = f.securityFlash > 0;
    const x = clamp(f.x + f.facing * (block ? 53 : -86), 42, 1238);
    const index = block ? (f.type === 'roboking' ? 3 : 2) : Math.abs(f.vx) > 10 ? 1 : 0;
    person(f.type + 'Support', index, x, -5, 162, f.facing, special ? 1 - special.age / .65 : 1);
    if (block) {
      ctx.save(); ctx.strokeStyle = '#b5eeff'; ctx.globalAlpha = clamp(f.securityFlash * 3);
      ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(x + f.facing * 35, ground - 102, 32, 65, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
    }
  }
  function warning(s) {
    if (!s.locked || (s.kind !== 'airstrike' && s.kind !== 'moneyRain')) return;
    const end = s.kind === 'airstrike' ? 1.85 : 2.26;
    if (s.age >= end) return;
    ctx.save(); ctx.strokeStyle = s.kind === 'airstrike' ? '#ffc56e' : '#f8dc81';
    ctx.fillStyle = s.kind === 'airstrike' ? 'rgba(255,177,71,.10)' : 'rgba(248,220,129,.10)';
    ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(s.focusX, ground + 2, s.kind === 'airstrike' ? 165 : 145, 22, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.restore();
  }
  function special(s) {
    const t = s.age;
    if (s.kind === 'airstrike') {
      if (t >= .55 && t < 1.85) prop('presidentSupport', 3, s.jetX, 220, 240, s.facing);
      if (t >= 1.2 && t < 1.85) prop('presidentSupport', 4, s.focusX, s.bombY, 34);
      if (t >= 1.85 && t < 3.05) {
        const index = t < 2.02 ? 5 : t < 2.48 ? 6 : 7;
        prop('presidentSupport', index, s.focusX, -4, index === 5 ? 250 : 350, 1, t > 2.48 ? (3.05 - t) / .57 : 1);
      }
    } else if (s.kind === 'moneyRain') {
      for (let i = 0; i < 4; i++) {
        const impact = 1.3 + i * .32, fall = (t - (impact - .65)) / .65;
        if (fall >= 0 && fall < 1) {
          for (let j = -1; j <= 1; j++) {
            const y = 490 * (1 - fall * fall) + Math.abs(j) * 28;
            prop('owhinnySupport', (i + Math.abs(j)) % 2, s.focusX + j * 86 + Math.sin(i * 3 + j) * 12, y, j ? 82 : 105, j < 0 ? -1 : 1);
          }
        }
      }
      if (t >= 1.3) prop('owhinnySupport', t < 2.05 ? 2 : 3, s.focusX, -7, 285, 1, t > 2.75 ? (3.5 - t) / .75 : 1);
    } else if (s.kind === 'cybertruck' && t >= .65) {
      const open = t >= 1.5 && t < 3.05;
      prop('robokingSupport', open ? 5 : t < 1.5 || t >= 3.05 ? 6 : 4, s.truckX, -4, 320, s.facing);
      if (t >= 1.5 && t < 3.05) person('robokingSupport', s.robotPose, s.robotX, s.robotY, 172, t >= 2.55 ? -s.facing : s.facing);
    }
  }
  return { security, warning, special };
}
