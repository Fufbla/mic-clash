// Run after tools/prepare-browser-qa.mjs; --clean on that tool removes all generated pages.
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const base = fileURLToPath(new URL('../dist/', import.meta.url));
const fixture = `
window.addEventListener('message', event => {
  if(event.origin !== location.origin || event.data?.type !== 'mobile-checks' || !state.ready) return;
  const results = [];
  const check = (name, ok) => { results.push({name, ok:!!ok}); };
  state.selected='ocrrrrr';state.opponent='dr-no-bunnies';startFight();setPhase('playing');state.game.aiEnabled=false;
  for(const type of ['blur','visibilitychange']) {
    held.add('KeyD');
    (type === 'blur' ? window : document).dispatchEvent(new Event(type));
    check(type+' does not pause and releases movement', state.phase==='playing' && movementAxis()===0);
  }
  for(const code of ['KeyP','Escape']) {
    window.dispatchEvent(new KeyboardEvent('keydown',{code,bubbles:true}));
    check(code+' does not pause', state.phase==='playing');
  }
  for(const type of ['touchstart','touchmove','touchend','dblclick','selectstart','contextmenu']) {
    const e=new Event(type,{bubbles:true,cancelable:true});$('specialButton').dispatchEvent(e);
    check(type+' on disabled Special is prevented',e.defaultPrevented);
  }
  for(const type of ['gesturestart','gesturechange','gestureend']) {
    const e=new Event(type,{bubbles:true,cancelable:true});document.dispatchEvent(e);
    check(type+' cannot zoom live game',e.defaultPrevented);
  }
  const clickEvent=new Event('touchend',{bubbles:true,cancelable:true});$('pauseButton').dispatchEvent(clickEvent);
  check('Pause touch keeps its native click',!clickEvent.defaultPrevented);
  $('helpButton').click();check('Hidden help cannot pause',state.phase==='playing' && $('helpScreen').hidden);
  $('pauseButton').click();check('Pause button opens options',state.phase==='paused' && !$('pauseScreen').hidden);
  $('helpButton').click();check('Help opens from paused menu',!$('helpScreen').hidden);
  $('closeHelpButton').click();check('Help returns to paused menu',state.phase==='paused' && $('helpScreen').hidden);
  const scrollEvent=new Event('touchmove',{bubbles:true,cancelable:true});$('pauseScreen').dispatchEvent(scrollEvent);
  check('Pause menu can scroll',!scrollEvent.defaultPrevented);
  $('resumeButton').click();check('Resume returns to combat',state.phase==='playing');
  check('Both fighters have 320 health',state.game.fighters.every(f=>f.hp===320));
  const arenaRect=canvas.getBoundingClientRect(),appRect=$('gameApp').getBoundingClientRect();
  check('Arena fills viewport',Math.abs(arenaRect.width-window.innerWidth)<1 && Math.abs(arenaRect.height-window.innerHeight)<1);
  check('HUD stays under 60px',document.querySelector('.match-hud').getBoundingClientRect().height<60);
  check('No horizontal or vertical page overflow',document.documentElement.scrollWidth<=window.innerWidth && document.documentElement.scrollHeight<=window.innerHeight);
  check('Roster retains all 17 fighters',document.querySelectorAll('[data-fighter]').length===17);
  parent.postMessage({type:'mobile-results',results},location.origin);
});`;
await writeFile(base+'__qa-game.js', await readFile(base+'__qa-game.js','utf8')+fixture);
let runner=await readFile(base+'__qa-runner.html','utf8');
runner=runner.replace('<button id="direction">','<button data-size="844,326">Short landscape</button><button data-size="320,568">Small phone</button><button id="check-input">Check input rules</button><output id="checks"></output><button id="direction">');
runner=runner.replace('</script>',`document.querySelector('#check-input').onclick=()=>f.contentWindow.postMessage({type:'mobile-checks'},location.origin);window.addEventListener('message',e=>{if(e.data?.type==='mobile-results'){document.querySelector('#checks').textContent=e.data.results.filter(r=>!r.ok).length?'FAIL '+JSON.stringify(e.data.results.filter(r=>!r.ok)):'PASS '+e.data.results.length+' input and layout checks';}});</script>`);
await writeFile(base+'__qa-runner.html',runner);
