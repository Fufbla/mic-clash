import test from 'node:test';
import assert from 'node:assert/strict';
import {CombatGame,FIGHTERS} from '../dist/combat.js';
import {JOOSIE,joosiePose,createJoosieSpecial,updateJoosieSpecial} from '../dist/joosie.js';
import {readFileSync} from 'node:fs';
test('Joosie atlas, roster and grounded movement',()=>{const a=JSON.parse(readFileSync(new URL('../dist/assets/atlas.json',import.meta.url))).joosie;assert.equal(a.frames.length,24);assert.equal(a.referenceHeight,336);assert.equal(a.frames[0].h,336);assert.ok(FIGHTERS.includes('joosie'));assert.equal(new CombatGame('joosie','coupe').fighters[0].type,'joosie');assert.deepEqual([0,.12,.24,.36].map(stateTime=>joosiePose({state:'run',grounded:true,stateTime}).index),[2,3,4,5]);});
test('five strikes, finish and cleanup',()=>{const a={id:'p1',x:340,facing:1,hp:100},b={id:'p2',x:600,y:0};const s=createJoosieSpecial(a);let damage=0;const g={hit(a,b,n){damage+=n;return true},setState(a,state){a.state=state}};s.age=2.1;s.ttl=.5;updateJoosieSpecial(g,s,a,b);assert.equal(s.hitCount,5);assert.equal(damage,45);s.age=2.6;s.ttl=0;updateJoosieSpecial(g,s,a,b);assert.equal(s.active,false);assert.equal(a.state,'idle');});
test('combat special activated through normal meter',()=>{const g=new CombatGame('joosie','coupe');const a=g.fighters[0];a.meter=100;assert.equal(g.useSpecial(a),true);assert.equal(g.specials[0].kind,JOOSIE.kind);g.reset('joosie','coupe');assert.equal(g.specials.length,0);});
