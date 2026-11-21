import test from 'node:test';
import assert from 'node:assert/strict';
import { CombatGame } from '../dist/combat.js';
import { SMACK_UPGRADE as M, smackPrincePose } from '../dist/smack-prince.js';

function match(side='p1', direction=1) {
  const g=new CombatGame(side==='p1'?'smackprince':'owl',side==='p1'?'owl':'smackprince');g.aiEnabled=false;
  const a=g.fighters.find(f=>f.type==='smackprince'),b=g.fighters.find(f=>f!==a);
  a.x=direction>0?450:830;b.x=a.x+direction*130;a.facing=direction;b.facing=-direction;
  return {g,a,b};
}
function step(g,seconds,fps=120){for(let n=0;n<Math.round(seconds*fps);n++)g.update(1/fps,{});}

test('Smack Prince is selectable on both sides, slaps for meter, and double jumps',()=>{
  for(const side of ['p1','p2']){
    const {g,a,b}=match(side);b.x=a.x+100;
    assert.equal(g.startAttack(a,'punch'),true);assert.equal(a.attack.style,'slap');
    step(g,.5);assert.equal(b.hp,150);assert.equal(a.meter,20);
    b.x=a.x+100;b.state='block';b.actionRemaining=1;
    g.startAttack(a,'punch');step(g,.5);assert.equal(a.meter,20);
    assert.equal(g.jump(a),true);step(g,.12);assert.equal(g.jump(a),true);
    assert.equal(a.flipRemaining,0);assert.equal(g.jump(a),false);step(g,2);assert.equal(a.grounded,true);
  }
});

test('Dancing walk cycles all eight poses; kick retracts and plants before repeating',()=>{
  const walk=new Set();for(let n=0;n<80;n++)walk.add(smackPrincePose({state:'run',grounded:true,vx:250,facing:1,stateTime:n/120}).index);
  assert.equal(walk.size,8);
  for(const fps of [30,60,120]){
    const {g,a}=match();g.fighters[1].x=1100;
    for(let repeat=0;repeat<3;repeat++){
      g.startAttack(a,'kick');const seen=new Set();
      while(a.attack){seen.add(smackPrincePose(a).index);if(a.attack.elapsed>=.48)assert.equal(smackPrincePose(a).index,13);g.update(1/fps,{});}
      assert.deepEqual([...seen],[8,9,10,11,12,13]);assert.equal(a.state,'idle');
    }
  }
});

test('Spotlight requires full meter and nearby opponent; invalid activation preserves it',()=>{
  const {g,a,b}=match();a.meter=99;assert.equal(g.useSpecial(a),false);
  a.meter=100;b.x=1100;assert.equal(g.useSpecial(a),false);assert.equal(a.meter,100);
  b.x=a.x-100;assert.equal(g.useSpecial(a),false);b.x=a.x+120;
  b.y=200;assert.equal(g.useSpecial(a),false);b.y=0;
  assert.equal(g.useSpecial(a),true);assert.equal(a.meter,0);assert.equal(g.useSpecial(a),false);
});

test('Suit and spotlight precede one unblockable slap, launch and outfit recovery at every frame rate',()=>{
  for(const fps of [30,60,120])for(const direction of [-1,1])for(const side of ['p1','p2']){
    const {g,a,b}=match(side,direction);a.meter=100;b.state='block';b.actionRemaining=5;
    g.useSpecial(a);const s=g.specials[0],poses=new Set();let launched=false;
    for(let n=0;n<fps*3;n++){
      poses.add(smackPrincePose(a,s).key+':'+smackPrincePose(a,s).index);
      g.update(1/fps,{});
      if(s.age<M.strikeAt-1e-9)assert.equal(b.hp,160);
      if(s.hitCount===1&&b.y>0){launched=true;assert.ok((b.x-a.x)*direction>0);}
    }
    assert.equal(b.hp,112);assert.equal(a.meter,0);assert.equal(s.hitCount,1);assert.ok(launched);
    for(const i of [8,9,10,11,12,13,14,15])assert.ok(poses.has('smackPrinceActions:'+i),`Special pose ${i}`);
    assert.equal(smackPrincePose(a).key,'smackprince');assert.equal(g.isPresenting(a),false);
    const events=g.drainEvents();assert.equal(events.filter(e=>e.type==='suitUp').length,1);
    assert.equal(events.filter(e=>e.type==='royalSmack').length,1);
  }
});

test('Jumping or moving out during the windup avoids the slap',()=>{
  for(const evade of ['range','air']){
    const {g,a,b}=match();a.meter=100;g.useSpecial(a);step(g,1);
    if(evade==='range')b.x=1100;else{b.y=300;b.vy=0;b.grounded=false;}
    step(g,.2);assert.equal(b.hp,160);step(g,2);assert.equal(b.hp,160);assert.equal(a.meter,0);
  }
});

test('A knockout still shows the launch and completes the protected transformation',()=>{
  const {g,a,b}=match();a.meter=100;b.hp=10;g.useSpecial(a);step(g,1.18);
  assert.equal(b.hp,0);assert.equal(g.over,false);assert.equal(g.isPresenting(a),true);assert.ok(b.y>0);
  assert.equal(g.hit(b,a,15,'kick',300,.4,b.x),false);step(g,1.2);
  assert.equal(g.over,true);assert.equal(g.winner,a.id);assert.equal(g.specials.length,0);
  assert.equal(smackPrincePose(a).key,'smackprince');
});

test('CPU chooses the special in range and reset clears the presentation',()=>{
  const {g,a}=match('p2',-1);a.meter=100;g.aiEnabled=true;g.ai.think=0;g.random=()=>.8;
  g.update(1/120,{});assert.equal(a.meter,0);assert.equal(g.specials[0].kind,'spotlight');
  step(g,.6);g.reset('smackprince','owl');assert.equal(g.specials.length,0);
  assert.equal(g.fighters[0].spotlightLaunched,false);assert.equal(smackPrincePose(g.fighters[0]).key,'smackprince');
});
