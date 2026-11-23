import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { CombatGame } from '../dist/combat.js';
import { RUSH_FIGHTERS as roster, rushPose } from '../dist/rush-fighters.js';
const step=(g,t,fps=120,input={})=>{for(let n=0;n<Math.round(t*fps);n++)g.update(1/fps,input);};
function match(type,side=0,facing=1,distance=320){
  const g=new CombatGame(...(side?['owl',type]:[type,'owl']));g.aiEnabled=false;
  const a=g.fighters[side],b=g.fighters[1-side];
  a.x=facing>0?100:1180;b.x=a.x+facing*distance;a.facing=facing;b.facing=-facing;
  return {g,a,b};
}
for(const type of Object.keys(roster)){
  test(`${type}: basic moves, meter, full kick recovery and double jump on both sides`,()=>{
    for(const fps of [30,60,120])for(const side of [0,1]){
      const {g,a,b}=match(type,side,1,100);
      g.startAttack(a,'punch');assert.equal(a.attack.style,type==='sassyt'?'slap':type==='quickfast'?'headbutt':'punch');
      step(g,.5,fps);assert.equal(b.hp,310);assert.equal(a.meter,20);
      b.x=a.x+100;g.startAttack(a,'kick');const frames=new Set();
      while(a.attack){frames.add(rushPose(a).index);g.update(1/fps);}
      assert.ok(frames.has(10)&&frames.has(11)&&frames.has(13));
      assert.equal(b.hp,295);assert.equal(a.meter,45);assert.equal(a.state,'idle');
      g.jump(a);step(g,.1,fps);assert.ok(g.jump(a));assert.equal(rushPose(a).index,3);assert.equal(g.jump(a),false);
      step(g,2,fps);assert.equal(a.grounded,true);
    }
    const walk=new Set(Array.from({length:120},(_,i)=>rushPose({type,state:'run',grounded:true,vx:250,facing:1,stateTime:i/120}).index));
    assert.equal(walk.size,8);
  });
  test(`${type}: one 48-damage special at close and full-stage range, all sides/directions/frame rates`,()=>{
    for(const fps of [30,60,120])for(const side of [0,1])for(const facing of [-1,1])for(const distance of [100,320,1000]){
      const {g,a,b}=match(type,side,facing,distance);b.state='block';b.actionRemaining=6;
      a.meter=99;assert.equal(g.useSpecial(a),false);a.meter=100;assert.ok(g.useSpecial(a));
      step(g,5,fps);assert.equal(b.hp,272,`${type} fps${fps} side${side} facing${facing} d${distance}`);
      assert.equal(a.hp,320);assert.equal(a.meter,0);assert.equal(a.damageDealt,48);assert.equal(g.specials.length,0);
      assert.ok(a.x>=100&&a.x<=1180);assert.equal(a.state,'idle');
      const events=g.drainEvents();assert.equal(events.filter(e=>e.type==='hit').length,1);
      if(type==='sassyt')assert.equal(events.filter(e=>e.type==='slimeThrow').length,1);
    }
  });
  test(`${type}: full presentation is protected; new basic attacks wait; AI can activate it`,()=>{
    const {g,a,b}=match(type);a.meter=100;g.useSpecial(a);const s=g.specials[0],poses=new Set();
    while(s.ttl>1/120){
      assert.equal(g.hit(b,a,50,'punch',0,.2,b.x),false);assert.equal(g.startAttack(a,'kick'),false);
      poses.add(rushPose(a,s).index);g.update(1/120);
    }
    step(g,.1);assert.equal(g.startAttack(a,'kick'),true);assert.ok(poses.has(8)&&(poses.has(15)||type==='sassyt'&&poses.has(0)));
    const cpu=match(type,1);cpu.g.aiEnabled=true;cpu.a.meter=100;cpu.g.ai.think=0;
    step(cpu.g,.6);assert.ok(cpu.g.drainEvents().some(e=>e.type==='special'&&e.fighter===cpu.a.id));
  });
  test(`${type}: knockout completes the move and reset/finish clear every phase`,()=>{
    for(const age of [.1,.5,.9,1.5,1.9,2.7,3.4])for(const mode of ['reset','finish']){
      const {g,a,b}=match(type);a.meter=100;b.hp=1;g.useSpecial(a);step(g,age);
      if(mode==='reset')g.reset();else g.finish('p1');
      assert.equal(g.specials.length,0);assert.equal(g.hasPresentations(),false);
      assert.ok(g.fighters.every(f=>f.state!=='special'&&!f.inCar&&!f.grabbedBy));
    }
    const {g,a,b}=match(type);a.meter=100;b.hp=1;g.useSpecial(a);
    while(b.hp>0)g.update(1/120);
    assert.equal(g.over,false);assert.ok(g.roundEnding);step(g,5);
    assert.equal(g.over,true);assert.equal(g.winner,'p1');
  });
}
test('Rush and slime are directional and can pass under an airborne opponent',()=>{
  for(const type of ['quickfast','sassyt'])for(const facing of [-1,1])for(const fps of [30,60,120]){
    const {g,a,b}=match(type,0,facing);a.meter=100;g.useSpecial(a);
    for(let i=0;i<Math.ceil(roster[type].duration*fps)+2;i++){
      b.y=310;b.vy=0;b.grounded=true;g.update(1/fps);
    }
    assert.equal(b.hp,320);
    const behind=match(type,0,facing);behind.a.x=640;behind.b.x=640-facing*250;
    behind.a.meter=100;behind.g.useSpecial(behind.a);step(behind.g,5,fps);assert.equal(behind.b.hp,320);
  }
});
test('Chase locks its bag strike before contact; moving away avoids it',()=>{
  for(const fps of [30,60,120])for(const facing of [-1,1]){
    const {g,a,b}=match('jminors',0,facing,450);a.meter=100;g.useSpecial(a);step(g,.5,fps);
    const s=g.specials[0];assert.equal(s.locked,true);b.x+=facing*230;step(g,4,fps);assert.equal(b.hp,320);
  }
});
test('The new fighters keep specials immune to each other and to personal-security counters',()=>{
  for(const type of Object.keys(roster))for(const defender of ['president','roboking']){
    const g=new CombatGame(type,defender);g.aiEnabled=false;const[a,b]=g.fighters;a.x=300;b.x=600;b.incomingBasics=9;
    a.meter=100;g.useSpecial(a);step(g,5);assert.equal(b.hp,272);assert.equal(b.incomingBasics,9);assert.equal(b.securityBlocks,0);
  }
});
test('All 29 roster cards/opponent choices and the 108 new sprite frames ship in both entry points',()=>{
  const atlas=JSON.parse(readFileSync(new URL('../dist/assets/atlas.json',import.meta.url)));
  for(const entry of ['../index.html','../dist/index.html']){
    const html=readFileSync(new URL(entry,import.meta.url),'utf8');const cards=[...html.matchAll(/data-fighter="([^"]+)"/g)].map(m=>m[1]);
    assert.equal(cards.length,36);assert.equal(new Set(cards).size,36);
    const options=[...html.matchAll(/<option value="([^"]+)"/g)].map(m=>m[1]);assert.deepEqual(new Set(options),new Set(cards));
    for(const type of Object.keys(roster))assert.ok(cards.includes(type));
  }
  let count=0;
  for(const type of Object.keys(roster))for(const suffix of ['', 'Actions', ...(type==='quickfast'?[]:['Support'])]){
    const asset=atlas[type+suffix];assert.ok(asset);assert.ok(existsSync(new URL('../dist/'+asset.src,import.meta.url)));count+=asset.frames.length;
    for(const f of asset.frames){assert.ok(f.w>0&&f.h>0);assert.ok(f.x>=f.cellX&&f.y>=f.cellY&&f.x+f.w<=f.cellX+f.cellW&&f.y+f.h<=f.cellY+f.cellH);}
  }
  assert.equal(count,108);assert.ok(readFileSync(new URL('../dist/assets/sassyt-slime.mp3',import.meta.url)).length>1000);
});
