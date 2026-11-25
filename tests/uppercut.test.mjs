import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CombatGame, FIGHTERS } from '../dist/combat.js';
import { UPPERCUT_PROFILES, uppercutPose } from '../dist/uppercut.js';
const atlas=JSON.parse(readFileSync(new URL('../dist/assets/atlas.json',import.meta.url),'utf8'));
const tick=(g,p={},q={})=>g.update(1/60,p,q);
const advance=(g,n)=>{for(let i=0;i<n;i++)tick(g);};
test('each roster fighter has a valid existing-frame uppercut profile and buffered P P K starts exactly one finisher',()=>{
 assert.deepEqual(Object.keys(UPPERCUT_PROFILES).sort(),[...FIGHTERS].sort());
 for(const type of FIGHTERS){
  const profile=UPPERCUT_PROFILES[type];
  assert.ok(profile.frames.every(i=>Number.isInteger(i)&&i>=0&&i<(atlas[type]?.frames.length??53)),type);
  for(const p of [0,.15,.31,.45,.65,.8,.98])assert.equal(uppercutPose({type,attackProgress:p}).key,type);
  const g=new CombatGame(type,'owl',{localMultiplayer:true});
  tick(g,{punchPressed:true});tick(g);tick(g,{punchPressed:true});tick(g);tick(g,{kickPressed:true});advance(g,230);
  const attacks=g.drainEvents().filter(e=>e.type==='attack'&&e.fighter==='p1').map(e=>e.kind);
  assert.deepEqual(attacks,['punch','punch','kick','uppercut'],type);
 }
});
test('wrong sequence does not start an uppercut, and it cannot be used directly',()=>{
 const g=new CombatGame('owl','coupe',{localMultiplayer:true});
 assert.equal(g.startAttack(g.fighters[0],'uppercut'),false);
 tick(g,{punchPressed:true});advance(g,30);tick(g,{kickPressed:true});advance(g,90);
 assert.ok(!g.drainEvents().some(e=>e.kind==='uppercut'));
});
test('uppercut launches a close opponent, but a guarded hit does not launch',()=>{
 for(const block of [false,true]){
  const g=new CombatGame('karate','owl',{localMultiplayer:true});
  const [a,b]=g.fighters;a.x=400;b.x=505;a.uppercutPending=true;
  if(block){b.state='block';b.facing=-1;}
  assert.ok(g.startAttack(a,'uppercut'));
  for(let i=0;i<23;i++)tick(g,{},block?{block:true}:{});
  assert.equal(b.hp,block?318:302);
  assert.equal(b.grounded,block);
 }
});
test('player two has the same combo',()=>{
 const g=new CombatGame('owl','nickiminaj',{localMultiplayer:true});
 tick(g,{}, {punchPressed:true});tick(g);tick(g,{}, {punchPressed:true});tick(g);tick(g,{}, {kickPressed:true});advance(g,200);
 assert.equal(g.drainEvents().filter(e=>e.type==='attack'&&e.fighter==='p2'&&e.kind==='uppercut').length,1);
});
