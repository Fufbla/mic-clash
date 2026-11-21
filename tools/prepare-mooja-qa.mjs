// Local visual fixtures; generated pages are ignored and cleaned before release.
import { readFile, writeFile, rm } from 'node:fs/promises';
const root = new URL('../dist/', import.meta.url);
const files = ['__qa-mooja.html', '__qa-mooja-game.js', '__qa-mooja-runner.html'];
if (process.argv.includes('--clean')) {
  for (const f of files) await rm(new URL(f, root), { force: true });
  process.exit(0);
}
const fixture = `
window.addEventListener('message', event => {
 if(event.origin!==location.origin || event.data?.type!=='mooja-qa' || !state.ready)return;
 const {scene,side=1}=event.data;clearInput();state.selected='mooja';state.opponent='owl';
 startFight();setPhase('playing');state.game.aiEnabled=false;
 const [a,b]=state.game.fighters;a.x=side>0?450:830;b.x=a.x+side*130;a.facing=side;b.facing=-side;
 $('phaseText').textContent='Local animation check';
 if(['first','second','third','flight','recover','restored','play'].includes(scene)){a.x=side>0?280:1000;b.x=a.x+side*650;}
 if(scene==='interactive'){updateHUD();return;}
 if(scene==='walk'){a.state='run';a.vx=250;a.stateTime=.32;state.phase='paused';updateHUD();return;}
 if(scene==='meter'){a.meter=100;updateHUD();return;}
 const kicks={windup:.04,lift:.13,contact:.23,retract:.35,lower:.44,planted:.53,idle:.70};
 let seconds=0;
 if(scene in kicks){state.game.startAttack(a,'kick');seconds=kicks[scene];}
 else if(scene==='punch'){b.x=a.x+side*100;state.game.startAttack(a,'punch');seconds=.14;}
 else {a.meter=100;state.game.useSpecial(a);seconds=({normal:.15,crouch:.30,transform:.50,cow:.65,first:.88,second:1.18,third:1.48,flight:1.60,recover:1.75,restored:2.10,finished:3.4})[scene]||0;}
 for(let n=0;n<Math.round(seconds*120);n++)state.game.update(1/120,{});
 processEvents();updateHUD();if(seconds){state.phase='paused';state.accumulator=0;}
});`;
await writeFile(new URL(files[1],root),(await readFile(new URL('game.js',root),'utf8'))+fixture);
await writeFile(new URL(files[0],root),(await readFile(new URL('index.html',root),'utf8')).replace('./game.js','./__qa-mooja-game.js'));
const scenes=['interactive','meter','punch','windup','lift','contact','retract','lower','planted','idle','play','normal','crouch','transform','cow','first','second','third','flight','recover','restored','finished','walk'];
await writeFile(new URL(files[2],root),`<!doctype html><meta name="viewport" content="width=device-width"><title>MooJa animation QA</title>
<style>body{margin:0;background:#333;color:#fff;font:14px system-ui}header{display:flex;flex-wrap:wrap;gap:6px;padding:8px}button{padding:6px}iframe{display:block;margin:8px auto;border:0;width:1280px;height:760px}</style>
<header><button data-size="1280,760">Desktop</button><button data-size="390,844">Phone portrait</button><button data-size="844,390">Phone landscape</button><button id="direction">Face left</button>${scenes.map(s=>'<button data-scene="'+s+'">'+s+'</button>').join('')}</header>
<iframe title="MooJa QA game" src="./__qa-mooja.html"></iframe><script>
const f=document.querySelector('iframe');let side=1;
document.querySelectorAll('[data-size]').forEach(b=>b.onclick=()=>{const[w,h]=b.dataset.size.split(',');f.style.width=w+'px';f.style.height=h+'px'});
document.querySelector('#direction').onclick=e=>{side=-side;e.target.textContent=side<0?'Face right':'Face left'};
document.querySelectorAll('[data-scene]').forEach(b=>b.onclick=()=>f.contentWindow.postMessage({type:'mooja-qa',scene:b.dataset.scene,side},location.origin));</script>`);
console.log('MooJa fixtures ready at /__qa-mooja-runner.html');
