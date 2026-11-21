// Local browser fixtures only. Generated __qa* files MUST be removed before packaging.
import {readFile,writeFile,rm} from 'node:fs/promises';
const root=new URL('../dist/',import.meta.url);
const files=['__qa.html','__qa-game.js','__qa-runner.html'];
if(process.argv.includes('--clean')){for(const f of files)await rm(new URL(f,root),{force:true});process.exit(0);}
const fixture=`
window.addEventListener('message', event => {
 if(event.origin !== location.origin || event.data?.type !== 'mic-clash-qa' || !state.ready)return;
 const {scene,side=1}=event.data;
 state.selected='dr-no-bunnies';state.opponent='owl';startFight();setPhase('playing');
 state.game.aiEnabled=false;const [a,b]=state.game.fighters;
 a.x=side>0?450:830;b.x=a.x+side*170;a.facing=side;b.facing=-side;
 $('phaseText').textContent='Local browser QA';
 if(scene==='interactive'){updateHUD();return;}
 if(scene==='meter'){a.meter=100;updateHUD();return;}
 if(scene==='block'){b.state='block';b.actionRemaining=99;updateHUD();return;}
 if(scene==='slap'){b.x=a.x+side*110;state.game.startAttack(a,'punch');}
 else if(scene==='kick')state.game.startAttack(a,'kick');
 else{a.meter=100;if(scene==='ko')b.hp=1;state.game.useSpecial(a);}
 const seconds=scene==='strike1'?.73:scene==='strike2'?1.44:scene==='strike3'?2.16:scene==='draw'?.28:scene==='slap'?.13:scene==='kick'?.23:0;
 for(let i=0;i<Math.round(seconds*120);i++)state.game.update(1/120,{});
 processEvents();updateHUD();
 if(seconds){state.phase='paused';state.accumulator=0;}
});`;
await writeFile(new URL('__qa-game.js',root),await readFile(new URL('game.js',root),'utf8')+fixture);
await writeFile(new URL('__qa.html',root),(await readFile(new URL('index.html',root),'utf8')).replace('./game.js','./__qa-game.js'));
await writeFile(new URL('__qa-runner.html',root),`<!doctype html><meta name="viewport" content="width=device-width"><title>Mic Clash local browser QA</title><style>body{margin:0;background:#333;color:white;font:14px system-ui}header{display:flex;flex-wrap:wrap;gap:6px;padding:8px}button{padding:6px}iframe{display:block;margin:8px auto;border:0;background:#111;width:1280px;height:760px}</style><header><button data-size="1280,760">Desktop</button><button data-size="390,844">Phone portrait</button><button data-size="844,390">Phone landscape</button><button id="direction">Face left</button><button data-scene="interactive">Combat</button><button data-scene="block">Blocked attacks</button><button data-scene="meter">Full meter</button><button data-scene="play">Play belt</button><button data-scene="ko">Early KO</button><button data-scene="draw">Draw belt</button><button data-scene="strike1">Strike 1</button><button data-scene="strike2">Strike 2</button><button data-scene="strike3">Strike 3</button><button data-scene="slap">Slap impact</button><button data-scene="kick">Kick impact</button></header><iframe title="Mic Clash QA game" src="./__qa.html"></iframe><script>const f=document.querySelector('iframe');let side=1;document.querySelectorAll('[data-size]').forEach(b=>b.onclick=()=>{const[w,h]=b.dataset.size.split(',');f.style.width=w+'px';f.style.height=h+'px'});document.querySelector('#direction').onclick=e=>{side=-side;e.target.textContent=side<0?'Face right':'Face left'};document.querySelectorAll('[data-scene]').forEach(b=>b.onclick=()=>f.contentWindow.postMessage({type:'mic-clash-qa',scene:b.dataset.scene,side},location.origin));</script>`);
console.log('Local fixtures ready at /__qa-runner.html');
