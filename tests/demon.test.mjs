import test from 'node:test';
import assert from 'node:assert/strict';
import { CombatGame } from '../dist/combat.js';
import { DEMON_CREW as C, demonPose as pose } from '../dist/demon.js';

function match(side = 'p1', direction = 1, distance = 350) {
  const g = new CombatGame(side === 'p1' ? 'demon' : 'owl', side === 'p1' ? 'owl' : 'demon');
  g.aiEnabled = false;
  const a = g.fighters.find(f => f.type === 'demon'), b = g.fighters.find(f => f !== a);
  a.x = direction > 0 ? 250 : 1030; b.x = a.x + direction * distance;
  a.facing = direction; b.facing = -direction;
  return { g, a, b };
}
function step(g, seconds, fps = 120, input = {}) {
  for (let n = 0; n < Math.round(seconds * fps); n++) g.update(1 / fps, input);
}
function activate(g, a) { a.meter = 100; assert.ok(g.useSpecial(a)); return g.specials[0]; }

test('Demon has standard hit-powered punch and kick, block and two ordinary jumps', () => {
  for (const side of ['p1', 'p2']) {
    const { g, a, b } = match(side, 1, 100);
    g.startAttack(a, 'punch'); step(g, .5); assert.equal(b.hp, b.maxHp - 10); assert.equal(a.meter, 20);
    b.x = a.x + 100; b.state = 'block'; b.actionRemaining = 1;
    g.startAttack(a, 'punch'); step(g, .5); assert.equal(a.meter, 20);
    b.state = 'idle'; b.x = a.x + 100; g.startAttack(a, 'kick'); step(g, .6); assert.equal(a.meter, 45);
    assert.ok(g.jump(a)); step(g, .1); assert.ok(g.jump(a)); assert.equal(g.jump(a), false);
    assert.equal(a.flipRemaining, 0); step(g, 2); assert.ok(a.grounded);
  }
});

test('Swagger uses eight steps and repeated kicks always retract and plant at 30/60/120 fps', () => {
  const seen = new Set();
  for (let i = 0; i < 120; i++) seen.add(pose({ state: 'run', grounded: true, vx: 250, facing: 1, stateTime: i / 120 }).index);
  assert.equal(seen.size, 8);
  for (const fps of [30, 60, 120]) {
    const { g, a, b } = match(); b.x = 1180;
    for (let n = 0; n < 3; n++) {
      g.startAttack(a, 'kick'); const frames = new Set();
      while (a.attack) { frames.add(pose(a).index); g.update(1 / fps, {}); }
      assert.deepEqual([...frames], [8, 9, 10, 11, 12, 13]); assert.equal(a.state, 'idle');
    }
  }
});

test('The Crew needs a full meter, grounds Demon and cannot stack or recharge itself', () => {
  const { g, a } = match(); a.meter = 99; assert.equal(g.useSpecial(a), false);
  g.jump(a); step(g, .1); activate(g, a);
  assert.equal(a.y, 0); assert.ok(a.grounded); assert.ok(a.maskedCrewActive); assert.equal(a.meter, 0);
  a.meter = 100; assert.equal(g.useSpecial(a), false); assert.equal(g.startAttack(a, 'punch'), false);
  a.meter = 0; step(g, 5); assert.equal(a.meter, 0); assert.equal(a.maskedCrewActive, false);
});

test('Demon points before turning away and up, and stays turned through the entire crew exit', () => {
  for (const direction of [-1, 1]) {
    const { g, a } = match('p1', direction); const s = activate(g, a);
    step(g, .25); assert.equal(pose(a, s).index, 9); assert.equal(pose(a, s).lookAway, false);
    step(g, .45); assert.equal(pose(a, s).index, 11); assert.ok(pose(a, s).lookAway);
    assert.ok(s.crew.every(m => !m.visible));
    while (s.age < C.exitAt - 1 / 120) {
      assert.ok(pose(a, s).lookAway); assert.equal(a.facing, direction); g.update(1 / 120, {});
    }
    step(g, .05); assert.equal(pose(a, s).lookAway, false); assert.ok(s.crew.every(m => !m.visible));
    step(g, .5); assert.equal(pose(a).key, 'demon');
  }
});

test('Two masked helpers enter from each side and two descend from above before attacking', () => {
  const { g, a } = match(); const s = activate(g, a);
  assert.deepEqual(s.crew.map(m => m.entry).sort(), ['left', 'left', 'right', 'right', 'top', 'top']);
  assert.ok(s.crew.filter(m => m.entry === 'left').every(m => m.x < 0));
  assert.ok(s.crew.filter(m => m.entry === 'right').every(m => m.x > 1280));
  assert.ok(s.crew.filter(m => m.entry === 'top').every(m => m.y >= 720));
  step(g, 1.1); assert.equal(s.crew.filter(m => m.visible).length, 6);
  assert.ok(s.crew.filter(m => m.entry === 'top').every(m => m.y > 300 && m.y < 720));
  step(g, .55); assert.ok(s.crew.every(m => m.y === 0)); assert.equal(s.strikeIndex, 0);
});

