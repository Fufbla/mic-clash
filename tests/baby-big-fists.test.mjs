import test from 'node:test';
import assert from 'node:assert/strict';
import { CombatGame } from '../dist/combat.js';
import { babyBigFistsPose as pose, babyBigFistsSpeech as speech } from '../dist/baby-big-fists.js';

function match(side = 'p1', direction = 1) {
  const g = new CombatGame(side === 'p1' ? 'babybigfists' : 'owl', side === 'p1' ? 'owl' : 'babybigfists');
  g.aiEnabled = false;
  const a = g.fighters.find(f => f.type === 'babybigfists'), b = g.fighters.find(f => f !== a);
  a.x = direction > 0 ? 450 : 830; b.x = a.x + direction * 130; a.facing = direction; b.facing = -direction;
  return { g, a, b };
}
function step(g, seconds, fps = 120) { for (let n = 0; n < Math.round(seconds * fps); n++) g.update(1 / fps, {}); }

test('Baby Big Fists is playable on both sides with regular punch meter, block, kicks and double jump', () => {
  for (const side of ['p1', 'p2']) {
    const { g, a, b } = match(side); b.x = a.x + 100;
    assert.equal(g.startAttack(a, 'punch'), true); assert.equal(a.attack.style, 'punch');
    step(g, .5); assert.equal(b.hp, b.maxHp - 10); assert.equal(a.meter, 20);
    b.x = a.x + 100; b.state = 'block'; b.actionRemaining = 1;
    g.startAttack(a, 'punch'); step(g, .5); assert.equal(a.meter, 20);
    b.state = 'idle'; b.x = a.x + 100;
    g.startAttack(a, 'kick'); step(g, .6); assert.equal(a.meter, 45);
    assert.equal(g.jump(a), true); step(g, .1); assert.equal(g.jump(a), true);
    assert.equal(a.flipRemaining, 0); assert.equal(g.jump(a), false); step(g, 2); assert.equal(a.grounded, true);
  }
});

test('Eight walking poses and six kick phases end in a planted recovery before each repeat', () => {
  const steps = new Set();
  for (let i = 0; i < 120; i++) steps.add(pose({ state: 'run', grounded: true, vx: 250, facing: 1, stateTime: i / 120 }).index);
  assert.equal(steps.size, 8);
  for (const fps of [30, 60, 120]) {
    const { g, a, b } = match(); b.x = 1100;
    for (let repeat = 0; repeat < 3; repeat++) {
      g.startAttack(a, 'kick'); const seen = new Set();
      while (a.attack) { seen.add(pose(a).index); if (a.attack.elapsed >= .48) assert.equal(pose(a).index, 13); g.update(1 / fps, {}); }
      assert.deepEqual([...seen], [8, 9, 10, 11, 12, 13]); assert.equal(a.state, 'idle');
    }
  }
});

test('Giant Fists requires full meter, forward reach and height; failed activation preserves meter', () => {
  const { g, a, b } = match(); a.meter = 99; assert.equal(g.useSpecial(a), false);
  a.meter = 100; b.x = 1100; assert.equal(g.useSpecial(a), false); assert.equal(a.meter, 100);
  b.x = a.x - 100; assert.equal(g.useSpecial(a), false); b.x = a.x + 130;
  b.y = 200; assert.equal(g.useSpecial(a), false); b.y = 0;
  assert.equal(g.useSpecial(a), true); assert.equal(a.meter, 0); assert.equal(g.useSpecial(a), false);
  assert.equal(g.specials.length, 1);
});

