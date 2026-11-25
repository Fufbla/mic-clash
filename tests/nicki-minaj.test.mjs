import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CombatGame,FIGHTERS} from '../dist/combat.js';
import {NICKI,DOLL_LANES,nickiPose,dollAction,nickiSlapIndex,NICKI_MOTION} from '../dist/nicki-minaj.js';
test('Nicki roster, 55 fighter frames and six dolls',()=>{
 assert.ok(FIGHTERS.includes('nickiminaj'));assert.equal(DOLL_LANES.length,6);
 const atlas=JSON.parse(readFileSync(new URL('../dist/assets/atlas.json',import.meta.url)));
 assert.equal(atlas.nickiminaj.frames.length,55);assert.equal(atlas.nickiDolls.frames.length,6);
 for(const spec of [...atlas.nickiminaj.frames.slice(0,30),...atlas.nickiDolls.frames])assert.equal(readFileSync(new URL('../dist/'+spec.src,import.meta.url)).subarray(1,4).toString(),'PNG');
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

test('Nicki purse slap uses stance and one corrected strike instead of pointing or duplicate attack frames',()=>{assert.deepEqual([0,.15,.24,.4,.55,.69,.7,.99].map(nickiSlapIndex),[15,15,17,17,17,17,19,19]);assert.equal(nickiPose({state:'punch',attackProgress:.5}).index,17);});

test('Nicki has distinct full-body pose sequences and landing transitions',()=>{const atlas=JSON.parse(readFileSync(new URL('../dist/assets/atlas.json',import.meta.url)));const all=Object.values(NICKI_MOTION).flat();assert.equal(new Set(all).size,25);for(const k of all){const a=atlas.nickiminaj.frames[k];assert.ok(a.src.endsWith('motion-v1.svg'));assert.equal(a.w,512);assert.equal(a.h,512);}assert.match(readFileSync(new URL('../dist/assets/nicki/motion-v1.svg',import.meta.url),'utf8'),/<svg/);for(const state of ['hurt','ko','block','jump','fall']){const a=nickiPose({state,stateTime:0,grounded:!['jump','fall'].includes(state),vy:state==='fall'?-200:300});assert.ok(NICKI_MOTION[state].includes(a.index));}assert.equal(nickiPose({state:'ko',hp:0,stateTime:1,grounded:false}).index,NICKI_MOTION.ko.at(-1));assert.equal(nickiPose({state:'hurt',stateTime:0,grounded:false}).index,NICKI_MOTION.hurt[0]);assert.equal(nickiPose({state:'idle',grounded:true,nickiLandRemaining:.22}).index,NICKI_MOTION.land[0]);const game=new CombatGame('nickiminaj','owl',{localMultiplayer:true});const [a]=game.fighters;game.update(1/60,{jumpPressed:true},{});let landed=false;for(let i=0;i<100;i++){game.update(1/60,{},{});if(a.nickiLandRemaining>0){landed=true;break;}}assert.ok(landed);});
