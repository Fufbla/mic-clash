import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { CombatGame } from '../dist/combat.js';
import { EXECUTIVE_FIGHTERS as roster, executivePose } from '../dist/executive-fighters.js';
const step = (g, sec, fps = 120, input = {}) => { for (let i = 0; i < Math.round(sec * fps); i++) g.update(1 / fps, input); };
function match(type, side = 0, facing = 1) {
  const g = new CombatGame(...(side ? ['owl', type] : [type, 'owl'])); g.aiEnabled = false;
  const a = g.fighters[side], b = g.fighters[1 - side];
  a.x = facing > 0 ? 320 : 960; b.x = a.x + facing * 320; a.facing = facing; b.facing = -facing;
  return { g, a, b };
}

for (const type of Object.keys(roster)) {
  test(`${type}: authored walk, attacks, double jump and special poses work on either side`, () => {
    for (const side of [0,1]) {
      const { g, a, b } = match(type, side); b.x = a.x + 100;
      assert.equal(a.type, type); assert.equal(a.hp, 320);
      g.startAttack(a, 'punch'); step(g, .5); assert.equal(b.hp, 310); assert.equal(a.meter, 20);
      b.x = a.x + 100; g.startAttack(a, 'kick'); step(g, .6); assert.equal(b.hp, 295); assert.equal(a.meter, 45);
      assert.ok(g.jump(a)); step(g, .1); assert.ok(g.jump(a)); assert.equal(g.jump(a), false); assert.equal(executivePose(a).index, 3);
      step(g, 2); a.meter = 99; assert.equal(g.useSpecial(a), false);
      a.meter = 100; assert.ok(g.useSpecial(a)); assert.equal(a.meter, 0);
      const s = g.specials[0], poses = new Set();
      while (s.active) { poses.add(executivePose(a,s).index); g.update(1 / 120); }
      assert.ok(poses.has(8) && poses.has(11) && poses.has(15));
      assert.equal(a.state, 'idle'); assert.equal(g.specials.length, 0);
    }
    const poses = new Set(Array.from({length:120}, (_,i) => executivePose({type, state:'run', grounded:true, vx:250, facing:1, stateTime:i/120}).index));
    assert.equal(poses.size, 8);
  });

  test(`${type}: full special deals 48 damage in both directions on both sides at 30/60/120 fps`, () => {
    for (const fps of [30,60,120]) for (const side of [0,1]) for (const facing of [-1,1]) {
      const { g, a, b } = match(type, side, facing); a.meter = 100; b.state = 'block'; b.actionRemaining = 7;
      assert.ok(g.useSpecial(a)); step(g, 6, fps);
      assert.equal(b.hp, 272, `${type}, ${side}, ${facing}, ${fps}`);
      assert.equal(a.hp, 320); assert.equal(a.meter, 0); assert.equal(a.damageDealt, 48);
      const hits = g.drainEvents().filter(e => e.type === 'hit');
      assert.equal(hits.length, type === 'owhinny' ? 4 : type === 'roboking' ? 2 : 1);
      assert.ok(hits.every(e => !e.blocked));
    }
  });

  test(`${type}: moving away after target lock evades and CPU uses the same special`, () => {
    const { g, a, b } = match(type, 1); a.meter = 100; g.useSpecial(a); step(g, .7);
    b.x = 1100; step(g, 5); assert.equal(b.hp, 320);
    const cpu = match(type, 1); cpu.g.aiEnabled = true; cpu.a.meter = 100; cpu.g.ai.think = 0;
    step(cpu.g, .5); assert.ok(cpu.g.drainEvents().some(e => e.type === 'special' && e.fighter === cpu.a.id));
  });
}

