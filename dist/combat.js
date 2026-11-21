import { DR_NO_BUNNIES, AfricanPrideBeltSlap } from './dr-no-bunnies.js';
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const FIGHTERS = ['owl', 'coupe', 'karate', 'snitchy', 'getit', 'loudbull', 'fatboi', 'icespice', 'hehaw', 'dr-no-bunnies'];
const BELT = DR_NO_BUNNIES.special;
const BARRAGE = { windup: .18, interval: .09, punchesTotal: 12, recovery: .20, range: 180 };
const VOCAL = { windup: .35, interval: .27, wavesTotal: 4, singDuration: 1.70,
  speed: 620, range: 700, waveWidth: 76, waveHeight: 126, duration: 2.4 };
const YELL = { windup: .38, interval: .20, pulsesTotal: 4, yellDuration: .80,
  recovery: .35, duration: 1.53, range: 560, nearHalfHeight: 34, farHalfHeight: 138 };
const WING = { biteAt: .34, releaseAt: .96, actorDuration: 1.46, duration: 2.6,
  speed: 720, rise: 150, gravity: 490, range: 760, projectileDuration: 1.5,
  projectileWidth: 70, projectileHeight: 42, handForward: 99, handHeight: 147 };
const MUNCH = { catchAt: .46, liftEnd: .66, biteTimes: [.78, 1.08, 1.38],
  releaseAt: 1.68, recoveryAt: 1.90, duration: 2.2, range: 185,
  biteDamage: 16, holdForward: 112, holdHeight: 145, mouthForward: 55, mouthHeight: 154 };
const HORSE = { windup: .42, speed: 900, width: 320, height: 176,
  frontReach: 124, backReach: 188,
  chargeDuration: 1720 / 900, recovery: .22, duration: .42 + 1720 / 900 + .22,
  damage: 48, knock: 560, lift: 320, stun: .48, stepInterval: .18 };
const BACKUP = { call: .4, arrive: .55, exit: .32, exitStagger: .12, rushSpeed: 650,
  rushDeadline: 2.7, range: 145, punchWindup: .08, punchInterval: .36,
  punchStagger: .12, punchesEach: 3, attackDuration: 1.32, returnDeadline: 1.25,
  departDuration: .55, duration: 6 };
const ATTACKS = {
  punch: { duration: .40, start: .10, end: .20, range: 132, damage: 10, meter: 20, stun: .20, knock: 180 },
  kick: { duration: .58, start: .18, end: .30, range: 178, damage: 15, meter: 25, stun: .26, knock: 250 }
};

// Entry time of a moving projectile into an expanded rectangular hurtbox.
function sweptHit(x0, y0, x1, y1, left, right, bottom, top) {
  let enter = 0, leave = 1;
  for (const [start, delta, low, high] of [[x0, x1 - x0, left, right], [y0, y1 - y0, bottom, top]]) {
    if (Math.abs(delta) < 1e-9) { if (start < low || start > high) return null; continue; }
    const a = (low - start) / delta, b = (high - start) / delta;
    enter = Math.max(enter, Math.min(a, b)); leave = Math.min(leave, Math.max(a, b));
    if (enter > leave) return null;
  }
  return enter;
}

/** Pure simulation. y is height above the floor, not a canvas coordinate. */
export class CombatGame {
  constructor(playerType = 'owl', opponentType) { this.reset(playerType, opponentType); }

  reset(playerType = this.playerType, opponentType) {
    // Release references held by an outgoing round before replacing its fighters.
    for (const s of this.specials || []) if (s.kind === 'munch') {
      this.endMunch(this.fighters.find(f => f.id === s.owner), s, 'reset');
    } else if (s.kind === 'horse') {
      this.endHorse(this.fighters.find(f => f.id === s.owner), s, 'reset');
    } else if (s.kind === 'belt') {
      this.endBelt(this.fighters.find(f => f.id === s.owner), s);
    }
    if (arguments.length === 0) opponentType = this.opponentType;
    this.playerType = FIGHTERS.includes(playerType) ? playerType : 'owl';
    const fallback = this.playerType === 'owl' ? 'coupe' : 'owl';
    this.opponentType = FIGHTERS.includes(opponentType) && opponentType !== this.playerType ? opponentType : fallback;
    this.fighters = [this.makeFighter('p1', this.playerType, 340, 1),
      this.makeFighter('p2', this.opponentType, 940, -1)];
    this.timeRemaining = 90;
    this.elapsed = 0;
    this.over = false;
    this.winner = null;
    this.roundEnding = null;
    this.specials = [];
    this.effects = [];
    this.events = [];
    this.aiEnabled = true;
    this.seed = 0x12f34ab;
    this.ai = { think: .45, blockFor: 0, retreatFor: 0 };
    return this;
  }

  makeFighter(id, type, x, facing) {
    return { id, type, x, y: 0, vx: 0, vy: 0, facing, hp: 160, maxHp: 160,
      meter: 0, state: 'idle', stateTime: 0, grounded: true, jumps: 0, invuln: 0,
      actionRemaining: 0, attack: null, attackProgress: 0, inCar: false,
      specialCooldown: 0, landedHits: 0, damageDealt: 0,
      flipDuration: .48, flipRemaining: 0, flipProgress: 0, flipDirection: facing,
      outfit: type === 'karate' ? 'blue' : 'normal', backupActive: false, vocalActive: false,
      yellActive: false, wingActive: false, munchActive: false, horseActive: false, grabbedBy: null,
      beltActive: false, beltHeldBy: null, beltLaunched: false };
  }

  random() {
    let s = this.seed;
    s ^= s << 13; s ^= s >>> 17; s ^= s << 5;
    this.seed = s >>> 0;
    return this.seed / 4294967296;
  }

  drainEvents() { return this.events.splice(0); }
  setState(f, state) { if (f.state !== state) { f.state = state; f.stateTime = 0; } }
  canAct(f) { return !this.over && !this.roundEnding && f.hp > 0 && !f.inCar && !f.grabbedBy && !f.beltHeldBy && f.actionRemaining <= 0; }

  isPresenting(f) {
    if (this.over) return false;
    // Delayed birds, detached projectiles, backup, and impact visuals all belong
    // to the presentation even after the fighter's own pose has recovered.
    return (f.state === 'special' && f.actionRemaining > 1e-9)
      || this.specials.some(s => s.owner === f.id && s.ttl > 1e-9 && (s.active || s.delay > 0))
      || this.effects.some(effect => effect.owner === f.id && effect.ttl > 1e-9);
  }

  hasPresentations() { return this.fighters.some(f => this.isPresenting(f)); }

  startAttack(f, kind) {
    const spec = ATTACKS[kind];
    if (!spec || !this.canAct(f) || this.isPresenting(f)) return false;
    const style = ['getit', 'dr-no-bunnies'].includes(f.type) && kind === 'punch' ? 'slap' : kind;
    f.attack = { kind, style, elapsed: 0, connected: false, ...spec };
    // Contact is the second authored slap pose, after a readable wind-up.
    if (f.type === 'dr-no-bunnies' && kind === 'punch') {
      f.attack.start = .11; f.attack.end = .20;
    }
    f.actionRemaining = spec.duration;
    f.attackProgress = 0;
    f.state = kind; f.stateTime = 0;
    f.vx *= .3;
    this.events.push({ type: 'attack', fighter: f.id, kind, style });
    return true;
  }

