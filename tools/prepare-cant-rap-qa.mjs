// Local visual fixtures; generated pages are ignored and cleaned before release.
import { readFile, writeFile, rm } from 'node:fs/promises';
const root = new URL('../dist/', import.meta.url);
const files = ['__qa-cantrap.html', '__qa-cantrap-game.js', '__qa-cantrap-runner.html'];
if (process.argv.includes('--clean')) {
  for (const f of files) await rm(new URL(f, root), { force: true });
  process.exit(0);
}
const fixture = `
window.addEventListener('message', event => {
 if(event.origin!==location.origin || event.data?.type!=='cantrap-qa' || !state.ready)return;
 const {scene,side=1}=event.data;clearInput();state.selected='cantrap';state.opponent='owl';
 startFight();setPhase('playing');state.game.aiEnabled=false;
 const [a,b]=state.game.fighters;a.x=side>0?450:830;b.x=a.x+side*160;a.facing=side;b.facing=-side;
 $('phaseText').textContent='Local animation check';
 if(scene==='interactive'){updateHUD();return;}
 if(scene==='meter'){a.meter=100;updateHUD();return;}
 const kicks={windup:.04,lift:.13,contact:.23,retract:.35,lower:.44,planted:.53,idle:.70};
 let seconds=0;
 if(scene in kicks){state.game.startAttack(a,'kick');seconds=kicks[scene];}
 else if(scene==='mic'){b.x=a.x+side*100;state.game.startAttack(a,'punch');seconds=.14;}
 else {a.meter=100;state.game.useSpecial(a);seconds=({call:.20,beforeKids:.55,rush:.90,attack:1.65,finished:3.7})[scene]||0;}
 for(let n=0;n<Math.round(seconds*120);n++)state.game.update(1/120,{});
 processEvents();updateHUD();if(seconds){state.phase='paused';state.accumulator=0;}
});`;
await writeFile(new URL(files[1],root),(await readFile(new URL('game.js',root),'utf8'))+fixture);
await writeFile(new URL(files[0],root),(await readFile(new URL('index.html',root),'utf8')).replace('./game.js','./__qa-cantrap-game.js'));
const scenes=['interactive','meter','mic','windup','lift','contact','retract','lower','planted','idle','play','call','beforeKids','rush','attack','finished'];
await writeFile(new URL(files[2],root),`<!doctype html><meta name="viewport" content="width=device-width"><title>Can’t Rap animation QA</title>
<style>body{margin:0;background:#333;color:#fff;font:14px system-ui}header{display:flex;flex-wrap:wrap;gap:6px;padding:8px}button{padding:6px}iframe{display:block;margin:8px auto;border:0;width:1280px;height:760px}</style>
<header><button data-size="1280,760">Desktop</button><button data-size="390,844">Phone portrait</button><button data-size="844,390">Phone landscape</button><button id="direction">Face left</button>${scenes.map(s=>'<button data-scene="'+s+'">'+s+'</button>').join('')}</header>
<iframe title="Can’t Rap QA game" src="./__qa-cantrap.html"></iframe><script>
const f=document.querySelector('iframe');let side=1;
document.querySelectorAll('[data-size]').forEach(b=>b.onclick=()=>{const[w,h]=b.dataset.size.split(',');f.style.width=w+'px';f.style.height=h+'px'});
document.querySelector('#direction').onclick=e=>{side=-side;e.target.textContent=side<0?'Face right':'Face left'};
document.querySelectorAll('[data-scene]').forEach(b=>b.onclick=()=>f.contentWindow.postMessage({type:'cantrap-qa',scene:b.dataset.scene,side},location.origin));</script>`);
console.log('Can’t Rap fixtures ready at /__qa-cantrap-runner.html');
