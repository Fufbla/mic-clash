import test from 'node:test';
import assert from 'node:assert/strict';
import { CombatGame } from '../dist/combat.js';
import { cantRapPose, cantRapSpeech } from '../dist/cant-rap.js';

function match(player='cantrap',opponent='owl') {
  const game=new CombatGame(player,opponent);
  game.aiEnabled=false;
  return game;
}
function advance(game,seconds,fps=60) {
  const frames=Math.ceil(seconds*fps);
  for(let i=0;i<frames;i++) game.update(1/fps,{});
}

test('Can’t Rap can be selected on either side and uses ordinary double jump',()=>{
  for(const [p,o] of [['cantrap','owl'],['owl','cantrap']]) {
    const game=match(p,o);
    assert.deepEqual(game.fighters.map(f=>f.type),[p,o]);
    const f=game.fighters.find(f=>f.type==='cantrap');
    assert.equal(game.jump(f),true); advance(game,.12);
    assert.equal(game.jump(f),true); assert.equal(f.flipRemaining,0);
    advance(game,1.5); assert.equal(f.grounded,true);
  }
});

test('Microphone strike uses the punch button and charges meter only when unblocked',()=>{
  const g=match(),[p,e]=g.fighters;
  p.x=400;e.x=505;
  assert.equal(g.startAttack(p,'punch'),true);
  advance(g,.5);
  assert.equal(e.hp,150);assert.equal(p.meter,20);
  assert.equal(g.drainEvents().filter(ev=>ev.type==='hit'&&ev.kind==='punch').length,1);
  e.x=505;e.state='block';e.actionRemaining=1;
  assert.equal(g.startAttack(p,'punch'),true);
  advance(g,.5);assert.equal(p.meter,20);
  e.x=1100;assert.equal(g.startAttack(p,'punch'),true);
  advance(g,.5);assert.equal(p.meter,20);
});

test('Turban Crew Jump-In lands eight unblockable hits at 30, 60 and 120 fps in both directions',()=>{
  for(const fps of [30,60,120])for(const facing of [-1,1]){
    const g=match(),[p,e]=g.fighters;
    p.x=facing>0?400:880;e.x=p.x+facing*140;
    p.facing=facing;e.facing=-facing;
    p.meter=99;assert.equal(g.useSpecial(p),false);
    p.meter=100;e.state='block';e.actionRemaining=4;
    assert.equal(g.useSpecial(p),true);assert.equal(p.meter,0);
    const s=g.specials[0];assert.equal(s.kind,'crew');assert.equal(s.crew.length,8);
    assert.equal(g.useSpecial(p),false);
    const events=[],phases=new Set();
    for(let i=0;i<fps*4;i++){
      g.update(1/fps,{});
      phases.add(s.phase);events.push(...g.drainEvents());
    }
    assert.equal(s.strikeIndex,8);
    assert.equal(s.hitCount,8);
    assert.equal(e.hp,112);
    assert.equal(p.hp,160);
    assert.equal(p.meter,0);
    assert.equal(p.crewActive,false);
    assert.equal(g.specials.length,0);
    assert.ok(phases.has('calling')&&phases.has('rushing')&&phases.has('attack')&&phases.has('retreat'));
    const hits=events.filter(ev=>ev.type==='hit'&&ev.kind==='crew');
    assert.equal(hits.length,8);
    assert.ok(hits.every(ev=>!ev.blocked&&ev.damage===6));
    assert.equal(events.filter(ev=>ev.type==='crewStrike').length,8);
  }
});

test('The crew cannot be interrupted, stacked, or blocked by ordinary defense',()=>{
  const g=match(),[p,e]=g.fighters;
  p.x=420;e.x=560;p.meter=100;g.useSpecial(p);
  advance(g,.5);
  assert.equal(g.isPresenting(p),true);
  assert.equal(g.hit(e,p,30,'kick',300,.3,e.x),false);
  assert.equal(p.hp,160);
  assert.equal(g.startAttack(p,'punch'),false);
  p.meter=100;assert.equal(g.useSpecial(p),false);
  advance(g,3.3);
  assert.equal(g.isPresenting(p),false);
  assert.equal(p.crewActive,false);
});