  useSpecial(f) {
    if (!this.canAct(f) || this.isPresenting(f) || f.meter < 100 || f.specialCooldown > 0 || f.backupActive || f.vocalActive || f.yellActive || f.wingActive || f.munchActive || f.horseActive) return false;
    const target = this.fighters.find(other => other !== f);
    if (f.type === 'dr-no-bunnies' && (Math.abs(target.x - f.x) > BELT.range
      || (target.x - f.x) * f.facing < 0 || Math.abs(target.y - f.y) > 112)) return false;
    f.meter = 0;
    f.attack = null;
    f.attackProgress = 0;
    f.state = 'special'; f.stateTime = 0;
    const kind = f.type === 'dr-no-bunnies' ? 'belt' : f.type === 'coupe' ? 'car' : f.type === 'karate' ? 'barrage' : f.type === 'snitchy' ? 'backup' : f.type === 'getit' ? 'vocal' : f.type === 'loudbull' ? 'yell' : f.type === 'fatboi' ? 'wing' : f.type === 'icespice' ? 'munch' : f.type === 'hehaw' ? 'horse' : 'owl';
    const barrageDuration = BARRAGE.windup + BARRAGE.interval * BARRAGE.punchesTotal + BARRAGE.recovery;
    f.actionRemaining = kind === 'belt' ? BELT.durationMs / 1000 : kind === 'car' ? .95 : kind === 'barrage' ? barrageDuration : kind === 'backup' ? .85 : kind === 'vocal' ? VOCAL.singDuration : kind === 'yell' ? YELL.duration : kind === 'wing' ? WING.actorDuration : kind === 'munch' ? MUNCH.duration : kind === 'horse' ? HORSE.duration : .66;
    f.specialCooldown = 1.2;
    f.vx = 0;
    // Protection follows the actual presentation lifetime, not a short startup timer.
    f.invuln = 0;
    if (kind === 'belt') {
      f.y = 0; f.vy = 0; f.grounded = true; f.jumps = 0; f.beltActive = true;
      const s = { kind, owner: f.id, targetId: target.id, facing: f.facing,
        age: 0, ttl: BELT.durationMs / 1000, active: true, delay: 0,
        phase: 'draw', spriteIndex: 0, strikeIndex: 0, hitCount: 0,
        holdX: target.x, holdY: target.y, contactX: target.x, contactY: target.y + 110 };
      s.controller = new AfricanPrideBeltSlap({
        onHit: strike => {
          // An opposing protected special always keeps its immunity. Ordinary
          // block and recovery i-frames cannot stop a belt strike.
          const connected = this.hit(f, target, strike.damage, 'belt', 0, .76, f.x);
          if (connected) s.hitCount++;
          if (strike.number === 3 && target.beltHeldBy === f.id) {
            target.beltHeldBy = null; target.beltLaunched = true;
            // Convert the pack's travel distance to the engine's damped velocity.
            target.vx = s.facing * strike.knockback * 7; target.vy = 460; target.grounded = false;
            target.actionRemaining = .58; this.setState(target, target.hp > 0 ? 'hurt' : 'ko');
          }
        },
        onCue: cue => {
          if (cue.type !== 'belt-slap') return;
          s.strikeIndex = cue.number;
          s.contactX = target.x; s.contactY = target.y + 110;
          this.events.push({ type: 'beltStrike', fighter: f.id, defender: target.id,
            number: cue.number, final: cue.number === 3, text: cue.callout,
            x: s.contactX, y: s.contactY, facing: s.facing });
        }
      });
      s.controller.start({ attacker: f, defender: target, now: 0, meter: 100,
        distance: Math.abs(target.x - f.x) });
      this.specials.push(s);
    } else if (kind === 'car') {
      f.y = 0; f.vy = 0; f.grounded = true; f.inCar = true;
      this.specials.push({ kind, owner: f.id, x: f.x - f.facing * 75, y: 0,
        vx: f.facing * 850, vy: 0, width: 310, height: 145, ttl: .95, age: 0,
        facing: f.facing, hitIds: [], active: true, delay: 0 });
    } else if (kind === 'barrage') {
      f.y = 0; f.vy = 0; f.grounded = true; f.jumps = 0;
      f.flipRemaining = 0; f.flipProgress = 0; f.outfit = 'gi';
      this.specials.push({ kind, owner: f.id, x: f.x + f.facing * 90, y: 105,
        vx: 0, vy: 0, width: BARRAGE.range, height: 130, ttl: barrageDuration, age: 0,
        facing: f.facing, hitIds: [], active: true, delay: 0, ...BARRAGE,
        punchIndex: 0, hitCount: 0, progress: 0,
        approachRemaining: Math.min(54, Math.max(0, (target.x - f.x) * f.facing - 110)) });
    } else if (kind === 'horse') {
      f.y = 0; f.vy = 0; f.grounded = true; f.jumps = 0; f.horseActive = true;
      f.flipRemaining = 0; f.flipProgress = 0;
      const startX = f.facing > 0 ? -220 : 1500, endX = f.facing > 0 ? 1500 : -220;
      this.specials.push({ kind, owner: f.id, facing: f.facing, age: 0,
        ttl: HORSE.duration, active: true, delay: 0, ...HORSE,
        phase: 'windup', phaseAge: 0, phaseStartedAt: 0, progress: 0, spriteIndex: 0,
        ownerStartX: f.x, entered: false, exited: false, stepIndex: 0, hitCount: 0, hitIds: [],
        horse: { x: startX, y: 0, startX, endX, previousX: startX,
          facing: f.facing, width: HORSE.width, height: HORSE.height,
          age: 0, frame: 0, spriteIndex: 0, visible: false, active: false } });
    } else if (kind === 'munch') {
      f.y = 0; f.vy = 0; f.grounded = true; f.jumps = 0; f.munchActive = true;
      f.flipRemaining = 0; f.flipProgress = 0;
      this.specials.push({ kind, owner: f.id, facing: f.facing, age: 0,
        ttl: MUNCH.duration, active: true, delay: 0, ...MUNCH,
        phase: 'windup', phaseAge: 0, phaseStartedAt: 0, progress: 0, spriteIndex: 0,
        catchAttempted: false, targetId: null, grabbed: false, released: false,
        biteIndex: 0, hitCount: 0, hitIds: [],
        x: f.x + f.facing * MUNCH.mouthForward, y: MUNCH.mouthHeight,
        mouthX: f.x + f.facing * MUNCH.mouthForward, mouthY: MUNCH.mouthHeight,
        targetX: f.x + f.facing * MUNCH.holdForward, targetY: MUNCH.holdHeight });
    } else if (kind === 'wing') {
      f.y = 0; f.vy = 0; f.grounded = true; f.jumps = 0; f.wingActive = true;
      f.flipRemaining = 0; f.flipProgress = 0;
      this.specials.push({ kind, owner: f.id, x: f.x + f.facing * WING.handForward, y: WING.handHeight,
        facing: f.facing, age: 0, ttl: WING.duration, active: true, delay: 0,
        ...WING, phase: 'reveal', phaseAge: 0, phaseStartedAt: 0, progress: 0,
        bitten: false, released: false, interrupted: false, hitCount: 0, hitIds: [], projectile: null });
    } else if (kind === 'yell') {
      f.y = 0; f.vy = 0; f.grounded = true; f.jumps = 0; f.yellActive = true;
      f.flipRemaining = 0; f.flipProgress = 0;
      this.specials.push({ kind, owner: f.id, x: f.x + f.facing * 65, y: 137,
        facing: f.facing, age: 0, ttl: YELL.duration, active: true, delay: 0,
        ...YELL, phase: 'windup', phaseAge: 0, phaseStartedAt: 0, progress: 0,
        yellProgress: 0, pulseIndex: 0, hitCount: 0, hitIds: [], interrupted: false });
    } else if (kind === 'vocal') {
      f.y = 0; f.vy = 0; f.grounded = true; f.jumps = 0; f.vocalActive = true;
      this.specials.push({ kind, owner: f.id, x: f.x + f.facing * 75, y: 120,
        facing: f.facing, age: 0, ttl: VOCAL.duration, active: true, delay: 0,
        ...VOCAL, phase: 'windup', phaseAge: 0, progress: 0, waveIndex: 0,
        hitCount: 0, hitIds: [], waves: [], interrupted: false });
    } else if (kind === 'backup') {
      f.y = 0; f.vy = 0; f.grounded = true; f.jumps = 0;
      f.flipRemaining = 0; f.flipProgress = 0; f.backupActive = true;
      const stopX = clamp(f.x - f.facing * 110, 195, 1085);
      const startX = f.facing > 0 ? -230 : 1510;
      this.specials.push({ kind, owner: f.id, x: stopX, y: 0, age: 0, ttl: BACKUP.duration,
        facing: f.facing, active: true, delay: 0, phase: 'calling', phaseAge: 0, phaseStartedAt: 0,
        attackAt: null, departAt: null, punchIndex: 0, hitCount: 0, hitIds: [],
        car: { x: startX, y: 0, startX, stopX, facing: f.facing, width: 360, height: 155,
          visible: false, progress: 0, doorsOpen: false, phase: 'waiting' },
        officers: Array.from({ length: 3 }, (_, index) => ({ index,
          x: stopX + f.facing * (12 + index * 24), y: 0, facing: f.facing,
          doorX: stopX + f.facing * (12 + index * 24), visible: false, alpha: 1,
          phase: 'waiting', phaseAge: 0, phaseStartedAt: 0,
          punchIndex: 0, punchProgress: 0, exitAt: BACKUP.call + BACKUP.arrive + index * BACKUP.exitStagger })) });
    } else {
      for (let i = 0; i < 3; i++) {
        const x = clamp(target.x - f.facing * (110 - i * 55), 70, 1210);
        this.specials.push({ kind, owner: f.id, x, y: 350 + i * 26,
          vx: (target.x - x) / .52, vy: -(490 + i * 35), width: 76, height: 58,
          ttl: 1.4, age: 0, facing: f.facing, hitIds: [], active: false, delay: .10 + i * .16 });
      }
    }
    this.events.push({ type: 'special', fighter: f.id, kind });
    return true;
  }

