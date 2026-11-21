import assert from 'node:assert/strict';
const { CombatGame } = await import('../dist/combat.js');
const advance = (game, seconds, input = {}) => {
  for (let i = 0; i < Math.ceil(seconds * 120); i++) game.update(1 / 120, input);
};
const fresh = (type, opponent) => { const game = new CombatGame(type, opponent); game.aiEnabled = false; return game; };
const setClose = game => {
  const [a, b] = game.fighters;
  a.x = 450; b.x = 550; a.y = b.y = 0; a.facing = 1; b.facing = -1;
  a.vx = b.vx = 0; b.invuln = 0;
};
let tests = 0;
const test = (name, fn) => { fn(); tests++; console.log(`PASS ${name}`); };

test('Time and misses never charge either special', () => {
  const g = fresh();
  advance(g, 5);
  assert.equal(g.fighters[0].meter, 0);
  assert.equal(g.fighters[1].meter, 0);
  assert.equal(g.startAttack(g.fighters[0], 'punch'), true);
  advance(g, .6);
  assert.equal(g.fighters[0].meter, 0);
  assert.equal(g.fighters[1].hp, g.fighters[1].maxHp);
});

test('A landed punch hits only once and awards exactly 20 meter', () => {
  const g = fresh(); setClose(g);
  g.startAttack(g.fighters[0], 'punch');
  advance(g, .6);
  assert.equal(g.fighters[1].hp, g.fighters[1].maxHp - 10);
  assert.equal(g.fighters[0].meter, 20);
  assert.equal(g.fighters[0].landedHits, 1);
});

test('A landed kick awards 25 meter; a blocked punch gives none', () => {
  const g = fresh(); setClose(g);
  g.startAttack(g.fighters[0], 'kick');
  advance(g, .7);
  assert.equal(g.fighters[1].hp, g.fighters[1].maxHp - 15);
  assert.equal(g.fighters[0].meter, 25);
  setClose(g);
  const [a, b] = g.fighters;
  b.state = 'block'; b.actionRemaining = 1;
  g.startAttack(a, 'punch');
  advance(g, .5);
  assert.equal(b.hp, b.maxHp - 17);
  assert.equal(a.meter, 25);
});

test('Five landed punches fill meter once; no early special is possible', () => {
  const g = fresh();
  assert.equal(g.useSpecial(g.fighters[0]), false);
  for (let i = 0; i < 5; i++) {
    setClose(g);
    assert.equal(g.startAttack(g.fighters[0], 'punch'), true);
    advance(g, .5);
  }
  assert.equal(g.fighters[0].meter, 100);
  assert.equal(g.drainEvents().filter(e => e.type === 'meterReady').length, 1);
  assert.equal(g.useSpecial(g.fighters[0]), true);
  assert.equal(g.fighters[0].meter, 0);
  assert.equal(g.useSpecial(g.fighters[0]), false);
});

test('Three descending owls hit without charging meter or hurting owner', () => {
  const g = fresh('owl');
  g.fighters[0].meter = 100;
  assert.equal(g.useSpecial(g.fighters[0]), true);
  advance(g, 2);
  assert.equal(g.fighters[1].hp, g.fighters[1].maxHp - 30);
  assert.equal(g.fighters[0].hp, g.fighters[0].maxHp);
  assert.equal(g.fighters[0].meter, 0);
  assert.equal(g.specials.length, 0);
});

test('Car charge hits once, consumes full meter, and dismounts', () => {
  const g = fresh('coupe');
  g.fighters[0].meter = 100;
  assert.equal(g.useSpecial(g.fighters[0]), true);
  assert.equal(g.fighters[0].inCar, true);
  advance(g, 2);
  assert.equal(g.fighters[1].hp, g.fighters[1].maxHp - 36);
  assert.equal(g.fighters[0].hp, g.fighters[0].maxHp);
  assert.equal(g.fighters[0].meter, 0);
  assert.equal(g.fighters[0].inCar, false);
  assert.equal(g.specials.length, 0);
});

test('Double jump is limited to two impulses and resets on landing', () => {
  const g = fresh(); const f = g.fighters[0];
  assert.equal(g.jump(f), true);
  advance(g, .15);
  assert.equal(g.jump(f), true);
  assert.equal(g.jump(f), false);
  assert.equal(f.jumps, 2);
  advance(g, 1.5);
  assert.equal(f.grounded, true);
  assert.equal(f.jumps, 0);
  assert.equal(g.jump(f), true);
});

test('Grounded bodies cannot pass through one another and stay in bounds', () => {
  const g = fresh(); setClose(g);
  advance(g, 3, { right: true });
  assert.ok(g.fighters[0].x < g.fighters[1].x);
  assert.ok(g.fighters[0].x >= 100 && g.fighters[0].x <= 1180);
  assert.ok(g.fighters[1].x >= 100 && g.fighters[1].x <= 1180);
});

test('Analog input scales movement, clamps safely, and preserves keyboard fallback', () => {
  const closeTo = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-8,
    `Expected ${expected}, received ${actual}`);
  for (const [input, travel] of [
    [{ moveX: .5 }, 25], [{ moveX: 1 }, 50], [{ moveX: -.25 }, -12.5],
    [{ moveX: 0, right: true }, 0], [{ moveX: 4 }, 50], [{ moveX: -4 }, -50],
    [{ moveX: Infinity }, 0], [{ moveX: NaN }, 0],
    [{ right: true }, 50], [{ left: true }, -50], [{ left: true, right: true }, 0],
    [{ moveX: NaN, right: true }, 50]
  ]) {
    const g = fresh(); const start = g.fighters[0].x;
    advance(g, .2, input);
    closeTo(g.fighters[0].x - start, travel);
  }
  const g = fresh(); const p = g.fighters[0];
  g.startAttack(p, 'punch'); advance(g, .23);
  g.update(1 / 120, { moveX: .4 });
  closeTo(p.vx, 42);
});

test('Held melee attacks can step during recovery and still respect arena bounds', () => {
  for (const action of ['punchPressed', 'kickPressed']) {
    const g = fresh(); const [p, e] = g.fighters;
    const start = p.x;
    advance(g, 2, { [action]: true, right: true });
    assert.ok(p.x > start + 60, `${action} should allow a controlled recovery step`);
    p.x = 1175; e.x = 100;
    advance(g, 2, { [action]: true, right: true });
    assert.equal(p.x, 1180);
    p.x = 105; e.x = 1180;
    advance(g, 2, { [action]: true, left: true });
    assert.equal(p.x, 100);
  }
});

test('Knockout finishes the fight and subsequent updates do not alter state', () => {
  const g = fresh(); setClose(g); g.fighters[1].hp = 10;
  g.startAttack(g.fighters[0], 'punch'); advance(g, .3);
  assert.equal(g.over, true); assert.equal(g.winner, 'p1');
  const time = g.timeRemaining; advance(g, 3, { right: true });
  assert.equal(g.timeRemaining, time);
});

test('A timed match correctly declares a draw with equal health', () => {
  const g = fresh(); g.timeRemaining = .02;
  advance(g, .1);
  assert.equal(g.over, true); assert.equal(g.winner, 'draw');
});

test('All seventeen fighters support valid opponent choices and safe default pairings', () => {
  const defaults = { owl: 'coupe', coupe: 'owl', karate: 'owl', snitchy: 'owl', getit: 'owl', loudbull: 'owl', fatboi: 'owl', icespice: 'owl', hehaw: 'owl', 'dr-no-bunnies': 'owl', cantrap: 'owl', smackprince: 'owl', babybigfists: 'owl', mooja: 'owl', cranes: 'owl', demon: 'owl', ocrrrrr: 'owl' };
  for (const player of Object.keys(defaults)) {
    assert.equal(new CombatGame(player).fighters[1].type, defaults[player]);
    assert.equal(new CombatGame(player, player).fighters[1].type, defaults[player]);
    for (const opponent of Object.keys(defaults).filter(type => type !== player)) {
      const g = new CombatGame(player, opponent);
      assert.deepEqual(g.fighters.map(f => f.type), [player, opponent]);
      g.reset();
      assert.deepEqual(g.fighters.map(f => f.type), [player, opponent]);
    }
  }
  const g = new CombatGame('unknown', 'unknown');
  assert.deepEqual(g.fighters.map(f => f.type), ['owl', 'coupe']);
  g.reset('karate', 'coupe');
  assert.deepEqual(g.fighters.map(f => f.type), ['karate', 'coupe']);
});

test('Karate and Snitchy flip only on the second jump and clear on completion, landing, or hit', () => {
  for (const type of ['karate', 'snitchy']) {
  const g = fresh(type); const [p, e] = g.fighters;
  g.jump(p); assert.equal(p.flipRemaining, 0);
  advance(g, .12); g.jump(p);
  assert.equal(p.flipRemaining, .48); assert.equal(p.flipProgress, 0);
  assert.equal(p.flipDirection, 1);
  advance(g, .24);
  assert.ok(p.flipProgress > .49 && p.flipProgress < .52);
  advance(g, .25);
  assert.equal(p.flipRemaining, 0); assert.equal(p.flipProgress, 1);
  advance(g, 1);
  assert.equal(p.grounded, true); assert.equal(p.flipProgress, 0);
  g.jump(p); advance(g, .1); g.jump(p);
  assert.ok(p.flipRemaining > 0);
  assert.equal(g.hit(e, p, 10, 'punch', 180, .2, e.x), true);
  assert.equal(p.flipRemaining, 0); assert.equal(p.flipProgress, 0);
  }
});

test('Barrage gates on full meter, winds up, lands twelve hits, and never recharges', () => {
  for (const fps of [30, 60, 120]) {
    const g = fresh('karate'); setClose(g); const [p, e] = g.fighters;
    p.meter = 99; assert.equal(g.useSpecial(p), false); assert.equal(p.meter, 99);
    p.meter = 100; assert.equal(g.useSpecial(p), true);
    assert.equal(p.meter, 0); assert.equal(p.outfit, 'gi'); assert.equal(p.state, 'special');
    assert.equal(g.useSpecial(p), false);
    const barrage = g.specials[0];
    assert.equal(barrage.kind, 'barrage');
    advance(g, .15); assert.equal(e.hp, e.maxHp);
    const hits = [];
    for (let i = 0; i < fps * 2; i++) {
      g.update(1 / fps, {});
      hits.push(...g.drainEvents().filter(evt => evt.type === 'hit' && evt.kind === 'barrage'));
    }
    assert.equal(e.hp, e.maxHp - 36); assert.equal(hits.length, 12);
    assert.equal(hits.filter(hit => hit.heavy).length, 1);
    assert.equal(barrage.punchIndex, 12); assert.equal(barrage.hitCount, 12);
    assert.equal(p.meter, 0); assert.equal(p.landedHits, 0);
    assert.equal(p.outfit, 'blue'); assert.equal(p.state, 'idle');
    assert.equal(g.specials.length, 0);
  }
});

