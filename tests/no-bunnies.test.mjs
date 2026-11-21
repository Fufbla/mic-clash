import test from 'node:test';
import assert from 'node:assert/strict';
import {CombatGame} from '../dist/combat.js';
import {AfricanPrideBeltSlap} from '../dist/dr-no-bunnies.js';
const step=(g,time,fps=120,input={})=>{for(let i=0;i<Math.round(time*fps);i++)g.update(1/fps,input);};
function fresh(side=1,cpu=false){
 const g=new CombatGame(cpu?'owl':'dr-no-bunnies',cpu?'dr-no-bunnies':'owl');g.aiEnabled=false;
 const a=g.fighters[cpu?1:0],b=g.fighters[cpu?0:1];
 a.x=side>0?450:830;b.x=a.x+side*160;a.facing=side;b.facing=-side;
 return {g,a,b};
}
test('Slap contact follows wind-up, hits once, charges meter, blocks and misses normally',()=>{
 for(const facing of [-1,1]){
  const {g,a,b}=fresh(facing);b.x=a.x+facing*110;
  assert.equal(g.startAttack(a,'punch'),true);assert.equal(a.attack.style,'slap');
  step(g,.1);assert.equal(b.hp,b.maxHp);step(g,.025);assert.equal(b.hp,b.maxHp - 10);
  step(g,.4);assert.equal(b.hp,b.maxHp - 10);assert.equal(a.meter,20);assert.equal(a.landedHits,1);
  b.x=a.x+facing*110;b.invuln=0;b.state='block';b.actionRemaining=1;
  g.startAttack(a,'punch');step(g,.5);assert.equal(b.hp,b.maxHp - 12);assert.equal(a.meter,20);
  b.x=a.x+facing*300;g.startAttack(a,'punch');step(g,.5);assert.equal(b.hp,b.maxHp - 12);assert.equal(a.meter,20);
 }
});
test('Dr. No Bunnies keeps kicks, analog movement, double jump and block',()=>{
 const {g,a,b}=fresh();const x=a.x;step(g,.2,120,{moveX:-.5});assert.ok(Math.abs(a.x-(x-25))<1e-8);
 assert.equal(g.jump(a),true);step(g,.1);assert.equal(g.jump(a),true);assert.equal(g.jump(a),false);step(g,1.5);assert.equal(a.grounded,true);
 b.x=a.x+160;b.invuln=0;g.startAttack(a,'kick');step(g,.7);assert.equal(b.hp,b.maxHp - 15);assert.equal(a.meter,25);
 step(g,.1,120,{block:true});assert.equal(a.state,'block');assert.equal(g.hit(b,a,10,'punch',180,.2,b.x),true);assert.equal(a.hp,a.maxHp - 2);
});
test('Belt activation gates on 100 meter, forward reach and height without spending on failures',()=>{
 const {g,a,b}=fresh();a.meter=99;assert.equal(g.useSpecial(a),false);assert.equal(a.meter,99);
 a.meter=100;b.x=a.x+286;assert.equal(g.useSpecial(a),false);assert.equal(a.meter,100);
 b.x=a.x-100;assert.equal(g.useSpecial(a),false);b.x=a.x+160;b.y=113;assert.equal(g.useSpecial(a),false);
 b.y=0;assert.equal(g.useSpecial(a),true);assert.equal(a.meter,0);assert.equal(g.useSpecial(a),false);
});
test('Three individual 16-damage strikes at .72, 1.43, 2.15s; third launch; recovery at 2.7s',()=>{
 for(const fps of [30,60,120])for(const facing of [-1,1])for(const cpu of [false,true]){
  const {g,a,b}=fresh(facing,cpu);a.meter=100;b.state='block';b.actionRemaining=4;b.invuln=4;
  assert.equal(g.useSpecial(a),true);const s=g.specials[0];const hits=[],cues=[];const startX=b.x;
  for(let n=1;n<=Math.ceil(2.7*fps);n++){
   const t=n/fps;g.update(1/fps,{right:true,jumpPressed:true,punchPressed:true,kickPressed:true,specialPressed:true});
   const events=g.drainEvents();hits.push(...events.filter(e=>e.type==='hit'));cues.push(...events.filter(e=>e.type==='beltStrike'));
   const expected=[.72,1.43,2.15].filter(at=>t+1e-9>=at).length;
   assert.equal(s.strikeIndex,expected);assert.equal(b.hp,b.maxHp-expected*16);
   if(expected<3){assert.equal(b.x,startX);assert.equal(Math.abs(b.vx),0);}
   if(t<2.7-1e-9){assert.equal(g.isPresenting(a),true);assert.equal(a.hp,a.maxHp);assert.equal(g.jump(a),false);assert.equal(g.hit(b,a,15,'kick',500,1,b.x),false);}
  }
  assert.equal(s.hitCount,3);assert.equal(hits.length,3);assert.ok(hits.every(e=>!e.blocked&&e.damage===16));
  assert.deepEqual(cues.map(e=>e.text),['LASHES!','LASHES!','LASHES!']);assert.deepEqual(cues.map(e=>e.number),[1,2,3]);
  assert.ok((b.x-startX)*facing>150);assert.equal(a.meter,0);assert.equal(a.beltActive,false);assert.equal(b.beltHeldBy,null);
  assert.equal(g.specials.length,0);assert.equal(g.isPresenting(a),false);
 }
});
test('Early KO still shows all three strikes and final knockback before one result',()=>{
 for(const hp of [1,17,33]){
  const {g,a,b}=fresh();a.meter=100;b.hp=hp;g.useSpecial(a);const events=[];
  while(g.elapsed<2.69){g.update(1/120,{});events.push(...g.drainEvents());assert.equal(g.over,false);}
  assert.equal(events.filter(e=>e.type==='beltStrike').length,3);assert.equal(b.hp,0);assert.ok(b.x>610);
  assert.equal(g.roundEnding.winner,'p1');assert.equal(events.filter(e=>e.type==='ko').length,0);
  step(g,.1);events.push(...g.drainEvents());assert.equal(g.over,true);assert.equal(g.winner,'p1');
  assert.equal(events.filter(e=>e.type==='ko').length,1);assert.equal(a.damageDealt,hp);
 }
});
test('CPU saves the belt for reach and executes the same three-strike move',()=>{
 const {g,a,b}=fresh(-1,true);g.aiEnabled=true;g.ai.think=0;g.random=()=>.8;a.meter=100;
 b.x=100;g.update(1/120,{});assert.equal(a.meter,100);
 b.x=a.x-160;g.ai.think=0;g.update(1/120,{});assert.equal(a.meter,0);g.aiEnabled=false;
 step(g,3);assert.equal(b.hp,b.maxHp - 48);assert.equal(g.drainEvents().filter(e=>e.type==='beltStrike').length,3);
});
test('Supplied controller catches up skipped frames and never repeats or interrupts strikes',()=>{
 const hits=[],cues=[];let completed=0;const a={},b={};
 const controller=new AfricanPrideBeltSlap({onHit:e=>hits.push(e),onCue:e=>cues.push(e),onComplete:()=>completed++});
 assert.equal(controller.start({attacker:a,defender:b,now:0,meter:100,distance:200}).ok,true);
 assert.equal(controller.tryInterrupt(),false);assert.equal(controller.isProtected(a),true);
 controller.tick(2400);assert.equal(hits.length,3);controller.tick(2500);assert.equal(hits.length,3);
 controller.tick(2700);controller.tick(3000);assert.equal(completed,1);assert.equal(controller.isProtected(a),false);
 assert.equal(cues.filter(e=>e.type==='callout').length,3);
});
