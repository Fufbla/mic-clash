import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {drawBlizzard,SNOW} from '../dist/yung-snow.js';
import {CombatGame} from '../dist/combat.js';
const source=readFileSync(new URL('../dist/game.js',import.meta.url),'utf8');
const draw=source.slice(source.indexOf('function draw(dt) {'),source.indexOf('\nfunction loop(now)'));
for(const mode of ['solo','online'])for(const [width,height] of [[780,1688],[1688,780]])test(`Blizzard render completes every frame in ${mode} ${width}x${height}`,()=>{
 const game=new CombatGame('yungsnow','owl',{localMultiplayer:true});game.fighters[0].meter=100;game.useSpecial(game.fighters[0]);
 const state={mode,phase:'playing',game,cameraWidth:1280,cameraX:640,shake:0,flash:0,labels:[]};let transform,blizzards=0;
 const ctx=new Proxy({setTransform(...v){transform=v;}},{get:(o,k)=>o[k]??(()=>{})});
 const sandbox={state,ctx,canvas:{width,height,dataset:{}},window:{devicePixelRatio:2},Math,SNOW,WORLD_W:1280,WORLD_H:720,GROUND:400,
 drawBlizzard(c,s,w,h){const ratio=mode==='online'?1.5:2;assert.deepEqual(transform,[ratio,0,0,ratio,0,0]);assert.equal(w,width/ratio);assert.equal(h,height/ratio);drawBlizzard(c,s,w,h);blizzards++;},
 $:()=>({style:{}})};
 for(const k of ['NICKI','BOAT','TRINI','TREE','CHARLES','SABER'])sandbox[k]={kind:k};
 for(const k of ['NEON_KINDS','EXECUTIVE_KINDS'])sandbox[k]=[];
 for(const k of ['executiveRenderer','rushRenderer','gauntletRenderer','neonRenderer','ascensionRenderer'])sandbox[k]={behind(){},warning(){},security(){}};
 for(const k of ['resize','drawStage','drawFighter','drawSpecial','drawEffects','drawFighterSpeech'])sandbox[k]=()=>{};
 vm.createContext(sandbox);vm.runInContext(draw,sandbox);
 for(let i=0;i<240;i++){game.update(1/60);vm.runInContext('draw(1/60)',sandbox);}
 assert(blizzards>100);assert.equal(game.specials.length,0);
});
test('Blizzard restores canvas state even if drawing fails',()=>{
 let depth=0,strokes=0;
 const ctx={save(){depth++;},restore(){depth--;},fillRect(){},beginPath(){},moveTo(){},lineTo(){},stroke(){strokes++;throw new Error('canvas failure');}};
 assert.throws(()=>drawBlizzard(ctx,{age:1,ttl:2},390,844),/canvas failure/);
 assert.equal(depth,0);assert.equal(strokes,1);
});