test('Barrage has bounded approach and collision is rechecked for each scheduled punch', () => {
  const miss = fresh('karate'); const [p, e] = miss.fighters;
  const start = p.x; p.meter = 100; miss.useSpecial(p); advance(miss, 2);
  assert.equal(e.hp, e.maxHp); assert.equal(p.meter, 0);
  assert.ok(p.x <= start + 54.000001);
  assert.equal(miss.drainEvents().filter(evt => evt.type === 'hit').length, 0);
  const g = fresh('karate'); setClose(g); g.fighters[0].meter = 100;
  g.useSpecial(g.fighters[0]); const barrage = g.specials[0];
  while (barrage.punchIndex < 6) g.update(1 / 120, {});
  assert.equal(g.fighters[1].hp, g.fighters[1].maxHp - 18);
  g.fighters[1].x = 1100;
  advance(g, 1);
  assert.equal(g.fighters[1].hp, g.fighters[1].maxHp - 18);
  assert.equal(barrage.punchIndex, 12); assert.equal(barrage.hitCount, 6);
});

test('Barrage ignores blocking while an opposing special presentation remains protected', () => {
  const g = fresh('karate'); setClose(g); const [p, e] = g.fighters;
  e.state = 'block'; e.actionRemaining = 2; p.meter = 100; g.useSpecial(p);
  advance(g, 2);
  assert.equal(e.hp, e.maxHp - 36); assert.equal(p.meter, 0); assert.equal(e.meter, 0);
  const hits = g.drainEvents().filter(evt => evt.type === 'hit');
  assert.equal(hits.length, 12); assert.ok(hits.every(evt => !evt.blocked && evt.damage === 3));
  const duel = fresh('karate', 'coupe'); setClose(duel);
  const [a, b] = duel.fighters; a.meter = b.meter = 100;
  duel.useSpecial(b); duel.useSpecial(a); advance(duel, 2);
  assert.equal(b.hp, b.maxHp); assert.equal(a.hp, a.maxHp); assert.equal(b.inCar, false);
  assert.equal(a.meter, 0); assert.equal(b.meter, 0);
  assert.equal(duel.specials.length, 0);
});

test('A knockout waits for all twelve barrage poses before restoring the normal outfit', () => {
  const g = fresh('karate'); setClose(g); const [p, e] = g.fighters;
  p.meter = 100; e.hp = 3; g.useSpecial(p); const barrage = g.specials[0]; advance(g, .3);
  assert.equal(g.over, false); assert.equal(g.roundEnding.winner, 'p1');
  assert.equal(e.hp, 0); assert.equal(p.outfit, 'gi'); assert.equal(p.state, 'special');
  const clock = g.timeRemaining; advance(g, 2);
  assert.equal(g.over, true); assert.equal(g.winner, 'p1'); assert.equal(g.timeRemaining, clock);
  assert.equal(barrage.punchIndex, 12); assert.equal(barrage.hitCount, 1);
  assert.equal(g.specials.length, 0); assert.equal(p.outfit, 'blue');
  assert.equal(e.state, 'ko'); assert.equal(p.meter, 0);
  const events = g.drainEvents();
  assert.equal(events.filter(evt => evt.type === 'barragePunch').length, 12);
  assert.equal(events.filter(evt => evt.type === 'ko').length, 1);
  const elapsed = g.elapsed; advance(g, 2); assert.equal(g.elapsed, elapsed);
});

test('CPU karate saves its melee special for nearby targets and can double-jump', () => {
  const g = new CombatGame('owl', 'karate'); const ai = g.fighters[1];
  ai.meter = 100; g.ai.think = 0; g.random = () => .8;
  g.update(1 / 120, {});
  assert.equal(ai.meter, 100); assert.equal(g.specials.length, 0);
  setClose(g); g.ai.think = 0; g.update(1 / 120, {});
  assert.equal(ai.meter, 0);
  assert.equal(g.specials.find(s => s.owner === 'p2')?.kind, 'barrage');
  const jump = new CombatGame('owl', 'karate'); setClose(jump);
  const jumper = jump.fighters[1]; jump.jump(jumper);
  jump.random = () => .2; jump.ai.think = 0; jump.update(1 / 120, {});
  assert.equal(jumper.jumps, 2); assert.ok(jumper.flipRemaining > 0);
});

test('Call the Cops gates on full meter and shows call, arrival, staggered exits, then attacks', () => {
  const g = fresh('snitchy'); setClose(g); const [p, e] = g.fighters;
  p.meter = 99; assert.equal(g.useSpecial(p), false); assert.equal(p.meter, 99);
  p.meter = 100; assert.equal(g.useSpecial(p), true);
  const s = g.specials[0];
  assert.equal(s.kind, 'backup'); assert.equal(p.meter, 0); assert.equal(p.backupActive, true);
  assert.equal(s.car.visible, false); assert.ok(s.officers.every(o => !o.visible));
  advance(g, .35); assert.equal(s.phase, 'calling'); assert.equal(e.hp, e.maxHp);
  advance(g, .2); assert.equal(s.phase, 'arriving'); assert.equal(s.car.visible, true);
  assert.equal(s.car.doorsOpen, false); assert.ok(s.car.progress > 0 && s.car.progress < 1);
  assert.ok(s.officers.every(o => !o.visible));
  advance(g, .43); assert.equal(s.phase, 'exiting'); assert.equal(s.car.doorsOpen, true);
  assert.equal(s.officers.filter(o => o.visible).length, 1);
  assert.equal(s.officers[0].phase, 'exit'); assert.ok(s.officers[0].y > 0);
  assert.equal(p.state, 'idle'); assert.equal(g.canAct(p), true);
  advance(g, .3); assert.equal(s.officers.filter(o => o.visible).length, 3);
  assert.equal(e.hp, e.maxHp); assert.equal(s.punchIndex, 0);
  assert.equal(p.meter, 0); assert.equal(p.landedHits, 0);
});

test('Backup lands nine timed punches for 36 damage in both directions and at 30/60/120 fps', () => {
  for (const fps of [30, 60, 120]) for (const facing of [-1, 1]) {
    const g = fresh('snitchy'); const [p, e] = g.fighters;
    p.x = facing > 0 ? 450 : 830; e.x = p.x + facing * 100;
    p.facing = facing; e.facing = -facing; p.meter = 100; g.useSpecial(p);
    const s = g.specials[0], hits = [], phases = new Set();
    for (let i = 0; i < fps * 7; i++) {
      g.update(1 / fps, {}); phases.add(s.phase);
      hits.push(...g.drainEvents().filter(evt => evt.type === 'hit' && evt.kind === 'backup'));
    }
    assert.equal(e.hp, e.maxHp - 36); assert.equal(hits.length, 9);
    assert.equal(hits.filter(hit => hit.heavy).length, 1);
    assert.equal(s.punchIndex, 9); assert.equal(s.hitCount, 9);
    assert.ok(s.officers.every(o => o.punchIndex === 3 && !o.visible));
    assert.equal(p.meter, 0); assert.equal(p.landedHits, 0);
    assert.equal(p.backupActive, false); assert.equal(g.specials.length, 0);
    assert.ok(phases.has('calling') && phases.has('arriving') && phases.has('exiting'));
    assert.ok(phases.has('attacking') && phases.has('returning') && phases.has('departing'));
    assert.ok(s.car.stopX >= 195 && s.car.stopX <= 1085);
    assert.equal(s.car.doorsOpen, false);
  }
});

test('Snitchy can move after calling but cannot attack or stack crews during the protected presentation', () => {
  const g = fresh('snitchy'); setClose(g); const p = g.fighters[0];
  p.meter = 100; g.useSpecial(p); advance(g, .9);
  const before = p.x; advance(g, .2, { left: true }); assert.ok(p.x < before);
  setClose(g); assert.equal(g.startAttack(p, 'punch'), false); assert.equal(g.startAttack(p, 'kick'), false);
  advance(g, .25, { punchPressed: true }); assert.equal(p.attack, null);
  assert.equal(p.meter, 0); assert.equal(p.landedHits, 0);
  p.meter = 100; advance(g, .4);
  assert.equal(g.useSpecial(p), false); assert.equal(p.meter, 100);
  advance(g, 5); assert.equal(p.backupActive, false); assert.equal(g.isPresenting(p), false);
  p.meter = 0; setClose(g); assert.equal(g.startAttack(p, 'punch'), true); advance(g, .5);
  assert.equal(p.meter, 20); assert.equal(p.landedHits, 1);
  p.meter = 100; assert.equal(g.useSpecial(p), true); assert.equal(p.meter, 0);
});

test('Backup ignores block but respects escape, airborne evasion, and a protected car', () => {
  const blocked = fresh('snitchy'); setClose(blocked);
  blocked.fighters[1].state = 'block'; blocked.fighters[1].actionRemaining = 8;
  blocked.fighters[0].meter = 100; blocked.useSpecial(blocked.fighters[0]); advance(blocked, 7);
  assert.equal(blocked.fighters[1].hp, blocked.fighters[1].maxHp - 36);
  assert.equal(blocked.fighters[0].meter, 0);
  assert.ok(blocked.drainEvents().filter(e => e.type === 'hit').every(e => !e.blocked && e.damage === 4));
  for (const defense of ['escape', 'airborne', 'car']) {
    const g = fresh('snitchy', defense === 'car' ? 'coupe' : 'owl'); setClose(g);
    const [p, e] = g.fighters; p.meter = 100; g.useSpecial(p); const s = g.specials[0];
    while (s.attackAt === null) g.update(1 / 120, {});
    const positions = s.officers.map(o => o.x);
    if (defense === 'escape') e.x = 1100;
    else if (defense === 'airborne') { e.y = 220; e.vy = 550; e.grounded = false; e.jumps = 1; }
    else { e.meter = 100; assert.equal(g.useSpecial(e), true); }
    while (s.punchIndex < 9 && !g.over) g.update(1 / 120, {});
    assert.deepEqual(s.officers.map(o => o.x), positions);
    if (defense === 'airborne') assert.ok(s.hitCount < 9);
    else assert.equal(e.hp, e.maxHp);
    assert.equal(p.meter, 0); advance(g, 6); assert.equal(p.backupActive, false);
  }
});

test('The phone call and complete backup arrival survive attacks, then reset clears them immediately', () => {
  const g = fresh('snitchy'); setClose(g);
  const [p, e] = g.fighters; p.meter = 100; g.useSpecial(p); const backup = g.specials[0]; advance(g, .25);
  assert.equal(g.hit(e, p, 10, 'punch', 180, .2, e.x), false);
  assert.equal(p.hp, p.maxHp); assert.equal(p.state, 'special'); assert.equal(p.meter, 0);
  advance(g, 1); assert.equal(p.backupActive, true); assert.equal(g.isPresenting(p), true);
  assert.equal(g.hit(e, p, 36, 'wing', 360, .38, e.x), false);
  advance(g, 6); assert.equal(backup.punchIndex, 9); assert.equal(e.hp, e.maxHp - 36);
  assert.equal(p.hp, p.maxHp); assert.equal(p.backupActive, false); assert.equal(g.specials.length, 0);
  p.meter = 100; assert.equal(g.useSpecial(p), true); advance(g, 1.4); g.reset(); g.aiEnabled = false;
  assert.equal(g.specials.length, 0); assert.equal(g.fighters[0].backupActive, false);
  assert.equal(g.roundEnding, null); assert.equal(g.isPresenting(g.fighters[0]), false);
});

