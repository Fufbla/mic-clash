import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {CombatGame,FIGHTERS} from '../dist/combat.js';
import {ASCENSION_FIGHTERS as roster,ascensionPose,goatWhiteout} from '../dist/ascension-fighters.js';
const step=(g,t,fps=120)=>{for(let n=0;n<Math.round(t*fps);n++)g.update(1/fps);};
function match(type,side=0,facing=1,distance=320){
  const g=new CombatGame(...(side?['owl',type]:[type,'owl']),{localMultiplayer:true});
  const a=g.fighters[side],b=g.fighters[1-side];
  a.x=facing>0?100:1180;b.x=a.x+facing*distance;a.facing=facing;b.facing=-facing;
  return {g,a,b};
}
for(const type of Object.keys(roster)){
  test(`${type}: both players attack, charge meter, animate kick recovery and double jump`,()=>{
    for(const fps of [30,60,120])for(const side of [0,1]){
      const {g,a,b}=match(type,side,1,100);
      g.startAttack(a,'punch');step(g,.5,fps);assert.equal(b.hp,310);assert.equal(a.meter,20);
      b.x=a.x+100;g.startAttack(a,'kick');const poses=new Set();
      while(a.attack){poses.add(ascensionPose(a).index);g.update(1/fps);}
      assert.ok(poses.has(10)&&poses.has(11)&&poses.has(13));assert.equal(b.hp,295);assert.equal(a.meter,45);
      g.jump(a);step(g,.1,fps);assert.ok(g.jump(a));assert.equal(ascensionPose(a).index,3);assert.equal(g.jump(a),false);
      step(g,2,fps);assert.equal(a.grounded,true);
    }
    const walk=new Set(Array.from({length:120},(_,i)=>ascensionPose({type,state:'run',grounded:true,vx:250,facing:1,stateTime:i/120}).index));
    assert.equal(walk.size,8);
  });
  test(`${type}: 48 special damage at close/full-stage range on both sides, directions and 30/60/120fps`,()=>{
    for(const fps of [30,60,120])for(const side of [0,1])for(const facing of [-1,1])for(const distance of [100,320,1000]){
      const {g,a,b}=match(type,side,facing,distance);b.state='block';b.actionRemaining=6;
      a.meter=99;assert.equal(g.useSpecial(a),false);a.meter=100;assert.ok(g.useSpecial(a));
      step(g,5,fps);assert.equal(b.hp,272,`${type} ${fps}fps side${side} facing${facing} d${distance}`);
      assert.equal(a.hp,320);assert.equal(a.meter,0);assert.equal(a.damageDealt,48);assert.equal(g.specials.length,0);
      assert.equal(a.state,'idle');
      const events=g.drainEvents();assert.equal(events.filter(e=>e.type==='hit').length,type==='eynakeast'?4:1);
      if(type==='taytay')assert.equal(events.filter(e=>e.type==='travyCall').length,1);
    }
  });
  test(`${type}: CPU, human mirrors and protected presentations use identical combat`,()=>{
    const {g,a,b}=match(type);a.meter=100;g.useSpecial(a);
    for(let n=0;n<Math.floor(roster[type].duration*120)-1;n++){
      assert.equal(g.hit(b,a,50,'punch',0,.2,b.x),false);assert.equal(g.startAttack(a,'kick'),false);g.update(1/120);
    }
    step(g,.1);assert.ok(g.startAttack(a,'kick'));
    const cpu=new CombatGame('owl',type);cpu.fighters[1].meter=100;cpu.ai.think=0;cpu.random=()=>.8;
    cpu.update(1/60);assert.ok(cpu.drainEvents().some(e=>e.type==='special'&&e.fighter==='p2'));
    const mirror=new CombatGame(type,type,{localMultiplayer:true});mirror.fighters.forEach(f=>f.meter=100);
    mirror.update(1/60,{specialPressed:true},{specialPressed:true});assert.equal(mirror.specials.length,2);step(mirror,5);
    assert.ok(mirror.fighters.every(f=>f.hp===320&&f.state!=='special'));assert.equal(mirror.specials.length,0);
  });
  test(`${type}: reset/finish clears transformed form, screen wash and helper at every phase`,()=>{
    for(const age of [.1,.6,1.1,1.45,1.8,2.5,3.1,3.7])for(const mode of ['reset','finish']){
      const {g,a}=match(type);a.meter=100;g.useSpecial(a);step(g,age);const s=g.specials[0];
      if(mode==='reset')g.reset();else g.finish('p1');
      assert.equal(g.specials.length,0);assert.equal(g.hasPresentations(),false);
      if(s){assert.ok(s.ghosts.every(h=>!h.visible));assert.ok(!s.helper?.visible);assert.equal(s.whiteout,0);assert.equal(s.hooded,false);}
      assert.ok(g.fighters.every(f=>f.state!=='special'));
    }
  });
  test(`${type}: timeout freezes damage while the animation finishes`,()=>{
    const {g,a,b}=match(type);a.meter=100;g.useSpecial(a);g.timeRemaining=.25;step(g,.4);
    const hp=b.hp;assert.ok(g.roundEnding);assert.equal(g.over,false);step(g,5);
    assert.equal(g.over,true);assert.equal(b.hp,hp);assert.equal(g.specials.length,0);
  });
}
test('Eynak becomes hooded before raising arms, quaking and releasing four different ghosts',()=>{
  const {g,a,b}=match('eynakeast',0,1,800);a.meter=100;g.useSpecial(a);const s=g.specials[0];
  step(g,.6);assert.equal(ascensionPose(a,s).key,'eynakeastSupport');assert.equal(b.hp,320);
  step(g,.5);assert.equal(ascensionPose(a,s).index,3);assert.equal(s.quaked,undefined);
  step(g,.3);assert.equal(s.quaked,true);assert.ok(s.ghosts.every(x=>!x.launched));
  step(g,2.3);assert.equal(s.ghosts.filter(x=>x.launched).length,4);assert.equal(s.hitCount,4);
  assert.equal(g.drainEvents().filter(e=>e.type==='ghostQuake').length,1);step(g,1);
  assert.equal(ascensionPose(a).key,'eynakeast');
});
test('Ghosts and Travy miss a rival who moves behind their locked attack path',()=>{
  for(const type of ['eynakeast','taytay'])for(const facing of [-1,1])for(const fps of [30,60,120]){
    const {g,a,b}=match(type,0,facing,320);a.x=640;b.x=a.x+facing*320;a.meter=100;g.useSpecial(a);
    step(g,type==='eynakeast'?1.72:.9,fps);b.x=640-facing*400;step(g,5,fps);assert.equal(b.hp,320,type);
  }
});
test('Travy only damages on tackle contact; an airborne rival clears his body',()=>{
  for(const fps of [30,60,120])for(const facing of [-1,1]){
    const {g,a,b}=match('taytay',0,facing,700);a.meter=100;g.useSpecial(a);const s=g.specials[0];
    step(g,1.59,fps);assert.equal(b.hp,320);assert.ok(s.helper.visible);
    for(let n=0;n<fps*3;n++){b.y=340;b.vy=0;b.grounded=true;g.update(1/fps);}
    assert.equal(b.hp,320);assert.equal(s.hitCount,0);assert.equal(s.helper.visible,false);
  }
});
test('GOAT forms the sign before one full opaque whiteout and exactly one 48-damage impact',()=>{
  for(const fps of [30,60,120]){
    const {g,a,b}=match('goat');a.meter=100;g.useSpecial(a);const s=g.specials[0];
    step(g,1.1,fps);assert.equal(ascensionPose(a,s).index,12);assert.equal(b.hp,320);assert.equal(s.whiteout,0);
    const samples=[];for(let n=0;n<fps*2;n++){g.update(1/fps);samples.push(s.whiteout);}
    assert.ok(samples.includes(1));assert.equal(samples.at(-1),0);assert.equal(b.hp,272);assert.equal(s.hitCount,1);
    assert.equal(g.drainEvents().filter(e=>e.type==='goatWhiteout').length,1);
    let falling=false;for(let n=1;n<samples.length;n++){if(samples[n]<samples[n-1])falling=true;if(falling)assert.ok(samples[n]<=samples[n-1]);}
  }
  assert.equal(goatWhiteout(0),0);assert.equal(goatWhiteout(1.5),1);assert.equal(goatWhiteout(3),0);
});
test('Both entry points have 33 unique fighters, 120 new frames and the Travy voice',()=>{
  const atlas=JSON.parse(readFileSync(new URL('../dist/assets/atlas.json',import.meta.url)));
  assert.equal(FIGHTERS.length,33);
  for(const path of ['../index.html','../dist/index.html']){
    const html=readFileSync(new URL(path,import.meta.url),'utf8'),cards=[...html.matchAll(/data-fighter="([^"]+)"/g)].map(m=>m[1]);
    assert.equal(cards.length,33);assert.deepEqual(new Set(cards),new Set(FIGHTERS));
    assert.deepEqual(new Set([...html.matchAll(/<option value="([^"]+)"/g)].map(m=>m[1])),new Set(FIGHTERS));
    assert.ok(html.includes('id="goatWhiteout"'));
  }
  let count=0;
  for(const key of [...Object.keys(roster).flatMap(t=>[t,t+'Actions']),'eynakeastSupport','travySupport']){
    const asset=atlas[key];assert.ok(asset,key);assert.ok(existsSync(new URL('../dist/'+asset.src,import.meta.url)));count+=asset.frames.length;
    assert.ok(asset.referenceHeight>0);
    for(const f of asset.frames)assert.ok(f.w>0&&f.h>0&&f.x>=f.cellX&&f.y>=f.cellY&&f.x+f.w<=f.cellX+f.cellW&&f.y+f.h<=f.cellY+f.cellH);
  }
  assert.equal(count,120);assert.ok(readFileSync(new URL('../dist/assets/taytay-travy.mp3',import.meta.url)).length>1000);
});
