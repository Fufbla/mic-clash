import test from 'node:test';
import assert from 'node:assert/strict';
import { CombatGame } from '../dist/combat.js';

const roster = ['owl', 'coupe', 'karate', 'snitchy', 'getit', 'loudbull',
  'fatboi', 'icespice', 'hehaw', 'dr-no-bunnies', 'cantrap', 'smackprince',
  'babybigfists', 'mooja', 'cranes', 'demon', 'ocrrrrr', 'president', 'owhinny', 'roboking', 'quickfast', 'sassyt', 'jminors', 'bigmumble', 'djbeigey', 'nobuttons'];

test('Every fighter on either side starts and restarts with 320 health', () => {
  for (const type of roster) for (const side of [0, 1]) {
    const other = type === 'owl' ? 'coupe' : 'owl';
    const g = new CombatGame(...(side === 0 ? [type, other] : [other, type]));
    assert.equal(g.fighters[side].type, type);
    for (const f of g.fighters) { assert.equal(f.hp, 320); assert.equal(f.maxHp, 320); f.hp = 1; }
    g.reset();
    for (const f of g.fighters) assert.equal(f.hp, 320);
  }
});

test('An unblocked knockout takes 32 punches or 22 kicks at 30, 60 and 120 fps', () => {
  for (const fps of [30, 60, 120]) for (const [kind, count, damage] of [['punch', 32, 10], ['kick', 22, 15]]) {
    const g = new CombatGame('ocrrrrr', 'dr-no-bunnies'); g.aiEnabled = false;
    const [a, b] = g.fighters;
    for (let hit = 1; hit <= count; hit++) {
      a.x = 450; b.x = 550; a.facing = 1; b.facing = -1;
      assert.ok(g.startAttack(a, kind));
      for (let frame = 0; frame < fps; frame++) g.update(1 / fps, {});
      assert.equal(b.hp, Math.max(0, 320 - hit * damage));
      assert.equal(g.over, hit === count);
    }
    assert.equal(g.winner, 'p1');
    assert.equal(a.damageDealt, 320);
  }
});