test('CPU Snitchy uses backup and its authored second-jump flip', () => {
  const g = new CombatGame('owl', 'snitchy'); setClose(g); const ai = g.fighters[1];
  ai.meter = 100; g.ai.think = 0; g.random = () => .8; g.update(1 / 120, {});
  assert.equal(ai.meter, 0); assert.equal(ai.backupActive, true);
  assert.equal(g.specials.find(s => s.owner === 'p2')?.kind, 'backup');
  const jump = new CombatGame('owl', 'snitchy'); setClose(jump);
  const jumper = jump.fighters[1]; jump.jump(jumper);
  jump.random = () => .2; jump.ai.think = 0; jump.update(1 / 120, {});
  assert.equal(jumper.jumps, 2); assert.equal(jumper.flipDirection, -1); assert.ok(jumper.flipRemaining > 0);
});

test('Get It uses the punch input for a single slap, with hit-only meter gain', () => {
  const g = fresh('getit'); setClose(g); const [p, e] = g.fighters;
  g.update(1 / 120, { punchPressed: true });
  assert.equal(p.state, 'punch'); assert.equal(p.attack.kind, 'punch'); assert.equal(p.attack.style, 'slap');
  advance(g, .55);
  assert.equal(e.hp, e.maxHp - 10); assert.equal(p.meter, 20); assert.equal(p.landedHits, 1);
  const hits = g.drainEvents().filter(evt => evt.type === 'hit');
  assert.equal(hits.length, 1); assert.equal(hits[0].style, 'slap');
  setClose(g); e.state = 'block'; e.actionRemaining = 1;
  g.startAttack(p, 'punch'); advance(g, .55);
  assert.equal(e.hp, e.maxHp - 12); assert.equal(p.meter, 20);
  p.x = 100; e.x = 1100; g.startAttack(p, 'punch'); advance(g, 1);
  assert.equal(e.hp, e.maxHp - 12); assert.equal(p.meter, 20);
});

test('Get It has two ordinary jumps with no somersault state', () => {
  const g = fresh('getit'), p = g.fighters[0];
  assert.equal(g.jump(p), true); advance(g, .15);
  assert.equal(g.jump(p), true); assert.equal(g.jump(p), false);
  assert.equal(p.jumps, 2); assert.equal(p.flipRemaining, 0); assert.equal(p.flipProgress, 0);
  advance(g, 1.5); assert.equal(p.grounded, true); assert.equal(p.jumps, 0);
});

test('Live Performance emits four notes and deals 36 damage at 30/60/120 fps in either direction', () => {
  for (const fps of [30, 60, 120]) for (const facing of [-1, 1]) {
    const g = fresh('getit'); const [p, e] = g.fighters;
    p.x = facing > 0 ? 400 : 880; e.x = p.x + facing * 300;
    p.facing = facing; e.facing = -facing;
    p.meter = 99; assert.equal(g.useSpecial(p), false); assert.equal(p.meter, 99);
    p.meter = 100; assert.equal(g.useSpecial(p), true); assert.equal(p.meter, 0);
    const s = g.specials[0], events = [], phases = new Set();
    assert.equal(s.kind, 'vocal'); assert.equal(p.vocalActive, true); assert.equal(g.useSpecial(p), false);
    advance(g, .30); assert.equal(e.hp, e.maxHp); assert.equal(s.waves.length, 0);
    for (let i = 0; i < fps * 3; i++) {
      g.update(1 / fps, {}); phases.add(s.phase); events.push(...g.drainEvents());
    }
    const hits = events.filter(evt => evt.type === 'hit' && evt.kind === 'vocal');
    assert.equal(e.hp, e.maxHp - 36); assert.equal(hits.length, 4); assert.equal(hits.filter(hit => hit.heavy).length, 1);
    assert.equal(s.waveIndex, 4); assert.equal(s.hitCount, 4);
    assert.ok(s.waves.every(wave => wave.hitIds.length === 1 && !wave.active));
    assert.equal(events.filter(evt => evt.type === 'vocalWave').length, 4);
    assert.equal(events.filter(evt => evt.type === 'vocalExplosion').length, 1);
    assert.ok(phases.has('singing') && phases.has('highNote') && phases.has('recovery'));
    assert.equal(p.meter, 0); assert.equal(p.landedHits, 0); assert.equal(p.hp, p.maxHp);
    assert.equal(p.vocalActive, false); assert.equal(p.state, 'idle');
    assert.equal(g.specials.length, 0); assert.equal(g.effects.length, 0);
  }
});

test('Vocal waves ignore blocking but retain range, vertical evasion, and invulnerability', () => {
  const blocked = fresh('getit'); setClose(blocked); const [a, b] = blocked.fighters;
  b.state = 'block'; b.actionRemaining = 4; a.meter = 100; blocked.useSpecial(a); advance(blocked, 3);
  assert.equal(b.hp, b.maxHp - 36); assert.equal(a.meter, 0);
  assert.ok(blocked.drainEvents().filter(evt => evt.type === 'hit').every(evt => !evt.blocked));
  for (const defense of ['range', 'airborne', 'invulnerable', 'car']) {
    const g = fresh('getit', defense === 'car' ? 'coupe' : 'owl'); setClose(g);
    const [p, e] = g.fighters;
    if (defense === 'range') { p.x = 100; e.x = 1180; }
    if (defense === 'invulnerable') e.invuln = 4;
    if (defense === 'car') e.inCar = true;
    p.meter = 100; g.useSpecial(p);
    for (let i = 0; i < 360; i++) {
      if (defense === 'airborne') { e.y = 300; e.vy = 0; e.grounded = false; }
      g.update(1 / 120, {});
    }
    assert.equal(e.hp, e.maxHp, defense); assert.equal(p.meter, 0); assert.equal(g.effects.length, 0);
    assert.equal(g.specials.length, 0); assert.equal(p.vocalActive, false);
  }
});

test('Attacks cannot interrupt the song or any of its four notes', () => {
  for (const late of [false, true]) {
    const g = fresh('getit'); const [p, e] = g.fighters;
    p.x = 400; e.x = 800; p.meter = 100; g.useSpecial(p); const s = g.specials[0];
    advance(g, late ? .50 : .25);
    assert.equal(s.waveIndex, late ? 1 : 0);
    assert.equal(g.hit(e, p, 10, 'punch', 180, .20, e.x), false);
    assert.equal(p.state, 'special'); assert.equal(p.hp, p.maxHp);
    advance(g, 3);
    assert.equal(s.interrupted, false); assert.equal(s.waveIndex, 4);
    assert.equal(e.hp, e.maxHp - 36); assert.equal(p.meter, 0);
    assert.equal(g.specials.length, 0); assert.equal(p.vocalActive, false);
    assert.equal(g.effects.length, 0);
  }
});

test('The final vocal explosion extends protection beyond the singing controller and then expires', () => {
  const g = fresh('getit'); const [p, e] = g.fighters;
  p.x = 200; e.x = 900; p.meter = 100; g.useSpecial(p); advance(g, 1.8);
  assert.equal(p.state, 'idle'); assert.equal(p.vocalActive, true);
  p.meter = 100; assert.equal(g.useSpecial(p), false);
  for (let i = 0; i < 360 && g.specials.length; i++) g.update(1 / 120, {});
  assert.equal(g.specials.length, 0); assert.equal(e.hp, e.maxHp - 36); assert.equal(g.effects.length, 1);
  assert.equal(g.effects[0].kind, 'vocalExplosion'); assert.equal(g.effects[0].defender, 'p2');
  assert.equal(g.effects[0].blocked, false); assert.equal(g.isPresenting(p), true);
  assert.equal(g.startAttack(p, 'punch'), false); assert.equal(g.useSpecial(p), false);
  assert.equal(g.hit(e, p, 10, 'punch', 180, .2, e.x), false);
  advance(g, .6); assert.equal(g.effects.length, 0); assert.equal(g.isPresenting(p), false);
  assert.equal(g.hit(e, p, 10, 'punch', 180, .2, e.x), true); assert.equal(p.hp, p.maxHp - 10);
});

test('CPU Get It uses ranged singing and slaps through its standard punch control', () => {
  const g = new CombatGame('owl', 'getit'); const [p, ai] = g.fighters;
  p.x = 100; ai.x = 1180; ai.meter = 100; g.ai.think = 0; g.random = () => .8;
  g.update(1 / 120, {}); assert.equal(ai.meter, 100); assert.equal(g.specials.length, 0);
  p.x = 350; ai.x = 850; g.ai.think = 0; g.update(1 / 120, {});
  assert.equal(ai.meter, 0); assert.equal(ai.vocalActive, true);
  assert.equal(g.specials.find(s => s.owner === 'p2')?.kind, 'vocal');
  const melee = new CombatGame('owl', 'getit'); setClose(melee);
  melee.random = () => .4; melee.ai.think = 0; melee.update(1 / 120, {});
  assert.equal(melee.fighters[1].attack.kind, 'punch'); assert.equal(melee.fighters[1].attack.style, 'slap');
});

test('Loud Bull charges from landed basics only and retains two ordinary jumps', () => {
  const g = fresh('loudbull'), [p, e] = g.fighters;
  advance(g, 2); g.startAttack(p, 'punch'); advance(g, .5);
  assert.equal(p.meter, 0);
  setClose(g); g.startAttack(p, 'punch'); advance(g, .5);
  assert.equal(p.meter, 20); assert.equal(e.hp, e.maxHp - 10);
  setClose(g); g.startAttack(p, 'kick'); advance(g, .7);
  assert.equal(p.meter, 45); assert.equal(e.hp, e.maxHp - 25);
  setClose(g); e.state = 'block'; e.actionRemaining = 1;
  g.startAttack(p, 'punch'); advance(g, .5); assert.equal(p.meter, 45);
  assert.equal(g.jump(p), true); advance(g, .15);
  assert.equal(g.jump(p), true); assert.equal(g.jump(p), false);
  assert.equal(p.jumps, 2); assert.equal(p.flipRemaining, 0); assert.equal(p.flipProgress, 0);
  advance(g, 1.5); assert.equal(p.grounded, true); assert.equal(p.jumps, 0);
});

test('Giant Yell plants Loud Bull, gates on full meter, and cannot stack', () => {
  const g = fresh('loudbull'), [p, e] = g.fighters;
  p.x = 400; e.x = 700; p.meter = 99;
  assert.equal(g.useSpecial(p), false); assert.equal(p.meter, 99);
  g.jump(p); advance(g, .1); p.meter = 100;
  assert.equal(g.useSpecial(p), true); assert.equal(p.y, 0); assert.equal(p.grounded, true);
  assert.equal(p.meter, 0); assert.equal(p.yellActive, true); assert.equal(p.jumps, 0);
  const s = g.specials[0];
  assert.equal(s.kind, 'yell'); assert.equal(s.phase, 'windup');
  advance(g, .30, { left: true, punchPressed: true, jumpPressed: true });
  assert.equal(p.x, 400); assert.equal(p.y, 0); assert.equal(p.state, 'special'); assert.equal(e.hp, e.maxHp);
  // Even an externally refilled meter must not create a second active shout.
  p.meter = 100; assert.equal(g.useSpecial(p), false); assert.equal(p.meter, 100);
  assert.equal(g.specials.length, 1);
  advance(g, 1.3); assert.equal(p.yellActive, false); assert.equal(g.specials.length, 0);
  assert.equal(g.useSpecial(p), true); assert.equal(p.meter, 0);
});

