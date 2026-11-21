import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {CombatGame,FIGHTERS} from '../dist/combat.js';
import {GAUNTLET_FIGHTERS as roster,gauntletPose,FACE_SHOT,PRIZE_CREW} from '../dist/gauntlet-fighters.js';
const step=(g,t,fps=120)=>{for(let n=0;n<Math.round(t*fps);n++)g.update(1/fps);};
function match(type,side=0,facing=1,distance=320){
  const g=new CombatGame(...(side?['owl',type]:[type,'owl']),{localMultiplayer:true});
  const a=g.fighters[side],b=g.fighters[1-side];
  a.x=facing>0?100:1180;b.x=a.x+facing*distance;a.facing=facing;b.facing=-facing;
  return {g,a,b};
}
for(const type of Object.keys(roster)){
  test(`${type}: both players can attack, build meter, block and double jump`,()=>{
    for(const fps of [30,60,120])for(const side of [0,1]){
      const {g,a,b}=match(type,side,1,100);
      g.startAttack(a,'punch');assert.equal(a.attack.style,type==='bigmumble'?'headbutt':'punch');
      step(g,.5,fps);assert.equal(b.hp,310);assert.equal(a.meter,20);
      b.x=a.x+100;g.startAttack(a,'kick');const poses=new Set();
      while(a.attack){poses.add(gauntletPose(a).index);g.update(1/fps);}
      assert.ok(poses.has(10)&&poses.has(11)&&poses.has(13));assert.equal(b.hp,295);assert.equal(a.meter,45);
      g.jump(a);step(g,.1,fps);assert.ok(g.jump(a));assert.equal(gauntletPose(a).index,3);assert.equal(g.jump(a),false);
      step(g,2,fps);assert.equal(a.grounded,true);
    }
    const walk=new Set(Array.from({length:120},(_,i)=>gauntletPose({type,state:'run',grounded:true,vx:250,facing:1,stateTime:i/120}).index));
    assert.equal(walk.size,8);
  });
  test(`${type}: special deals 48 total damage at close/full-stage range on either side, direction and refresh rate`,()=>{
    for(const fps of [30,60,120])for(const side of [0,1])for(const facing of [-1,1])for(const distance of [100,320,1000]){
      const {g,a,b}=match(type,side,facing,distance);b.state='block';b.actionRemaining=6;
      a.meter=99;assert.equal(g.useSpecial(a),false);a.meter=100;assert.ok(g.useSpecial(a));
      step(g,5,fps);assert.equal(b.hp,272,`${type} ${fps}fps side${side} facing${facing} d${distance}`);
      assert.equal(a.hp,320);assert.equal(a.meter,0);assert.equal(a.damageDealt,48);assert.equal(g.specials.length,0);
      assert.ok(a.x>=100&&a.x<=1180);assert.equal(a.state,'idle');assert.equal(a.inCar,false);
      const events=g.drainEvents();assert.equal(events.filter(e=>e.type==='hit').length,type==='nobuttons'?8:1);
      if(type==='nobuttons')assert.equal(events.filter(e=>e.type==='prizePicks').length,1);
    }
  });
  test(`${type}: AI and human mirror matches use the same move and preserve protected presentation`,()=>{
    const {g,a,b}=match(type);a.meter=100;g.useSpecial(a);
    for(let n=0;n<Math.floor(roster[type].duration*120)-1;n++){
      assert.equal(g.hit(b,a,50,'punch',0,.2,b.x),false);assert.equal(g.startAttack(a,'kick'),false);g.update(1/120);
    }
    step(g,.1);assert.ok(g.startAttack(a,'kick'));
    const cpu=new CombatGame('owl',type);cpu.fighters[1].meter=100;cpu.ai.think=0;cpu.random=()=>.8;
    cpu.update(1/60);assert.ok(cpu.drainEvents().some(e=>e.type==='special'&&e.fighter==='p2'));
    const mirror=new CombatGame(type,type,{localMultiplayer:true});mirror.fighters.forEach(f=>f.meter=100);
    mirror.update(1/60,{specialPressed:true},{specialPressed:true});assert.equal(mirror.specials.length,2);step(mirror,5);
    assert.ok(mirror.fighters.every(f=>!f.inCar&&f.state!=='special'));assert.equal(mirror.specials.length,0);
  });
  test(`${type}: finish/reset at every phase releases helpers, rider and presentation`,()=>{
    for(const age of [.1,.6,1.1,1.8,2.5,3.1,3.7])for(const mode of ['reset','finish']){
      const {g,a}=match(type);a.meter=100;g.useSpecial(a);step(g,age);const s=g.specials[0];
      if(mode==='reset')g.reset();else g.finish('p1');
      assert.equal(a.inCar,false);assert.equal(g.specials.length,0);assert.equal(g.hasPresentations(),false);
      if(s)assert.ok(s.crew.every(h=>!h.visible));
      assert.ok(g.fighters.every(f=>f.state!=='special'&&!f.inCar));
    }
  });
  test(`${type}: timeout freezes damage while the authored presentation finishes`,()=>{
    const {g,a,b}=match(type);a.meter=100;g.useSpecial(a);g.timeRemaining=.25;step(g,.4);
    const hp=b.hp;assert.ok(g.roundEnding);assert.equal(g.over,false);step(g,5);
    assert.equal(g.over,true);assert.equal(b.hp,hp);assert.equal(g.specials.length,0);assert.equal(a.inCar,false);
  });
}
test('Face Shot passes below the hoop, strikes the face only once, and misses a dodge after release',()=>{
  for(const fps of [30,60,120])for(const facing of [-1,1]){
    const {g,a}=match('bigmumble',0,facing,800);a.meter=100;g.useSpecial(a);const s=g.specials[0];let high=0;
    for(let i=0;i<fps*3.2;i++){g.update(1/fps);if(s.released&&!s.spent)high=Math.max(high,s.y);}
    assert.equal(s.hitCount,1);assert.ok(s.ballImpactY>=137&&s.ballImpactY<=214);assert.ok(high<FACE_SHOT.hoopHeight-70);
    const dodge=match('bigmumble',0,facing,800);dodge.a.meter=100;dodge.g.useSpecial(dodge.a);step(dodge.g,.9,fps);
    dodge.b.x=dodge.a.x-facing*100;step(dodge.g,4,fps);assert.equal(dodge.b.hp,320);
  }
});
test('The four Prize Picks helpers are distinct and lock their attack area before the first hit',()=>{
  for(const fps of [30,60,120])for(const facing of [-1,1]){
    const {g,a,b}=match('nobuttons',0,facing,450);a.meter=100;g.useSpecial(a);step(g,.7,fps);
    const s=g.specials[0];assert.equal(s.crew.length,4);assert.deepEqual(s.crew.map(h=>h.index),[0,1,2,3]);
    assert.ok(s.crew.every(h=>h.visible));assert.equal(new Set(s.crew.map(h=>h.offset)).size,4);
    b.x+=facing*220;step(g,4,fps);assert.equal(b.hp,320);assert.equal(s.strikeIndex,PRIZE_CREW.hits);
    assert.ok(s.crew.every(h=>!h.visible));
  }
});
test('Airborne rivals evade all three specials instead of being pulled into scripted damage',()=>{
  for(const type of Object.keys(roster))for(const fps of [30,60,120]){
    const {g,a,b}=match(type);a.meter=100;g.useSpecial(a);
    for(let n=0;n<fps*5;n++){b.y=320;b.vy=0;b.grounded=true;g.update(1/fps);}
    assert.equal(b.hp,320,type);
  }
});
test('Both entry points preserve the complete roster; 116 new transparent frames and the shout ship',()=>{
  const atlas=JSON.parse(readFileSync(new URL('../dist/assets/atlas.json',import.meta.url)));
  for(const entry of ['../index.html','../dist/index.html']){
    const html=readFileSync(new URL(entry,import.meta.url),'utf8');const cards=[...html.matchAll(/data-fighter="([^"]+)"/g)].map(m=>m[1]);
    assert.equal(cards.length,FIGHTERS.length);assert.deepEqual(new Set(cards),new Set(FIGHTERS));
    assert.deepEqual(new Set([...html.matchAll(/<option value="([^"]+)"/g)].map(m=>m[1])),new Set(FIGHTERS));
  }
  let count=0;
  for(const key of [...Object.keys(roster).flatMap(t=>[t,t+'Actions']),'gauntletProps','nobuttonsCrew']){
    const asset=atlas[key];assert.ok(asset,key);assert.ok(existsSync(new URL('../dist/'+asset.src,import.meta.url)));count+=asset.frames.length;
    assert.ok(asset.referenceHeight>0);
    for(const f of asset.frames){assert.ok(f.w>0&&f.h>0);assert.ok(f.x>=f.cellX&&f.y>=f.cellY&&f.x+f.w<=f.cellX+f.cellW&&f.y+f.h<=f.cellY+f.cellH);}
  }
  assert.equal(count,116);assert.ok(readFileSync(new URL('../dist/assets/nobuttons-prize-picks.mp3',import.meta.url)).length>1000);
});
