import test from 'node:test';
import assert from 'node:assert/strict';
import { CombatGame } from '../dist/combat.js';
import { ELEVATOR_DROP as E, cranesPose as pose } from '../dist/cranes.js';

function match(side = 'p1', direction = 1, distance = 300) {
  const g = new CombatGame(side === 'p1' ? 'cranes' : 'owl', side === 'p1' ? 'owl' : 'cranes');
  g.aiEnabled = false;
  const a = g.fighters.find(f => f.type === 'cranes'), b = g.fighters.find(f => f !== a);
  a.x = direction > 0 ? 250 : 1030; b.x = a.x + direction * distance;
  a.facing = direction; b.facing = -direction;
  return { g, a, b };
}
function step(g, seconds, fps = 120, input = {}) {
  for (let n = 0; n < Math.round(seconds * fps); n++) g.update(1 / fps, input);
}

test('Cranes is selectable on either side with standard punch, kick, block and double jump rules', () => {
  for (const side of ['p1', 'p2']) {
    const { g, a, b } = match(side, 1, 100);
    g.startAttack(a, 'punch'); assert.equal(a.attack.style, 'punch'); step(g, .5);
    assert.equal(b.hp, 150); assert.equal(a.meter, 20);
    b.x = a.x + 100; b.state = 'block'; b.actionRemaining = 1;
    g.startAttack(a, 'punch'); step(g, .5); assert.equal(a.meter, 20);
    b.state = 'idle'; b.x = a.x + 100; g.startAttack(a, 'kick'); step(g, .6); assert.equal(a.meter, 45);
    assert.ok(g.jump(a)); step(g, .1); assert.ok(g.jump(a)); assert.equal(g.jump(a), false);
    assert.equal(a.flipRemaining, 0); step(g, 2); assert.ok(a.grounded);
  }
});

test('Eight elegant steps and all six kick phases return to a planted stance at every frame rate', () => {
  const steps = new Set();
  for (let i = 0; i < 120; i++) steps.add(pose({ state: 'run', grounded: true, vx: 250, facing: 1, stateTime: i / 120 }).index);
  assert.equal(steps.size, 8);
  for (const fps of [30, 60, 120]) {
    const { g, a, b } = match(); b.x = 1180;
    for (let repeat = 0; repeat < 3; repeat++) {
      g.startAttack(a, 'kick'); const seen = new Set();
      while (a.attack) { seen.add(pose(a).index); if (a.attack.elapsed >= .48) assert.equal(pose(a).index, 13); g.update(1 / fps, {}); }
      assert.deepEqual([...seen], [8, 9, 10, 11, 12, 13]); assert.equal(a.state, 'idle');
    }
  }
});

test('Elevator Drop consumes a full meter, grounds the caster and prevents overlapping specials', () => {
  const { g, a } = match(); a.meter = 99; assert.equal(g.useSpecial(a), false);
  a.meter = 100; g.jump(a); step(g, .1); assert.ok(g.useSpecial(a));
  assert.equal(a.meter, 0); assert.ok(a.grounded); assert.equal(a.y, 0); assert.ok(a.elevatorActive);
  a.meter = 100; assert.equal(g.useSpecial(a), false); assert.equal(g.startAttack(a, 'punch'), false);
  assert.equal(g.specials.length, 1);
});

test('The angry shout locks the landing location before the cab starts falling', () => {
  const { g, a, b } = match(); a.meter = 100; g.useSpecial(a); const s = g.specials[0];
  step(g, .3); assert.equal(s.shouted, false); assert.equal(s.bottom, E.startBottom);
  b.x = 680; step(g, .15); assert.ok(s.shouted); assert.equal(s.x, 680);
  b.x = 900; step(g, .5); assert.equal(s.x, 680); assert.equal(s.bottom, E.startBottom);
  assert.equal(g.drainEvents().filter(e => e.type === 'cranesShout').length, 1);
  step(g, .2); assert.ok(s.bottom < E.startBottom); assert.equal(s.phase, 'falling');
});

test('The elevator deals one 48-damage unblockable hit on both sides and directions at 30/60/120 fps', () => {
  for (const fps of [30, 60, 120]) for (const direction of [-1, 1]) for (const side of ['p1', 'p2']) {
    const { g, a, b } = match(side, direction); a.meter = 100; b.state = 'block'; b.actionRemaining = 5;
    g.useSpecial(a); const s = g.specials[0], poses = new Set();
    for (let n = 0; n < fps * 3; n++) {
      poses.add(pose(a, s).key + ':' + pose(a, s).index);
      g.update(1 / fps, {});
      if (s.age < E.dropAt) assert.equal(b.hp, 160);
    }
    assert.equal(b.hp, 112); assert.equal(s.hitCount, 1); assert.equal(a.meter, 0);
    const events = g.drainEvents();
    assert.deepEqual(events.filter(e => e.type === 'hit').map(e => [e.damage, e.blocked, e.kind]), [[48, false, 'elevator']]);
    assert.equal(events.filter(e => e.type === 'cranesShout').length, 1);
    assert.equal(events.filter(e => e.type === 'elevatorLand').length, 1);
    for (const i of [8, 9, 10, 11, 12, 13, 14]) assert.ok(poses.has('cranesActions:' + i), `Missing pose ${i}`);
    assert.equal(a.elevatorActive, false); assert.equal(pose(a).key, 'cranes'); assert.equal(g.effects.length, 0);
  }
});

