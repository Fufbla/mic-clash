import test from 'node:test';import assert from 'node:assert/strict';import {CombatGame} from '../dist/combat.js';import {saberPose} from '../dist/ooou-saber.js';
for(const fps of [30,60,120])for(const side of [0,1])for(const dir of [-1,1])test(`Saber player ${side+1}, direction ${dir}, ${fps} fps`,()=>{
 const g=new CombatGame(...(side?['owl','ooousaber']:['ooousaber','owl']),{localMultiplayer:true}),a=g.fighters[side],b=g.fighters[1-side];a.x=dir>0?300:980;b.x=a.x+dir*200;a.facing=dir;b.facing=-dir;a.meter=100;assert(g.useSpecial(a));const s=g.specials[0];assert.equal(saberPose(a,s).index,12);
 for(let i=0;i<fps;i++)g.update(1/fps);assert.equal(b.hp,320);assert.equal(saberPose(a,s).index,13);
 for(let i=0;i<fps*2;i++)g.update(1/fps);assert.equal(b.hp,272);assert.equal(s.hitCount,1);assert.equal(a.meter,0);assert.equal(g.specials.length,0);
});
test('Saber misses out of reach and resets cleanly',()=>{const g=new CombatGame('ooousaber','owl',{localMultiplayer:true}),a=g.fighters[0],b=g.fighters[1];a.meter=100;g.useSpecial(a);for(let i=0;i<180;i++)g.update(1/60);assert.equal(b.hp,320);a.meter=100;g.useSpecial(a);const s=g.specials[0];g.reset();assert.equal(s.active,false);});
test('Saber basic attack is a downward swipe and charges meter',()=>{const g=new CombatGame('ooousaber','owl',{localMultiplayer:true}),a=g.fighters[0],b=g.fighters[1];b.x=a.x+110;g.startAttack(a,'punch');assert.equal(a.attack.style,'swipe');for(let i=0;i<30;i++)g.update(1/60);assert.equal(b.hp,310);assert.equal(a.meter,20);});
