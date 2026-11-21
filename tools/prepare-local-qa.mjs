// Virtual standard Gamepad snapshots exercise the production input pipeline.
// Generated pages are local-only and must be cleaned before publication.
import { readFile, writeFile, rm } from 'node:fs/promises';
const root = new URL('../dist/', import.meta.url);
const files = ['__qa-local.html', '__qa-local-game.js', '__qa-local-runner.html'];
if (process.argv.includes('--clean')) { for (const file of files) await rm(new URL(file, root), { force: true }); process.exit(0); }
const fixture = String.raw`
const qaPad = (index, buttons = [], axes = [0,0]) => ({ index, id:'QA standard controller', mapping:'standard', connected:true, axes,
  buttons:Array.from({length:17},(_,i)=>({pressed:buttons.includes(i),value:buttons.includes(i)?1:0})) });
const qaWait = ms => new Promise(resolve=>{const start=performance.now();const next=()=>performance.now()-start>=ms?resolve():requestAnimationFrame(next);requestAnimationFrame(next);});
async function qaUntil(predicate, label, timeout=30000) {
 const start=performance.now();
 while(!predicate()) { if(performance.now()-start>timeout)throw new Error('Timed out: '+label);await qaWait(40); }
}
async function qaPulse(player, button) { qaPads[player]=qaPad(player?3:0);await qaWait(40);qaPads[player]=qaPad(player?3:0,[button]);await qaWait(40);qaPads[player]=qaPad(player?3:0);await qaWait(40); }
async function qaRun() {
 const results=[];const check=(name,ok)=>{results.push({name,ok:!!ok,...(!ok?{phase:state.phase,focus:document.hasFocus(),activeElement:document.activeElement?.id,fighters:state.game?.fighters.map(f=>({x:f.x,y:f.y,jumps:f.jumps,hp:f.hp,meter:f.meter})),blocked:controllers.slots.map(s=>s?.blocked)}:{})});parent.postMessage({type:'local-results',results},location.origin);};
 for(let n=0;n<200&&!state.ready;n++)await qaWait(100);
 showSelection();$('localMode').click();controllers.reset();qaPads=[];updateLobby();
 check('Local mode waits for two controllers',$('startFight').disabled&&state.mode==='local');
 check('All 23 fighters remain available',document.querySelectorAll('[data-fighter]').length===23);
 await qaPulse(0,0);check('First controller joins P1 only',controllers.connected(0)&&!controllers.connected(1)&&$('startFight').disabled);
 await qaPulse(1,0);check('Second controller joins P2 and enables start',controllers.bothConnected()&&!$('startFight').disabled);
 const before=[state.selected,state.opponent];
 qaPads=[qaPad(0,[15]),qaPad(3,[14])];await qaWait(100);qaPads=[qaPad(0),qaPad(3)];await qaWait(100);
 check('Controllers choose fighters independently',before[0]!==state.selected&&before[1]!==state.opponent);
 qaPads=[qaPad(0,[0]),qaPad(3,[0])];await qaWait(120);qaPads=[qaPad(0),qaPad(3)];
 check('Both ready starts a local countdown',state.phase==='countdown'&&state.game.localMultiplayer&&!state.game.aiEnabled);
 await qaUntil(()=>state.phase==='playing','round countdown');
 check('Ready buttons do not jump into the round',state.phase==='playing'&&state.game.fighters.every(f=>f.jumps===0));
 qaPads=[qaPad(0,[],[1,0]),qaPad(3,[],[-1,0])];
 await qaUntil(()=>state.game.fighters[0].x>390&&state.game.fighters[1].x<890,'simultaneous movement');
 qaPads=[qaPad(0),qaPad(3)];await qaWait(100);
 check('Both players move simultaneously',state.game.fighters[0].x>350&&state.game.fighters[1].x<930);
 await qaPulse(1,0);await qaPulse(1,0);
 check('P2 double jumps without moving P1 into a jump',state.game.fighters[1].jumps===2&&state.game.fighters[0].jumps===0);
 await qaUntil(()=>state.game.fighters[1].jumps===0,'P2 landing');
 qaPads=[qaPad(0,[],[1,0]),qaPad(3,[],[-1,0])];
 await qaUntil(()=>state.game.fighters[1].x-state.game.fighters[0].x<105,'fighters in kick reach');
 qaPads=[qaPad(0),qaPad(3)];await qaWait(100);
 qaPads[1]=qaPad(3,[1]);await qaUntil(()=>state.game.fighters[0].hp<320,'P2 kick contact');qaPads[1]=qaPad(3);await qaWait(100);
 check('P2 attack damages P1 and charges only P2',state.game.fighters[0].hp<320&&state.game.fighters[1].meter>0&&state.game.fighters[0].meter===0);
 await qaPulse(1,9);check('P2 Pause button opens the pause menu',state.phase==='paused'&&!$('pauseScreen').hidden);
 const clock=state.game.timeRemaining;qaPads=[qaPad(0,[2]),qaPad(3,[3])];await qaWait(200);
 check('Paused attacks do not advance the round',state.game.timeRemaining===clock);
 qaPads=[qaPad(0),qaPad(3)];await qaWait(100);await qaPulse(0,9);
 check('P1 Pause button resumes',state.phase==='playing');
 await qaPulse(0,9);await qaPulse(1,15);await qaPulse(1,15);
 check('P2 navigates the pause menu to Controls',document.activeElement?.id==='helpButton');
 await qaPulse(1,0);check('P2 opens controller instructions',!$('helpScreen').hidden);
 await qaPulse(1,1);check('P2 returns from instructions without resuming',state.phase==='paused'&&$('helpScreen').hidden);
 await qaPulse(0,9);
 qaPads[0]=null;await qaWait(150);
 check('Disconnect does not pause or enable AI',state.phase==='playing'&&!state.game.aiEnabled&&!$('controllerNotice').hidden);
 check('P2 keeps its controller slot',controllers.slots[1].index===3&&controllers.connected(1)&&!controllers.connected(0));
 await qaPulse(0,0);check('Reconnect restores the same slots',controllers.bothConnected()&&controllers.slots[0].index===0&&controllers.slots[1].index===3);
 state.game.finish('p2');showResults();await qaWait(100);
 check('Results identify the human winner',$('resultTitle').textContent==='Player 2 wins!');
 await qaPulse(1,0);
 check('Controller rematch retains local mode and restores health',state.phase==='countdown'&&state.game.localMultiplayer&&!state.game.aiEnabled&&state.game.fighters.every(f=>f.hp===320));
 parent.postMessage({type:'local-done',results},location.origin);
}
window.addEventListener('message',async event=>{
 if(event.origin!==location.origin||event.data?.type!=='local-qa')return;
 const {action,player=0,button=0}=event.data;
 if(action==='run'){try{await qaRun();}catch(error){parent.postMessage({type:'local-error',error:String(error)},location.origin);}return;}
 if(action==='pulse')await qaPulse(player,button);
 if(action==='roster')showSelection();
 if(action==='disconnect')qaPads[player]=null;
});
setInterval(()=>parent.postMessage({type:'local-state',state:{focus:document.hasFocus(),active:document.activeElement?.tagName,visibility:document.visibilityState,phase:state.phase,mode:state.mode,ready:state.ready,playersReady:state.playersReady,menus:qaLastMenus,slots:controllers.slots.map(s=>s&&{index:s.index,connected:s.connected,blocked:s.blocked}),fighters:state.game?.fighters.map(f=>({id:f.id,type:f.type,x:Math.round(f.x),hp:f.hp,meter:f.meter,jumps:f.jumps})),ai:state.game?.aiEnabled}},location.origin),250);
`;
const source = await readFile(new URL('game.js', root), 'utf8');
await writeFile(new URL('__qa-local-game.js', root), 'let qaPads=[],qaLastMenus=[];\n' + source.replace('new LocalControllers()', 'new LocalControllers(() => qaPads)').replace('controllerMenus(menus);','qaLastMenus=menus;controllerMenus(menus);') + fixture);
await writeFile(new URL('__qa-local.html', root), (await readFile(new URL('index.html', root), 'utf8')).replace('./game.js', './__qa-local-game.js'));
await writeFile(new URL('__qa-local-runner.html', root), `<!doctype html><meta name="viewport" content="width=device-width"><title>Celebrity Gauntlet local controller QA</title><style>body{margin:0;background:#333;color:white;font:12px system-ui}header{display:flex;flex-wrap:wrap;gap:5px;padding:6px}button{padding:7px}iframe{display:block;margin:6px auto;border:0;width:1280px;height:760px}#results{max-height:80px;overflow:auto}#state{font-size:11px}</style><header><button data-size="1280,760">Desktop</button><button data-size="390,844">Phone portrait</button><button data-size="844,390">Phone landscape</button><button data-size="844,326">Short landscape</button><button data-size="320,568">Small phone</button><button data-action="run">Run local checks</button><button data-action="roster">Roster</button><button data-action="pulse" data-player="0" data-button="0">P1 A</button><button data-action="pulse" data-player="1" data-button="0">P2 A</button><button data-action="pulse" data-player="0" data-button="15">P1 right</button><button data-action="pulse" data-player="1" data-button="15">P2 right</button><button data-action="pulse" data-player="0" data-button="9">P1 pause</button><button data-action="disconnect" data-player="1">Disconnect P2</button></header><output id="results">Ready for checks</output><div id="state"></div><iframe title="Local controller QA game" src="./__qa-local.html" allow="gamepad"></iframe><script>const f=document.querySelector('iframe');document.querySelectorAll('[data-size]').forEach(b=>b.onclick=()=>{const[w,h]=b.dataset.size.split(',');f.style.width=w+'px';f.style.height=h+'px';f.contentWindow.focus()});document.querySelectorAll('[data-action]').forEach(b=>b.onclick=()=>{f.contentWindow.focus();f.contentWindow.postMessage({type:'local-qa',action:b.dataset.action,player:Number(b.dataset.player||0),button:Number(b.dataset.button||0)},location.origin)});window.addEventListener('message',e=>{if(e.origin!==location.origin)return;if(e.data?.type==='local-state')document.querySelector('#state').textContent=JSON.stringify(e.data.state);if(e.data?.type==='local-error')document.querySelector('#results').textContent=document.querySelector('#results').textContent+' ERROR '+e.data.error;if(['local-results','local-done'].includes(e.data?.type)){const bad=e.data.results.filter(r=>!r.ok);document.querySelector('#results').textContent=(e.data.type==='local-done'?'DONE ':'RUNNING ')+(bad.length?'FAIL '+JSON.stringify(bad):'PASS '+e.data.results.length+' checks');}});</script>`);
console.log('Local controller fixtures ready at /__qa-local-runner.html');