test('Moving out of the warning evades the drop and the settled cab never deals a late hit', () => {
  for (const fps of [30, 60, 120]) {
    const { g, a, b } = match('p2', -1, 400); a.meter = 100; g.useSpecial(a);
    step(g, .5, fps); const s = g.specials[0], lockedX = s.x;
    step(g, 1.1, fps, { left: true });
    assert.equal(s.x, lockedX); assert.ok(s.landed); assert.equal(b.hp, 160);
    b.x = lockedX; step(g, 1, fps); assert.equal(b.hp, 160); assert.equal(s.hitCount, 0);
    assert.equal(a.meter, 0); assert.equal(g.specials.length, 0);
  }
});

test('A falling cab hits an airborne opponent without tunneling through the hurtbox', () => {
  for (const fps of [30, 60, 120]) {
    const { g, a, b } = match(); a.meter = 100; g.useSpecial(a); step(g, 1, fps);
    assert.ok(g.jump(b)); step(g, .45, fps); assert.equal(b.hp, 112);
    assert.ok(b.elevatorLaunched); assert.ok(b.y > 0);
    step(g, 2, fps); assert.equal(b.hp, 112);
  }
});

test('Opposing invulnerability is respected and the elevator still lands and clears', () => {
  const { g, a, b } = match(); a.meter = 100; b.invuln = 10; g.useSpecial(a);
  const s = g.specials[0]; step(g, 3); assert.equal(b.hp, 160); assert.equal(s.hitCount, 0);
  assert.ok(s.landed); assert.equal(g.specials.length, 0); assert.equal(g.effects.length, 0);
});

test('Protection lasts through the falling cab, impact and departure after caster recovery', () => {
  const { g, a, b } = match(); a.meter = 100; g.useSpecial(a); step(g, 2.2);
  assert.equal(pose(a).key, 'cranes'); assert.ok(g.isPresenting(a));
  assert.equal(g.hit(b, a, 15, 'kick', 300, .4, b.x), false); assert.equal(g.startAttack(a, 'kick'), false);
  step(g, .3); assert.equal(g.isPresenting(a), false); assert.equal(a.elevatorActive, false);
  assert.ok(g.hit(b, a, 10, 'punch', 180, .2, b.x));
});

test('KO and timeout finish the whole drop with a frozen result and no later damage', () => {
  for (const mode of ['ko', 'timeout']) {
    const { g, a, b } = match(); a.meter = 100; if (mode === 'ko') b.hp = 10;
    g.useSpecial(a); if (mode === 'timeout') g.timeRemaining = .01;
    step(g, 1.5); assert.ok(g.roundEnding); assert.equal(g.over, false);
    const clock = g.timeRemaining; step(g, 2); assert.ok(g.over); assert.equal(g.timeRemaining, clock);
    assert.equal(g.winner, mode === 'ko' ? a.id : 'draw'); assert.equal(b.hp, mode === 'ko' ? 0 : 160);
    const events = g.drainEvents(); assert.equal(events.filter(e => e.type === 'ko').length, 1);
    assert.equal(events.filter(e => e.type === 'cranesShout').length, 1);
    assert.equal(events.filter(e => e.type === 'elevatorLand').length, 1);
    assert.equal(events.filter(e => e.type === 'hit').reduce((n, e) => n + e.damage, 0), mode === 'ko' ? 10 : 0);
    assert.equal(a.elevatorActive, false); assert.equal(g.effects.length, 0);
  }
});

test('Reset and forced finish remove the cab, targeting and caster state', () => {
  for (const mode of ['reset', 'finish']) for (const time of [1.2, 1.6]) {
    const { g, a } = match(); a.meter = 100; g.useSpecial(a); step(g, time); const s = g.specials[0];
    if (mode === 'reset') g.reset('cranes', 'owl'); else g.finish('p1');
    assert.equal(s.active, false); assert.equal(s.locked, false); assert.equal(a.elevatorActive, false);
    assert.equal(g.specials.length, 0); assert.equal(g.effects.length, 0); assert.equal(pose(g.fighters[0]).key, 'cranes');
  }
});

test('CPU Cranes uses the same shout and elevator drop across the arena', () => {
  const { g, a, b } = match('p2', -1, 700); a.meter = 100; g.aiEnabled = true; g.ai.think = 0; g.random = () => .8;
  g.update(1 / 120, {}); assert.equal(a.meter, 0); assert.equal(g.specials[0].kind, 'elevator');
  g.aiEnabled = false; step(g, 3); assert.equal(b.hp, 112);
  assert.equal(g.drainEvents().filter(e => e.type === 'cranesShout').length, 1);
});