for (const type of ['president', 'roboking']) {
  test(`${type}: security consumes only the tenth basic contact without chip, meter, or repeated same-attack hits`, () => {
    for (const fps of [30,60,120]) for (const side of [0,1]) {
      const { g, a: defender, b: attacker } = match(type, side);
      for (let i = 1; i <= 20; i++) {
        attacker.x = 450; defender.x = 550; attacker.facing = 1; defender.facing = -1;
        attacker.actionRemaining = 0; attacker.state = 'idle'; attacker.meter = 0;
        defender.invuln = 0; defender.actionRemaining = 0; defender.state = 'idle';
        const before = defender.hp; assert.ok(g.startAttack(attacker,'punch')); step(g,.45,fps);
        assert.equal(defender.hp, before - (i % 10 ? 10 : 0));
        assert.equal(attacker.meter, i % 10 ? 20 : 0);
        assert.equal(defender.incomingBasics, i);
      }
      assert.equal(defender.securityBlocks, 2); assert.equal(defender.hp, 140);
      assert.equal(g.drainEvents().filter(e => e.type === 'securityBlock').length, 2);
      g.reset(); assert.equal(g.fighters[side].incomingBasics, 0); assert.equal(g.fighters[side].securityBlocks, 0);
    }
  });

  test(`${type}: misses and invulnerable contacts do not count; all specials bypass security`, () => {
    const { g, a, b } = match(type); a.incomingBasics = 9;
    a.invuln = 1; assert.equal(g.hit(b,a,10,'punch',0,.2,b.x), false); assert.equal(a.incomingBasics, 9);
    a.invuln = 0; b.x = 1180; g.startAttack(b,'punch'); step(g,.5); assert.equal(a.incomingBasics, 9);
    for (const kind of ['airstrike','moneyRain','cybertruck','nailPierce','belt','owl']) {
      a.invuln = 0; const hp = a.hp; assert.ok(g.hit(b,a,12,kind,0,.2,b.x)); assert.equal(a.hp, hp - 12);
      assert.equal(a.incomingBasics,9);
    }
    a.invuln=0; a.state='block'; a.grounded=true; a.facing=1;
    const hp=a.hp; assert.ok(g.hit(b,a,15,'kick',0,.2,b.x)); assert.equal(a.hp,hp); assert.equal(a.securityBlocks,1);
  });
}

test('New specials reset and force-finish cleanly at every phase, including after knockout', () => {
  for (const type of Object.keys(roster)) for (const age of [.1,.8,1.4,1.9,2.4,3.1]) for (const mode of ['reset','finish']) {
    const {g,a,b}=match(type);a.meter=100;b.hp=1;g.useSpecial(a);step(g,age);
    if(mode==='reset')g.reset();else g.finish('p1');
    assert.equal(g.specials.length,0);assert.equal(g.hasPresentations(),false);
    assert.ok(g.fighters.every(f=>f.state!=='special'&&!f.inCar&&!f.grabbedBy));
  }
});

test('Both served entry points contain the complete 29-fighter roster and atlas assets', () => {
  const atlas=JSON.parse(readFileSync(new URL('../dist/assets/atlas.json',import.meta.url)));
  for(const entry of ['../index.html','../dist/index.html']) {
    const html=readFileSync(new URL(entry,import.meta.url),'utf8');
    const cards=[...html.matchAll(/data-fighter="([^"]+)"/g)].map(m=>m[1]);
    assert.equal(cards.length,37);assert.equal(new Set(cards).size,37);
    for(const type of Object.keys(roster))assert.ok(cards.includes(type));
  }
  for(const type of Object.keys(roster))for(const suffix of ['','Actions','Support']) {
    const asset=atlas[type+suffix];assert.ok(asset);assert.ok(existsSync(new URL('../dist/'+asset.src,import.meta.url)));
    assert.equal(asset.frames.length,suffix==='Support'?(type==='owhinny'?4:8):16);
    for(const f of asset.frames){assert.ok(f.w>0&&f.h>0);assert.ok(f.x>=0&&f.y>=0&&f.x+f.w<=asset.width&&f.y+f.h<=asset.height);}
  }
});
