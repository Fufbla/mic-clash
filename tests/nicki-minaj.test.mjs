import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CombatGame,FIGHTERS} from '../dist/combat.js';
import {NICKI,DOLL_LANES,nickiPose,dollAction,nickiSlapIndex,NICKI_MOTION,nickiDefeatPose} from '../dist/nicki-minaj.js';
test('Nicki roster, 46 fighter frames and six dolls',()=>{
 assert.ok(FIGHTERS.includes('nickiminaj'));assert.equal(DOLL_LANES.length,6);
 const atlas=JSON.parse(readFileSync(new URL('../dist/assets/atlas.json',import.meta.url)));
 assert.equal(atlas.nickiminaj.frames.length,46);assert.equal(atlas.nickiDolls.frames.length,6);
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

test('Nicki uses 16 separately drawn aligned reaction cells, not transformed idle art',()=>{
 const atlas=JSON.parse(readFileSync(new URL('../dist/assets/atlas.json',import.meta.url)));
 const frames=atlas.nickiminaj.frames.slice(30);assert.equal(frames.length,16);
 assert.equal(new Set(frames.map(f=>f.x+','+f.y)).size,16);
 for(const f of frames){assert.equal(f.src,'./assets/nicki/motion-redrawn-v2.webp');assert.equal(f.w,512);assert.equal(f.h,512);assert.equal(f.anchorY,475);}
 const image=readFileSync(new URL('../dist/assets/nicki/motion-redrawn-v2.webp',import.meta.url));
 assert.equal(image.subarray(0,4).toString(),'RIFF');assert.equal(image.subarray(8,12).toString(),'WEBP');assert.equal(image.length,729702);
 assert.equal(image.subarray(12,16).toString(),'VP8X');assert.equal(image.readUIntLE(24,3)+1,2048);assert.equal(image.readUIntLE(27,3)+1,2048);
 assert.equal(nickiPose({state:'hurt',stateTime:0,grounded:true}).index,30);
 assert.equal(nickiPose({state:'hurt',stateTime:0,grounded:true,nickiHurtHeavy:true}).index,31);
 assert.equal(nickiPose({state:'hurt',stateTime:0,grounded:false}).index,37);
 const hitFrames=[0,.07,.14,.21].map(stateTime=>nickiPose({state:'hurt',stateTime,grounded:true,nickiHurtSpan:.26}).index);
 assert.equal(new Set(hitFrames).size,4);
 assert.equal(nickiPose({state:'block',grounded:true}).index,34);
 assert.equal(nickiPose({state:'jump',grounded:false,vy:300}).index,35);
 assert.ok(NICKI_MOTION.fall.includes(nickiPose({state:'fall',grounded:false,vy:-200}).index));
 assert.equal(nickiPose({state:'idle',grounded:true,nickiLandRemaining:.22}).index,38);
 const loser={id:'p1',hp:0,state:'ko',stateTime:0,grounded:true};
 assert.deepEqual([0,.13,.26,.39,.52].map(age=>nickiDefeatPose(loser,{over:true,winner:'p2'},age).index),[40,41,42,43,44]);
 assert.equal(nickiDefeatPose({...loser,hp:2,state:'idle'},{over:true,winner:'p2'},.75).index,44);
 assert.equal(nickiDefeatPose({...loser,hp:20,state:'idle'},{over:true,winner:'p1'},.75).index,0);
 const game=new CombatGame('nickiminaj','owl',{localMultiplayer:true});const [a,b]=game.fighters;
 game.update(1/60,{jumpPressed:true},{});let landed=false;for(let i=0;i<100;i++){game.update(1/60,{},{});if(a.nickiLandRemaining>0){landed=true;break;}}assert.ok(landed);
 a.invuln=0;a.grounded=true;a.actionRemaining=0;assert.ok(game.hit(b,a,8,'punch',35,.26,b.x));assert.equal(a.nickiHurtHeavy,false);
 a.invuln=0;assert.ok(game.hit(b,a,16,'kick',35,.4,b.x));assert.equal(a.nickiHurtHeavy,true);assert.equal(a.nickiHurtSpan,.4);
});