test('Twelve unblockable four-damage strikes complete on both sides and directions at 30/60/120 fps', () => {
  for (const fps of [30, 60, 120]) for (const direction of [-1, 1]) for (const side of ['p1', 'p2']) {
    const { g, a, b } = match(side, direction); b.state = 'block'; b.actionRemaining = 6;
    const s = activate(g, a); step(g, 4.5, fps);
    assert.equal(b.hp, b.maxHp - 48); assert.equal(s.hitCount, 12); assert.equal(s.strikeIndex, 12);
    assert.equal(a.meter, 0); assert.equal(a.landedHits, 0);
    const events = g.drainEvents(), hits = events.filter(e => e.type === 'hit');
    assert.equal(hits.length, 12); assert.ok(hits.every(e => e.damage === 4 && !e.blocked && e.kind === 'maskedCrew'));
    assert.deepEqual(events.filter(e => e.type === 'maskedStrike').map(e => e.member), [0,1,2,3,4,5,0,1,2,3,4,5]);
    assert.equal(events.filter(e => e.type === 'maskedEnter').length, 1);
    assert.equal(g.specials.length, 0); assert.ok(s.crew.every(m => !m.visible));
  }
});

test('The crew locks its target area and running away evades every strike', () => {
  for (const fps of [30, 60, 120]) {
    const { g, a, b } = match('p2', -1, 500); const s = activate(g, a);
    step(g, 1.3, fps); const focus = s.focusX; assert.ok(s.locked);
    step(g, 3, fps, { left: true });
    assert.equal(s.focusX, focus); assert.equal(b.hp, b.maxHp); assert.equal(s.hitCount, 0);
    assert.equal(s.strikeIndex, 12); assert.equal(a.meter, 0);
  }
});

test('Jumping over the first attacks avoids their damage and does not move the target area', () => {
  const { g, a, b } = match(); const s = activate(g, a); step(g, 1.3);
  assert.ok(g.jump(b)); step(g, .2); assert.ok(g.jump(b)); step(g, .45);
  assert.ok(s.strikeIndex >= 3); assert.equal(s.hitCount, 0); assert.equal(b.hp, b.maxHp);
  assert.equal(s.focusX, 600); step(g, 3); assert.ok(s.hitCount < 12);
});

test('Demon stays protected through all entrances, attacks and exits and then recovers', () => {
  const { g, a, b } = match(); activate(g, a);
  while (g.specials.length) {
    assert.equal(g.hit(b, a, 15, 'kick', 300, .4, b.x), false);
    assert.equal(g.startAttack(a, 'kick'), false); g.update(1 / 120, {});
  }
  assert.equal(g.isPresenting(a), false); assert.equal(a.maskedCrewActive, false);
  assert.ok(g.hit(b, a, 10, 'punch', 180, .2, b.x));
});

test('Early, middle and final KOs still show all strikes and final launch; timeout does no extra damage', () => {
  for (const initial of [4, 24, 48, 'timeout']) {
    const { g, a, b } = match(); if (initial !== 'timeout') b.hp = initial;
    const s = activate(g, a); if (initial === 'timeout') g.timeRemaining = .01;
    step(g, 2.95); assert.ok(g.roundEnding); assert.equal(g.over, false); assert.equal(s.strikeIndex, 12);
    if (initial !== 'timeout') { assert.ok(b.demonLaunched); assert.ok(b.y > 0); }
    const clock = g.timeRemaining; step(g, 2); assert.ok(g.over); assert.equal(g.timeRemaining, clock);
    const events = g.drainEvents(); assert.equal(events.filter(e => e.type === 'maskedStrike').length, 12);
    assert.equal(events.filter(e => e.type === 'hit').reduce((n, e) => n + e.damage, 0), initial === 'timeout' ? 0 : initial);
    assert.equal(events.filter(e => e.type === 'ko').length, 1); assert.equal(a.maskedCrewActive, false);
  }
});

test('Reset and forced finish remove all crew references, caster state and launches', () => {
  for (const mode of ['reset', 'finish']) for (const time of [1.2, 2, 2.95, 3.5]) {
    const { g, a } = match(); const s = activate(g, a); step(g, time);
    if (mode === 'reset') g.reset('demon', 'owl'); else g.finish('p1');
    assert.equal(s.active, false); assert.equal(s.locked, false); assert.equal(a.maskedCrewActive, false);
    assert.ok(s.crew.every(m => !m.visible)); assert.equal(g.specials.length, 0); assert.equal(g.effects.length, 0);
    assert.ok(g.fighters.every(f => !f.demonLaunched)); assert.equal(pose(g.fighters[0]).key, 'demon');
  }
});

test('CPU Demon uses the same point, turn, arrivals and combo across the arena', () => {
  const { g, a, b } = match('p2', -1, 700); a.meter = 100; g.aiEnabled = true; g.ai.think = 0; g.random = () => .8;
  g.update(1 / 120, {}); assert.equal(a.meter, 0); assert.equal(g.specials[0].kind, 'maskedCrew');
  g.aiEnabled = false; step(g, 4.5); assert.equal(b.hp, b.maxHp - 48);
  assert.equal(g.drainEvents().filter(e => e.type === 'maskedStrike').length, 12);
});