  jump(f) {
    if (!this.canAct(f) || f.jumps >= 2) return false;
    f.vy = f.jumps ? 570 : 620;
    f.jumps++; f.grounded = false;
    if ((f.type === 'karate' || f.type === 'snitchy') && f.jumps === 2) {
      f.flipRemaining = f.flipDuration; f.flipProgress = 0; f.flipDirection = f.facing;
    }
    this.setState(f, 'jump');
    this.events.push({ type: 'jump', fighter: f.id, double: f.jumps === 2 });
    return true;
  }

  update(dt, input = {}) {
    dt = clamp(Number(dt) || 0, 0, 1 / 30);
    if (!dt) return;
    this.updateEffects(dt);
    if (this.over) return;
    this.elapsed += dt;
    if (this.roundEnding) {
      const [player, enemy] = this.fighters;
      this.updateFighter(player, enemy, dt, {});
      this.updateFighter(enemy, player, dt, {});
      this.updateSpecials(dt);
      if (!this.hasPresentations()) this.finish(this.roundEnding.winner);
      return;
    }
    this.timeRemaining = Math.max(0, this.timeRemaining - dt);
    const [player, enemy] = this.fighters;
    const aiInput = this.aiEnabled ? this.updateAI(dt) : {};
    this.updateFighter(player, enemy, dt, input);
    this.updateFighter(enemy, player, dt, aiInput);
    this.updateSpecials(dt);
    this.separateFighters();
    if (player.hp <= 0 || enemy.hp <= 0 || this.timeRemaining <= 0) {
      const winner = player.hp === enemy.hp ? 'draw' : player.hp > enemy.hp ? 'p1' : 'p2';
      this.roundEnding = { winner, timedOut: this.timeRemaining <= 0 };
      for (const f of this.fighters) {
        f.attack = null; f.attackProgress = 0;
        if (!f.inCar && !f.beltLaunched) f.vx = 0;
        if (!this.isPresenting(f) && f.hp > 0) this.setState(f, 'idle');
      }
      if (!this.hasPresentations()) this.finish(winner);
    }
  }

  updateFighter(f, opponent, dt, input) {
    const moveX = Number.isFinite(input.moveX)
      ? clamp(input.moveX, -1, 1)
      : (input.right ? 1 : 0) - (input.left ? 1 : 0);
    f.stateTime += dt;
    if (f.flipRemaining > 0) {
      f.flipRemaining = Math.max(0, f.flipRemaining - dt);
      f.flipProgress = clamp(1 - f.flipRemaining / f.flipDuration, 0, 1);
    }
    f.invuln = Math.max(0, f.invuln - dt);
    f.specialCooldown = Math.max(0, f.specialCooldown - dt);
    f.actionRemaining = Math.max(0, f.actionRemaining - dt);
    if (f.beltHeldBy) {
      f.attack = null; f.attackProgress = 0; f.vx = 0; f.vy = 0;
      this.setState(f, 'beltHeld');
      return;
    }
    if (f.grabbedBy) {
      // The special positions the held opponent; input, gravity and basic attacks wait.
      f.attack = null; f.attackProgress = 0; f.vx = 0; f.vy = 0;
      this.setState(f, 'grabbed');
      return;
    }
    if (f.attack) {
      const attack = f.attack;
      attack.elapsed += dt;
      f.attackProgress = clamp(attack.elapsed / attack.duration, 0, 1);
      if (!attack.connected && attack.elapsed >= attack.start && attack.elapsed <= attack.end) {
        const forward = (opponent.x - f.x) * f.facing;
        if (forward >= -12 && forward < attack.range && Math.abs(opponent.y - f.y) < 112) {
          attack.connected = this.hit(f, opponent, attack.damage, attack.kind, attack.knock, attack.stun, f.x);
        }
      }
      if (f.attack && attack.elapsed >= attack.duration) {
        if (!attack.connected) this.events.push({ type: 'whiff', fighter: f.id, kind: attack.kind, style: attack.style });
        f.attack = null; f.attackProgress = 0;
      }
    }
    if (f.inCar) return;
    if (f.hp <= 0 && !this.isPresenting(f)) { this.setState(f, 'ko'); if (!f.beltLaunched) return; }
    if (this.roundEnding && f.state === 'special' && f.actionRemaining <= 1e-9) {
      this.setState(f, f.hp > 0 ? 'idle' : 'ko');
    }
    if (this.canAct(f)) {
      if (Math.abs(opponent.x - f.x) > 2) f.facing = opponent.x > f.x ? 1 : -1;
      if (input.specialPressed) this.useSpecial(f);
      if (this.canAct(f) && input.jumpPressed) this.jump(f);
      if (this.canAct(f) && input.punchPressed) this.startAttack(f, 'punch');
      else if (this.canAct(f) && input.kickPressed) this.startAttack(f, 'kick');
      if (this.canAct(f)) {
        if (input.block && f.grounded) {
          f.vx = 0; this.setState(f, 'block');
        } else {
          f.vx = moveX * 250;
          this.setState(f, !f.grounded ? 'jump' : moveX ? 'run' : 'idle');
        }
      }
    } else {
      const recoveryStep = f.attack && f.attack.elapsed > f.attack.end;
      // Let held attacks reposition after their hit window, without moving a stun or special.
      if (recoveryStep && moveX) f.vx = moveX * 105;
      else f.vx *= Math.exp(-7 * dt);
    }
    if (f.inCar) return;
    f.x = clamp(f.x + f.vx * dt, 100, 1180);
    if (!f.grounded || f.vy > 0) {
      f.y += f.vy * dt;
      f.vy -= 1800 * dt;
      if (f.y <= 0) {
        f.y = 0; f.vy = 0; f.grounded = true; f.jumps = 0;
        f.beltLaunched = false;
        f.flipRemaining = 0; f.flipProgress = 0;
        this.events.push({ type: 'land', fighter: f.id, x: f.x, y: 0 });
        if (this.canAct(f)) this.setState(f, 'idle');
      }
    }
  }