test('Giant Yell lands four pulses for 36 damage at 30/60/120 fps in either direction', () => {
  for (const fps of [30, 60, 120]) for (const facing of [-1, 1]) {
    const g = fresh('loudbull'), [p, e] = g.fighters;
    p.x = facing > 0 ? 400 : 880; e.x = p.x + facing * 280;
    p.facing = facing; e.facing = -facing; p.meter = 100; g.useSpecial(p);
    const s = g.specials[0], events = [], phases = new Set();
    for (let i = 0; i < fps * 2; i++) {
      g.update(1 / fps, {}); phases.add(s.phase); events.push(...g.drainEvents());
    }
    const hits = events.filter(evt => evt.type === 'hit' && evt.kind === 'yell');
    assert.equal(e.hp, e.maxHp - 36); assert.equal(hits.length, 4); assert.equal(hits.filter(hit => hit.heavy).length, 1);
    assert.equal(s.pulseIndex, 4); assert.equal(s.hitCount, 4);
    assert.deepEqual(hits.map(evt => evt.damage), [9, 9, 9, 9]);
    assert.equal(events.filter(evt => evt.type === 'yellStart').length, 1);
    assert.equal(events.filter(evt => evt.type === 'yellPulse').length, 4);
    assert.equal(events.filter(evt => evt.type === 'yellEnd').length, 1);
    assert.ok(phases.has('windup') && phases.has('yelling') && phases.has('recovery'));
    assert.equal(p.meter, 0); assert.equal(p.landedHits, 0); assert.equal(p.hp, p.maxHp);
    assert.equal(p.x, facing > 0 ? 400 : 880);
    assert.equal(p.yellActive, false); assert.equal(p.state, 'idle'); assert.equal(g.specials.length, 0);
  }
});

test('Giant Yell is a forward cone with bounded range and credible vertical evasion', () => {
  for (const defense of ['behind', 'range', 'airborne', 'invulnerable', 'car']) {
    const g = fresh('loudbull', defense === 'car' ? 'coupe' : 'owl'), [p, e] = g.fighters;
    p.x = 400; e.x = 700; p.facing = 1;
    if (defense === 'range') { p.x = 100; e.x = 1180; }
    if (defense === 'invulnerable') e.invuln = 3;
    if (defense === 'car') e.inCar = true;
    p.meter = 100; g.useSpecial(p);
    const s = g.specials[0];
    if (defense === 'behind') e.x = 200;
    for (let i = 0; i < 240; i++) {
      if (defense === 'airborne') { e.y = 300; e.vy = 0; e.grounded = false; }
      g.update(1 / 120, {});
      assert.equal(s.facing, 1);
    }
    assert.equal(e.hp, e.maxHp, defense); assert.equal(s.hitCount, 0); assert.equal(p.meter, 0);
    assert.equal(g.specials.length, 0); assert.equal(p.yellActive, false);
  }
  const jump = fresh('loudbull'); setClose(jump); const [a, b] = jump.fighters;
  a.meter = 100; jump.useSpecial(a); jump.jump(b); advance(jump, .40);
  assert.equal(b.hp, b.maxHp, 'the first jump clears the narrow cone at its apex');
  assert.equal(jump.jump(b), true); advance(jump, 1.5);
  assert.equal(b.hp, b.maxHp, 'a timed double jump clears all four pulses');
});

test('Giant Yell rechecks escape each pulse and ignores block for all four hits', () => {
  const blocked = fresh('loudbull'); setClose(blocked); const [a, b] = blocked.fighters;
  b.state = 'block'; b.actionRemaining = 3; a.meter = 100; blocked.useSpecial(a); advance(blocked, 2);
  assert.equal(b.hp, b.maxHp - 36); assert.equal(a.meter, 0); assert.equal(b.meter, 0);
  const hits = blocked.drainEvents().filter(evt => evt.type === 'hit');
  assert.equal(hits.length, 4); assert.ok(hits.every(evt => !evt.blocked));
  assert.deepEqual(hits.map(evt => evt.damage), [9, 9, 9, 9]);
  const escaped = fresh('loudbull'), [p, e] = escaped.fighters;
  p.x = 300; e.x = 600; p.meter = 100; escaped.useSpecial(p);
  advance(escaped, .42); assert.equal(e.hp, e.maxHp - 9);
  e.x = 1180; advance(escaped, 2);
  assert.equal(e.hp, e.maxHp - 9); assert.equal(p.meter, 0);
});

test('Attacks during windup or yelling cannot stop any of the four pulses', () => {
  for (const late of [false, true]) {
    const g = fresh('loudbull'), [p, e] = g.fighters;
    p.x = 400; e.x = 700; p.meter = 100; g.useSpecial(p); const s = g.specials[0];
    advance(g, late ? .44 : .25); assert.equal(s.pulseIndex, late ? 1 : 0);
    assert.equal(g.hit(e, p, 10, 'punch', 180, .20, e.x), false);
    assert.equal(g.hit(e, p, 36, 'car', 520, .42, e.x), false);
    assert.equal(p.hp, p.maxHp); assert.equal(p.x, 400); assert.equal(p.state, 'special');
    advance(g, 2);
    assert.equal(s.interrupted, false); assert.equal(s.pulseIndex, 4); assert.equal(e.hp, e.maxHp - 36);
    assert.equal(p.yellActive, false); assert.equal(g.specials.length, 0); assert.equal(p.meter, 0);
  }
});

test('Giant Yell completes its recovery after an early knockout and resets immediately on request', () => {
  const g = fresh('loudbull'); setClose(g); const [p, e] = g.fighters;
  p.meter = 100; e.hp = 9; g.useSpecial(p); const s = g.specials[0]; advance(g, .5);
  assert.equal(g.over, false); assert.equal(g.roundEnding.winner, 'p1'); assert.equal(p.state, 'special');
  assert.equal(p.yellActive, true); assert.equal(e.hp, 0);
  const clock = g.timeRemaining; advance(g, 2);
  assert.equal(g.over, true); assert.equal(g.winner, 'p1'); assert.equal(g.timeRemaining, clock);
  assert.equal(s.pulseIndex, 4); assert.equal(p.yellActive, false); assert.equal(g.specials.length, 0);
  const events = g.drainEvents(); assert.equal(events.filter(evt => evt.type === 'yellEnd').length, 1);
  assert.equal(events.filter(evt => evt.type === 'ko').length, 1);
  g.reset(); g.aiEnabled = false; g.fighters[0].meter = 100; g.useSpecial(g.fighters[0]); advance(g, .5);
  g.reset(); assert.equal(g.specials.length, 0); assert.equal(g.fighters[0].yellActive, false);
  assert.equal(g.roundEnding, null);
});

test('CPU Loud Bull waits for shout range and uses the same street punches', () => {
  const g = new CombatGame('owl', 'loudbull'), [p, ai] = g.fighters;
  p.x = 100; ai.x = 1180; ai.meter = 100; g.ai.think = 0; g.random = () => .8;
  g.update(1 / 120, {}); assert.equal(ai.meter, 100); assert.equal(g.specials.length, 0);
  p.x = 350; ai.x = 850; g.ai.think = 0; g.update(1 / 120, {});
  assert.equal(ai.meter, 0); assert.equal(ai.yellActive, true);
  const shout = g.specials.find(s => s.owner === 'p2');
  assert.equal(shout.kind, 'yell'); assert.equal(shout.facing, -1);
  ai.meter = 100; g.ai.think = 0; g.update(1 / 120, {}); assert.equal(g.specials.length, 1);
  const melee = new CombatGame('owl', 'loudbull'); setClose(melee);
  melee.random = () => .4; melee.ai.think = 0; melee.update(1 / 120, {});
  assert.equal(melee.fighters[1].attack.kind, 'punch'); assert.equal(melee.fighters[1].attack.style, 'punch');
});

test('FatBoi earns meter only from basic hits and has two ordinary jumps', () => {
  const g = fresh('fatboi'), [p, e] = g.fighters;
  advance(g, 2); g.startAttack(p, 'punch'); advance(g, .5); assert.equal(p.meter, 0);
  setClose(g); g.startAttack(p, 'punch'); advance(g, .5); assert.equal(p.meter, 20);
  setClose(g); g.startAttack(p, 'kick'); advance(g, .7); assert.equal(p.meter, 45);
  setClose(g); e.state = 'block'; e.actionRemaining = 1;
  g.startAttack(p, 'punch'); advance(g, .5); assert.equal(p.meter, 45);
  assert.equal(g.jump(p), true); advance(g, .15); assert.equal(g.jump(p), true);
  assert.equal(g.jump(p), false); assert.equal(p.jumps, 2); assert.equal(p.flipRemaining, 0);
  advance(g, 1.5); assert.equal(p.jumps, 0); assert.equal(p.grounded, true);
});

test('Bite and Toss visibly bites before one throw, consumes full meter, and never heals', () => {
  const g = fresh('fatboi'), [p, e] = g.fighters;
  p.x = 300; e.x = 900; p.hp = 110; p.meter = 99;
  assert.equal(g.useSpecial(p), false); p.meter = 100; g.jump(p); advance(g, .1);
  assert.equal(g.useSpecial(p), true); assert.equal(p.y, 0); assert.equal(p.jumps, 0);
  assert.equal(p.meter, 0); assert.equal(p.wingActive, true); const s = g.specials[0];
  assert.equal(s.kind, 'wing'); assert.equal(s.phase, 'reveal');
  advance(g, .32, { right: true, punchPressed: true, jumpPressed: true });
  assert.equal(p.x, 300); assert.equal(p.y, 0); assert.equal(s.bitten, false); assert.equal(s.projectile, null);
  advance(g, .04); assert.equal(s.phase, 'bite'); assert.equal(s.bitten, true);
  assert.equal(s.projectile, null); assert.equal(p.hp, 110);
  advance(g, .58); assert.equal(s.phase, 'windup'); assert.equal(s.projectile, null);
  advance(g, .03); assert.equal(s.phase, 'release'); assert.equal(s.released, true); assert.equal(s.projectile.active, true);
  const events = g.drainEvents();
  assert.equal(events.filter(evt => evt.type === 'wingBite').length, 1);
  assert.equal(events.filter(evt => evt.type === 'wingThrow').length, 1);
  assert.ok(events.findIndex(evt => evt.type === 'wingBite') < events.findIndex(evt => evt.type === 'wingThrow'));
  p.meter = 100; assert.equal(g.useSpecial(p), false); assert.equal(g.specials.length, 1);
  assert.equal(p.hp, 110); assert.equal(e.hp, e.maxHp);
});

