import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CombatGame,FIGHTERS} from '../dist/combat.js';
import {NICKI,DOLL_LANES,nickiPose,dollAction} from '../dist/nicki-minaj.js';
test('Nicki roster, 30 fighter frames and six dolls',()=>{
 assert.ok(FIGHTERS.includes('nickiminaj'));assert.equal(DOLL_LANES.length,6);
 const atlas=JSON.parse(readFileSync(new URL('../dist/assets/atlas.json',import.meta.url)));
 assert.equal(atlas.nickiminaj.frames.length,30);assert.equal(atlas.nickiDolls.frames.length,6);
 for(const spec of [...atlas.nickiminaj.frames,...atlas.nickiDolls.frames])assert.equal(readFileSync(new URL('../dist/'+spec.src,import.meta.url)).subarray(1,4).toString(),'PNG');
 assert.notEqual(nickiPose({state:'run',stateTime:.1,grounded:true,vx:250,facing:1}).index,nickiPose({state:'run',stateTime:.3,grounded:true,vx:250,facing:1}).index);
});
test('Nicki slap, two kick contacts and special complete',()=>{
 const g=new CombatGame('nickiminaj','owl',{localMultiplayer:true});const [a,b]=g.fighters;a.x=500;b.x=600;
 g.update(1/60,{punchPressed:true},{});assert.equal(a.attack.style,'slap');
 for(let i=0;i<60;i++)g.update(1/60,{},{});
 a.x=500;b.x=600;b.vx=0;b.invuln=0;const hp=b.hp;
 g.update(1/60,{kickPressed:true},{});
 for(let i=0;i<55;i++)g.update(1/60,{},{});
 assert.equal(hp-b.hp,15);
 a.meter=100;g.update(1/60,{specialPressed:true},{block:true});assert.ok(g.specials.some(s=>s.kind===NICKI.kind));
 const before=b.hp;for(let i=0;i<250;i++)g.update(1/60,{},{block:true});
 assert.equal(before-b.hp,48);assert.ok(!g.specials.some(s=>s.kind===NICKI.kind));
});

test('Barbie squad staggered passes, multiple poses, no crowding',()=>{
 assert.equal(DOLL_LANES.length,6);
 for(const l of DOLL_LANES){
  assert.equal(dollAction(l.entry-.001,l),null);
  assert.equal(dollAction(l.entry+.03,l).pose,'run');
  assert.equal(dollAction(l.contact,l).pose,'strike');
  assert.equal(dollAction(l.contact+.13,l).phase,'exit');
  assert.equal(dollAction(l.contact+.33,l),null);
 }
 for(let t=0;t<NICKI.duration;t+=1/120){
  const active=DOLL_LANES.filter(l=>dollAction(t,l));
  assert.ok(active.length<=3);
  assert.ok(active.filter(l=>dollAction(t,l).phase==='attack').length<=1);
 }
 assert.ok(DOLL_LANES.at(-1).contact+.32<NICKI.duration);
});
