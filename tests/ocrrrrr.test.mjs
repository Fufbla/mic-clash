import test from 'node:test';
import assert from 'node:assert/strict';
import { CombatGame } from '../dist/combat.js';
import { NAIL_PIERCE as N, ocrrrrrPose as pose, nailSegments, nailExtension } from '../dist/ocrrrrr.js';

function match(side = 'p1', direction = 1, distance = 250) {
  const g = new CombatGame(side === 'p1' ? 'ocrrrrr' : 'owl', side === 'p1' ? 'owl' : 'ocrrrrr');
  g.aiEnabled = false;
  const a = g.fighters.find(f => f.type === 'ocrrrrr'), b = g.fighters.find(f => f !== a);
  a.x = direction > 0 ? 300 : 980; b.x = a.x + direction * distance;
  a.facing = direction; b.facing = -direction;
  return { g, a, b };
}
function step(g, seconds, fps = 120, input = {}) {
  for (let n = 0; n < Math.round(seconds * fps); n++) g.update(1 / fps, input);
}
function activate(g, a) { a.meter = 100; assert.ok(g.useSpecial(a)); return g.specials[0]; }

test('Ocrrrrr! is selectable on both sides with claw slaps, hit-powered meter, kicks and ordinary double jump', () => {
  for (const side of ['p1', 'p2']) {
    const { g, a, b } = match(side, 1, 100);
    g.startAttack(a, 'punch'); assert.equal(a.attack.style, 'slap'); step(g, .5);
    assert.equal(b.hp, 150); assert.equal(a.meter, 20);
    b.x = a.x + 100; b.state = 'block'; b.actionRemaining = 1;
    g.startAttack(a, 'punch'); step(g, .5); assert.equal(a.meter, 20);
    b.state = 'idle'; b.x = a.x + 100; g.startAttack(a, 'kick'); step(g, .6); assert.equal(a.meter, 45);
    assert.ok(g.jump(a)); step(g, .1); assert.ok(g.jump(a)); assert.equal(g.jump(a), false);
    assert.equal(a.flipRemaining, 0); step(g, 2); assert.ok(a.grounded);
  }
});

test('The confident walk uses eight steps and kicks retract and plant before repeating at every frame rate', () => {
  const steps = new Set();
  for (let i = 0; i < 120; i++) steps.add(pose({ state: 'run', grounded: true, vx: 250, facing: 1, stateTime: i / 120 }).index);
  assert.equal(steps.size, 8);
  for (const fps of [30, 60, 120]) {
    const { g, a, b } = match(); b.x = 1180;
    for (let repeat = 0; repeat < 3; repeat++) {
      g.startAttack(a, 'kick'); const seen = new Set();
      while (a.attack) { seen.add(pose(a).index); g.update(1 / fps, {}); }
      assert.deepEqual([...seen], [8,9,10,11,12,13]); assert.equal(a.state, 'idle');
    }
  }
});

test('Nail Pierce requires full meter, grounds the caster and prevents overlapping attacks', () => {
  const { g, a } = match(); a.meter = 99; assert.equal(g.useSpecial(a), false);
  g.jump(a); step(g, .1); activate(g, a); assert.equal(a.meter, 0); assert.equal(a.y, 0); assert.ok(a.nailActive);
  a.meter = 100; assert.equal(g.useSpecial(a), false); assert.equal(g.startAttack(a, 'kick'), false);
  assert.equal(g.specials.length, 1); a.meter = 0; step(g, 3); assert.equal(a.meter, 0);
});

test('Hands reach first, ten attached nails grow, hold, retract, and disappear before normal guard returns', () => {
  const { g, a } = match(); const s = activate(g, a);
  step(g, .5); assert.equal(pose(a, s).index, 10); assert.equal(nailSegments(s, a).length, 0);
  step(g, .25); const growing = nailSegments(s, a); assert.equal(growing.length, 10);
  assert.ok(s.extension > 0 && s.extension < 1); assert.equal(pose(a, s).index, 11);
  step(g, .3); assert.equal(s.extension, 1);
  const full = nailSegments(s, a); assert.ok(full.every((n, i) => n.length > growing[i].length));
  assert.ok(full.slice(0, 5).every(n => n.rootY > 115)); assert.ok(full.slice(5).every(n => n.rootY < 115));
  step(g, .4); assert.ok(s.extension > 0 && s.extension < 1); assert.equal(s.phase, 'retract');
  step(g, .25); assert.equal(nailSegments(s, a).length, 0); assert.equal(pose(a, s).index, 14);
  step(g, .5); assert.equal(a.nailActive, false); assert.equal(pose(a).key, 'ocrrrrr');
});

test('One 48-damage piercing hit ignores block on both sides at close and extended reach at 30/60/120 fps', () => {
  for (const fps of [30,60,120]) for (const direction of [-1,1]) for (const side of ['p1','p2']) for (const distance of [100,250,370]) {
    const { g, a, b } = match(side, direction, distance); b.state = 'block'; b.actionRemaining = 5;
    const s = activate(g, a); step(g, .75, fps); assert.equal(b.hp, 160);
    step(g, 2.5, fps); assert.equal(b.hp, 112); assert.equal(s.hitCount, 1); assert.equal(a.meter, 0);
    const events = g.drainEvents();
    assert.deepEqual(events.filter(e => e.type === 'hit').map(e => [e.damage,e.blocked,e.kind]), [[48,false,'nailPierce']]);
    assert.equal(events.filter(e => e.type === 'nailsExtend').length, 1);
    assert.equal(events.filter(e => e.type === 'nailsRetract').length, 1);
    assert.equal(events.filter(e => e.type === 'nailPierceHit').length, 1);
  }
});