  hit(attacker, target, damage, kind, knock, stun, sourceX) {
    if (this.over || this.roundEnding || target.hp <= 0 || (target.invuln > 0 && kind !== 'belt') || target.inCar || this.isPresenting(target)) return false;
    const direction = sourceX < target.x ? 1 : -1;
    const basic = kind === 'punch' || kind === 'kick';
    const blocked = basic && target.state === 'block' && target.grounded && target.facing === -direction;
    const actualDamage = Math.min(target.hp, blocked ? 2 : damage);
    target.hp = Math.max(0, target.hp - actualDamage);
    attacker.damageDealt += actualDamage;
    if (!blocked) {
      target.attack = null; target.attackProgress = 0;
      target.state = target.hp ? 'hurt' : 'ko'; target.stateTime = 0;
      target.actionRemaining = stun;
      target.vx = direction * knock;
      target.invuln = kind === 'barrage' ? .04 : .075;
      target.flipRemaining = 0; target.flipProgress = 0;
      if ((kind === 'car' || kind === 'horse') && target.hp) {
        target.vy = kind === 'horse' ? HORSE.lift : 340; target.grounded = false;
      }
      // This is the ONLY meter-gain path. Specials, blocks, misses and time give none.
      if (basic) {
        const oldMeter = attacker.meter;
        attacker.meter = Math.min(100, attacker.meter + ATTACKS[kind].meter);
        attacker.landedHits++;
        if (oldMeter < 100 && attacker.meter === 100) this.events.push({ type: 'meterReady', fighter: attacker.id });
      }
    }
    this.events.push({ type: 'hit', x: target.x, y: target.y + 105, attacker: attacker.id,
      defender: target.id, damage: actualDamage,
      heavy: kind === 'kick' || kind === 'car' || kind === 'wing' || kind === 'munch' || kind === 'horse' || (kind === 'barrage' && knock >= 300) || (kind === 'backup' && knock >= 280) || ((kind === 'vocal' || kind === 'yell') && knock >= 300),
      blocked, kind, style: ['getit', 'dr-no-bunnies'].includes(attacker.type) && kind === 'punch' ? 'slap' : kind });
    return true;
  }

  updateSpecials(dt) {
    const alive = [];
    for (const s of this.specials) {
      if (s.delay > 0) {
        s.delay -= dt;
        if (s.delay > 0) { alive.push(s); continue; }
        s.active = true;
      }
      s.age += dt; s.ttl -= dt;
      const owner = this.fighters.find(f => f.id === s.owner);
      const target = this.fighters.find(f => f.id !== s.owner);
      if (s.kind === 'belt') {
        this.updateBelt(s, owner, target);
        if (s.controller.active) alive.push(s);
        else this.endBelt(owner, s);
        continue;
      }
      if (s.kind === 'horse') {
        this.updateHorse(s, owner, target);
        if (s.ttl > 1e-9 && s.active) alive.push(s);
        else this.endHorse(owner, s);
        continue;
      }
      if (s.kind === 'munch') {
        this.updateMunch(s, owner, target);
        if (s.ttl > 1e-9 && s.active) alive.push(s);
        else this.endMunch(owner, s);
        continue;
      }
      if (s.kind === 'wing') {
        this.updateWing(s, owner, target, dt);
        if (s.ttl > 1e-9 && s.active) alive.push(s);
        else { s.active = false; if (s.projectile) s.projectile.active = false; this.endWing(owner); }
        continue;
      }
      if (s.kind === 'yell') {
        this.updateYell(s, owner, target);
        if (s.ttl > 1e-9 && s.active) alive.push(s);
        else { s.active = false; this.endYell(owner); }
        continue;
      }
      if (s.kind === 'vocal') {
        this.updateVocal(s, owner, target, dt);
        if (s.ttl > 1e-9 && s.active) alive.push(s);
        else this.endVocal(owner);
        continue;
      }
      if (s.kind === 'backup') {
        this.updateBackup(s, owner, target, dt);
        if (s.ttl > 1e-9 && s.active) alive.push(s);
        else this.endBackup(owner);
        continue;
      }
      if (s.kind === 'barrage') {
        this.updateBarrage(s, owner, target, dt);
        if (s.ttl > 1e-9) alive.push(s);
        else this.endBarrage(owner);
        continue;
      }
      s.x += s.vx * dt; s.y += s.vy * dt;
      if (s.kind === 'owl') {
        s.vy -= 190 * dt;
        if (!s.hitIds.includes(target.id) && Math.abs(target.x - s.x) < 68 && Math.abs(target.y + 100 - s.y) < 66) {
          if (this.hit(owner, target, 10, 'owl', 135, .16, s.x - s.facing * 25) || this.roundEnding) s.hitIds.push(target.id);
        }
      } else {
        owner.x = clamp(s.x, 100, 1180);
        if (!s.hitIds.includes(target.id) && Math.abs(target.x - s.x) < s.width / 2 + 30 && target.y < 145) {
          if (this.hit(owner, target, 36, 'car', 520, .42, s.x - s.facing * 30)) s.hitIds.push(target.id);
        }
      }
      const expired = s.ttl <= 1e-9 || s.x < -270 || s.x > 1550 || (s.kind === 'owl' && (s.y < -45 || s.hitIds.length));
      if (!expired) alive.push(s);
      else if (s.kind === 'car') this.dismount(owner, s);
    }
    this.specials = alive;
  }

  updateEffects(dt) {
    for (const effect of this.effects) { effect.age += dt; effect.ttl -= dt; }
    this.effects = this.effects.filter(effect => effect.ttl > 1e-9);
  }

  updateBelt(s, owner, target) {
    // Lock an ordinary target for the complete three-strike presentation. A
    // simultaneously activated special keeps its own full protection instead.
    if (s.strikeIndex < 3 && !this.isPresenting(target) && !target.inCar && !target.grabbedBy) {
      target.beltHeldBy = owner.id;
      target.x = s.holdX; target.y = s.holdY; target.vx = 0; target.vy = 0;
      target.attack = null; target.attackProgress = 0;
      target.facing = -s.facing; this.setState(target, 'beltHeld');
    }
    s.phase = s.age < .32 ? 'draw' : s.age < 2.33 ? 'striking' : 'recovery';
    const next = BELT.hits.find(hit => hit.atMs / 1000 + .18 > s.age);
    const until = next ? next.atMs / 1000 - s.age : -1;
    s.spriteIndex = s.age < .16 ? 0 : s.age < .32 ? 1
      : until > .24 ? 2 : until > .08 ? 3 : until > -.07 ? 4
      : until > -.18 ? 5 : s.age < 2.5 ? 6 : 7;
    s.controller.tick((s.age + 1e-9) * 1000);
  }

  endBelt(owner, s) {
    s.active = false; s.controller.active = false;
    const target = this.fighters.find(f => f.id === s.targetId);
    if (target?.beltHeldBy === s.owner) {
      target.beltHeldBy = null; target.actionRemaining = 0;
      this.setState(target, target.hp > 0 ? 'idle' : 'ko');
    }
    if (!owner) return;
    owner.beltActive = false; owner.actionRemaining = 0; owner.vx = 0;
    this.setState(owner, owner.hp > 0 ? 'idle' : 'ko');
  }

