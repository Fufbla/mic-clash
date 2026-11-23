import test from 'node:test';import assert from 'node:assert/strict';import {CombatGame} from '../dist/combat.js';import {treePose} from '../dist/tree-a-yawl.js';
for(const fps of [30,60,120])for(const side of [0,1])for(const dir of [-1,1])test(`Tree dragon player ${side+1}, direction ${dir}, ${fps} fps`,()=>{
 const g=new CombatGame(...(side?['owl','treeyawl']:['treeyawl','owl']),{localMultiplayer:true}),a=g.fighters[side],b=g.fighters[1-side];a.x=dir>0?180:1100;b.x=a.x+dir*600;a.facing=dir;b.facing=-dir;a.meter=100;assert(g.useSpecial(a));const s=g.specials[0];assert.equal(treePose(a,s).index,12);
 for(let i=0;i<fps;i++)g.update(1/fps);assert.equal(b.hp,320);assert.equal(treePose(a,s).index,13);
 for(let i=0;i<fps*2.5;i++)g.update(1/fps);assert.equal(b.hp,272);assert.equal(s.hitCount,1);assert.equal(a.meter,0);assert.equal(g.specials.length,0);assert.equal(s.visible,false);
});
test('Dragon does not hit behind caster and reset clears it',()=>{const g=new CombatGame('treeyawl','owl',{localMultiplayer:true}),a=g.fighters[0],b=g.fighters[1];a.x=700;b.x=300;a.facing=1;a.meter=100;g.useSpecial(a);for(let i=0;i<210;i++)g.update(1/60);assert.equal(b.hp,320);a.meter=100;g.useSpecial(a);const s=g.specials[0];g.reset();assert.equal(s.active,false);});
test('Tree slap charges meter',()=>{const g=new CombatGame('treeyawl','owl',{localMultiplayer:true}),a=g.fighters[0],b=g.fighters[1];b.x=a.x+110;g.startAttack(a,'punch');assert.equal(a.attack.style,'slap');for(let i=0;i<30;i++)g.update(1/60);assert.equal(b.hp,310);assert.equal(a.meter,20);});