test('Exactly two 24-damage punches and mmm cues, then launch and normal fists at 30/60/120 fps', () => {
  for (const fps of [30, 60, 120]) for (const side of ['p1', 'p2']) for (const direction of [-1, 1]) {
    const { g, a, b } = match(side, direction); a.meter = 100; b.state = 'block'; b.actionRemaining = 5;
    g.useSpecial(a); const s = g.specials[0], poses = new Set(); let launched = false, bubbleStarts = 0, lastSpeech = '';
    for (let n = 0; n < fps * 3; n++) {
      g.update(1 / fps, {}); const text = speech(s);
      if (text && !lastSpeech) bubbleStarts++; lastSpeech = text;
      if (text) assert.equal(text, 'mmm');
      poses.add(pose(a, s).key + ':' + pose(a, s).index);
      if (s.age < .68 - 1e-9) assert.equal(b.hp, b.maxHp);
      else if (s.age < 1.24 - 1e-9) assert.equal(b.hp, b.maxHp - 24);
      if (s.hitCount === 2 && b.y > 0) launched = true;
    }
    assert.equal(b.hp, b.maxHp - 48); assert.equal(s.hitCount, 2); assert.equal(s.punchIndex, 2);
    assert.equal(a.meter, 0); assert.equal(bubbleStarts, 2); assert.ok(launched);
    for (const i of [8, 9, 10, 11, 12, 13, 14, 15]) assert.ok(poses.has('babyBigFistsActions:' + i), `Special pose ${i}`);
    const cues = g.drainEvents().filter(e => e.type === 'giantPunch');
    assert.deepEqual(cues.map(e => [e.number, e.text, e.connected]), [[1, 'mmm', true], [2, 'mmm', true]]);
    assert.equal(pose(a).key, 'babybigfists'); assert.equal(g.isPresenting(a), false); assert.equal(speech(s), '');
  }
});

test('Range and jump evasion avoid damage, while both punch cues still play', () => {
  for (const evade of ['range', 'air']) {
    const { g, a, b } = match(); a.meter = 100; g.useSpecial(a); step(g, .6);
    if (evade === 'range') b.x = 1100;
    else { b.y = 800; b.vy = 0; b.grounded = false; }
    step(g, 2); assert.equal(b.hp, b.maxHp); assert.equal(a.meter, 0);
    const cues = g.drainEvents().filter(e => e.type === 'giantPunch');
    assert.equal(cues.length, 2); assert.ok(cues.every(e => !e.connected));
  }
});

test('KO on either punch still completes both poses and bubbles, launches, and resolves once', () => {
  for (const hp of [10, 35]) {
    const { g, a, b } = match(); b.hp = hp; a.meter = 100; g.useSpecial(a);
    step(g, 1.3); assert.equal(b.hp, 0); assert.equal(g.over, false); assert.ok(b.y > 0);
    assert.equal(g.hit(b, a, 15, 'kick', 300, .4, b.x), false);
    step(g, 1); assert.equal(g.over, true); assert.equal(g.winner, a.id); assert.equal(g.specials.length, 0);
    const events = g.drainEvents(); assert.equal(events.filter(e => e.type === 'giantPunch').length, 2);
    assert.equal(events.filter(e => e.type === 'hit').reduce((n, e) => n + e.damage, 0), hp);
    assert.equal(pose(a).key, 'babybigfists');
  }
});

test('Speech is tied to each strike, disappears between punches, and clears on cancellation', () => {
  const s = { kind: 'giantFists', active: true, age: .67 };
  assert.equal(speech(s), ''); s.age = .68; assert.equal(speech(s), 'mmm');
  s.age = 1.10; assert.equal(speech(s), ''); s.age = 1.24; assert.equal(speech(s), 'mmm');
  s.age = 1.65; assert.equal(speech(s), ''); s.age = .72; s.active = false; assert.equal(speech(s), '');
  assert.equal(speech(null), ''); assert.equal(speech({ ...s, kind: 'crew', active: true }), '');
});

test('CPU uses the two-punch special; restart clears all giant fists and speech', () => {
  const { g, a } = match('p2', -1); a.meter = 100; g.aiEnabled = true; g.ai.think = 0; g.random = () => .8;
  g.update(1 / 120, {}); assert.equal(a.meter, 0); assert.equal(g.specials[0].kind, 'giantFists');
  step(g, 1.3); assert.equal(g.specials[0].punchIndex, 2);
  g.reset('babybigfists', 'owl'); assert.equal(g.specials.length, 0);
  assert.equal(g.fighters[0].bigFistsLaunched, false); assert.equal(pose(g.fighters[0]).key, 'babybigfists');
});