  updateHorse(s, owner, target) {
    const horse = s.horse;
    const exitAt = s.windup + s.chargeDuration;
    s.phase = s.age < s.windup ? 'windup' : s.age < exitAt ? 'charge' : 'recovery';
    s.phaseStartedAt = s.phase === 'windup' ? 0 : s.phase === 'charge' ? s.windup : exitAt;
    s.phaseAge = Math.max(0, s.age - s.phaseStartedAt);
    s.progress = clamp(s.age / s.duration, 0, 1);
    // Eight authored caster poses: gather, raise, call, point, hold, follow, lower, guard.
    s.spriteIndex = s.age < .14 ? 0 : s.age < .28 ? 1 : s.age < s.windup ? 2
      : s.age < .68 ? 3 : s.age < exitAt - .22 ? 4 : s.age < exitAt ? 5
      : s.phaseAge < s.recovery / 2 ? 6 : 7;
    horse.previousX = horse.x;
    horse.age = clamp(s.age - s.windup, 0, s.chargeDuration);
    horse.x = horse.startX + s.facing * s.speed * horse.age;
    horse.frame = horse.spriteIndex = Math.floor(horse.age / .065) % 8;
    horse.visible = s.age >= s.windup && s.age < exitAt;
    horse.active = horse.visible;
    if (!s.entered && s.age + 1e-9 >= s.windup) {
      s.entered = true;
      this.events.push({ type: 'horseEnter', fighter: owner.id, x: horse.startX,
        y: 0, facing: s.facing });
    }
    if (s.entered && !s.exited) {
      while (s.stepIndex * s.stepInterval <= horse.age + 1e-9) {
        const stepAge = s.stepIndex++ * s.stepInterval;
        const x = horse.startX + s.facing * s.speed * stepAge;
        // Hoofbeats begin when the animal is on screen and stop after it has passed.
        if (x > -horse.width / 2 && x < 1280 + horse.width / 2) {
          this.events.push({ type: 'horseStep', fighter: owner.id, x, y: 0,
            facing: s.facing, index: s.stepIndex - 1 });
        }
      }
      const forward = (target.x - s.ownerStartX) * s.facing;
      // The authored hoof anchor is forward of the body center: the nose extends
      // 124px ahead while the tail extends 188px behind. Mirror those extents,
      // then expand by the opponent's 28px half-width so contact matches the art.
      const front = s.frontReach + 28, back = s.backReach + 28;
      const left = target.x - (s.facing > 0 ? front : back);
      const right = target.x + (s.facing > 0 ? back : front);
      // Sweep the charging body through the torso hurtbox. A high jump clears it.
      const contact = forward >= 0 ? sweptHit(horse.previousX, 88, horse.x, 88,
        left, right, target.y + 105 - (horse.height / 2 + 38),
        target.y + 105 + (horse.height / 2 + 38)) : null;
      if (contact !== null && !s.hitIds.includes(target.id)) {
        if (this.hit(owner, target, s.damage, 'horse', s.knock, s.stun, target.x - s.facing)) {
          s.hitIds.push(target.id); s.hitCount++;
          const effect = { kind: 'horseImpact', owner: owner.id, defender: target.id,
            x: target.x, y: target.y + 105, facing: s.facing, age: 0, ttl: .42, duration: .42 };
          this.effects.push(effect);
          this.events.push({ type: 'horseImpact', fighter: owner.id, damage: s.damage, ...effect });
        }
      }
    }
    if (!s.exited && s.age + 1e-9 >= exitAt) {
      s.exited = true; horse.visible = false; horse.active = false; horse.x = horse.endX;
      this.events.push({ type: 'horseExit', fighter: owner.id, x: horse.x,
        y: 0, facing: s.facing, reason: 'complete' });
    }
    if (s.age >= s.duration - 1e-9) s.active = false;
  }

  endHorse(owner, s, reason = 'complete') {
    s.active = false; s.horse.active = false; s.horse.visible = false;
    if (reason !== 'complete') this.effects = (this.effects || []).filter(effect =>
      effect.kind !== 'horseImpact' || effect.owner !== s.owner);
    if (!s.exited && s.entered) this.events.push({ type: 'horseExit', fighter: s.owner,
      x: s.horse.x, y: 0, facing: s.facing, reason });
    s.exited = true;
    if (!owner) return;
    owner.horseActive = false;
    if (owner.state === 'special') {
      owner.actionRemaining = 0; owner.vx = 0;
      this.setState(owner, owner.hp > 0 ? 'idle' : 'ko');
    }
  }

  updateMunch(s, owner, target) {
    s.mouthX = owner.x + s.facing * s.mouthForward;
    s.mouthY = owner.y + s.mouthHeight;
    s.x = s.mouthX; s.y = s.mouthY;
    const stages = [[.20, 'windup', 0, 0], [s.catchAt, 'reach', .20, 1],
      [s.liftEnd, 'lift', s.catchAt, 2], [s.biteTimes[0], 'open', s.liftEnd, 3],
      [.92, 'chomp', s.biteTimes[0], 4], [s.biteTimes[1], 'open', .92, 5],
      [1.22, 'chomp', s.biteTimes[1], 4], [s.biteTimes[2], 'open', 1.22, 5],
      [s.releaseAt, 'chomp', s.biteTimes[2], 4],
      [s.recoveryAt, 'release', s.releaseAt, 6], [s.duration, 'recovery', s.recoveryAt, 7]];
    const stage = stages.find(([end]) => s.age < end) || stages.at(-1);
    [, s.phase, s.phaseStartedAt, s.spriteIndex] = stage;
    s.phaseAge = Math.max(0, s.age - s.phaseStartedAt);
    s.progress = clamp(s.age / s.duration, 0, 1);

    if (!s.catchAttempted && s.age + 1e-9 >= s.catchAt) {
      s.catchAttempted = true;
      const forward = (target.x - owner.x) * s.facing;
      // Catch once at the end of the visible reach. Jumping or leaving range avoids it.
      if (!this.roundEnding && target.hp > 0 && target.grounded && target.y <= 4
        && forward >= 0 && forward <= s.range && !target.inCar && !target.grabbedBy
        && target.invuln <= 0 && !this.isPresenting(target)) {
        s.targetId = target.id; s.grabbed = true;
        s.grabStartX = target.x; s.grabStartY = target.y + 105;
        target.grabbedBy = owner.id; target.attack = null; target.attackProgress = 0;
        target.flipRemaining = 0; target.flipProgress = 0;
        target.vx = 0; target.vy = 0;
        this.events.push({ type: 'munchGrab', fighter: owner.id, targetId: target.id,
          defender: target.id, x: s.mouthX, y: s.mouthY, facing: s.facing });
      }
    }
    if (s.grabbed) this.holdMunchTarget(s, owner, target);
    while (s.biteIndex < s.biteTimes.length && s.age + 1e-9 >= s.biteTimes[s.biteIndex]) {
      const index = s.biteIndex++, final = index === s.biteTimes.length - 1;
      const connected = s.grabbed && target.id === s.targetId && target.grabbedBy === owner.id
        && this.hit(owner, target, s.biteDamage, 'munch', 0, .30, owner.x);
      if (connected) {
        s.hitCount++;
        if (!s.hitIds.includes(target.id)) s.hitIds.push(target.id);
      }
      this.events.push({ type: 'munchBite', fighter: owner.id, targetId: s.targetId,
        defender: s.targetId, index, final, connected: Boolean(connected),
        x: s.mouthX, y: s.mouthY, facing: s.facing });
      // Damage changes the ordinary hurt state; keep the presentation's held pose.
      if (s.grabbed) this.holdMunchTarget(s, owner, target);
    }
    if (!s.released && s.age + 1e-9 >= s.releaseAt) this.releaseMunch(s, 'complete');
    if (s.age >= s.duration - 1e-9) s.active = false;
  }

  holdMunchTarget(s, owner, target) {
    if (!target || target.id !== s.targetId || target.grabbedBy !== owner.id) {
      s.grabbed = false;
      return;
    }
    const lift = clamp((s.age - s.catchAt) / (s.liftEnd - s.catchAt), 0, 1);
    const ease = lift * lift * (3 - 2 * lift);
    s.targetX = s.grabStartX + (clamp(owner.x + s.facing * s.holdForward, 100, 1180) - s.grabStartX) * ease;
    s.targetY = s.grabStartY + (owner.y + s.holdHeight - s.grabStartY) * ease;
    // targetX/Y are the display torso center. Fighter y retains its feet-above-floor meaning.
    target.x = s.targetX; target.y = Math.max(0, s.targetY - 105);
    target.vx = 0; target.vy = 0; target.grounded = false; target.facing = -s.facing;
    target.actionRemaining = Math.max(.05, s.releaseAt - s.age);
    this.setState(target, 'grabbed');
  }