test('Collision follows visible nail reach and mirrors the same hand geometry in both directions', () => {
  for (const fps of [30,60,120]) for (const direction of [-1,1]) {
    const { g, a, b } = match('p1', direction, 370); const s = activate(g, a);
    while (!s.hitCount && s.active) {
      g.update(1/fps, {});
      const segments = nailSegments(s,a);
      if (s.hitCount) {
        assert.ok(s.age >= N.strikeAt && s.age <= N.hitEnd);
        const farthest = Math.max(...segments.map(n => (n.tipX - a.x) * direction));
        assert.ok(farthest >= (b.x-a.x)*direction-28, 'No invisible reach past the drawn tips');
        assert.ok(b.nailLaunched); assert.ok(b.vy > 0);
      }
    }
    assert.equal(s.hitCount, 1);
    const right = nailSegments({active:true,age:1,facing:1},{x:0,y:0});
    const left = nailSegments({active:true,age:1,facing:-1},{x:0,y:0});
    for(let i=0;i<10;i++) { assert.equal(right[i].tipX,-left[i].tipX); assert.equal(right[i].tipY,left[i].tipY); }
  }
});

test('Behind, out-of-range and invulnerable targets evade; retracting nails never land a late hit', () => {
  for (const mode of ['behind','far','invulnerable','late']) {
    const { g, a, b } = match();
    if (mode === 'behind') b.x=a.x-160;
    if (mode === 'far' || mode === 'late') b.x=1100;
    if (mode === 'invulnerable') b.invuln=4;
    const s=activate(g,a); step(g,1.2);
    if(mode==='late') b.x=a.x+110;
    step(g,1.5); assert.equal(b.hp,160); assert.equal(s.hitCount,0); assert.equal(a.meter,0);
  }
});

test('A timed double jump clears the nail fan while a grounded opponent is hittable', () => {
  for (const fps of [30,60,120]) {
    const { g,a,b }=match(); const s=activate(g,a); step(g,.5,fps);
    assert.ok(g.jump(b)); step(g,.2,fps); assert.ok(g.jump(b)); step(g,2,fps);
    assert.equal(b.hp,160); assert.equal(s.hitCount,0);
  }
});

test('Ocrrrrr! is protected through nail retraction and recovers vulnerability afterward', () => {
  const { g,a,b }=match(); activate(g,a); step(g,1.4);
  assert.equal(g.startAttack(a,'punch'),false); assert.equal(g.hit(b,a,15,'kick',250,.3,b.x),false);
  step(g,.7); assert.equal(g.isPresenting(a),false); assert.equal(a.nailActive,false);
  assert.ok(g.hit(b,a,10,'punch',180,.2,b.x));
});

test('KO and timeout finish the nail growth and retraction before one frozen result without extra damage', () => {
  for(const mode of ['ko','timeout']) {
    const {g,a,b}=match(); if(mode==='ko')b.hp=10;
    const s=activate(g,a); if(mode==='timeout')g.timeRemaining=.01;
    step(g,1.1); assert.ok(g.roundEnding); assert.equal(g.over,false);
    if(mode==='ko')assert.ok(b.nailLaunched);
    const clock=g.timeRemaining; step(g,2); assert.ok(g.over); assert.equal(g.timeRemaining,clock);
    assert.ok(s.extended && s.retracted); assert.equal(a.nailActive,false);
    const events=g.drainEvents(); assert.equal(events.filter(e=>e.type==='ko').length,1);
    assert.equal(events.filter(e=>e.type==='hit').reduce((n,e)=>n+e.damage,0),mode==='ko'?10:0);
  }
});

test('Reset and forced finish remove nails, impact visuals and caster/launch state', () => {
  for(const mode of ['reset','finish'])for(const time of [.7,.95,1.4]) {
    const {g,a}=match();const s=activate(g,a);step(g,time);
    if(mode==='reset')g.reset('ocrrrrr','owl');else g.finish('p1');
    assert.equal(s.active,false);assert.equal(s.extension,0);assert.equal(a.nailActive,false);
    assert.equal(nailSegments(s,a).length,0);assert.equal(g.specials.length,0);assert.equal(g.effects.length,0);
    assert.ok(g.fighters.every(f=>!f.nailLaunched));assert.equal(pose(g.fighters[0]).key,'ocrrrrr');
  }
});

test('CPU uses Nail Pierce in reach and saves its meter when too far away', () => {
  for(const distance of [250,650]) {
    const {g,a,b}=match('p2',-1,distance);a.meter=100;g.aiEnabled=true;g.ai.think=0;g.random=()=>.8;
    g.update(1/120,{});g.aiEnabled=false;
    assert.equal(a.meter,distance<400?0:100);step(g,3);assert.equal(b.hp,distance<400?112:160);
  }
  assert.equal(nailExtension(N.shrinkEnd),0);
});
