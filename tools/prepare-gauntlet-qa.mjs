// Local-only browser fixtures; never included in the public release.
import { readFile, writeFile, rm } from 'node:fs/promises';
const root = new URL('../dist/', import.meta.url);
const files = ['__qa-gauntlet.html','__qa-gauntlet-game.js','__qa-gauntlet-runner.html'];
if (process.argv.includes('--clean')) { for (const f of files) await rm(new URL(f,root),{force:true}); process.exit(0); }
const fixture = `
window.addEventListener('message', event => {
 if(event.origin!==location.origin || event.data?.type!=='gauntlet-qa' || !state.ready)return;
 const {scene,side=1,fighter='bigmumble'}=event.data;clearInput();state.selected=fighter;state.opponent='ocrrrrr';
 startFight();setPhase('playing');state.game.aiEnabled=false;
 const [a,b]=state.game.fighters;a.x=side>0?360:920;b.x=a.x+side*360;a.facing=side;b.facing=-side;
 $('phaseText').textContent='';
 if(scene==='interactive'){updateHUD();return;}
 if(scene==='roster'){setPhase('select');return;}
 if(scene==='audio'){state.audio=true;sound.enable(true);$('soundButton').setAttribute('aria-pressed','true');a.meter=100;updateHUD();return;}
 if(scene==='walk'){a.state='run';a.vx=250;a.stateTime=.32;state.phase='paused';updateHUD();return;}
 if(scene==='ko'){a.hp=0;a.state='ko';state.phase='paused';updateHUD();return;}
 if(scene==='meter'){a.meter=100;updateHUD();return;}
 let seconds=0;
 if(scene==='flip'){state.game.startAttack(a,'kick');seconds=.45;}
 else if(scene==='punch'||scene==='kick'){b.x=a.x+side*100;state.game.startAttack(a,scene);seconds=scene==='punch'?.14:(fighter==='quickfast'?.29:.24);}
 else {a.meter=100;state.game.useSpecial(a);seconds=({call:.25,aim:.63,release:.80,throw:1.01,impact:1.16,car:1.6,exit:2.55,crew:1.75,depart:3.45,recover:3.1,finished:4.6})[scene]||0;}
 for(let n=0;n<Math.round(seconds*120);n++)state.game.update(1/120,{});
 processEvents();updateHUD();if(seconds){state.phase='paused';state.accumulator=0;}
 const special=state.game.specials[0];canvas.dataset.qaKind=special?.kind||'none';canvas.dataset.qaPhase=special?.phase||'none';
 canvas.dataset.qaHits=String(special?.hitCount||0);canvas.dataset.qaHp=String(b.hp);canvas.dataset.qaHelpers=String(special?.crew?.filter(h=>h.visible).length||0);
 parent.postMessage({type:'gauntlet-state',fighter,scene,hp:b.hp,hits:special?.hitCount||0,helpers:special?.crew?.filter(h=>h.visible).length||0,kind:special?.kind||'none',phase:special?.phase||'none'},location.origin);
});`;
await writeFile(new URL(files[1],root),(await readFile(new URL('game.js',root),'utf8'))+fixture);
await writeFile(new URL(files[0],root),(await readFile(new URL('index.html',root),'utf8')).replace('./game.js','./__qa-gauntlet-game.js'));
const scenes=['roster','interactive','walk','punch','kick','ko','audio','meter','call','aim','release','throw','impact','car','exit','crew','depart','recover','finished'];
await writeFile(new URL(files[2],root),`<!doctype html><meta name="viewport" content="width=device-width"><title>Three new fighters QA</title>
<style>body{margin:0;background:#333;color:#fff;font:14px system-ui}header{display:flex;flex-wrap:wrap;gap:6px;padding:8px}button,select{padding:6px}iframe{display:block;margin:8px auto;border:0;width:1280px;height:760px}</style>
<header><select id="fighter"><option value="bigmumble">Big Mumble</option><option value="djbeigey">DJ Beigey</option><option value="nobuttons">No Buttons</option></select><button data-size="1280,760">Desktop</button><button data-size="390,844">Phone portrait</button><button data-size="844,390">Phone landscape</button><button data-size="844,326">Short landscape</button><button data-size="320,568">Small phone</button><button id="direction">Face left</button>${scenes.map(s=>'<button data-scene="'+s+'">'+s+'</button>').join('')}</header>
<output id="result">Ready</output><iframe title="Three new fighters QA game" src="./__qa-gauntlet.html"></iframe><script>
const f=document.querySelector('iframe');let side=1;window.addEventListener('message',e=>{if(e.origin===location.origin&&e.data?.type==='gauntlet-state')document.querySelector('#result').textContent=JSON.stringify(e.data)});
document.querySelectorAll('[data-size]').forEach(b=>b.onclick=()=>{const[w,h]=b.dataset.size.split(',');f.style.width=w+'px';f.style.height=h+'px'});
document.querySelector('#direction').onclick=e=>{side=-side;e.target.textContent=side<0?'Face right':'Face left'};
document.querySelectorAll('[data-scene]').forEach(b=>b.onclick=()=>{f.contentWindow.focus();f.contentWindow.postMessage({type:'gauntlet-qa',scene:b.dataset.scene,side,fighter:document.querySelector('#fighter').value},location.origin)});</script>`);
console.log('Three-fighter fixtures ready at /__qa-gauntlet-runner.html');