  releaseMunch(s, reason = 'complete') {
    if (s.released) return;
    s.released = true;
    const target = this.fighters.find(f => f.id === s.targetId);
    const held = s.grabbed && target?.grabbedBy === s.owner;
    s.grabbed = false;
    if (!held) return;
    target.grabbedBy = null; target.attack = null; target.attackProgress = 0;
    target.actionRemaining = reason === 'complete' && target.hp > 0 ? .28 : 0;
    target.invuln = 0;
    if (reason === 'complete' && target.hp > 0) {
      target.vx = s.facing * 290; target.vy = 220; target.grounded = false;
      this.setState(target, 'hurt');
    } else {
      target.y = 0; target.vx = 0; target.vy = 0; target.grounded = true;
      this.setState(target, target.hp > 0 ? 'idle' : 'ko');
    }
    this.events.push({ type: 'munchRelease', fighter: s.owner, targetId: target.id,
      defender: target.id, x: s.targetX, y: s.targetY, facing: s.facing, reason });
  }

  endMunch(owner, s, reason = 'complete') {
    this.releaseMunch(s, reason);
    s.active = false;
    if (!owner) return;
    owner.munchActive = false;
    if (owner.state === 'special') {
      owner.actionRemaining = 0; owner.vx = 0;
      this.setState(owner, owner.hp > 0 ? 'idle' : 'ko');
    }
  }

  updateWing(s, owner, target, dt) {
    // Once activated, the complete bite, throw, and projectile sequence plays out.
    // Measured release-hand position in the authored sprite at the game's 215px height.
    if (!s.released) { s.x = owner.x + s.facing * s.handForward; s.y = owner.y + s.handHeight; }
    const phases = [[.18, 'reveal', 0], [.34, 'raise', .18], [.58, 'bite', .34],
      [.76, 'pullback', .58], [.96, 'windup', .76], [1.10, 'release', .96],
      [1.28, 'followthrough', 1.10], [s.actorDuration, 'recovery', 1.28]];
    const phase = phases.find(([end]) => s.age < end);
    s.phase = phase?.[1] || 'flight'; s.phaseStartedAt = phase?.[2] ?? s.actorDuration;
    s.phaseAge = Math.max(0, s.age - s.phaseStartedAt); s.progress = clamp(s.age / s.actorDuration, 0, 1);
    if (!s.bitten && s.age + 1e-9 >= s.biteAt) {
      s.bitten = true;
      this.events.push({ type: 'wingBite', fighter: owner.id, x: owner.x + s.facing * 27, y: owner.y + 165, facing: s.facing });
    }
    if (!s.released && s.age + 1e-9 >= s.releaseAt) {
      s.released = true;
      const groundAt = (s.rise + Math.sqrt(s.rise * s.rise + 2 * s.gravity * s.y)) / s.gravity;
      const edgeAt = Math.max(0, (s.facing > 0 ? 1280 - s.x : s.x) / s.speed);
      const maxAge = Math.min(s.projectileDuration, s.range / s.speed, groundAt, edgeAt);
      s.projectile = { x: s.x, y: s.y, previousX: s.x, previousY: s.y,
        startX: s.x, startY: s.y, ownerStartX: owner.x, vx: s.facing * s.speed, vy: s.rise,
        facing: s.facing, age: 0, ttl: maxAge, maxAge, groundAt, edgeAt, angle: 0,
        progress: 0, active: true, hitIds: [], width: s.projectileWidth, height: s.projectileHeight };
      this.events.push({ type: 'wingThrow', fighter: owner.id, x: s.x, y: s.y, facing: s.facing });
    }
    const wing = s.projectile;
    if (wing?.active) {
      const flightDt = Math.min(dt, Math.max(0, s.age - s.releaseAt));
      wing.previousX = wing.x; wing.previousY = wing.y;
      wing.age = Math.min(wing.maxAge, wing.age + flightDt); wing.ttl = Math.max(0, wing.maxAge - wing.age);
      wing.x = wing.startX + wing.vx * wing.age;
      wing.y = Math.max(0, wing.startY + s.rise * wing.age - .5 * s.gravity * wing.age * wing.age);
      wing.vy = s.rise - s.gravity * wing.age; wing.angle = wing.facing * wing.age * 12;
      wing.progress = clamp(wing.age * s.speed / s.range, 0, 1);
      const forward = (target.x - wing.ownerStartX) * wing.facing;
      const halfW = wing.width / 2 + 28, halfH = wing.height / 2 + 48;
      const contact = forward >= 0 ? sweptHit(wing.previousX, wing.previousY, wing.x, wing.y,
        target.x - halfW, target.x + halfW, target.y + 105 - halfH, target.y + 105 + halfH) : null;
      if (contact !== null && !wing.hitIds.includes(target.id)) {
        const connected = this.hit(owner, target, 36, 'wing', 360, .38, target.x - s.facing);
        if (connected || this.roundEnding) {
          wing.x = wing.previousX + (wing.x - wing.previousX) * contact;
          wing.y = wing.previousY + (wing.y - wing.previousY) * contact;
          wing.hitIds.push(target.id); s.hitIds.push(target.id);
          if (connected) s.hitCount++;
          wing.active = false;
          this.wingImpact(s, target.x, wing.y, 'hit', false, target.id);
        }
      }
      if (wing.active && wing.ttl <= 1e-9) {
        wing.active = false;
        const reason = Math.abs(wing.maxAge - wing.groundAt) < 1e-6 ? 'ground'
          : Math.abs(wing.maxAge - wing.edgeAt) < 1e-6 ? 'edge' : 'range';
        this.wingImpact(s, wing.x, wing.y, reason, false, null);
      }
    }
    if (s.age >= s.actorDuration - 1e-9 && s.released && !wing?.active) s.active = false;
  }

  wingImpact(s, x, y, reason, blocked, defender) {
    const effect = { kind: 'wingImpact', owner: s.owner, defender, x, y,
      facing: s.facing, reason, blocked, age: 0, ttl: .35, duration: .35 };
    this.effects.push(effect); this.events.push({ type: 'wingImpact', ...effect });
  }

  endWing(f) {
    if (f.wingActive) this.events.push({ type: 'wingEnd', fighter: f.id });
    f.wingActive = false;
    if (f.state === 'special') { f.actionRemaining = 0; f.vx = 0; this.setState(f, 'idle'); }
  }

  updateYell(s, owner, target) {
    // The shout stays attached to the mouth and keeps its committed direction.
    s.x = owner.x + s.facing * 65; s.y = owner.y + 137;
    const nextPhase = s.age < s.windup ? 'windup'
      : s.age < s.windup + s.yellDuration ? 'yelling' : 'recovery';
    if (nextPhase !== s.phase) {
      s.phase = nextPhase;
      s.phaseStartedAt = nextPhase === 'yelling' ? s.windup : s.windup + s.yellDuration;
      if (nextPhase === 'yelling') this.events.push({ type: 'yellStart', fighter: owner.id,
        x: s.x, y: s.y, facing: s.facing, duration: s.yellDuration });
    }
    s.phaseAge = Math.max(0, s.age - s.phaseStartedAt);
    s.progress = clamp(s.age / s.duration, 0, 1);
    s.yellProgress = clamp((s.age - s.windup) / s.yellDuration, 0, 1);
    while (s.pulseIndex < s.pulsesTotal && s.age + 1e-9 >= s.windup + s.pulseIndex * s.interval) {
      const index = s.pulseIndex++, final = index === s.pulsesTotal - 1;
      const forward = (target.x - s.x) * s.facing;
      const halfHeight = s.nearHalfHeight + (s.farHalfHeight - s.nearHalfHeight)
        * clamp(forward / s.range, 0, 1);
      // Use the torso hurtbox: a timed jump can pass above the narrow near cone.
      if (forward >= 0 && forward <= s.range && Math.abs(target.y + 120 - s.y) <= halfHeight + 28) {
        if (this.hit(owner, target, 9, 'yell', final ? 360 : 45, final ? .35 : .16, owner.x)) {
          s.hitCount++;
          if (!s.hitIds.includes(target.id)) s.hitIds.push(target.id);
        }
      }
      this.events.push({ type: 'yellPulse', fighter: owner.id, index, final,
        x: s.x, y: s.y, facing: s.facing });
    }
    if (s.age >= s.duration - 1e-9) s.active = false;
  }