test('A thrown wing deals one 36-damage hit at 30/60/120 fps in either direction', () => {
  for (const fps of [30, 60, 120]) for (const facing of [-1, 1]) {
    const g = fresh('fatboi'), [p, e] = g.fighters;
    p.x = facing > 0 ? 300 : 980; e.x = p.x + facing * 400;
    p.facing = facing; e.facing = -facing; p.meter = 100; g.useSpecial(p);
    const s = g.specials[0], events = [], phases = new Set();
    for (let i = 0; i < fps * 3; i++) {
      g.update(1 / fps, {}); phases.add(s.phase); events.push(...g.drainEvents());
    }
    const hits = events.filter(evt => evt.type === 'hit' && evt.kind === 'wing');
    assert.equal(e.hp, e.maxHp - 36); assert.equal(hits.length, 1); assert.equal(hits[0].damage, 36); assert.equal(hits[0].heavy, true);
    assert.equal(s.hitCount, 1); assert.deepEqual(s.projectile.hitIds, ['p2']); assert.equal(s.projectile.active, false);
    assert.equal(events.filter(evt => evt.type === 'wingBite').length, 1);
    assert.equal(events.filter(evt => evt.type === 'wingThrow').length, 1);
    assert.equal(events.filter(evt => evt.type === 'wingImpact').length, 1);
    assert.equal(events.filter(evt => evt.type === 'wingEnd').length, 1);
    assert.ok(phases.has('bite') && phases.has('windup') && phases.has('release') && phases.has('recovery'));
    assert.equal(p.meter, 0); assert.equal(p.landedHits, 0); assert.equal(p.hp, p.maxHp);
    assert.equal(p.wingActive, false); assert.equal(p.state, 'idle'); assert.equal(g.specials.length, 0);
  }
});

test('Wing collision is swept and its one 36-damage hit ignores blocking', () => {
  const blocked = fresh('fatboi'); setClose(blocked); const [a, b] = blocked.fighters;
  b.state = 'block'; b.actionRemaining = 3; a.meter = 100; blocked.useSpecial(a); advance(blocked, 3);
  assert.equal(b.hp, b.maxHp - 36); assert.equal(a.meter, 0); assert.equal(b.meter, 0);
  const hits = blocked.drainEvents().filter(evt => evt.type === 'hit');
  assert.equal(hits.length, 1); assert.equal(hits[0].blocked, false); assert.equal(hits[0].damage, 36);
  const swept = fresh('fatboi'), [p, e] = swept.fighters;
  p.x = 100; e.x = 520; p.meter = 100; swept.useSpecial(p);
  swept.specials[0].speed = 6000; // Crosses the whole hurtbox between coarse simulation frames.
  for (let i = 0; i < 75; i++) swept.update(1 / 30, {});
  assert.equal(e.hp, e.maxHp - 36); assert.equal(swept.drainEvents().filter(evt => evt.type === 'hit').length, 1);
});

test('A wing follows a fixed arc, can miss, and does not home behind FatBoi or through invulnerability', () => {
  for (const defense of ['behind', 'range', 'airborne', 'invulnerable', 'car']) {
    const g = fresh('fatboi', defense === 'car' ? 'coupe' : 'owl'), [p, e] = g.fighters;
    p.x = 300; e.x = 800; p.facing = 1;
    if (defense === 'range') { p.x = 100; e.x = 1180; }
    if (defense === 'invulnerable') e.invuln = 4;
    if (defense === 'car') e.inCar = true;
    p.meter = 100; g.useSpecial(p); const s = g.specials[0];
    if (defense === 'behind') e.x = 100;
    const heights = [];
    for (let i = 0; i < 360; i++) {
      if (defense === 'airborne') { e.y = 320; e.vy = 0; e.grounded = false; }
      g.update(1 / 120, {});
      if (s.projectile?.active) heights.push(s.projectile.y);
      assert.equal(s.facing, 1);
    }
    assert.equal(e.hp, e.maxHp, defense); assert.equal(s.hitCount, 0); assert.equal(p.meter, 0);
    assert.ok(Math.max(...heights) > 150); assert.ok(heights.at(-1) < 80);
    assert.equal(g.specials.length, 0); assert.equal(p.wingActive, false);
  }
  const jump = fresh('fatboi'); setClose(jump); const [p, e] = jump.fighters;
  p.meter = 100; jump.useSpecial(p); advance(jump, .70); jump.jump(e);
  advance(jump, .12); assert.equal(jump.jump(e), true); advance(jump, 2);
  assert.equal(e.hp, e.maxHp, 'a timed double jump clears a close-range wing');
});

test('Neither the bite nor the released wing can be interrupted by incoming attacks', () => {
  for (const late of [false, true]) {
    const g = fresh('fatboi'), [p, e] = g.fighters;
    p.x = 300; e.x = 900; p.meter = 100; g.useSpecial(p); const s = g.specials[0];
    advance(g, late ? 1.02 : .65); assert.equal(s.released, late);
    assert.equal(g.hit(e, p, 10, 'punch', 180, .20, e.x), false);
    assert.equal(p.state, 'special'); assert.equal(p.hp, p.maxHp); assert.equal(p.x, 300);
    advance(g, 3); assert.equal(s.interrupted, false); assert.equal(e.hp, e.maxHp - 36); assert.equal(p.meter, 0);
    assert.equal(p.wingActive, false); assert.equal(g.specials.length, 0);
    const events = g.drainEvents();
    assert.equal(events.filter(evt => evt.type === 'wingBite').length, 1);
    assert.equal(events.filter(evt => evt.type === 'wingThrow').length, 1);
    assert.equal(events.filter(evt => evt.type === 'wingImpact' && evt.reason === 'hit').length, 1);
  }
});

test('FatBoi can move after recovery but cannot stack a wing still in flight', () => {
  const g = fresh('fatboi'), [p, e] = g.fighters;
  p.x = 100; e.x = 1180; p.meter = 100; g.useSpecial(p); const s = g.specials[0];
  advance(g, 1.50); assert.equal(p.state, 'idle'); assert.equal(p.wingActive, true); assert.equal(s.projectile.active, true);
  p.meter = 100; assert.equal(g.useSpecial(p), false); const x = p.x;
  advance(g, .15, { right: true }); assert.ok(p.x > x); assert.equal(s.projectile.facing, 1);
  advance(g, 1); assert.equal(p.wingActive, false); assert.equal(g.specials.length, 0);
  assert.equal(g.useSpecial(p), true); assert.equal(p.meter, 0);
});

test('Bite and Toss retains its impact presentation after a knockout, with no delayed damage', () => {
  const g = fresh('fatboi'), [p, e] = g.fighters;
  p.x = 300; e.x = 900; p.meter = 100; e.hp = 36; g.useSpecial(p); advance(g, 1.02);
  const s = g.specials[0]; assert.equal(s.projectile.active, true);
  for (let i = 0; i < 240 && !g.roundEnding; i++) g.update(1 / 120, {});
  assert.equal(g.over, false); assert.equal(g.roundEnding.winner, 'p1'); assert.equal(e.hp, 0);
  assert.equal(g.isPresenting(p), true); assert.ok(g.effects.some(effect => effect.kind === 'wingImpact'));
  const clock = g.timeRemaining; advance(g, 3);
  assert.equal(g.winner, 'p1'); assert.equal(g.over, true); assert.equal(g.timeRemaining, clock);
  assert.equal(g.specials.length, 0); assert.equal(p.wingActive, false); assert.equal(g.effects.length, 0);
  assert.equal(p.damageDealt, 36); assert.equal(e.hp, 0);
  g.reset(); g.aiEnabled = false; g.fighters[0].meter = 100; g.useSpecial(g.fighters[0]); advance(g, 1.02);
  g.reset(); assert.equal(g.specials.length, 0); assert.equal(g.fighters[0].wingActive, false);
  assert.equal(g.effects.length, 0); assert.equal(g.roundEnding, null);
});

test('CPU FatBoi saves the throw for range and uses normal street attacks', () => {
  const g = new CombatGame('owl', 'fatboi'), [p, ai] = g.fighters;
  p.x = 100; ai.x = 1180; ai.meter = 100; g.ai.think = 0; g.random = () => .8;
  g.update(1 / 120, {}); assert.equal(ai.meter, 100); assert.equal(g.specials.length, 0);
  p.x = 350; ai.x = 850; g.ai.think = 0; g.update(1 / 120, {});
  assert.equal(ai.meter, 0); assert.equal(ai.wingActive, true);
  assert.equal(g.specials[0].kind, 'wing'); assert.equal(g.specials[0].facing, -1);
  ai.meter = 100; g.ai.think = 0; g.update(1 / 120, {}); assert.equal(g.specials.length, 1);
  const melee = new CombatGame('owl', 'fatboi'); setClose(melee);
  melee.random = () => .4; melee.ai.think = 0; melee.update(1 / 120, {});
  assert.equal(melee.fighters[1].attack.kind, 'punch'); assert.equal(melee.fighters[1].attack.style, 'punch');
});

test('Munchy uses landed basics for meter and keeps two ordinary jumps', () => {
  const g = fresh('icespice'), [p, e] = g.fighters;
  advance(g, 2); g.startAttack(p, 'punch'); advance(g, .5); assert.equal(p.meter, 0);
  setClose(g); g.startAttack(p, 'punch'); advance(g, .5); assert.equal(p.meter, 20);
  setClose(g); g.startAttack(p, 'kick'); advance(g, .7); assert.equal(p.meter, 45);
  setClose(g); e.state = 'block'; e.actionRemaining = 1;
  g.startAttack(p, 'punch'); advance(g, .5); assert.equal(p.meter, 45);
  assert.equal(g.jump(p), true); advance(g, .15); assert.equal(g.jump(p), true);
  assert.equal(g.jump(p), false); assert.equal(p.jumps, 2); assert.equal(p.flipRemaining, 0);
  advance(g, 1.5); assert.equal(p.grounded, true); assert.equal(p.jumps, 0);
});

test('Munch requires full meter and presents a visible reach before catching or biting', () => {
  const g = fresh('icespice'); setClose(g); const [p, e] = g.fighters;
  p.meter = 99; assert.equal(g.useSpecial(p), false); assert.equal(p.meter, 99);
  p.meter = 100; g.jump(p); advance(g, .1); assert.equal(g.useSpecial(p), true);
  const s = g.specials[0];
  assert.equal(s.kind, 'munch'); assert.equal(p.meter, 0); assert.equal(p.munchActive, true);
  assert.equal(p.y, 0); assert.equal(p.jumps, 0); assert.equal(s.phase, 'windup');
  advance(g, .30, { right: true, jumpPressed: true, punchPressed: true });
  assert.equal(p.x, 450); assert.equal(p.y, 0); assert.equal(s.phase, 'reach');
  assert.equal(e.hp, e.maxHp); assert.equal(e.grabbedBy, null); assert.equal(s.biteIndex, 0);
  advance(g, .20); assert.equal(s.phase, 'lift'); assert.equal(e.grabbedBy, p.id);
  assert.equal(s.targetId, e.id); assert.equal(s.grabbed, true); assert.equal(e.hp, e.maxHp);
  assert.equal(s.biteIndex, 0); p.meter = 100;
  assert.equal(g.useSpecial(p), false); assert.equal(g.specials.length, 1);
});

