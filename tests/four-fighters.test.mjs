import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CombatGame,FIGHTERS} from '../dist/combat.js';
import {FOUR_FIGHTERS,FOUR_KINDS,fourPose} from '../dist/four-fighters.js';
const step=(g,s,fps=120)=>{for(let i=0;i<Math.ceil(s*fps);i++)g.update(1/fps);};
for(const type of Object.keys(FOUR_FIGHTERS)){
 test(type+': regular attacks and both player slots',()=>{
  for(const side of [0,1]){
   const g=new CombatGame(...(side?['owl',type]:[type,'owl']),{localMultiplayer:true});
   const a=g.fighters[side],b=g.fighters[1-side];
   a.x=500;b.x=600;a.facing=1;b.facing=-1;
   assert.ok(g.startAttack(a,'punch'));step(g,.6);
   assert.ok(a.landedHits>=1);assert.equal(a.meter,20);
   assert.ok(g.startAttack(a,'kick'));step(g,.7);
   assert.equal(a.meter,45);assert.ok(b.hp<320);
   assert.ok(g.jump(a));assert.ok(g.jump(a));assert.equal(g.jump(a),false);
   step(g,2);assert.equal(a.grounded,true);
  }
 });
 test(type+': full-meter unblockable 48 damage, both directions and refresh rates',()=>{
  for(const fps of [30,60,120])for(const side of [0,1])for(const dir of [-1,1]){
   const g=new CombatGame(...(side?['owl',type]:[type,'owl']),{localMultiplayer:true});
   const a=g.fighters[side],b=g.fighters[1-side];
   a.x=dir>0?350:930;b.x=a.x+dir*180;a.facing=dir;b.facing=-dir;
   b.state='block';b.actionRemaining=8;
   a.meter=99;assert.equal(g.useSpecial(a),false);a.meter=100;
   assert.ok(g.useSpecial(a));step(g,5,fps);
   assert.equal(b.hp,272);assert.equal(a.hp,320);assert.equal(a.meter,0);
   assert.equal(a.damageDealt,48);assert.equal(g.specials.length,0);
   assert.ok(!g.isPresenting(a));
  }
 });
 test(type+': cannot interrupt special, can reset and finish safely',()=>{
  const g=new CombatGame(type,'owl');const a=g.fighters[0],b=g.fighters[1];a.meter=100;
  assert.ok(g.useSpecial(a));
  assert.ok(!g.startAttack(a,'punch'));assert.equal(g.hit(b,a,20,'kick',300,.4,b.x),false);
  step(g,.5);assert.equal(g.isPresenting(a),true);
  const s=g.specials[0];g.reset();assert.equal(g.specials.length,0);assert.equal(s.active,false);
  assert.equal(g.hasPresentations(),false);
  a.meter=100;g.fighters[0].meter=100;g.useSpecial(g.fighters[0]);g.finish('p1');
  assert.equal(g.specials.length,0);assert.ok(g.fighters.every(f=>f.state!=='special'));
 });
 test(type+': special works for CPU, human mirrors, and timed-out presentation',()=>{
  const cpu=new CombatGame('owl',type);cpu.fighters[1].meter=100;cpu.ai.think=0;cpu.random=()=>.8;
  cpu.update(1/60);assert.ok(cpu.drainEvents().some(e=>e.type==='special'&&e.fighter==='p2'));
  const mirror=new CombatGame(type,type,{localMultiplayer:true});mirror.fighters.forEach(f=>f.meter=100);
  mirror.update(1/60,{specialPressed:true},{specialPressed:true});assert.equal(mirror.specials.length,2);
  step(mirror,5);assert.equal(mirror.specials.length,0);assert.ok(mirror.fighters.every(f=>f.hp===320));
  const timed=new CombatGame(type,'owl');timed.fighters[0].meter=100;timed.useSpecial(timed.fighters[0]);
  timed.timeRemaining=.2;step(timed,.5);assert.ok(timed.roundEnding);assert.equal(timed.over,false);
  step(timed,5);assert.equal(timed.over,true);
 });
 test(type+': deterministic animation keys',()=>{
  assert.equal(fourPose({type,state:'run',grounded:true,vx:250,facing:1,stateTime:0}).index,0);
  assert.ok(FOUR_KINDS.includes(FOUR_FIGHTERS[type].kind));
 });
}
test('both entry points have 33 selectable fighters and generated atlas module',()=>{
 assert.equal(FIGHTERS.length,33);
 for(const path of ['../index.html','../dist/index.html']){
  const h=readFileSync(new URL(path,import.meta.url),'utf8');
  assert.equal([...h.matchAll(/data-fighter="([^"]+)"/g)].length,33);
  assert.deepEqual(new Set([...h.matchAll(/<option value="([^"]+)"/g)].map(x=>x[1])),new Set(FIGHTERS));
 }
});
