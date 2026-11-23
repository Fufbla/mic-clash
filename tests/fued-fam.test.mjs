import test from 'node:test';import assert from 'node:assert/strict';import {CombatGame} from '../dist/combat.js';
for(const fps of [30,60,120])for(const side of [0,1])test(`Fued Fam board drop, player ${side+1}, ${fps} fps`,()=>{
 const g=new CombatGame(...(side?['owl','fuedfam']:['fuedfam','owl']),{localMultiplayer:true}),a=g.fighters[side],b=g.fighters[1-side];
 a.meter=100;assert(g.useSpecial(a));const s=g.specials[0];
 for(let i=0;i<fps;i++)g.update(1/fps);assert.equal(b.hp,320);assert(s.visible);assert(s.boardY>0);
 for(let i=0;i<fps*2;i++)g.update(1/fps);assert.equal(b.hp,272);assert.equal(s.hitCount,1);assert.equal(a.meter,0);assert.equal(g.specials.length,0);
});
test('Board can be dodged after its position locks; reset clears it',()=>{const g=new CombatGame('fuedfam','owl',{localMultiplayer:true}),a=g.fighters[0],b=g.fighters[1];a.meter=100;g.useSpecial(a);for(let i=0;i<60;i++)g.update(1/60);b.x=100;for(let i=0;i<120;i++)g.update(1/60);assert.equal(b.hp,320);a.meter=100;g.useSpecial(a);const s=g.specials[0];g.reset();assert.equal(s.active,false);assert.equal(g.specials.length,0);});