test('Munch holds the actual opponent and lands three 16-damage chomps at 30/60/120 fps in both directions', () => {
  for (const fps of [30, 60, 120]) for (const facing of [-1, 1]) {
    const g = fresh('icespice', 'fatboi'), [p, e] = g.fighters;
    p.x = facing > 0 ? 450 : 830; e.x = p.x + facing * 100;
    p.facing = facing; e.facing = -facing; e.state = 'block'; e.actionRemaining = 6;
    p.meter = 100; g.useSpecial(p); const s = g.specials[0], events = [], phases = new Set();
    for (let i = 0; i < fps * 3; i++) {
      g.update(1 / fps, {}); phases.add(s.phase); events.push(...g.drainEvents());
      if (s.grabbed) {
        assert.equal(e.type, 'fatboi'); assert.equal(e.grabbedBy, p.id); assert.equal(e.state, 'grabbed');
        assert.equal(e.x, s.targetX); assert.equal(e.y, Math.max(0, s.targetY - 105));
        assert.equal(e.vx, 0); assert.equal(e.vy, 0); assert.equal(g.canAct(e), false);
      }
    }
    const hits = events.filter(evt => evt.type === 'hit' && evt.kind === 'munch');
    const bites = events.filter(evt => evt.type === 'munchBite');
    assert.equal(e.hp, e.maxHp - 48); assert.equal(p.hp, p.maxHp); assert.equal(p.damageDealt, 48);
    assert.equal(hits.length, 3); assert.ok(hits.every(evt => evt.damage === 16 && !evt.blocked && evt.heavy));
    assert.deepEqual(bites.map(evt => evt.index), [0, 1, 2]); assert.ok(bites.every(evt => evt.connected));
    assert.equal(events.filter(evt => evt.type === 'munchGrab').length, 1);
    assert.equal(events.filter(evt => evt.type === 'munchRelease').length, 1);
    assert.equal(s.hitCount, 3); assert.equal(s.biteIndex, 3); assert.equal(s.targetId, e.id);
    assert.ok(['reach', 'lift', 'open', 'chomp', 'release', 'recovery'].every(phase => phases.has(phase)));
    assert.equal(s.grabbed, false); assert.equal(e.grabbedBy, null); assert.equal(p.munchActive, false);
    assert.equal(g.specials.length, 0); assert.equal(p.meter, 0); assert.equal(e.meter, 0); assert.equal(p.landedHits, 0);
  }
});

test('A grabbed player cannot move, jump, attack, block, or start a special until released', () => {
  const g = fresh('owl', 'icespice'); setClose(g); const [target, owner] = g.fighters;
  owner.meter = 100; g.useSpecial(owner); const s = g.specials[0]; advance(g, .72);
  assert.equal(target.grabbedBy, owner.id); const x = target.x, y = target.y;
  target.meter = 100; assert.equal(g.jump(target), false); assert.equal(g.startAttack(target, 'punch'), false);
  assert.equal(g.startAttack(target, 'kick'), false); assert.equal(g.useSpecial(target), false);
  advance(g, .40, { moveX: 1, block: true, jumpPressed: true, punchPressed: true, kickPressed: true, specialPressed: true });
  assert.equal(target.x, x); assert.equal(target.y, y); assert.equal(target.state, 'grabbed');
  assert.equal(target.attack, null); assert.equal(target.meter, 100); assert.equal(owner.hp, owner.maxHp);
  target.x = owner.x - 20; g.separateFighters(); assert.equal(target.x, owner.x - 20);
  advance(g, 1.5); assert.equal(s.grabbed, false); assert.equal(target.grabbedBy, null);
  assert.equal(target.grounded, true); assert.equal(g.canAct(target), true); assert.equal(g.jump(target), true);
});

test('Munch misses behind, out of range, jumping, invulnerable, and protected opponents without late recapture', () => {
  for (const defense of ['behind', 'range', 'airborne', 'invulnerable', 'protected', 'escape']) {
    const g = fresh('icespice', defense === 'protected' ? 'loudbull' : 'owl'); setClose(g);
    const [p, e] = g.fighters;
    if (defense === 'behind') e.x = p.x - 100;
    if (defense === 'range') e.x = p.x + 186;
    if (defense === 'airborne') g.jump(e);
    if (defense === 'invulnerable') e.invuln = 3;
    if (defense === 'protected') { e.meter = 100; assert.equal(g.useSpecial(e), true); }
    p.meter = 100; g.useSpecial(p); const s = g.specials.find(effect => effect.owner === p.id);
    advance(g, .30); if (defense === 'escape') e.x = 1100;
    advance(g, .22); assert.equal(s.catchAttempted, true); assert.equal(s.grabbed, false, defense);
    assert.equal(s.targetId, null); assert.equal(e.grabbedBy, null);
    if (defense !== 'protected') { e.x = p.x + 100; e.y = 0; e.grounded = true; e.vy = 0; }
    advance(g, 3); assert.equal(e.hp, e.maxHp, defense); assert.equal(p.hp, p.maxHp);
    assert.equal(s.hitCount, 0); assert.equal(s.biteIndex, 3); assert.equal(p.meter, 0); assert.equal(p.munchActive, false);
    assert.equal(g.drainEvents().filter(evt => evt.type === 'munchGrab').length, 0);
  }
});

test('Munch releases its captured opponent on normal completion, reset, or forced finish', () => {
  for (const ending of ['complete', 'reset', 'finish']) {
    const g = fresh('icespice'); setClose(g); const [p, e] = g.fighters;
    p.meter = 100; g.useSpecial(p); const s = g.specials[0]; advance(g, .70);
    assert.equal(s.grabbed, true); assert.equal(e.grabbedBy, p.id);
    if (ending === 'reset') g.reset();
    else if (ending === 'finish') g.finish('draw');
    else advance(g, 2);
    assert.equal(s.grabbed, false); assert.equal(s.active, false); assert.equal(e.grabbedBy, null);
    assert.equal(p.munchActive, false); assert.equal(g.specials.length, 0);
    assert.ok(g.fighters.every(f => !f.grabbedBy && !f.munchActive));
    if (ending !== 'complete') { assert.equal(e.y, 0); assert.equal(e.grounded, true); }
  }
});

test('An early munch knockout keeps all three jaw beats and releases the opponent safely before the result', () => {
  const g = fresh('icespice'); setClose(g); const [p, e] = g.fighters;
  p.meter = 100; e.hp = 10; g.useSpecial(p); const s = g.specials[0];
  for (let i = 0; i < 180 && !g.roundEnding; i++) g.update(1 / 120, {});
  assert.equal(g.over, false); assert.equal(g.roundEnding.winner, 'p1'); assert.equal(e.hp, 0);
  assert.equal(e.grabbedBy, p.id); assert.equal(s.biteIndex, 1); const clock = g.timeRemaining;
  advance(g, 3); assert.equal(g.over, true); assert.equal(g.winner, 'p1'); assert.equal(g.timeRemaining, clock);
  assert.equal(s.biteIndex, 3); assert.equal(s.hitCount, 1); assert.equal(p.damageDealt, 10);
  assert.equal(e.grabbedBy, null); assert.equal(e.y, 0); assert.equal(e.state, 'ko');
  const events = g.drainEvents(); assert.equal(events.filter(evt => evt.type === 'munchBite').length, 3);
  assert.equal(events.filter(evt => evt.type === 'munchRelease').length, 1);
  assert.equal(events.filter(evt => evt.type === 'ko').length, 1);
});

test('Timeout or owner knockout during a grab finishes the presentation without further damage or stuck fighters', () => {
  for (const ending of ['timeout', 'owner knockout']) {
    const g = fresh('icespice'); setClose(g); const [p, e] = g.fighters;
    p.meter = 100; g.useSpecial(p); const s = g.specials[0]; advance(g, .60);
    assert.equal(e.grabbedBy, p.id); assert.equal(e.hp, e.maxHp);
    if (ending === 'timeout') g.timeRemaining = .001; else p.hp = 0;
    g.update(1 / 120, {}); assert.ok(g.roundEnding); assert.equal(g.over, false);
    const winner = g.roundEnding.winner, clock = g.timeRemaining;
    advance(g, 3); assert.equal(g.over, true); assert.equal(g.winner, winner); assert.equal(g.timeRemaining, clock);
    assert.equal(e.hp, e.maxHp); assert.equal(p.damageDealt, 0); assert.equal(s.biteIndex, 3);
    assert.equal(e.grabbedBy, null); assert.equal(p.munchActive, false); assert.equal(g.specials.length, 0);
    assert.equal(g.drainEvents().filter(evt => evt.type === 'hit').length, 0);
  }
});

test('CPU Munchy waits for a grounded target in grab range and uses the same munch sequence', () => {
  const g = new CombatGame('owl', 'icespice'), [p, ai] = g.fighters;
  p.x = 100; ai.x = 1180; ai.meter = 100; g.ai.think = 0; g.random = () => .8;
  g.update(1 / 120, {}); assert.equal(ai.meter, 100); assert.equal(g.specials.length, 0);
  setClose(g); g.jump(p); advance(g, .1); g.ai.think = 0; g.update(1 / 120, {});
  assert.equal(ai.meter, 100); assert.equal(g.specials.length, 0);
  p.y = 0; p.vy = 0; p.grounded = true; ai.actionRemaining = 0; ai.attack = null;
  g.ai.think = 0; g.update(1 / 120, {});
  assert.equal(ai.meter, 0); assert.equal(ai.munchActive, true); assert.equal(g.specials[0].kind, 'munch');
  assert.equal(g.specials[0].facing, -1); g.aiEnabled = false; advance(g, 3);
  assert.equal(p.hp, p.maxHp - 48); assert.equal(p.grabbedBy, null); assert.equal(ai.munchActive, false);
});

test('Horse Power requires a full meter and a visible grounded summon before the stallion arrives', () => {
  const g = fresh('hehaw'); setClose(g); const [p, e] = g.fighters;
  p.meter = 99; assert.equal(g.useSpecial(p), false); assert.equal(g.specials.length, 0);
  g.jump(p); advance(g, .1); assert.ok(p.y > 0);
  p.meter = 100; assert.equal(g.useSpecial(p), true); const s = g.specials[0];
  assert.equal(s.kind, 'horse'); assert.equal(p.meter, 0); assert.equal(p.horseActive, true);
  assert.equal(p.y, 0); assert.equal(p.grounded, true); assert.equal(p.jumps, 0);
  assert.equal(s.horse.visible, false); assert.ok(s.horse.x + s.horse.width / 2 < 0);
  advance(g, .4, { moveX: 1, jumpPressed: true, punchPressed: true, specialPressed: true });
  assert.equal(s.phase, 'windup'); assert.equal(e.hp, e.maxHp); assert.equal(s.horse.visible, false);
  assert.equal(p.x, 450); assert.equal(p.y, 0); assert.equal(p.attack, null);
  assert.equal(g.jump(p), false); assert.equal(g.startAttack(p, 'kick'), false);
  p.meter = 100; assert.equal(g.useSpecial(p), false); p.meter = 0;
  advance(g, .1); assert.equal(s.phase, 'charge'); assert.equal(s.horse.visible, true);
  assert.equal(g.drainEvents().filter(evt => evt.type === 'horseEnter').length, 1);
});