  endYell(f) {
    if (f.yellActive) this.events.push({ type: 'yellEnd', fighter: f.id });
    f.yellActive = false;
    if (f.state === 'special') { f.actionRemaining = 0; f.vx = 0; this.setState(f, 'idle'); }
  }

  updateVocal(s, owner, target, dt) {
    // All notes and the final explosion remain part of the committed presentation.
    s.x = owner.x + s.facing * 75;
    s.y = 120;
    const finalAt = s.windup + (s.wavesTotal - 1) * s.interval;
    const nextPhase = s.age < s.windup ? 'windup'
      : s.age < finalAt ? 'singing' : s.age < finalAt + .25 ? 'highNote'
      : s.age < s.singDuration ? 'recovery' : 'tail';
    if (nextPhase !== s.phase) { s.phase = nextPhase; s.phaseStartedAt = s.age; }
    s.phaseAge = s.age - (s.phaseStartedAt || 0);
    s.progress = clamp(s.age / s.singDuration, 0, 1);
    while (s.waveIndex < s.wavesTotal && s.age + 1e-9 >= s.windup + s.waveIndex * s.interval) {
      const index = s.waveIndex++, final = index === s.wavesTotal - 1;
      const bornAt = s.windup + index * s.interval;
      s.waves.push({ index, final, x: s.x, previousX: s.x, y: s.y,
        startX: s.x, vx: s.facing * s.speed, facing: s.facing, age: 0,
        ttl: s.range / s.speed, progress: 0, active: true, hitIds: [], bornAt,
        width: final ? 104 : s.waveWidth, height: final ? 156 : s.waveHeight });
      this.events.push({ type: 'vocalWave', fighter: owner.id, index, final, x: s.x, y: s.y, facing: s.facing });
    }
    for (const wave of s.waves) {
      if (!wave.active) continue;
      const waveDt = Math.min(dt, Math.max(0, s.age - wave.bornAt));
      wave.previousX = wave.x;
      wave.x += wave.vx * waveDt;
      wave.age += waveDt; wave.ttl -= waveDt;
      wave.progress = clamp(wave.age * s.speed / s.range, 0, 1);
      // Swept collision keeps the narrow sound wave reliable across simulation rates.
      const left = Math.min(wave.previousX, wave.x) - wave.width / 2;
      const right = Math.max(wave.previousX, wave.x) + wave.width / 2;
      if (!wave.hitIds.includes(target.id) && target.x >= left && target.x <= right
        && Math.abs(target.y + 100 - wave.y) < wave.height / 2 + 20) {
        const connected = this.hit(owner, target, wave.final ? 18 : 6, 'vocal', wave.final ? 360 : 0,
          wave.final ? .40 : .16, target.x - s.facing);
        if (connected || this.roundEnding) {
          wave.hitIds.push(target.id); wave.active = false;
          if (connected) s.hitCount++;
          if (!s.hitIds.includes(target.id)) s.hitIds.push(target.id);
          if (wave.final) {
            const effect = { kind: 'vocalExplosion', x: target.x, y: target.y + 105,
              facing: s.facing, age: 0, ttl: .55, duration: .55,
              blocked: false, defender: target.id, owner: owner.id };
            this.effects.push(effect);
            this.events.push({ type: 'vocalExplosion', ...effect });
          }
        }
      }
      if (wave.ttl <= 0 || wave.x < -160 || wave.x > 1440) wave.active = false;
    }
    if (s.waveIndex === s.wavesTotal && s.waves.every(wave => !wave.active)
      && s.age >= s.singDuration) s.active = false;
  }

  endVocal(f) {
    f.vocalActive = false;
    if (f.state === 'special') { f.actionRemaining = 0; f.vx = 0; this.setState(f, 'idle'); }
  }

  updateBarrage(s, owner, target, dt) {
    const approachDt = Math.max(0, Math.min(dt, s.windup - (s.age - dt)));
    const step = Math.min(s.approachRemaining, approachDt * 300);
    owner.x = clamp(owner.x + s.facing * step, 100, 1180);
    s.approachRemaining -= step;
    s.x = owner.x + s.facing * 90; s.y = owner.y + 105;
    s.progress = clamp((s.age - s.windup) / (s.interval * s.punchesTotal), 0, 1);
    while (s.punchIndex < s.punchesTotal && s.age + 1e-9 >= s.windup + s.punchIndex * s.interval) {
      s.punchIndex++;
      const forward = (target.x - owner.x) * s.facing;
      const final = s.punchIndex === s.punchesTotal;
      if (forward >= 0 && forward <= s.range && Math.abs(target.y - owner.y) < 112) {
        if (this.hit(owner, target, 3, 'barrage', final ? 300 : 0, final ? .35 : .115, owner.x)) {
          s.hitCount++;
          if (!s.hitIds.includes(target.id)) s.hitIds.push(target.id);
        }
      }
      this.events.push({ type: 'barragePunch', fighter: owner.id, index: s.punchIndex,
        final, x: s.x, y: s.y, facing: s.facing });
    }
  }

  endBarrage(f) {
    f.outfit = 'blue';
    if (f.state === 'special') { f.actionRemaining = 0; f.vx = 0; this.setState(f, 'idle'); }
  }