test('An opposing protected special and airborne escape can avoid the crew',()=>{
  const g=match('cantrap','coupe'),[p,e]=g.fighters;
  p.x=400;e.x=540;p.meter=e.meter=100;
  assert.equal(g.useSpecial(e),true);
  assert.equal(g.useSpecial(p),true);
  advance(g,3.6);
  assert.equal(p.hp,160);
  const h=match(),[a,b]=h.fighters;
  a.x=400;b.x=540;a.meter=100;h.useSpecial(a);
  for(let i=0;i<240;i++){
    b.y=240;b.grounded=false;b.vy=0;
    h.update(1/120,{});
  }
  assert.equal(b.hp,160);
});

test('Early knockout waits for the full crew presentation before showing results',()=>{
  const g=match(),[p,e]=g.fighters;
  p.x=400;e.x=540;e.hp=6;p.meter=100;
  g.useSpecial(p);advance(g,1.4);
  assert.equal(e.hp,0);assert.equal(g.over,false);
  assert.equal(g.roundEnding?.winner,'p1');
  advance(g,2.2);
  assert.equal(g.over,true);assert.equal(g.winner,'p1');
  assert.equal(g.specials.length,0);
});

test('CPU can call the crew and round reset clears it',()=>{
  const g=match('owl','cantrap'),[p,ai]=g.fighters;
  p.x=500;ai.x=650;ai.meter=100;
  g.aiEnabled=true;g.ai.think=0;g.random=()=>.8;
  g.update(1/120,{});
  assert.equal(ai.meter,0);
  assert.equal(g.specials.find(s=>s.owner==='p2')?.kind,'crew');
  g.reset('cantrap','owl');
  assert.equal(g.specials.length,0);
  assert.equal(g.fighters[0].crewActive,false);
});

test('Single and held kicks extend only at contact, retract, plant the foot, and return to idle',()=>{
  for(const fps of [30,60,120])for(const side of ['p1','p2']){
    const g=side==='p1'?match():match('owl','cantrap');
    const f=g.fighters.find(f=>f.id===side);
    g.fighters[0].x=150;g.fighters[1].x=1100;
    for(let repeat=0;repeat<3;repeat++){
      assert.equal(g.startAttack(f,'kick'),true);
      const frames=new Set();
      while(f.attack){
        const pose=cantRapPose(f).index;frames.add(pose);
        const elapsed=f.attack.elapsed;
        if(elapsed>=.18 && elapsed<.30)assert.equal(pose,10);
        if(elapsed>=.48)assert.equal(pose,13,'The foot must be planted before the next kick');
        g.update(1/fps,{});
      }
      for(const pose of [8,9,10,11,12,13])assert.ok(frames.has(pose),`Missing kick keyframe ${pose} at ${fps} fps`);
      assert.equal(f.state,'idle');assert.equal(cantRapPose(f).index,0);
    }
  }
});

test('Kids! is visible before any crew enters and clears after the call or reset',()=>{
  for(const fps of [30,60,120])for(const side of ['p1','p2']){
    const g=side==='p1'?match():match('owl','cantrap');
    const f=g.fighters.find(f=>f.id===side);f.meter=100;g.useSpecial(f);
    const s=g.specials[0];
    assert.equal(cantRapSpeech(s),'Kids!');assert.equal(cantRapPose(f,s).index,14);
    let firstKid=null;
    for(let n=0;n<fps*1.5;n++){
      g.update(1/fps,{});
      if(s.age<.60-1e-9){assert.equal(cantRapSpeech(s),'Kids!');assert.ok(s.crew.every(k=>!k.visible));}
      if(firstKid===null&&s.crew.some(k=>k.visible))firstKid=s.age;
    }
    assert.ok(firstKid>=.60-1e-9&&firstKid<=.60+1/fps+1e-9);
    assert.equal(cantRapSpeech(s),'');
    g.reset('cantrap','owl');assert.equal(cantRapSpeech(g.specials[0]),'');
  }
});