test('The stallion crosses the arena, hits once through block, and exits at 30/60/120 fps in both directions', () => {
  for (const fps of [30, 60, 120]) for (const facing of [-1, 1]) {
    const g = fresh('hehaw', 'fatboi'), [p, e] = g.fighters;
    p.x = facing > 0 ? 300 : 980; e.x = p.x + facing * 400;
    p.facing = facing; e.facing = -facing; e.state = 'block'; e.actionRemaining = 5;
    p.meter = 100; g.useSpecial(p); const s = g.specials[0];
    const events = [], phases = new Set(), frames = new Set(); let oldX = s.horse.x, launched = false;
    for (let i = 0; i < fps * 3; i++) {
      g.update(1 / fps, {}); phases.add(s.phase); events.push(...g.drainEvents());
      assert.ok((s.horse.x - oldX) * facing >= -1e-8); oldX = s.horse.x;
      if (s.horse.visible) frames.add(s.horse.frame);
      if (e.vy > 200 && e.vx * facing > 400) launched = true;
      assert.equal(p.x, facing > 0 ? 300 : 980); assert.equal(p.y, 0);
    }
    const hits = events.filter(evt => evt.type === 'hit' && evt.kind === 'horse');
    assert.equal(e.hp, e.maxHp - 48); assert.equal(p.hp, p.maxHp); assert.equal(p.damageDealt, 48);
    assert.equal(hits.length, 1); assert.equal(hits[0].blocked, false); assert.equal(hits[0].heavy, true);
    assert.equal(s.hitCount, 1); assert.deepEqual(s.hitIds, [e.id]); assert.equal(launched, true);
    assert.equal(events.filter(evt => evt.type === 'horseEnter').length, 1);
    assert.equal(events.filter(evt => evt.type === 'horseImpact').length, 1);
    assert.equal(events.filter(evt => evt.type === 'horseExit').length, 1);
    const steps = events.filter(evt => evt.type === 'horseStep');
    assert.ok(steps.length >= 8); assert.equal(new Set(steps.map(evt => evt.index)).size, steps.length);
    assert.equal(frames.size, 8); assert.ok(phases.has('windup') && phases.has('charge') && phases.has('recovery'));
    assert.ok(facing > 0 ? s.horse.x - s.horse.width / 2 > 1280 : s.horse.x + s.horse.width / 2 < 0);
    assert.equal(s.horse.visible, false); assert.equal(s.horse.active, false); assert.equal(p.horseActive, false);
    assert.equal(g.specials.length, 0); assert.equal(g.effects.length, 0);
    assert.equal(p.meter, 0); assert.equal(e.meter, 0); assert.equal(p.landedHits, 0);
  }
});

test('Horse collision is swept even when a coarse frame crosses the complete opponent hurtbox', () => {
  for (const facing of [-1, 1]) {
    const g = fresh('hehaw'), [p, e] = g.fighters;
    p.x = facing > 0 ? 300 : 980; e.x = p.x + facing * 250; p.facing = facing;
    p.meter = 100; g.useSpecial(p); g.specials[0].speed = 36000;
    for (let i = 0; i < 90; i++) g.update(1 / 30, {});
    assert.equal(e.hp, e.maxHp - 48); assert.equal(g.drainEvents().filter(evt => evt.type === 'horseImpact').length, 1);
  }
});

test('Horse Power waits for visible nose contact in both directions before applying damage', () => {
  for (const facing of [-1, 1]) {
    const g = fresh('hehaw'), [p, e] = g.fighters;
    p.x = facing > 0 ? 340 : 940; e.x = facing > 0 ? 940 : 340;
    p.facing = facing; p.meter = 100; g.useSpecial(p); const s = g.specials[0];
    let connected = false;
    for (let i = 0; i < 360 && !connected; i++) {
      g.update(1 / 120, {});
      const nose = s.horse.x + facing * 124;
      const opponentEdge = e.x - facing * 28;
      const gap = (opponentEdge - nose) * facing;
      if (gap > 1e-8) assert.equal(e.hp, e.maxHp, `Facing ${facing}: damage occurred with a ${gap}px gap`);
      if (e.hp < e.maxHp) {
        connected = true;
        assert.ok(gap <= 1e-8, 'The nose must reach the opponent before impact');
        assert.ok(gap >= -(900 / 120) - 1e-8, 'Contact must occur on the first crossing frame');
        assert.equal(e.hp, e.maxHp - 48);
      }
    }
    assert.equal(connected, true);
    assert.equal(g.drainEvents().filter(evt => evt.type === 'horseImpact').length, 1);
  }
});

test('A timed double jump clears Horse Power, while behind, invulnerable, and protected targets are not hit', () => {
  const jumping = fresh('hehaw'); setClose(jumping); const [p, e] = jumping.fighters;
  p.meter = 100; jumping.useSpecial(p); advance(jumping, .75);
  assert.equal(jumping.jump(e), true); advance(jumping, .20); assert.equal(jumping.jump(e), true);
  advance(jumping, 2); assert.equal(e.hp, e.maxHp); assert.equal(e.grounded, true);
  assert.equal(jumping.drainEvents().filter(evt => evt.type === 'horseImpact').length, 0);
  for (const defense of ['behind', 'invulnerable', 'protected']) {
    const g = fresh('hehaw', defense === 'protected' ? 'snitchy' : 'owl'), [a, b] = g.fighters;
    a.x = 450; b.x = defense === 'behind' ? 300 : 850; a.facing = 1;
    if (defense === 'invulnerable') b.invuln = 4;
    if (defense === 'protected') { b.meter = 100; g.useSpecial(b); }
    a.meter = 100; g.useSpecial(a); const s = g.specials.find(special => special.owner === a.id);
    advance(g, 3); assert.equal(b.hp, b.maxHp, defense); assert.equal(s.hitCount, 0);
    assert.equal(s.horse.visible, false); assert.equal(a.horseActive, false);
    assert.equal(g.drainEvents().filter(evt => evt.type === 'horseImpact').length, 0);
  }
});

test('Horse Power keeps galloping after a knockout before resolving the round exactly once', () => {
  const g = fresh('hehaw'); setClose(g); const [p, e] = g.fighters;
  p.meter = 100; e.hp = 1; g.useSpecial(p); const s = g.specials[0];
  for (let i = 0; i < 360 && !g.roundEnding; i++) g.update(1 / 120, {});
  assert.equal(g.over, false); assert.equal(e.hp, 0); assert.equal(s.horse.visible, true);
  const hitX = s.horse.x, clock = g.timeRemaining; advance(g, 3);
  assert.ok(s.horse.x > hitX + 600); assert.equal(s.horse.visible, false);
  assert.equal(g.over, true); assert.equal(g.winner, 'p1'); assert.equal(g.timeRemaining, clock);
  assert.equal(p.damageDealt, 1); assert.equal(p.horseActive, false);
  const events = g.drainEvents(); assert.equal(events.filter(evt => evt.type === 'horseExit').length, 1);
  assert.equal(events.filter(evt => evt.type === 'ko').length, 1);
  assert.ok(events.findIndex(evt => evt.type === 'horseExit') < events.findIndex(evt => evt.type === 'ko'));
});

test('Reset and forced finish remove the stallion and its impact without leaving HeHaw locked', () => {
  for (const ending of ['reset', 'finish']) {
    const g = fresh('hehaw'); setClose(g); const [p] = g.fighters;
    p.meter = 100; g.useSpecial(p); const s = g.specials[0]; advance(g, 1.15);
    assert.equal(s.horse.visible, true); assert.ok(g.effects.some(effect => effect.kind === 'horseImpact'));
    if (ending === 'reset') g.reset(); else g.finish('draw');
    assert.equal(s.horse.visible, false); assert.equal(s.horse.active, false); assert.equal(s.active, false);
    assert.equal(p.horseActive, false); assert.equal(p.actionRemaining, 0);
    assert.equal(g.specials.length, 0); assert.equal(g.effects.length, 0);
    assert.ok(g.fighters.every(f => !f.horseActive));
  }
});

test('CPU HeHaw calls the stallion from across the arena using the same special sequence', () => {
  const g = new CombatGame('owl', 'hehaw'), [p, ai] = g.fighters;
  p.x = 100; ai.x = 1180; ai.meter = 100; g.ai.think = 0; g.random = () => .8;
  g.update(1 / 120, {}); const s = g.specials[0];
  assert.equal(ai.meter, 0); assert.equal(ai.horseActive, true); assert.equal(s.kind, 'horse');
  assert.equal(s.facing, -1); assert.ok(s.horse.x - s.horse.width / 2 > 1280);
  g.aiEnabled = false; advance(g, 3); assert.equal(p.hp, p.maxHp - 48); assert.equal(ai.hp, ai.maxHp);
  assert.equal(ai.horseActive, false); assert.equal(g.specials.length, 0);
});

const roster = ['owl', 'coupe', 'karate', 'snitchy', 'getit', 'loudbull', 'fatboi', 'icespice', 'hehaw', 'dr-no-bunnies', 'cantrap', 'smackprince', 'babybigfists', 'mooja', 'cranes', 'demon', 'ocrrrrr', 'president', 'owhinny', 'roboking', 'quickfast', 'sassyt', 'jminors'];
const specialKinds = ['owl', 'car', 'barrage', 'backup', 'vocal', 'yell', 'wing', 'munch', 'horse', 'belt', 'crew', 'spotlight', 'giantFists', 'milk', 'elevator', 'maskedCrew', 'nailPierce', 'airstrike', 'moneyRain', 'cybertruck'];

test('All twenty specials deal full damage through a facing block at 30/60/120 fps in both directions', () => {
  for (const type of roster) for (const fps of [30, 60, 120]) for (const direction of [-1, 1]) {
    const g = fresh(type), [p, e] = g.fighters;
    p.x = direction > 0 ? 450 : 830; e.x = p.x + direction * 100;
    p.facing = direction; e.facing = -direction;
    e.state = 'block'; e.actionRemaining = 8; p.meter = 100;
    assert.equal(g.useSpecial(p), true);
    for (let i = 0; i < fps * 8; i++) g.update(1 / fps, {});
    const hits = g.drainEvents().filter(evt => evt.type === 'hit');
    const total = type === 'owl' ? 30 : ['icespice', 'hehaw', 'dr-no-bunnies', 'cantrap', 'smackprince', 'babybigfists', 'mooja', 'cranes', 'demon', 'ocrrrrr', 'president', 'owhinny', 'roboking', 'quickfast', 'sassyt', 'jminors'].includes(type) ? 48 : 36;
    assert.equal(e.hp, e.maxHp - total, `${type}, ${fps}fps, facing ${direction}`);
    assert.equal(hits.reduce((sum, hit) => sum + hit.damage, 0), total);
    assert.ok(hits.length > 0 && hits.every(hit => hit.blocked === false));
    assert.equal(p.meter, 0); assert.equal(e.meter, 0); assert.equal(p.landedHits, 0);
  }
});

