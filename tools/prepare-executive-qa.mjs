// Local-only browser fixtures; never included in the public release.
import { readFile, writeFile, rm } from 'node:fs/promises';
const root = new URL('../dist/', import.meta.url);
const files = ['__qa-executive.html','__qa-executive-game.js','__qa-executive-runner.html'];
if (process.argv.includes('--clean')) { for (const f of files) await rm(new URL(f,root),{force:true}); process.exit(0); }
const fixture = `
window.addEventListener('message', event => {
 if(event.origin!==location.origin || event.data?.type!=='executive-qa' || !state.ready)return;
 const {scene,side=1,fighter='president'}=event.data;clearInput();state.selected=fighter;state.opponent='ocrrrrr';
 startFight();setPhase('playing');state.game.aiEnabled=false;
 const [a,b]=state.game.fighters;a.x=side>0?360:920;b.x=a.x+side*360;a.facing=side;b.facing=-side;
 $('phaseText').textContent='';
 if(scene==='interactive'){updateHUD();return;}
 if(scene==='roster'){setPhase('select');return;}
 if(scene==='security'){a.securityFlash=.45;state.phase='paused';updateHUD();return;}
 if(scene==='walk'){a.state='run';a.vx=250;a.stateTime=.32;state.phase='paused';updateHUD();return;}
 if(scene==='ko'){a.hp=0;a.state='ko';state.phase='paused';updateHUD();return;}
 if(scene==='meter'){a.meter=100;updateHUD();return;}
 let seconds=0;
 if(scene==='punch'||scene==='kick'){b.x=a.x+side*100;state.game.startAttack(a,scene);seconds=scene==='punch'?.14:.24;}
 else {a.meter=100;state.game.useSpecial(a);seconds=({call:.4,jet:1.2,bomb:1.6,impact:1.96,robot:2.25,recover:2.9,finished:4.4})[scene]||0;}
 for(let n=0;n<Math.round(seconds*120);n++)state.game.update(1/120,{});
 processEvents();updateHUD();if(seconds){state.phase='paused';state.accumulator=0;}
 const special=state.game.specials[0];canvas.dataset.qaKind=special?.kind||'none';canvas.dataset.qaPhase=special?.phase||'none';
 canvas.dataset.qaHits=String(special?.hitCount||0);canvas.dataset.qaHp=String(b.hp);
});`;
await writeFile(new URL(files[1],root),(await readFile(new URL('game.js',root),'utf8'))+fixture);
await writeFile(new URL(files[0],root),(await readFile(new URL('index.html',root),'utf8')).replace('./game.js','./__qa-executive-game.js'));
const scenes=['roster','interactive','walk','punch','kick','ko','security','meter','play','call','jet','bomb','impact','robot','recover','finished'];
await writeFile(new URL(files[2],root),`<!doctype html><meta name="viewport" content="width=device-width"><title>Three new fighters QA</title>
<style>body{margin:0;background:#333;color:#fff;font:14px system-ui}header{display:flex;flex-wrap:wrap;gap:6px;padding:8px}button,select{padding:6px}iframe{display:block;margin:8px auto;border:0;width:1280px;height:760px}</style>
<header><select id="fighter"><option value="president">The President</option><option value="owhinny">O’whinny</option><option value="roboking">RoboKing</option></select><button data-size="1280,760">Desktop</button><button data-size="390,844">Phone portrait</button><button data-size="844,390">Phone landscape</button><button data-size="844,326">Short landscape</button><button data-size="320,568">Small phone</button><button id="direction">Face left</button>${scenes.map(s=>'<button data-scene="'+s+'">'+s+'</button>').join('')}</header>
<iframe title="Three new fighters QA game" src="./__qa-executive.html"></iframe><script>
const f=document.querySelector('iframe');let side=1;
document.querySelectorAll('[data-size]').forEach(b=>b.onclick=()=>{const[w,h]=b.dataset.size.split(',');f.style.width=w+'px';f.style.height=h+'px'});
document.querySelector('#direction').onclick=e=>{side=-side;e.target.textContent=side<0?'Face right':'Face left'};
document.querySelectorAll('[data-scene]').forEach(b=>b.onclick=()=>f.contentWindow.postMessage({type:'executive-qa',scene:b.dataset.scene,side,fighter:document.querySelector('#fighter').value},location.origin));</script>`);
console.log('Three-fighter fixtures ready at /__qa-executive-runner.html');
