import test from 'node:test';
import assert from 'node:assert/strict';
import { CombatGame } from '../dist/combat.js';
import { COW_MODE as M, moojaPose as pose } from '../dist/mooja.js';

function match(side = 'p1', direction = 1, distance = 140) {
  const g = new CombatGame(side === 'p1' ? 'mooja' : 'owl', side === 'p1' ? 'owl' : 'mooja'); g.aiEnabled = false;
  const a = g.fighters.find(f => f.type === 'mooja'), b = g.fighters.find(f => f !== a);
  a.x = direction > 0 ? 250 : 1030; b.x = a.x + direction * distance; a.facing = direction; b.facing = -direction;
  return { g, a, b };
}
function step(g, seconds, fps = 120) { for (let n = 0; n < Math.round(seconds * fps); n++) g.update(1 / fps, {}); }

test('MooJa is selectable on both sides, uses slaps for meter, kicks, block and double jump', () => {
  for (const side of ['p1', 'p2']) {
    const { g, a, b } = match(side); b.x = a.x + 100;
    g.startAttack(a, 'punch'); assert.equal(a.attack.style, 'slap'); step(g, .5);
    assert.equal(b.hp, 150); assert.equal(a.meter, 20);
    b.x = a.x + 100; b.state = 'block'; b.actionRemaining = 1;
    g.startAttack(a, 'punch'); step(g, .5); assert.equal(a.meter, 20);
    b.state = 'idle'; b.x = a.x + 100; g.startAttack(a, 'kick'); step(g, .6); assert.equal(a.meter, 45);
    assert.equal(g.jump(a), true); step(g, .1); assert.equal(g.jump(a), true);
    assert.equal(a.flipRemaining, 0); assert.equal(g.jump(a), false); step(g, 2); assert.ok(a.grounded);
  }
});

test('MooJa struts through eight poses and finishes every kick with a planted foot', () => {
  const walk = new Set(); for (let i = 0; i < 120; i++) walk.add(pose({ state: 'run', grounded: true, vx: 250, facing: 1, stateTime: i / 120 }).index);
  assert.equal(walk.size, 8);
  for (const fps of [30, 60, 120]) {
    const { g, a, b } = match(); b.x = 1180;
    for (let repeat = 0; repeat < 3; repeat++) {
      g.startAttack(a, 'kick'); const seen = new Set();
      while (a.attack) { seen.add(pose(a).index); if (a.attack.elapsed >= .48) assert.equal(pose(a).index, 13); g.update(1 / fps, {}); }
      assert.deepEqual([...seen], [8, 9, 10, 11, 12, 13]); assert.equal(a.state, 'idle');
    }
  }
});

test('Cow Mode consumes full meter, transforms before firing and prevents stacking', () => {
  const { g, a } = match(); a.meter = 99; assert.equal(g.useSpecial(a), false);
  a.meter = 100; g.jump(a); step(g, .1); assert.equal(g.useSpecial(a), true);
  assert.equal(a.meter, 0); assert.ok(a.grounded); assert.equal(a.y, 0);
  const s = g.specials[0]; step(g, .6); assert.equal(s.shotIndex, 0); assert.equal(pose(a, s).index, 10);
  a.meter = 100; assert.equal(g.useSpecial(a), false); assert.equal(g.specials.length, 1); a.meter = 0;
});

test('Three mouth-fired missiles deal exactly 16 damage each through block on both sides at every frame rate', () => {
  for (const fps of [30, 60, 120]) for (const direction of [-1, 1]) for (const side of ['p1', 'p2']) {
    const { g, a, b } = match(side, direction); a.meter = 100; b.state = 'block'; b.actionRemaining = 6;
    g.useSpecial(a); const s = g.specials[0], poses = new Set();
    for (let i = 0; i < fps * 4; i++) {
      g.update(1 / fps, {}); poses.add(pose(a, s).key + ':' + pose(a, s).index);
      if (s.age < .82 - 1e-9) assert.equal(b.hp, 160);
    }
    assert.equal(b.hp, 112); assert.equal(s.shotIndex, 3); assert.equal(s.hitCount, 3); assert.equal(a.meter, 0);
    for (const i of [8, 9, 10, 11, 12, 13, 14, 15]) assert.ok(poses.has('mooJaActions:' + i), `Pose ${i}`);
    const events = g.drainEvents(), shots = events.filter(e => e.type === 'milkShot'), hits = events.filter(e => e.type === 'hit');
    assert.equal(shots.length, 3); assert.ok(shots.every(e => Math.abs(e.x - (a.x + direction * 80)) < .001 && e.y === 92));
    assert.deepEqual(hits.map(e => [e.damage, e.blocked]), [[16, false], [16, false], [16, false]]);
    assert.equal(pose(a).key, 'mooja'); assert.equal(a.cowActive, false); assert.equal(g.effects.length, 0);
  }
});