test('Every full presentation rejects basic and special interruption and restores vulnerability afterward', () => {
  for (const type of roster) {
    const g = fresh(type); setClose(g); const [p, e] = g.fighters;
    p.meter = 100; g.useSpecial(p); assert.equal(g.isPresenting(p), true);
    let protectedSteps = 0;
    for (let i = 0; i < 960 && g.isPresenting(p); i++) {
      const before = { hp: p.hp, x: p.x, y: p.y, vx: p.vx, vy: p.vy,
        state: p.state, stateTime: p.stateTime, actionRemaining: p.actionRemaining, facing: p.facing };
      for (const kind of ['punch', 'kick', ...specialKinds]) {
        assert.equal(g.hit(e, p, 36, kind, 520, .42, e.x), false, `${type} protected against ${kind}`);
      }
      assert.deepEqual({ hp: p.hp, x: p.x, y: p.y, vx: p.vx, vy: p.vy,
        state: p.state, stateTime: p.stateTime, actionRemaining: p.actionRemaining, facing: p.facing }, before);
      assert.equal(g.startAttack(p, 'punch'), false); assert.equal(g.startAttack(p, 'kick'), false);
      assert.equal(p.attack, null);
      p.meter = 100; assert.equal(g.useSpecial(p), false); assert.equal(p.meter, 100); p.meter = 0;
      g.update(1 / 120, { punchPressed: true, kickPressed: true }); protectedSteps++;
    }
    assert.ok(protectedSteps > 0 && protectedSteps < 960, `${type} presentation must complete`);
    assert.equal(g.isPresenting(p), false); assert.equal(p.hp, p.maxHp);
    assert.equal(p.landedHits, 0); assert.equal(p.meter, 0); assert.equal(e.meter, 0);
    assert.equal(g.hit(e, p, 10, 'punch', 180, .2, e.x), true, `${type} vulnerability restored`);
    assert.equal(p.hp, p.maxHp - 10); assert.equal(p.state, 'hurt'); assert.equal(e.meter, 20);
  }
});

test('Delayed owls and post-release wing impact retain protection after the actor recovers', () => {
  const owls = fresh('owl'), [a, b] = owls.fighters;
  a.meter = 100; owls.useSpecial(a);
  assert.ok(owls.specials.every(s => s.delay > 0 && !s.active));
  assert.equal(owls.isPresenting(a), true);
  advance(owls, .68);
  assert.equal(a.state, 'idle'); assert.ok(owls.specials.length > 0); assert.equal(owls.isPresenting(a), true);
  assert.equal(owls.hit(b, a, 10, 'punch', 180, .2, b.x), false);
  advance(owls, 2); assert.equal(owls.isPresenting(a), false);

  const wing = fresh('fatboi'), [p, e] = wing.fighters;
  p.x = 200; e.x = 900; p.meter = 100; wing.useSpecial(p);
  for (let i = 0; i < 480 && wing.specials.length; i++) wing.update(1 / 120, {});
  assert.equal(p.state, 'idle'); assert.equal(wing.specials.length, 0);
  assert.ok(wing.effects.some(effect => effect.kind === 'wingImpact'));
  assert.equal(wing.isPresenting(p), true);
  assert.equal(wing.hit(e, p, 36, 'wing', 360, .38, e.x), false);
  assert.equal(wing.startAttack(p, 'kick'), false);
  advance(wing, .4); assert.equal(wing.isPresenting(p), false);
  assert.equal(wing.startAttack(p, 'kick'), true);
});

test('Simultaneous specials preserve both presentations across all ordered fighter pairings', () => {
  for (const player of roster) for (const opponent of roster.filter(type => type !== player)) {
    const g = fresh(player, opponent); setClose(g); const [a, b] = g.fighters;
    a.meter = b.meter = 100;
    assert.equal(g.useSpecial(a), true); assert.equal(g.useSpecial(b), true);
    assert.equal(g.isPresenting(a), true); assert.equal(g.isPresenting(b), true);
    let steps = 0;
    while (g.hasPresentations() && steps++ < 960) {
      for (const [owner, other] of [[a, b], [b, a]]) if (g.isPresenting(owner)) {
        assert.equal(owner.hp, owner.maxHp, `${player}/${opponent}: ${owner.type} was hurt during presentation`);
        assert.equal(g.hit(other, owner, 36, 'wing', 360, .38, other.x), false);
        assert.notEqual(owner.state, 'hurt'); assert.notEqual(owner.state, 'ko');
      }
      g.update(1 / 120, {});
    }
    assert.ok(steps < 960, `${player}/${opponent}: presentations must terminate`);
    assert.equal(g.specials.length, 0); assert.equal(g.effects.length, 0);
    assert.equal(a.meter, 0); assert.equal(b.meter, 0); assert.equal(g.over, false);
  }
});

test('All twenty specials finish after knockout with one frozen result and no subsequent damage', () => {
  for (const type of roster) {
    const g = fresh(type); setClose(g); const [p, e] = g.fighters;
    p.meter = 100; e.hp = 1; g.useSpecial(p);
    for (let i = 0; i < 960 && !g.roundEnding; i++) g.update(1 / 120, {});
    assert.equal(g.over, false, `${type} must finish presenting before the result`);
    assert.equal(g.roundEnding.winner, 'p1'); assert.equal(g.roundEnding.timedOut, false);
    assert.equal(g.winner, null); assert.equal(e.hp, 0); assert.equal(g.isPresenting(p), true);
    const clock = g.timeRemaining, hp = p.hp;
    assert.equal(g.canAct(p), false); assert.equal(g.canAct(e), false);
    assert.equal(g.startAttack(p, 'punch'), false); assert.equal(g.jump(p), false);
    p.meter = 100; assert.equal(g.useSpecial(p), false); p.meter = 0;
    assert.equal(g.hit(e, p, 36, 'wing', 360, .38, e.x), false);
    advance(g, 8, { right: true, jumpPressed: true, punchPressed: true, specialPressed: true });
    assert.equal(g.over, true); assert.equal(g.winner, 'p1'); assert.equal(g.timeRemaining, clock);
    assert.equal(e.hp, 0); assert.equal(p.hp, hp); assert.equal(p.damageDealt, 1);
    assert.equal(g.specials.length, 0); assert.equal(g.effects.length, 0); assert.equal(g.isPresenting(p), false);
    assert.notEqual(p.state, 'special', `${type} must exit its presentation pose`); assert.equal(p.inCar, false);
    const events = g.drainEvents();
    assert.equal(events.filter(evt => evt.type === 'ko').length, 1);
    assert.equal(events.filter(evt => evt.type === 'hit').reduce((sum, evt) => sum + evt.damage, 0), 1);
    if (type === 'karate') assert.equal(events.filter(evt => evt.type === 'barragePunch').length, 12);
    if (type === 'snitchy') assert.equal(events.filter(evt => evt.type === 'backupPunch').length, 9);
    if (type === 'getit') {
      assert.equal(events.filter(evt => evt.type === 'vocalWave').length, 4);
      assert.equal(events.filter(evt => evt.type === 'vocalExplosion').length, 1);
    }
    if (type === 'loudbull') assert.equal(events.filter(evt => evt.type === 'yellPulse').length, 4);
    if (type === 'fatboi') assert.equal(events.filter(evt => evt.type === 'wingThrow').length, 1);
    if (type === 'icespice') {
      assert.equal(events.filter(evt => evt.type === 'munchBite').length, 3);
      assert.equal(events.filter(evt => evt.type === 'munchRelease').length, 1);
      assert.equal(e.grabbedBy, null);
    }
  }
});

test('Timeout freezes the result and lets every existing presentation finish without extra damage', () => {
  for (const type of roster) {
    const g = fresh(type), [p, e] = g.fighters;
    p.x = 100; e.x = 1180; if (['dr-no-bunnies', 'smackprince', 'babybigfists'].includes(type)) setClose(g); p.meter = 100; g.useSpecial(p); g.timeRemaining = .001;
    g.update(1 / 120, {});
    assert.equal(g.over, false); assert.equal(g.timeRemaining, 0);
    assert.equal(g.roundEnding.winner, 'draw'); assert.equal(g.roundEnding.timedOut, true);
    assert.equal(g.isPresenting(p), true); assert.equal(g.canAct(p), false);
    assert.equal(g.hit(p, e, 36, 'wing', 360, .38, p.x), false);
    advance(g, 8, { punchPressed: true, kickPressed: true, specialPressed: true });
    assert.equal(g.over, true); assert.equal(g.winner, 'draw'); assert.equal(g.timeRemaining, 0);
    assert.equal(p.hp, p.maxHp); assert.equal(e.hp, e.maxHp); assert.equal(p.damageDealt, 0);
    assert.equal(g.specials.length, 0); assert.equal(g.effects.length, 0);
    const events = g.drainEvents(); assert.equal(events.filter(evt => evt.type === 'hit').length, 0);
    assert.equal(events.filter(evt => evt.type === 'ko').length, 1);
    assert.equal(events.find(evt => evt.type === 'ko').timedOut, true);
  }
});

test('Reset immediately clears pending results and presentations for every fighter', () => {
  for (const type of roster) {
    const g = fresh(type); if (['dr-no-bunnies', 'smackprince', 'babybigfists'].includes(type)) setClose(g); g.fighters[0].meter = 100; g.useSpecial(g.fighters[0]);
    g.timeRemaining = .01; advance(g, .1);
    assert.ok(g.roundEnding); assert.ok(g.hasPresentations());
    g.reset(); g.aiEnabled = false;
    assert.equal(g.roundEnding, null); assert.equal(g.over, false); assert.equal(g.winner, null);
    assert.equal(g.specials.length, 0); assert.equal(g.effects.length, 0); assert.equal(g.hasPresentations(), false);
    for (const f of g.fighters) {
      assert.equal(f.hp, f.maxHp); assert.equal(f.state, 'idle'); assert.equal(f.inCar, false);
      assert.equal(f.backupActive || f.vocalActive || f.yellActive || f.wingActive || f.munchActive || f.horseActive || f.beltActive || f.crewActive, false);
      assert.equal(f.grabbedBy, null);
    }
    advance(g, 8); assert.equal(g.fighters[1].hp, g.fighters[1].maxHp); assert.equal(g.drainEvents().length, 0);
  }
});

test('A resolved owner knockout preserves its existing presentation until the latched result completes', () => {
  for (const type of roster) {
    const g = fresh(type), [p, e] = g.fighters;
    p.x = 100; e.x = 1180; if (['dr-no-bunnies', 'smackprince', 'babybigfists'].includes(type)) setClose(g); p.meter = 100; g.useSpecial(p); advance(g, .20);
    // A direct health resolution is an exceptional game-state transition, not an interrupting hit.
    p.hp = 0; g.update(1 / 120, {});
    assert.equal(g.over, false); assert.equal(g.roundEnding.winner, 'p2');
    assert.equal(g.isPresenting(p), true); assert.equal(p.state, 'special');
    const clock = g.timeRemaining; advance(g, 8);
    assert.equal(g.over, true); assert.equal(g.winner, 'p2'); assert.equal(g.timeRemaining, clock);
    assert.equal(p.hp, 0); assert.equal(e.hp, e.maxHp); assert.equal(p.state, 'ko');
    assert.equal(g.specials.length, 0); assert.equal(g.effects.length, 0); assert.equal(p.inCar, false);
    const events = g.drainEvents(); assert.equal(events.filter(evt => evt.type === 'ko').length, 1);
    if (type === 'karate') assert.equal(events.filter(evt => evt.type === 'barragePunch').length, 12);
    if (type === 'snitchy') assert.equal(events.filter(evt => evt.type === 'backupPunch').length, 9);
    if (type === 'getit') assert.equal(events.filter(evt => evt.type === 'vocalWave').length, 4);
    if (type === 'loudbull') assert.equal(events.filter(evt => evt.type === 'yellPulse').length, 4);
    if (type === 'fatboi') assert.equal(events.filter(evt => evt.type === 'wingThrow').length, 1);
  }
});

console.log(`${tests} combat behavior checks passed.`);