  updateBackup(s, owner, target, dt) {
    const phase = (item, name) => {
      if (item.phase !== name) { item.phase = name; item.phaseStartedAt = s.age; }
      item.phaseAge = s.age - item.phaseStartedAt;
    };
    const { car, officers } = s;
    const driveEnd = BACKUP.call + BACKUP.arrive;
    const leaveAt = s.attackAt === null ? Infinity : s.attackAt + BACKUP.attackDuration;
    car.visible = s.age >= BACKUP.call;
    car.progress = clamp((s.age - BACKUP.call) / BACKUP.arrive, 0, 1);
    car.x = car.startX + (car.stopX - car.startX) * (1 - Math.pow(1 - car.progress, 3));
    car.phase = s.age < BACKUP.call ? 'waiting' : s.age < driveEnd ? 'arriving' : 'parked';
    car.doorsOpen = s.age >= driveEnd && (s.age < driveEnd + BACKUP.exit + 2 * BACKUP.exitStagger || s.age >= leaveAt);

    if (s.departAt !== null) {
      phase(s, 'departing');
      car.phase = 'departing'; car.doorsOpen = false;
      car.progress = clamp((s.age - s.departAt) / BACKUP.departDuration, 0, 1);
      const exitX = s.facing > 0 ? 1510 : -230;
      car.x = car.stopX + (exitX - car.stopX) * car.progress * car.progress;
      if (car.progress >= 1) s.active = false;
      s.x = car.x;
      return;
    }

    if (s.age >= leaveAt) {
      phase(s, 'returning');
      for (const o of officers) {
        o.y = 0; o.punchProgress = 0;
        if (o.phase === 'inCar') continue;
        phase(o, 'return');
        const dx = o.doorX - o.x;
        o.facing = dx >= 0 ? 1 : -1;
        o.x += Math.sign(dx) * Math.min(Math.abs(dx), 900 * dt);
        o.alpha = clamp((BACKUP.returnDeadline - (s.age - leaveAt)) / .2, 0, 1);
        if (Math.abs(o.x - o.doorX) <= 12) { phase(o, 'inCar'); o.visible = false; }
      }
      if ((officers.every(o => o.phase === 'inCar') && s.age - leaveAt >= .2) || s.age - leaveAt >= BACKUP.returnDeadline) {
        s.departAt = s.age;
        for (const o of officers) { phase(o, 'inCar'); o.visible = false; }
      }
      return;
    }

    for (const o of officers) {
      if (s.age < o.exitAt) { o.visible = false; continue; }
      o.visible = true;
      if (s.age < o.exitAt + BACKUP.exit) {
        phase(o, 'exit');
        const p = clamp((s.age - o.exitAt) / BACKUP.exit, 0, 1);
        o.x = o.doorX + s.facing * (28 + o.index * 8) * p;
        o.y = Math.sin(p * Math.PI) * 22;
      } else if (s.attackAt === null) {
        o.y = 0;
        o.facing = target.x >= o.x ? 1 : -1;
        const destination = clamp(target.x - o.facing * (62 + o.index * 36), 100, 1180);
        const dx = destination - o.x;
        o.x += Math.sign(dx) * Math.min(Math.abs(dx), BACKUP.rushSpeed * dt);
        phase(o, Math.abs(dx) > 10 ? 'rush' : 'ready');
      } else {
        o.y = 0;
        const start = s.attackAt + o.index * BACKUP.punchStagger;
        const elapsed = s.age - start;
        phase(o, elapsed < 0 ? 'ready' : 'attack');
        o.phaseAge = Math.max(0, elapsed);
        const cycle = Math.min(BACKUP.punchesEach - 1, Math.floor(Math.max(0, elapsed) / BACKUP.punchInterval));
        o.punchProgress = clamp((elapsed - cycle * BACKUP.punchInterval) / BACKUP.punchInterval, 0, 1);
        while (o.punchIndex < BACKUP.punchesEach && s.age + 1e-9 >= start + BACKUP.punchWindup + o.punchIndex * BACKUP.punchInterval) {
          o.punchIndex++; s.punchIndex++;
          const final = o.index === 2 && o.punchIndex === BACKUP.punchesEach;
          const forward = (target.x - o.x) * o.facing;
          if (forward >= 0 && forward <= BACKUP.range && target.y < 115) {
            if (this.hit(owner, target, 4, 'backup', final ? 280 : 0, final ? .30 : .135, o.x)) {
              s.hitCount++;
              if (!s.hitIds.includes(target.id)) s.hitIds.push(target.id);
            }
          }
          this.events.push({ type: 'backupPunch', fighter: owner.id, officer: o.index,
            index: o.punchIndex, final, x: o.x + o.facing * 75, y: 95, facing: o.facing });
        }
      }
    }

    if (s.attackAt === null && (s.age >= BACKUP.rushDeadline || officers.every(o => o.visible && o.phase !== 'exit' && Math.abs(target.x - o.x) < BACKUP.range - 8))) {
      s.attackAt = s.age + .10;
    }
    phase(s, s.age < BACKUP.call ? 'calling' : s.age < driveEnd ? 'arriving'
      : s.age < driveEnd + BACKUP.exit + 2 * BACKUP.exitStagger ? 'exiting'
      : s.attackAt === null ? 'rushing' : s.age < s.attackAt ? 'ready' : 'attacking');
  }

  endBackup(f) {
    f.backupActive = false;
    if (f.state === 'special') { f.actionRemaining = 0; f.vx = 0; this.setState(f, 'idle'); }
  }

  dismount(f, car) {
    f.inCar = false;
    f.x = clamp(car.x - car.facing * 55, 100, 1180);
    f.y = 0; f.vy = 0; f.vx = 0; f.grounded = true; f.jumps = 0;
    f.actionRemaining = 0; f.invuln = 0;
    this.setState(f, 'idle');
  }

  separateFighters() {
    const [a, b] = this.fighters;
    if (a.inCar || b.inCar || a.grabbedBy || b.grabbedBy || a.beltHeldBy || b.beltHeldBy || a.y > 65 || b.y > 65) return;
    const dx = b.x - a.x;
    if (Math.abs(dx) >= 88) return;
    const direction = dx === 0 ? a.facing : Math.sign(dx);
    const push = (88 - Math.abs(dx)) / 2;
    a.x = clamp(a.x - push * direction, 100, 1180);
    b.x = clamp(b.x + push * direction, 100, 1180);
  }

  updateAI(dt) {
    const [p, ai] = this.fighters;
    const distance = Math.abs(p.x - ai.x);
    this.ai.think -= dt;
    this.ai.blockFor = Math.max(0, this.ai.blockFor - dt);
    this.ai.retreatFor = Math.max(0, this.ai.retreatFor - dt);
    const input = { block: this.ai.blockFor > 0 };
    if (!input.block && !ai.inCar) {
      let move = distance > 145 ? Math.sign(p.x - ai.x) : 0;
      if (this.ai.retreatFor > 0) move = -Math.sign(p.x - ai.x);
      input.left = move < 0; input.right = move > 0;
    }
    if (this.ai.think <= 0) {
      this.ai.think = .35 + this.random() * .35;
      if (this.canAct(ai)) {
        const roll = this.random();
        const specialRange = ai.type === 'dr-no-bunnies' ? BELT.range : ai.type === 'icespice' ? MUNCH.range : ai.type === 'hehaw' ? 1200 : ai.type === 'karate' ? 230 : ai.type === 'getit' ? 730 : ai.type === 'loudbull' ? 610 : ai.type === 'fatboi' ? 750 : 850;
        const catchable = ai.type !== 'icespice' || (p.grounded && p.y <= 4 && !this.isPresenting(p));
        if (ai.meter >= 100 && distance < specialRange && catchable && roll > .12) input.specialPressed = true;
        else if (p.attack && distance < 225 && roll < .35) {
          this.ai.blockFor = .25 + this.random() * .3; input.block = true;
        } else if ((roll < .10 || ((ai.type === 'karate' || ai.type === 'snitchy') && ai.jumps === 1 && !ai.grounded && roll < .3)) && distance < 300) input.jumpPressed = true;
        else if (distance < 178) {
          if (roll < .19) this.ai.retreatFor = .22;
          else if (distance > 130 || roll > .55) input.kickPressed = true;
          else input.punchPressed = true;
        }
      }
    }
    return input;
  }

  finish(winner) {
    this.over = true; this.winner = winner;
    for (const s of this.specials) {
      const owner = this.fighters.find(f => f.id === s.owner);
      if (s.kind === 'car') this.dismount(owner, s);
      else if (s.kind === 'barrage') this.endBarrage(owner);
      else if (s.kind === 'backup') this.endBackup(owner);
      else if (s.kind === 'vocal') this.endVocal(owner);
      else if (s.kind === 'yell') this.endYell(owner);
      else if (s.kind === 'wing') { if (s.projectile) s.projectile.active = false; this.endWing(owner); }
      else if (s.kind === 'munch') this.endMunch(owner, s, 'finish');
      else if (s.kind === 'horse') this.endHorse(owner, s, 'finish');
      else if (s.kind === 'belt') this.endBelt(owner, s);
    }
    this.specials = [];
    for (const f of this.fighters) {
      f.attack = null; f.vx = 0; f.vy = 0;
      f.actionRemaining = 0;
      f.flipRemaining = 0; f.flipProgress = 0;
      if (f.hp <= 0) this.setState(f, 'ko');
      else if (f.state === 'special') this.setState(f, 'idle');
    }
    this.events.push({ type: 'ko', winner, timedOut: this.timeRemaining <= 0 });
  }
}
