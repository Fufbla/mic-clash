import test from 'node:test';
import assert from 'node:assert/strict';
import { CombatGame, FIGHTERS } from '../dist/combat.js';
const local = (a = 'owl', b = 'coupe') => new CombatGame(a, b, { localMultiplayer: true });
const tick = (g, seconds, p1 = {}, p2 = {}) => { for (let n = 0; n < Math.round(seconds * 60); n++) g.update(1 / 60, p1, p2); };

test('Local mode disables AI across resets, permits mirror matches, and keeps 320 health', () => {
  for (const type of FIGHTERS) {
    const g = local(type, type); assert.equal(g.aiEnabled, false);
    assert.deepEqual(g.fighters.map(f => f.type), [type, type]);
    g.fighters[0].hp = 1; g.reset(); assert.equal(g.aiEnabled, false);
    assert.deepEqual(g.fighters.map(f => f.hp), [320, 320]);
  }
  assert.notEqual(new CombatGame('owl', 'owl').opponentType, 'owl');
  assert.equal(new CombatGame().aiEnabled, true);
});
test('Both players move independently; releasing Player 2 never invokes CPU control', () => {
  const g = local(); g.updateAI = () => { throw new Error('AI ran in local mode'); };
  tick(g, .5, { moveX: -1 }, { moveX: 1 });
  assert.ok(g.fighters[0].x < 340); assert.ok(g.fighters[1].x > 940);
  const positions = g.fighters.map(f => f.x); tick(g, 5);
  assert.deepEqual(g.fighters.map(f => f.x), positions);
  assert.deepEqual(g.fighters.map(f => f.hp), [320, 320]);
});
test('Player 2 can jump twice, block, punch, charge meter and defeat Player 1 through its own input', () => {
  const g = local(); const [a, b] = g.fighters;
  g.update(1 / 60, {}, { jumpPressed: true }); g.update(1 / 60, {}, { jumpPressed: true });
  assert.equal(b.jumps, 2); assert.equal(a.jumps, 0); tick(g, 2);
  a.x = 500; b.x = 600; tick(g, .1, {}, { block: true }); assert.equal(b.state, 'block');
  tick(g, .6, {}, { punchPressed: true }); assert.ok(a.hp < 320); assert.ok(b.meter > 0); assert.equal(a.meter, 0);
  tick(g, 1); a.x = 500; b.x = 600; a.hp = 1;
  tick(g, 1, {}, { kickPressed: true }); assert.equal(g.winner, 'p2');
});
test('All 26 fighters can activate and land their special as human Player 2', () => {
  for (const type of FIGHTERS) {
    const g = local('owl', type), [a, b] = g.fighters;
    a.x = 540; b.x = 650; b.meter = 100;
    g.update(1 / 60, {}, { specialPressed: true });
    assert.equal(b.meter, 0, type + ' uses its own meter');
    tick(g, 8);
    assert.ok(a.hp < 320, type + ' damages Player 1');
    assert.equal(b.hp, 320, type + ' has no CPU rival attacking');
  }
});
test('CPU mode ignores a second human input and preserves normal opponent AI', () => {
  const a = new CombatGame(), b = new CombatGame();
  tick(a, 1, {}, { jumpPressed: true, kickPressed: true, moveX: 1 }); tick(b, 1);
  assert.deepEqual(a.fighters, b.fighters);
});
