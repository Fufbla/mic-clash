import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {CombatGame} from '../dist/combat.js';
const source=readFileSync(new URL('../dist/game.js',import.meta.url),'utf8');
const loopSource=source.slice(source.indexOf('function loop(now) {'),source.indexOf("\nselectFighter('owl');"));
for(const guest of [false,true])test(`Animation continues after a draw exception (${guest?'online guest':'local match'})`,()=>{
 const game=new CombatGame('yungsnow','owl',{localMultiplayer:true});
 game.fighters[0].meter=100;game.useSpecial(game.fighters[0]);
 const queue=[],positions=game.fighters.map(f=>({x:f.x,y:f.y}));let draws=0;
 const state={mode:guest?'online':'local',phase:'playing',game,last:1000,time:0,shake:0,flash:0,toastTimer:0,specialBuffer:0};
 const sandbox={state,Math,jumpQueue:0,pressed:{},requestAnimationFrame:callback=>queue.push(callback),
 controllers:{consume:()=>({moveX:0}),clearSpecial(){}},localInput:x=>x,onlineGuest:()=>guest,
 room:{tick(){},send:()=>true},net:{lastInput:0,lastHeld:'',lastHud:0,match:1,remote:{consume:()=>({}),clearSpecial(){}},smooth:{positions:fs=>fs.map(f=>({x:f.x+10,y:f.y+5}))}},
 sound:{tick(){}},draw(){if(draws++===0)throw new Error('simulated canvas error');}};
 for(const name of ['pollControllers','processEvents','updateHUD','onlineSnapshot','showResults'])sandbox[name]=()=>{};
 vm.createContext(sandbox);vm.runInContext(loopSource,sandbox);
 assert.throws(()=>sandbox.loop(1017),/simulated canvas error/);
 assert.equal(queue.length,1,'a failed draw must still leave the next frame scheduled');
 if(guest)assert.deepEqual(game.fighters.map(f=>({x:f.x,y:f.y})),positions,'guest visual offsets must always be restored');
 for(let i=0;i<240;i++){const callback=queue.shift();callback(1034+i*17);assert.equal(queue.length,1,'only one frame should be queued');}
 assert(draws>200);
 if(!guest){assert(game.elapsed>3.5);assert.equal(game.specials.length,0);assert.notEqual(game.fighters[0].state,'special');}
});
