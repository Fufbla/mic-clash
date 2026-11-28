// Local-only browser fixture. Generated files are ignored and never deployed.
import fs from 'node:fs/promises';
const root=new URL('../dist/',import.meta.url);
const fixture=`
const qa=document.createElement('div');qa.id='defenseQA';qa.style='position:fixed;z-index:999999;top:5px;left:5px;right:5px;padding:6px;background:#160e20;color:white;font:13px system-ui;display:flex;gap:6px;flex-wrap:wrap';
qa.innerHTML='<select id="qaFighter" aria-label="QA fighter"></select><button id="qaAll">Check all poses</button><button id="qaGuard">Guard recoil</button><button id="qaDefeat">Play defeat</button><button id="qaMirror">Mirror</button><span id="qaReport">Waiting for sprites</span>';
document.body.append(qa);const qs=id=>document.getElementById(id);qs('qaFighter').replaceChildren(...ROSTER.map(id=>{const o=document.createElement('option');o.value=id;o.textContent=META[id].name;return o;}));
let qaFace=1;
function qaScene(kind){if(!state.ready)return;const id=qs('qaFighter').value;beginFight(id,id==='coupe'?'owl':'coupe');setPhase('playing');state.game.aiEnabled=false;state.resultDelay=-10;const [a,b]=state.game.fighters;a.x=440;b.x=850;a.facing=qaFace;b.facing=-qaFace;a.stateTime=.5;
if(kind==='guard'){a.state='block';a.actionRemaining=99;state.phase='paused';defensePresentation.noteBlock(state.game,a,state.defenseTime);}
else {a.state='ko';a.stateTime=0;a.hp=0;a.y=120;a.grounded=false;state.game.over=true;state.game.winner='p2';}updateHUD();qs('qaReport').textContent=META[id].name+' · '+kind;}
qs('qaGuard').onclick=()=>qaScene('guard');qs('qaDefeat').onclick=()=>qaScene('defeat');qs('qaMirror').onclick=()=>{qaFace=-qaFace;qaScene('guard');};
qs('qaAll').onclick=()=>{if(!state.ready){qs('qaReport').textContent='Still loading';return;}const errors=[],originalFrame=frame;let calls=[];frame=(key,index)=>{calls.push([key,index]);return originalFrame(key,index);};let checked=0;
try{for(const id of ROSTER){state.game=new CombatGame(id,id==='coupe'?'owl':'coupe',{localMultiplayer:true});const f=state.game.fighters[0];f.state='block';f.stateTime=.5;f.grounded=true;state.defenseTime+=2;calls=[];drawFighter(f);if(state.assets[id+'Defense']&&!calls.some(([k,i])=>k===id+'Defense'&&i===1))errors.push(id+' guard');defensePresentation.noteBlock(state.game,f,state.defenseTime);calls=[];drawFighter(f);if(state.assets[id+'Defense']&&!calls.some(([k,i])=>k===id+'Defense'&&i===2))errors.push(id+' recoil');f.hp=0;f.state='ko';f.stateTime=0;state.game.over=true;state.game.winner='p2';drawFighter(f);state.defenseTime+=.7;calls=[];drawFighter(f);if(state.assets[id+'Defense']?.hasDefeat&&!calls.some(([k,i])=>k===id+'Defense'&&i===7))errors.push(id+' defeat');f.facing=-1;drawFighter(f);checked++;}}catch(e){errors.push(e.stack);}finally{frame=originalFrame;}qaScene('guard');qs('qaReport').textContent=errors.length?'FAIL: '+errors.join('; '):'PASS: '+checked+' fighters · guards, recoil, defeats, both directions';};
const qaReady=setInterval(()=>{if(state.ready){clearInterval(qaReady);qs('qaReport').textContent='Ready';}},100);
`;
await fs.writeFile(new URL('__qa-defense-game.js',root),await fs.readFile(new URL('game.js',root),'utf8')+fixture);
await fs.writeFile(new URL('__qa-defense.html',root),(await fs.readFile(new URL('index.html',root),'utf8')).replace('./game.js','./__qa-defense-game.js'));
