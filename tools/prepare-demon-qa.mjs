// Local visual fixtures; generated pages are ignored and cleaned before release.
import { readFile, writeFile, rm } from 'node:fs/promises';
const root = new URL('../dist/', import.meta.url);
const files = ['__qa-demon.html', '__qa-demon-game.js', '__qa-demon-runner.html'];
if (process.argv.includes('--clean')) {
  for (const f of files) await rm(new URL(f, root), { force: true });
  process.exit(0);
}
const fixture = `
window.addEventListener('message', event => {
 if(event.origin!==location.origin || event.data?.type!=='demon-qa' || !state.ready)return;
 const {scene,side=1}=event.data;clearInput();state.selected='demon';state.opponent='owl';
 startFight();setPhase('playing');state.game.aiEnabled=false;
 const [a,b]=state.game.fighters;a.x=side>0?450:830;b.x=a.x+side*130;a.facing=side;b.facing=-side;
 $('phaseText').textContent='Local animation check';
 if(['point','chin','away','entry','drop','landing','firststrike','combo','laststrike','exit','recover','finished','play'].includes(scene)){a.x=side>0?330:950;b.x=a.x+side*400;}
 if(scene==='interactive'){updateHUD();return;}
 if(scene==='walk'){a.state='run';a.vx=250;a.stateTime=.32;state.phase='paused';updateHUD();return;}
 if(scene==='meter'){a.meter=100;updateHUD();return;}
 const kicks={windup:.04,lift:.13,kick:.23,retract:.35,lower:.44,planted:.53,idle:.70};
 let seconds=0;
 if(scene in kicks){state.game.startAttack(a,'kick');seconds=kicks[scene];}
 else if(scene==='punch'){b.x=a.x+side*100;state.game.startAttack(a,'punch');seconds=.14;}
 else {a.meter=100;state.game.useSpecial(a);seconds=({point:.3,chin:.55,away:.74,entry:1.12,drop:1.34,landing:1.54,firststrike:1.74,combo:2.25,laststrike:2.95,exit:3.4,recover:3.9,finished:4.4})[scene]||0;}
 for(let n=0;n<Math.round(seconds*120);n++)state.game.update(1/120,{});
 processEvents();updateHUD();if(seconds){state.phase='paused';state.accumulator=0;}
});`;
await writeFile(new URL(files[1],root),(await readFile(new URL('game.js',root),'utf8'))+fixture);
await writeFile(new URL(files[0],root),(await readFile(new URL('index.html',root),'utf8')).replace('./game.js','./__qa-demon-game.js'));
const scenes=['interactive','meter','punch','windup','lift','kick','retract','lower','planted','idle','play','point','chin','away','entry','drop','landing','firststrike','combo','laststrike','exit','recover','finished','walk'];
await writeFile(new URL(files[2],root),`<!doctype html><meta name="viewport" content="width=device-width"><title>Demon animation QA</title>
<style>body{margin:0;background:#333;color:#fff;font:14px system-ui}header{display:flex;flex-wrap:wrap;gap:6px;padding:8px}button{padding:6px}iframe{display:block;margin:8px auto;border:0;width:1280px;height:760px}</style>
<header><button data-size="1280,760">Desktop</button><button data-size="390,844">Phone portrait</button><button data-size="844,390">Phone landscape</button><button id="direction">Face left</button>${scenes.map(s=>'<button data-scene="'+s+'">'+s+'</button>').join('')}</header>
<iframe title="Demon QA game" src="./__qa-demon.html"></iframe><script>
const f=document.querySelector('iframe');let side=1;
document.querySelectorAll('[data-size]').forEach(b=>b.onclick=()=>{const[w,h]=b.dataset.size.split(',');f.style.width=w+'px';f.style.height=h+'px'});
document.querySelector('#direction').onclick=e=>{side=-side;e.target.textContent=side<0?'Face right':'Face left'};
document.querySelectorAll('[data-scene]').forEach(b=>b.onclick=()=>f.contentWindow.postMessage({type:'demon-qa',scene:b.dataset.scene,side},location.origin));</script>`);
console.log('Demon fixtures ready at /__qa-demon-runner.html');