test('Long-range missiles keep protection after human recovery and end after the final splash', () => {
  const { g, a, b } = match(); a.x = 100; b.x = 1180; a.meter = 100; g.useSpecial(a);
  const s = g.specials[0]; step(g, 2.2);
  assert.equal(pose(a, s).key, 'mooja'); assert.ok(s.missiles.some(p => p.active)); assert.ok(g.isPresenting(a));
  assert.equal(g.startAttack(a, 'punch'), false); assert.equal(g.hit(b, a, 15, 'kick', 300, .4, b.x), false);
  step(g, 1.5); assert.equal(b.hp, 112); assert.equal(g.isPresenting(a), false); assert.equal(g.specials.length, 0); assert.equal(g.effects.length, 0);
});

test('Missiles can be jumped over and do not turn around to hit an opponent behind MooJa', () => {
  const { g, a, b } = match('p1', 1, 260); a.meter = 100; g.useSpecial(a); step(g, .65);
  // Delay the second jump so the trailing missile clears before the landing.
  assert.equal(g.jump(b), true); step(g, .5); assert.equal(g.jump(b), true); step(g, 3);
  assert.equal(b.hp, 160); assert.equal(a.meter, 0);
  const other = match(); other.a.x = 600; other.b.x = 200; other.a.meter = 100;
  other.g.useSpecial(other.a); step(other.g, 4); assert.equal(other.b.hp, 160);
  assert.equal(other.g.drainEvents().filter(e => e.type === 'milkShot').length, 3);
});

test('Missiles hit once, expire at their range, and respect opposing invulnerability', () => {
  const { g, a, b } = match('p1', 1, 600); a.meter = 100; b.invuln = 10; g.useSpecial(a);
  const s = g.specials[0]; step(g, 4); assert.equal(b.hp, 160); assert.equal(s.hitCount, 0);
  assert.ok(s.missiles.every(p => !p.active && Math.abs(p.x - p.startX) <= M.range + .001));
  assert.equal(g.specials.length, 0);
});

test('A KO from any missile completes the cow animation, all three shots and final launch without extra damage', () => {
  for (const hp of [10, 25, 40]) {
    const { g, a, b } = match(); b.hp = hp; a.meter = 100; g.useSpecial(a); step(g, 1.55);
    assert.equal(b.hp, 0); assert.equal(g.over, false); assert.ok(b.y > 0);
    step(g, 2); assert.equal(g.over, true); assert.equal(g.winner, a.id); assert.equal(a.cowActive, false);
    const events = g.drainEvents(); assert.equal(events.filter(e => e.type === 'milkShot').length, 3);
    assert.equal(events.filter(e => e.type === 'hit').reduce((n, e) => n + e.damage, 0), hp);
    assert.equal(events.filter(e => e.type === 'ko').length, 1); assert.equal(pose(a).key, 'mooja');
  }
});

test('Reset and forced finish clear cow form and every remaining missile', () => {
  for (const mode of ['reset', 'finish']) {
    const { g, a } = match('p1', 1, 700); a.meter = 100; g.useSpecial(a); step(g, 1.15); const s = g.specials[0];
    if (mode === 'reset') g.reset('mooja', 'owl'); else g.finish('p1');
    assert.equal(a.cowActive, false); assert.equal(s.active, false); assert.ok(s.missiles.every(p => !p.active));
    assert.equal(g.specials.length, 0); assert.equal(pose(g.fighters[0]).key, 'mooja');
  }
});

test('CPU MooJa fires the same three-missile special at range', () => {
  const { g, a, b } = match('p2', -1, 600); a.meter = 100; g.aiEnabled = true; g.ai.think = 0; g.random = () => .8;
  g.update(1 / 120, {}); assert.equal(a.meter, 0); assert.equal(g.specials[0].kind, 'milk');
  g.aiEnabled = false; step(g, 4); assert.equal(b.hp, 112); assert.equal(g.drainEvents().filter(e => e.type === 'milkShot').length, 3);
});
