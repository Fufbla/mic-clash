import { DEMON_CREW, demonPose } from './demon.js';
import { ELEVATOR_DROP, cranesPose } from './cranes.js';
import { COW_MODE, moojaPose } from './mooja.js';
import { GIANT_FISTS, babyBigFistsPose, babyBigFistsSpeech } from './baby-big-fists.js';
import { CombatGame } from './combat.js?v=demon-munchy-20261121';
import { smackPrincePose, SMACK_UPGRADE } from './smack-prince.js';
import { cantRapPose, cantRapSpeech } from './cant-rap.js';

const $ = id => document.getElementById(id);
const META = {
  owl: { name: 'Owl Striker', special: 'Owl Strike', color: '#ffcf70', glow: 'rgba(255,190,75,.35)' },
  coupe: { name: 'Night Rider', special: 'Black Coupe', color: '#b6a0ff', glow: 'rgba(166,125,255,.35)' },
  karate: { name: 'Karate Fighter', hudName: 'Karate', special: 'Rapid Punches', color: '#6faaff', glow: 'rgba(65,135,255,.4)' },
  snitchy: { name: 'Snitchy', special: 'Call the Cops', color: '#ff72d2', glow: 'rgba(255,81,193,.4)' },
  getit: { name: 'Get It', special: 'Live Performance', color: '#ff6687', glow: 'rgba(255,70,125,.4)' },
  loudbull: { name: 'Loud Bull', special: 'Giant Yell', color: '#e0e7f2', glow: 'rgba(221,230,255,.4)' },
  fatboi: { name: 'FatBoi', special: 'Bite & Toss', color: '#ffab66', glow: 'rgba(255,158,69,.4)' },
  icespice: { name: 'Munchy', special: 'Munch', color: '#ff9748', glow: 'rgba(255,151,72,.4)' },
  hehaw: { name: 'HeHaw', special: 'Horse Power', color: '#e8e6ed', glow: 'rgba(225,222,239,.4)' },
  'dr-no-bunnies': { name: 'Dr. No Bunnies', hudName: 'Dr. No Bunnies', special: 'African Pride Belt Slap', color: '#70adff', glow: 'rgba(70,140,255,.4)' },
  demon: { name: 'Demon', special: 'The Crew', color: '#c18aff', glow: 'rgba(167,82,255,.4)' },
  cranes: { name: 'Cranes', special: 'Elevator Drop', color: '#ffafd6', glow: 'rgba(255,116,191,.4)' },
  mooja: { name: 'MooJa', special: 'Cow Mode: Milk Missiles', color: '#ff83cc', glow: 'rgba(255,98,201,.4)' },
  babybigfists: { name: 'Baby Big Fists', special: 'Giant Fists', color: '#49dcea', glow: 'rgba(105,65,255,.4)' },
  smackprince: { name: 'Smack Prince', special: 'The Smack Upgrade', color: '#bbf15a', glow: 'rgba(178,240,70,.4)' },
  cantrap: { name: "Can't Rap", special: 'Turban Crew Jump-In', color: '#ff7076', glow: 'rgba(255,80,90,.4)' }
};
const ROSTER = Object.keys(META);
const canvas = $('arena');
const ctx = canvas.getContext('2d');
const WORLD_W = 1280, WORLD_H = 720, GROUND = 548;
const state = { phase: 'select', selected: 'owl', opponent: 'coupe', assets: null, game: null, countdown: 0, resultDelay: 0, last: 0, time: 0, shake: 0, flash: 0, particles: [], labels: [], audio: false, pausedFrom: 'playing', ready: false, toastTimer: 0, cameraX: 640, cameraWidth: 1280 };
const held = new Set();
const pointers = new Map();
const pressed = { jumpPressed: false, punchPressed: false, kickPressed: false, specialPressed: false };
let jumpQueue = 0;
const frameCache = new Map();
const analogStick = $('analogStick'), analogKnob = $('analogKnob');
const analog = { pointerId: null, axis: 0 };

function resetAnalog() {
  const pointerId = analog.pointerId;
  analog.pointerId = null; analog.axis = 0;
  if (!analogStick) return;
  analogStick.style.setProperty('--stick-x', '0px');
  analogStick.style.setProperty('--stick-y', '0px');
  analogStick.classList.remove('is-active');
  analogStick.dataset.axis = '0';
  analogStick.setAttribute('aria-valuenow', '0');
  analogStick.setAttribute('aria-valuetext', 'Centered');
  if (pointerId !== null && analogStick.hasPointerCapture(pointerId)) analogStick.releasePointerCapture(pointerId);
}

function showToast(text, seconds = 2.2) {
  if (!$('toast')) return;
  $('toast').textContent = text;
  $('toast').hidden = false;
  state.toastTimer = seconds;
}
function clearInput() {
  const activePointers = [...pointers.keys()];
  held.clear(); pointers.clear(); resetAnalog(); jumpQueue = 0;
  Object.keys(pressed).forEach(k => pressed[k] = false);
  document.querySelectorAll('[data-control]').forEach(el => {
    el.classList.remove('is-held');
    for (const pointerId of activePointers) if (el.hasPointerCapture(pointerId)) el.releasePointerCapture(pointerId);
  });
}
function actionDown(action) {
  if (state.phase !== 'playing' || state.game?.roundEnding || state.game?.over || state.game?.fighters[0].grabbedBy || state.game?.fighters[0].beltHeldBy) return;
  const presenting = state.game.isPresenting(state.game.fighters[0]);
  if (presenting && (action === 'punch' || action === 'kick')) return;
  if (action === 'jump') jumpQueue = Math.min(2, jumpQueue + 1);
  if (action === 'punch') pressed.punchPressed = true;
  if (action === 'kick') pressed.kickPressed = true;
  if (action === 'special') {
    if (presenting) showToast(`${META[state.game.fighters[0].type].special} is still playing.`, 1.5);
    else if (state.game.fighters[0].meter < 100) showToast(['getit', 'dr-no-bunnies', 'smackprince', 'mooja'].includes(state.game.fighters[0].type) ? 'Land slaps and kicks to fill your special meter.' : 'Land punches and kicks to fill your special meter.', 1.5);
    else if (state.game.fighters[0].type === 'dr-no-bunnies' && (Math.abs(state.game.fighters[0].x - state.game.fighters[1].x) > 285 || Math.abs(state.game.fighters[0].y - state.game.fighters[1].y) > 112)) showToast('Move closer for the belt slap. Your full meter is saved.', 1.8);
    else if (state.game.fighters[0].type === 'smackprince' && (Math.abs(state.game.fighters[0].x - state.game.fighters[1].x) > SMACK_UPGRADE.range || Math.abs(state.game.fighters[0].y - state.game.fighters[1].y) > 112)) showToast('Move closer for The Smack Upgrade. Your full meter is saved.', 1.8);
    else if (state.game.fighters[0].type === 'babybigfists' && (Math.abs(state.game.fighters[0].x - state.game.fighters[1].x) > GIANT_FISTS.range || Math.abs(state.game.fighters[0].y - state.game.fighters[1].y) > 112)) showToast('Move closer for Giant Fists. Your full meter is saved.', 1.8);
    else { pressed.specialPressed = true; state.specialBuffer = .65; }
  }
}

class Sound {
  constructor() { this.context = null; this.nextBeat = 0; this.beat = 0; this.shouts = new Map(); }
  enable(on) {
    if (on) {
      this.context ||= new (window.AudioContext || window.webkitAudioContext)();
      this.context.resume().catch(() => {});
      this.nextBeat = this.context.currentTime + .1;
    }
    else this.stopYells();
  }
  tone(freq, end, duration, gain = .04, type = 'sine') {
    if (!state.audio || !this.context) return;
    const c = this.context, t = c.currentTime;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, end), t + duration);
    g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(.0001, t + duration);
    o.connect(g).connect(c.destination); o.start(t); o.stop(t + duration + .02);
  }
  noise(duration = .07, gain = .035) {
    if (!state.audio || !this.context) return;
    const c = this.context, n = Math.floor(c.sampleRate * duration), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = c.createBufferSource(), g = c.createGain(); s.buffer = b; g.gain.value = gain;
    s.connect(g).connect(c.destination); s.start();
  }
  hit(heavy, blocked) { this.noise(blocked ? .035 : .08, blocked ? .02 : .055); this.tone(heavy ? 100 : 155, 38, .14, .07, 'triangle'); }
  slap(blocked) { this.noise(blocked ? .025 : .055, blocked ? .025 : .075); this.tone(410, 130, .06, .035, 'triangle'); }
  mmm(number) {
    if (!state.audio || !this.context) return;
    // An original closed-mouth arcade hum, synchronized with each punch.
    const c = this.context, t = c.currentTime, length = .28;
    const voice = c.createOscillator(), nasal = c.createBiquadFilter(), volume = c.createGain();
    voice.type = 'triangle'; voice.frequency.setValueAtTime(number === 2 ? 125 : 138, t);
    voice.frequency.exponentialRampToValueAtTime(100, t + length);
    nasal.type = 'lowpass'; nasal.frequency.value = 650; nasal.Q.value = 2.4;
    volume.gain.setValueAtTime(.0001, t); volume.gain.linearRampToValueAtTime(.16, t + .035);
    volume.gain.setValueAtTime(.13, t + .18); volume.gain.exponentialRampToValueAtTime(.0001, t + length);
    voice.connect(nasal).connect(volume).connect(c.destination); voice.start(t); voice.stop(t + length + .02);
  }
  bite() { this.noise(.095, .045); this.tone(185, 70, .08, .035, 'triangle'); }
  munch(index = 0) {
    this.noise(.065, .05);
    this.tone(240 - index * 23, 65, .115, .045, 'triangle');
    this.tone(670, 310, .045, .018, 'square');
  }
  wingThrow() { this.noise(.07, .022); this.tone(420, 155, .17, .025, 'triangle'); }
  hoof() {
    if (!state.audio || !this.context) return;
    const c = this.context, t = c.currentTime;
    for (const [delay, frequency] of [[0, 135], [.045, 190]]) {
      const hoof = c.createOscillator(), gain = c.createGain();
      hoof.type = 'triangle'; hoof.frequency.setValueAtTime(frequency, t + delay);
      hoof.frequency.exponentialRampToValueAtTime(48, t + delay + .075);
      gain.gain.setValueAtTime(.045, t + delay);
      gain.gain.exponentialRampToValueAtTime(.0001, t + delay + .09);
      hoof.connect(gain).connect(c.destination); hoof.start(t + delay); hoof.stop(t + delay + .10);
    }
    this.noise(.025, .012);
  }
  sing(index, final) {
    if (!state.audio || !this.context) return;
    const c = this.context, t = c.currentTime, length = final ? .44 : .23;
    const pitch = [349.23, 440, 523.25, 698.46][index] || 523.25;
    const voice = c.createOscillator(), volume = c.createGain();
    voice.type = 'sawtooth'; voice.frequency.setValueAtTime(pitch * .97, t);
    voice.frequency.exponentialRampToValueAtTime(pitch, t + .06);
    // Three vowel resonances turn the musical note into an original wordless "ah".
    for (const [frequency, weight] of [[850, .65], [1250, .32], [2700, .14]]) {
      const formant = c.createBiquadFilter(), level = c.createGain();
      formant.type = 'bandpass'; formant.frequency.value = frequency; formant.Q.value = 6;
      level.gain.value = weight; voice.connect(formant); formant.connect(level); level.connect(volume);
    }
    const vibrato = c.createOscillator(), depth = c.createGain();
    vibrato.frequency.value = 5.5; depth.gain.value = final ? 5 : 2.5;
    vibrato.connect(depth); depth.connect(voice.frequency);
    volume.gain.setValueAtTime(.0001, t); volume.gain.linearRampToValueAtTime(.13, t + .025);
    volume.gain.setValueAtTime(.11, t + length * .65); volume.gain.exponentialRampToValueAtTime(.0001, t + length);
    volume.connect(c.destination); voice.start(t); vibrato.start(t); voice.stop(t + length + .02); vibrato.stop(t + length + .02);
  }
  yell(fighter, pitch = 122, length = .8) {
    if (!state.audio || !this.context) return;
    this.stopYell(fighter);
    const c = this.context, t = c.currentTime;
    const volume = c.createGain(), voice = c.createOscillator();
    // An original wordless arcade shout, independent of any recorded person's voice.
    voice.type = 'sawtooth'; voice.frequency.setValueAtTime(pitch, t);
    voice.frequency.exponentialRampToValueAtTime(pitch * 168 / 122, t + .13);
    voice.frequency.exponentialRampToValueAtTime(pitch * 112 / 122, t + length);
    for (const [frequency, weight] of [[800, .6], [1200, .34], [2600, .14]]) {
      const formant = c.createBiquadFilter(), level = c.createGain();
      formant.type = 'bandpass'; formant.frequency.value = frequency; formant.Q.value = 4;
      level.gain.value = weight; voice.connect(formant); formant.connect(level); level.connect(volume);
    }
    const tremor = c.createOscillator(), depth = c.createGain();
    tremor.frequency.value = 24; depth.gain.value = 4;
    tremor.connect(depth); depth.connect(voice.frequency);
    volume.gain.setValueAtTime(.0001, t); volume.gain.linearRampToValueAtTime(.17, t + .045);
    volume.gain.setValueAtTime(.14, t + length * .72); volume.gain.exponentialRampToValueAtTime(.0001, t + length);
    volume.connect(c.destination); voice.start(t); tremor.start(t);
    voice.stop(t + length + .02); tremor.stop(t + length + .02);
    this.shouts.set(fighter, { volume, nodes: [voice, tremor] });
    this.tone(84, 40, .28, .04, 'triangle');
  }
  stopYell(fighter) {
    const shout = this.shouts.get(fighter);
    if (!shout) return;
    const t = this.context.currentTime;
    shout.volume.gain.cancelScheduledValues(t);
    shout.volume.gain.setTargetAtTime(.0001, t, .008);
    for (const node of shout.nodes) { try { node.stop(t + .04); } catch {} }
    this.shouts.delete(fighter);
  }
  stopYells() { for (const fighter of this.shouts.keys()) this.stopYell(fighter); }
  siren() {
    if (!state.audio || !this.context) return;
    const c = this.context, t = c.currentTime;
    const o = c.createOscillator(), g = c.createGain();
    o.type = 'triangle'; o.frequency.setValueAtTime(620, t);
    for (let i = 1; i <= 4; i++) o.frequency.linearRampToValueAtTime(i % 2 ? 920 : 620, t + i * .16);
    g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(.035, t + .04); g.gain.exponentialRampToValueAtTime(.0001, t + .74);
    o.connect(g).connect(c.destination); o.start(t); o.stop(t + .75);
  }
  tick() {
    if (!state.audio || !this.context || state.phase !== 'playing') return;
    if (this.context.currentTime < this.nextBeat) return;
    this.nextBeat = this.context.currentTime + .3;
    if (this.beat % 2 === 0) this.tone(105, 36, .13, .028);
    if (this.beat % 4 === 2) this.noise(.06, .015);
    this.tone(5200, 1900, .022, .006, 'square');
    if (this.beat % 4 === 0) this.tone([65.41, 65.41, 77.78, 58.27][Math.floor(this.beat / 4) % 4], 55, .22, .014, 'triangle');
    this.beat++;
  }
}
const sound = new Sound();

async function loadAssets() {
  const response = await fetch(new URL('./assets/atlas.json?v=demon-munchy-20261121', import.meta.url));
  if (!response.ok) throw new Error('The sprite map could not be loaded.');
  const atlas = await response.json();
  await Promise.all(Object.values(atlas).filter(v => v && v.src).map(async entry => {
    const img = new Image(); img.decoding = 'async';
    await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; img.src = new URL(entry.src, import.meta.url).href; });
    entry.image = img;
  }));
  state.assets = atlas;
  state.ready = true;
  $('startFight').disabled = false;
  $('startFight').textContent = 'Start fight';
  renderPortraits();
}

function frame(asset, index) {
  if (!state.assets?.[asset]) return null;
  const key = `${asset}:${index}`;
  if (frameCache.has(key)) return frameCache.get(key);
  const entry = state.assets[asset];
  const spec = typeof index === 'string' && index.startsWith('single:') ? entry.singles?.[Number(index.split(':')[1])] : entry.frames[index];
  if (!spec) return null;
  const c = document.createElement('canvas'); c.width = Math.max(1, spec.w); c.height = Math.max(1, spec.h);
  const g = c.getContext('2d', { willReadFrequently: true });
  g.drawImage(entry.image, spec.x, spec.y, spec.w, spec.h, 0, 0, spec.w, spec.h);
  const pixels = g.getImageData(0, 0, c.width, c.height);
  // Sprite compositing: discard nearly transparent matte pixels at render time.
  const threshold = asset === 'owls' ? 18 : 35;
  let footLeft = c.width, footRight = 0, bottom = 0;
  for (let i = 0; i < pixels.data.length; i += 4) {
    const a = pixels.data[i + 3];
    if (a < threshold) pixels.data[i + 3] = 0;
    else if (a > 245) pixels.data[i + 3] = 255;
    if (a > 130) {
      const p = i / 4, y = Math.floor(p / c.width), x = p % c.width;
      bottom = Math.max(bottom, y);
      if (y > c.height * .88) { footLeft = Math.min(footLeft, x); footRight = Math.max(footRight, x); }
    }
  }
  g.putImageData(pixels, 0, 0);
  const item = { image: c, w: c.width, h: c.height, anchorX: spec.anchorX ?? (footLeft <= footRight ? (footLeft + footRight) / 2 : c.width / 2), anchorY: spec.anchorY ?? bottom + 1 };
  frameCache.set(key, item);
  return item;
}

function renderPortraits() {
  document.querySelectorAll('[data-portrait]').forEach(c => {
    const g = c.getContext('2d'), type = c.dataset.portrait, f = frame(type, 0);
    if (!f) return;
    g.clearRect(0, 0, c.width, c.height);
    const scale = Math.min((c.height - 16) / f.h, (c.width - 10) / f.w);
    g.save(); g.shadowColor = META[type].glow; g.shadowBlur = 22;
    g.drawImage(f.image, (c.width - f.w * scale) / 2, c.height - f.h * scale - 3, f.w * scale, f.h * scale); g.restore();
  });
}

function selectFighter(type) {
  if (!META[type]) return;
  state.selected = type;
  document.querySelectorAll('[data-fighter]').forEach(el => {
    const selected = el.dataset.fighter === type;
    el.classList.toggle('selected', selected); el.classList.toggle('is-selected', selected); el.setAttribute('aria-pressed', String(selected));
  });
  const p = $('selectedName'); if (p) p.textContent = META[type].name;
  if (!META[state.opponent] || state.opponent === type) state.opponent = ROSTER.find(other => other !== type);
  const opponentSelect = $('opponentSelect');
  if (opponentSelect) {
    for (const option of opponentSelect.options) {
      option.hidden = option.value === type;
      option.disabled = option.value === type;
    }
    opponentSelect.value = state.opponent;
  }
}
function setPhase(phase) {
  if (['select', 'paused', 'result'].includes(phase)) sound.stopYells();
  state.phase = phase; state.accumulator = 0; state.specialBuffer = 0; canvas.dataset.phase = phase;
  document.body.dataset.phase = phase;
  $('selectionScreen').hidden = phase !== 'select';
  $('resultScreen').hidden = phase !== 'result';
  if ($('pauseScreen')) $('pauseScreen').hidden = phase !== 'paused';
  if ($('helpScreen')) $('helpScreen').hidden = true;
  if ($('pauseButton')) $('pauseButton').disabled = !['playing', 'countdown', 'paused'].includes(phase);
  analogStick?.setAttribute('aria-disabled', String(phase !== 'playing'));
  clearInput();
}
function startFight() {
  if (!state.ready) return;
  state.game = new CombatGame(state.selected, state.opponent);
  const opponent = state.game.fighters[1].type;
  state.cameraX = 640; state.cameraWidth = 1280;
  document.documentElement.style.setProperty('--p1-accent', META[state.selected].color);
  document.documentElement.style.setProperty('--p2-accent', META[opponent].color);
  state.particles = []; state.labels = []; state.resultDelay = 0; state.countdown = 2.8; state.shake = 0;
  $('p1Name').textContent = META[state.selected].hudName || META[state.selected].name;
  $('p2Name').textContent = META[opponent].hudName || META[opponent].name;
  const slaps = ['getit', 'dr-no-bunnies', 'smackprince', 'mooja'].includes(state.selected);
  const mic = state.selected === 'cantrap';
  document.querySelector('[data-control="punch"]')?.setAttribute('aria-label', mic ? 'Microphone strike. Keyboard J.' : slaps ? 'Open-hand slap. Keyboard J.' : 'Punch. Keyboard J.');
  document.querySelector('[data-control="punch"] .control-label').textContent = mic ? 'MIC HIT' : slaps ? 'SLAP' : 'PUNCH';
  setPhase('countdown');
  $('phaseText').textContent = 'Get ready';
  updateHUD();
  if (state.audio) sound.enable(true);
}
function showSelection() {
  state.game = null; state.particles = []; state.labels = [];
  setPhase('select'); $('phaseText').textContent = 'Choose your fighter';
  if ($('toast')) $('toast').hidden = true;
}
function pause() {
  if (state.phase === 'paused') { setPhase(state.pausedFrom); $('phaseText').textContent = 'Round 1'; return; }
  if (!['playing', 'countdown'].includes(state.phase)) return;
  state.pausedFrom = state.phase; setPhase('paused'); $('phaseText').textContent = 'Paused';
}
function showResults() {
  const winner = state.game.winner;
  $('resultTitle').textContent = winner === 'draw' ? 'Draw!' : winner === 'p1' ? 'You win!' : 'Round lost';
  const won = state.game.fighters.find(f => f.id === winner);
  $('resultMessage').textContent = won ? `${META[won.type].name} takes the round. Ready for a rematch?` : 'Both fighters held their ground. Run it back.';
  setPhase('result'); $('phaseText').textContent = 'Round complete';
}

document.querySelectorAll('[data-fighter]').forEach(el => el.addEventListener('click', () => selectFighter(el.dataset.fighter)));
$('opponentSelect')?.addEventListener('change', event => {
  const type = event.target.value;
  if (META[type] && type !== state.selected) state.opponent = type;
});
$('startFight').disabled = true; $('startFight').textContent = 'Loading fighters…';
$('startFight').addEventListener('click', startFight);
$('rematchButton').addEventListener('click', startFight);
$('changeFighterButton').addEventListener('click', showSelection);
$('backButton')?.addEventListener('click', showSelection);
$('pauseButton')?.addEventListener('click', pause);
$('resumeButton')?.addEventListener('click', pause);
$('restartButton')?.addEventListener('click', startFight);
$('selectButton')?.addEventListener('click', showSelection);
$('soundButton')?.addEventListener('click', () => {
  try { state.audio = !state.audio; sound.enable(state.audio); }
  catch { state.audio = false; showToast('Sound is unavailable in this browser.'); }
  $('soundButton').setAttribute('aria-pressed', String(state.audio));
  $('soundButton').textContent = state.audio ? 'Sound on' : 'Sound off';
});
$('helpButton')?.addEventListener('click', () => {
  if (state.phase === 'playing' || state.phase === 'countdown') pause();
  if ($('helpScreen')) $('helpScreen').hidden = false;
});
$('closeHelpButton')?.addEventListener('click', () => { $('helpScreen').hidden = true; });

const KEYMAP = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', ArrowUp: 'jump', KeyW: 'jump', Space: 'jump', KeyJ: 'punch', KeyK: 'kick', KeyL: 'special', KeyB: 'block' };
window.addEventListener('keydown', event => {
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName)) return;
  if (event.code === 'Escape' || event.code === 'KeyP') { if (!event.repeat) pause(); event.preventDefault(); return; }
  const control = KEYMAP[event.code]; if (!control) return;
  if (state.phase !== 'select') event.preventDefault();
  held.add(event.code);
  if (!event.repeat) actionDown(control);
});
window.addEventListener('keyup', event => { held.delete(event.code); });
document.querySelectorAll('[data-control]').forEach(button => {
  button.addEventListener('pointerdown', event => {
    event.preventDefault(); if (button.disabled || state.phase !== 'playing') return;
    pointers.set(event.pointerId, button.dataset.control); button.setPointerCapture(event.pointerId); button.classList.add('is-held');
    actionDown(button.dataset.control);
  });
  const release = event => {
    pointers.delete(event.pointerId);
    button.classList.toggle('is-held', [...pointers.values()].includes(button.dataset.control));
  };
  button.addEventListener('pointerup', release); button.addEventListener('pointercancel', release); button.addEventListener('lostpointercapture', release);
  button.addEventListener('contextmenu', event => event.preventDefault());
});
function controlHeld(name) {
  return [...held].some(code => KEYMAP[code] === name) || [...pointers.values()].includes(name);
}
function movementAxis() {
  const left = controlHeld('left'), right = controlHeld('right');
  return left || right ? Number(right) - Number(left) : analog.axis;
}
function moveAnalog(event) {
  if (event.pointerId !== analog.pointerId) return;
  const rect = analogStick.getBoundingClientRect();
  const knobSize = analogKnob?.getBoundingClientRect().width || rect.width * .44;
  const travel = Math.max(1, (Math.min(rect.width, rect.height) - knobSize) / 2 - 8);
  let x = event.clientX - rect.left - rect.width / 2;
  let y = event.clientY - rect.top - rect.height / 2;
  const distance = Math.hypot(x, y);
  if (distance > travel) { x *= travel / distance; y *= travel / distance; }
  // A small center dead zone prevents unintended movement under a resting thumb.
  const raw = x / travel, strength = Math.max(0, (Math.abs(raw) - .16) / .84);
  analog.axis = Math.sign(raw) * Math.min(1, strength);
  analogStick.style.setProperty('--stick-x', `${x}px`);
  analogStick.style.setProperty('--stick-y', `${y}px`);
  analogStick.dataset.axis = analog.axis.toFixed(3);
  analogStick.setAttribute('aria-valuenow', String(Math.round(analog.axis * 100)));
  analogStick.setAttribute('aria-valuetext', analog.axis ? `${analog.axis < 0 ? 'Left' : 'Right'} ${Math.round(Math.abs(analog.axis) * 100)} percent` : 'Centered');
}
analogStick?.addEventListener('pointerdown', event => {
  event.preventDefault();
  if (state.phase !== 'playing' || analog.pointerId !== null || state.game?.fighters[0].grabbedBy) return;
  analog.pointerId = event.pointerId;
  analogStick.setPointerCapture(event.pointerId);
  analogStick.classList.add('is-active');
  moveAnalog(event);
});
analogStick?.addEventListener('pointermove', event => {
  if (event.pointerId !== analog.pointerId) return;
  event.preventDefault(); moveAnalog(event);
});
for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
  analogStick?.addEventListener(type, event => { if (event.pointerId === analog.pointerId) resetAnalog(); });
}
analogStick?.addEventListener('contextmenu', event => event.preventDefault());
window.addEventListener('blur', () => { clearInput(); if (['playing', 'countdown'].includes(state.phase)) pause(); });
document.addEventListener('visibilitychange', () => { if (document.hidden) { clearInput(); if (['playing', 'countdown'].includes(state.phase)) pause(); } });

function resize() {
  const rect = canvas.getBoundingClientRect(); const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const w = Math.round(Math.max(1, rect.width) * ratio), h = Math.round(Math.max(1, rect.height) * ratio);
  if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
}
new ResizeObserver(resize).observe(canvas);
let viewportQueued = false;
function syncViewport() {
  if (viewportQueued) return;
  viewportQueued = true;
  requestAnimationFrame(() => {
    viewportQueued = false;
    const viewport = window.visualViewport;
    const width = viewport?.width || window.innerWidth;
    const height = viewport?.height || window.innerHeight;
    const orientation = width > height ? 'landscape' : 'portrait';
    const root = document.documentElement;
    if (root.dataset.orientation && root.dataset.orientation !== orientation) clearInput();
    root.dataset.orientation = orientation;
    root.style.setProperty('--viewport-height', `${height}px`);
    resize();
    if (state.phase === 'select') document.querySelector('[data-fighter][aria-pressed="true"]')?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  });
}
window.addEventListener('resize', syncViewport);
window.visualViewport?.addEventListener('resize', syncViewport);
window.screen.orientation?.addEventListener('change', syncViewport);
syncViewport();

function updateHUD() {
  if (!state.game) return;
  const [p1, p2] = state.game.fighters;
  for (const [i, f] of [[1, p1], [2, p2]]) {
    const hp = Math.max(0, f.hp);
    $(`p${i}Health`).style.width = `${hp / f.maxHp * 100}%`;
    $(`p${i}Health`).setAttribute('aria-valuenow', String(Math.ceil(hp)));
    $(`p${i}Health`).setAttribute('aria-valuemax', String(f.maxHp));
    $(`p${i}Meter`).style.width = `${Math.min(100, f.meter)}%`;
    $(`p${i}HpText`).textContent = `${Math.ceil(hp)} / ${f.maxHp}`;
    const active = state.game.isPresenting(f);
    $(`p${i}MeterText`).textContent = active ? 'ACTIVE' : f.meter >= 100 ? 'READY' : `${Math.floor(f.meter)}%`;
    $(`p${i}Meter`).classList.toggle('ready', f.meter >= 100 && !active);
  }
  $('roundClock').textContent = Math.max(0, Math.ceil(state.game.timeRemaining)).toString().padStart(2, '0');
  const specialActive = state.game.isPresenting(p1);
  const ending = !!state.game.roundEnding || state.game.over;
  const grabbed = Boolean(p1.grabbedBy || p1.beltHeldBy);
  document.querySelectorAll('[data-control]').forEach(button => {
    button.disabled = ending || grabbed || state.phase !== 'playing'
      || (specialActive && ['punch', 'kick', 'special'].includes(button.dataset.control));
  });
  analogStick?.setAttribute('aria-disabled', String(ending || grabbed || state.phase !== 'playing'));
  $('specialButton').disabled = p1.meter < 100 || specialActive || ending || grabbed || state.phase !== 'playing';
  $('specialButton').classList.toggle('ready', p1.meter >= 100 && !specialActive);
  $('specialButton').setAttribute('aria-label', specialActive ? `${META[p1.type].special} is active. Cannot be interrupted.` : p1.meter >= 100 ? `Use ${META[p1.type].special}` : `Special charging: ${Math.floor(p1.meter)} percent. Land hits to charge.`);
  if (state.game.roundEnding && state.phase === 'playing') $('phaseText').textContent = state.game.over ? 'Round complete' : 'Finishing special…';
  canvas.dataset.playerProtected = String(specialActive);
  canvas.dataset.opponentProtected = String(state.game.isPresenting(p2));
  canvas.dataset.roundEnding = state.game.roundEnding ? (state.game.roundEnding.timedOut ? 'timeout' : 'ko') : 'none';
  canvas.dataset.playerHealth = Math.round(p1.hp); canvas.dataset.opponentHealth = Math.round(p2.hp); canvas.dataset.specialMeter = Math.floor(p1.meter);
  canvas.dataset.playerType = p1.type; canvas.dataset.opponentType = p2.type;
  canvas.dataset.playerAction = p1.state;
  canvas.dataset.playerOutfit = p1.type === 'karate' && p1.state === 'special' ? 'karate-gi' : 'street';
  canvas.dataset.playerFlip = p1.flipRemaining > 0 ? p1.flipProgress.toFixed(2) : 'none';
  const playerFlipFrame = flipFrameIndex(p1), opponentFlipFrame = flipFrameIndex(p2);
  canvas.dataset.playerFlipFrame = playerFlipFrame < 0 ? 'none' : String(playerFlipFrame);
  canvas.dataset.opponentFlipFrame = opponentFlipFrame < 0 ? 'none' : String(opponentFlipFrame);
  canvas.dataset.playerJumps = p1.jumps;
  const backup = state.game.specials.find(s => s.kind === 'backup');
  canvas.dataset.policePhase = backup?.phase || 'none';
  canvas.dataset.policeOwner = backup?.owner || 'none';
  canvas.dataset.policeCar = backup?.car?.visible ? backup.car.phase : 'none';
  canvas.dataset.policeOfficers = String(backup?.officers?.filter(o => o.visible).length || 0);
  canvas.dataset.policeHits = String(backup?.hitCount || 0);
  const vocal = state.game.specials.find(s => s.kind === 'vocal');
  canvas.dataset.vocalPhase = vocal?.phase || 'none';
  canvas.dataset.vocalOwner = vocal?.owner || 'none';
  canvas.dataset.vocalWaves = String(vocal?.waves?.filter(w => w.active).length || 0);
  canvas.dataset.vocalHits = String(vocal?.hitCount || 0);
  const yell = state.game.specials.find(s => s.kind === 'yell');
  canvas.dataset.yellPhase = yell?.phase || 'none';
  canvas.dataset.yellOwner = yell?.owner || 'none';
  canvas.dataset.yellPulses = String(yell?.pulseIndex || 0);
  canvas.dataset.yellHits = String(yell?.hitCount || 0);
  const wing = state.game.specials.find(s => s.kind === 'wing');
  canvas.dataset.wingPhase = wing?.phase || 'none';
  canvas.dataset.wingOwner = wing?.owner || 'none';
  canvas.dataset.wingProjectile = wing?.projectile?.active ? 'flying' : 'none';
  canvas.dataset.wingHits = String(wing?.hitCount || 0);
  const munch = state.game.specials.find(s => s.kind === 'munch');
  canvas.dataset.munchPhase = munch?.phase || 'none';
  canvas.dataset.munchOwner = munch?.owner || 'none';
  canvas.dataset.munchTarget = munch?.grabbed ? munch.targetId : 'none';
  canvas.dataset.munchBites = String(munch?.biteIndex || 0);
  canvas.dataset.munchHits = String(munch?.hitCount || 0);
  const horse = state.game.specials.find(s => s.kind === 'horse');
  canvas.dataset.horsePhase = horse?.phase || 'none';
  canvas.dataset.horseOwner = horse?.owner || 'none';
  canvas.dataset.horseVisible = String(!!horse?.horse?.visible);
  canvas.dataset.horseFrame = horse?.horse?.visible ? String(horse.horse.frame ?? horse.horse.spriteIndex ?? 0) : 'none';
  canvas.dataset.horseHits = String(horse?.hitCount || 0);
  const belt = state.game.specials.find(s => s.kind === 'belt');
  canvas.dataset.beltPhase = belt?.phase || 'none';
  canvas.dataset.beltStrikes = String(belt?.strikeIndex || 0);
  canvas.dataset.beltHits = String(belt?.hitCount || 0);
  canvas.dataset.beltOwner = belt?.owner || 'none';
  const crew = state.game.specials.find(s => s.kind === 'crew');
  canvas.dataset.crewPhase = crew?.phase || 'none';
  canvas.dataset.crewOwner = crew?.owner || 'none';
  canvas.dataset.crewVisible = String(crew?.crew?.filter(k => k.visible).length || 0);
  canvas.dataset.crewHits = String(crew?.hitCount || 0);
  const masked = state.game.specials.find(s => s.kind === 'maskedCrew');
  canvas.dataset.demonPhase = masked?.phase || 'none';
  canvas.dataset.demonStrikes = String(masked?.strikeIndex || 0);
  canvas.dataset.demonHits = String(masked?.hitCount || 0);
  canvas.dataset.demonVisible = String(masked?.crew.filter(k => k.visible).length || 0);
  canvas.dataset.demonEntries = masked?.crew.filter(k => k.visible).map(k => k.entry).join(',') || '';
  canvas.dataset.demonLookAway = String(!!masked && demonSprite(state.game.fighters.find(f => f.id === masked.owner)).lookAway);
  const elevator = state.game.specials.find(s => s.kind === 'elevator');
  canvas.dataset.elevatorPhase = elevator?.phase || 'none';
  canvas.dataset.elevatorHits = String(elevator?.hitCount || 0);
  canvas.dataset.elevatorBottom = String(elevator?.bottom ?? -1);
  canvas.dataset.elevatorTarget = String(elevator?.x ?? -1);
  const milk = state.game.specials.find(s => s.kind === 'milk');
  canvas.dataset.milkShots = String(milk?.shotIndex || 0);
  canvas.dataset.milkHits = String(milk?.hitCount || 0);
  canvas.dataset.milkFlying = String(milk?.missiles.filter(p => p.active).length || 0);
  const giantFists = state.game.specials.find(s => s.kind === 'giantFists');
  canvas.dataset.giantFistsPunch = String(giantFists?.punchIndex || 0);
  canvas.dataset.giantFistsHits = String(giantFists?.hitCount || 0);
  canvas.dataset.giantFistsSpeech = babyBigFistsSpeech(giantFists);
  const spotlight = state.game.specials.find(s => s.kind === 'spotlight');
  canvas.dataset.spotlightPhase = spotlight?.phase || 'none';
  canvas.dataset.spotlightHits = String(spotlight?.hitCount || 0);
  canvas.dataset.crewSpeech = cantRapSpeech(crew);
  const explosion = state.game.effects.find(e => e.kind === 'vocalExplosion');
  canvas.dataset.vocalExplosion = explosion ? String(Math.min(7, Math.floor(explosion.age / explosion.duration * 8))) : 'none';
  canvas.dataset.playerAttackStyle = p1.attack?.style || p1.attack?.kind || 'none';
  const customPose = p1.type === 'demon' ? demonSprite(p1) : p1.type === 'cranes' ? cranesSprite(p1) : p1.type === 'mooja' ? moojaSprite(p1) : p1.type === 'babybigfists' ? bigFistsSprite(p1) : p1.type === 'smackprince' ? princeSprite(p1) : p1.type === 'dr-no-bunnies' ? noBunniesSprite(p1) : p1.type === 'getit' ? getItSprite(p1) : p1.type === 'loudbull' ? loudBullSprite(p1) : p1.type === 'fatboi' ? fatBoiSprite(p1) : p1.type === 'icespice' ? iceSpiceSprite(p1) : p1.type === 'hehaw' ? hehawSprite(p1) : p1.type === 'cantrap' ? cantRapSprite(p1) : null;
  canvas.dataset.playerSprite = customPose?.key || p1.type;
  canvas.dataset.playerSpriteFrame = customPose ? String(customPose.index) : String(poseIndex(p1));
}

function particleBurst(x, y, color, count = 10, force = 180) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    state.particles.push({ x, y, vx: Math.cos(angle) * force * (.4 + Math.random()), vy: Math.sin(angle) * force, life: .35 + Math.random() * .3, max: .65, color, size: 2 + Math.random() * 5 });
  }
}
function processEvents() {
  for (const event of state.game.drainEvents()) {
    if (event.type === 'hit') {
      const target = state.game.fighters.find(f => f.id === event.defender);
      const x = Number.isFinite(event.x) ? event.x : target?.x ?? 640;
      const y = GROUND - (target?.y || 0) - 110;
      state.shake = Math.max(state.shake, event.blocked ? 2 : event.heavy ? 8 : 4);
      particleBurst(x, y, event.blocked ? '#9de9ff' : event.kind === 'yell' ? '#e2ebff' : event.kind === 'vocal' ? '#ff7ec9' : event.kind === 'barrage' ? '#96c9ff' : '#ffd78e', event.blocked ? 5 : event.kind === 'barrage' ? 7 : 13, event.heavy ? 240 : 170);
      state.labels.push({ x, y: y - 35, text: event.blocked ? 'BLOCK' : `${event.damage}`, color: event.blocked ? '#a8edff' : event.kind === 'yell' ? '#f2f5ff' : event.kind === 'vocal' ? '#ffd4f4' : event.kind === 'barrage' ? '#b8ddff' : '#fff2d7', life: event.kind === 'barrage' ? .38 : .75 });
      if (event.style === 'slap') sound.slap(event.blocked); else sound.hit(event.heavy, event.blocked);
    }
    if (event.type === 'meterReady' && event.fighter === 'p1') { showToast(`${META[state.game.fighters[0].type].special} ready — use SPECIAL!`, 3); sound.tone(440, 880, .25, .04, 'triangle'); }
    if (event.type === 'special') {
      const fighter = state.game.fighters.find(f => f.id === event.fighter);
      const meta = META[fighter?.type || 'owl'];
      state.flash = .18; state.shake = 6;
      // Can’t Rap announces the move in his own speech bubble, including on
      // short landscape screens where a second banner would cover the call.
      if (event.kind !== 'crew') state.labels.push({ x: 640, y: 175, text: meta.special.toUpperCase(), color: meta.color, life: 1.2, big: true });
      if (!['vocal', 'yell', 'wing', 'munch', 'horse', 'elevator'].includes(event.kind)) sound.tone(event.kind === 'car' ? 75 : event.kind === 'barrage' ? 300 : 440, event.kind === 'car' ? 210 : event.kind === 'barrage' ? 650 : 100, .65, .07, 'sawtooth');
      if (event.kind === 'backup') sound.siren();
    }
    if (event.type === 'maskedEnter') sound.noise(.20, .035);
    if (event.type === 'maskedStrike' && event.impact) {
      particleBurst(event.x, GROUND - event.y, '#cc9bff', event.final ? 22 : 6, event.final ? 260 : 135);
      if (event.final) { state.shake = Math.max(state.shake, 12); sound.hit(true, false); }
    }
    if (event.type === 'cranesShout') { sound.yell(event.fighter, 235, 1.1); state.shake = Math.max(state.shake, 3); }
    if (event.type === 'elevatorHit') particleBurst(event.x, GROUND - event.y, '#ffd1e9', 16, 210);
    if (event.type === 'elevatorLand') {
      particleBurst(event.x, GROUND, '#d7c9e2', 24, 310);
      sound.noise(.26, .075); sound.tone(90, 28, .38, .10, 'triangle');
      sound.tone(720, 280, .16, .025, 'square'); state.shake = Math.max(state.shake, 13);
    }
    if (event.type === 'milkShot') {
      sound.noise(.09, .025); sound.tone(430, 180, .11, .035, 'sine');
    }
    if (event.type === 'milkImpact') {
      particleBurst(event.x, GROUND - event.y, '#f5fbff', event.final ? 18 : 10, event.final ? 230 : 150);
      sound.noise(.12, .04);
      if (event.final) state.shake = Math.max(state.shake, 9);
    }
    if (event.type === 'giantPunch') {
      sound.mmm(event.number);
      if (event.impact) {
        state.shake = Math.max(state.shake, event.final ? 14 : 8);
        particleBurst(event.x, GROUND - event.y, event.final ? '#bd8aff' : '#57f0ff', event.final ? 25 : 16, event.final ? 290 : 200);
      }
    }
    if (event.type === 'suitUp') sound.tone(523, 1046, .22, .04, 'triangle');
    if (event.type === 'royalSmack' && event.connected) {
      sound.slap(false); state.shake = Math.max(state.shake, 12);
      particleBurst(event.x, GROUND - event.y, '#f3f68c', 22, 260);
      state.labels.push({ x: event.x, y: GROUND - event.y - 48, text: 'SMACK!', color: '#e8ff94', life: .65 });
    }
    if (event.type === 'crewStrike' && event.connected) {
      state.shake = Math.max(state.shake, event.final ? 10 : 3);
      particleBurst(event.x, GROUND - event.y, event.final ? '#ffe27a' : '#ff8085', event.final ? 18 : 7, event.final ? 220 : 100);
    }
    if (event.type === 'vocalWave') sound.sing(event.index, event.final);
    if (event.type === 'beltStrike') {
      state.labels = state.labels.filter(label => label.text !== 'LASHES!');
      state.labels.push({ x: event.x, y: GROUND - event.y - 105,
        text: 'LASHES!', color: '#ffd76a', life: .56, lash: true });
      state.shake = Math.max(state.shake, event.final ? 12 : 7);
      particleBurst(event.x, GROUND - event.y, event.final ? '#ffd76a' : '#72e6a4', 16, 200);
      sound.slap(false); sound.tone(event.final ? 140 : 220, 55, .12, .05, 'sawtooth');
    }
    if (event.type === 'yellStart') { sound.yell(event.fighter); state.shake = Math.max(state.shake, 5); }
    if (event.type === 'yellEnd') sound.stopYell(event.fighter);
    if (event.type === 'yellPulse') state.shake = Math.max(state.shake, event.final ? 7 : 3);
    if (event.type === 'wingBite') {
      sound.bite();
      particleBurst(event.x, GROUND - event.y, '#dba05d', 5, 60);
    }
    if (event.type === 'wingThrow') sound.wingThrow();
    if (event.type === 'munchGrab') {
      sound.tone(190, 530, .16, .035, 'triangle');
      if (event.targetId === 'p1') { clearInput(); state.specialBuffer = 0; }
    }
    if (event.type === 'munchBite') {
      sound.munch(event.index || 0);
      if (event.connected) {
        state.shake = Math.max(state.shake, 6);
        particleBurst(event.x, GROUND - event.y, '#ffcb7e', 9, 95);
      }
    }
    if (event.type === 'munchRelease') sound.tone(380, 140, .19, .03, 'triangle');
    if (event.type === 'horseEnter') sound.tone(110, 65, .25, .035, 'triangle');
    if (event.type === 'horseStep') sound.hoof();
    if (event.type === 'horseImpact') {
      state.shake = Math.max(state.shake, 11); state.flash = Math.max(state.flash, .12);
      particleBurst(event.x, GROUND - event.y, '#ead9b9', 20, 260);
      sound.noise(.13, .055); sound.tone(95, 30, .23, .07, 'triangle');
    }
    if (event.type === 'wingImpact') {
      particleBurst(event.x, GROUND - event.y, '#ffc37f', event.blocked ? 7 : 12, 140);
      sound.noise(.075, .035);
    }
    if (event.type === 'vocalExplosion') {
      state.shake = Math.max(state.shake, event.blocked ? 3 : 11); state.flash = event.blocked ? .07 : .2;
      particleBurst(event.x, GROUND - event.y, '#ff9ada', event.blocked ? 8 : 28, event.blocked ? 100 : 300);
      sound.noise(event.blocked ? .07 : .18, event.blocked ? .025 : .07); sound.tone(95, 28, .24, .065, 'triangle');
    }
    if (event.type === 'jump') sound.tone(190, 360, .08, .015, 'triangle');
    if (event.type === 'ko') { state.shake = 10; state.flash = .25; sound.tone(180, 35, .6, .07, 'triangle'); }
  }
}

const skyline = Array.from({ length: 32 }, (_, i) => ({ x: i * 44 - 25, w: 29 + (i * 17 % 30), h: 50 + (i * 37 % 130), seed: i * 11 }));
function paintStage(g) {
  const sky = g.createLinearGradient(0, 0, 0, WORLD_H); sky.addColorStop(0, '#090d21'); sky.addColorStop(.52, '#25203e'); sky.addColorStop(1, '#100f22');
  g.fillStyle = sky; g.fillRect(-1500, -1000, 4280, 2720);
  const haze = g.createRadialGradient(650, 330, 20, 650, 330, 520); haze.addColorStop(0, 'rgba(122,67,150,.22)'); haze.addColorStop(1, 'transparent'); g.fillStyle = haze; g.fillRect(0, 0, WORLD_W, WORLD_H);
  g.fillStyle = '#ebd7b8'; g.beginPath(); g.arc(1050, 107, 30, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#14162b';
  for (let i = 0; i < 38; i++) { const x = (i * 103.3) % 1280, y = 24 + (i * 47.9) % 245; g.fillStyle = `rgba(222,224,255,${.25 + (i % 3) * .12})`; g.fillRect(x, y, i % 3 ? 1.5 : 2.5, 1.5); }
  for (const b of skyline) {
    g.fillStyle = '#0d1225'; g.fillRect(b.x, 365 - b.h, b.w, b.h + 65);
    for (let x = b.x + 7; x < b.x + b.w - 3; x += 10) for (let y = 375 - b.h; y < 350; y += 16) {
      if ((Math.floor(x) + y + b.seed) % 5 < 2) { g.fillStyle = (y + b.seed) % 3 ? 'rgba(148,118,220,.25)' : 'rgba(245,186,119,.35)'; g.fillRect(x, y, 3, 5); }
    }
  }
  g.fillStyle = '#171829'; g.fillRect(-1500, 386, 4280, 145);
  g.strokeStyle = 'rgba(151,133,181,.12)'; g.lineWidth = 1;
  for (let y = 402; y < 530; y += 24) { g.beginPath(); g.moveTo(0, y); g.lineTo(1280, y); g.stroke(); }
  g.fillStyle = '#242137'; g.fillRect(-1500, 383, 4280, 9);
  g.save(); g.globalAlpha = .15;
  for (const [x, color] of [[100, '#bc76ff'], [1180, '#5bdfe5']]) {
    g.fillStyle = color; g.beginPath(); g.moveTo(x - 15, 220); g.lineTo(x + 15, 220); g.lineTo(x + 240 * Math.sin(state.time * .35 + x), 535); g.lineTo(x - 160, 535); g.closePath(); g.fill();
  } g.restore();
  // Stage speakers anchor the music-fighting setting without obscuring combat.
  for (const x of [18, 1166]) {
    g.fillStyle = '#101220'; g.fillRect(x, 354, 96, 188); g.strokeStyle = '#34344c'; g.lineWidth = 3; g.strokeRect(x + 4, 358, 88, 178);
    for (const y of [400, 485]) { g.fillStyle = '#080d18'; g.beginPath(); g.arc(x + 48, y, 31, 0, Math.PI * 2); g.fill(); g.strokeStyle = '#2e3045'; g.stroke(); g.beginPath(); g.arc(x + 48, y, 13 + Math.sin(state.time * 9) * .7, 0, Math.PI * 2); g.fillStyle = '#24273b'; g.fill(); }
  }
  const floor = g.createLinearGradient(0, 530, 0, 720); floor.addColorStop(0, '#302a43'); floor.addColorStop(1, '#131522'); g.fillStyle = floor; g.fillRect(-1500, 535, 4280, 1500);
  g.strokeStyle = 'rgba(183,167,212,.12)'; g.lineWidth = 1;
  for (let x = -150; x < 1500; x += 110) { g.beginPath(); g.moveTo(640 + (x - 640) * .7, 535); g.lineTo(x, 720); g.stroke(); }
  for (const y of [565, 610, 675]) { g.beginPath(); g.moveTo(0, y); g.lineTo(1280, y); g.stroke(); }
  g.fillStyle = '#a66fdd'; g.globalAlpha = .7; g.fillRect(-1500, 534, 4280, 3); g.globalAlpha = 1;
  // Low equalizer at the front lip of the rooftop stage.
  for (let i = 0; i < 100; i++) { const h = 3 + (Math.sin(i * .7 + state.time * 3) + 1) * 6; g.fillStyle = i % 8 < 4 ? '#b68aff' : '#efb367'; g.globalAlpha = .18; g.fillRect(i * 13, 711 - h, 6, h); } g.globalAlpha = 1;
  g.save(); g.translate(640, 626); g.fillStyle = 'rgba(232,219,255,.06)'; g.textAlign = 'center'; g.font = '900 42px system-ui'; g.fillText('MIC CLASH', 0, 0); g.restore();
}

let stageBuffer = null;
function drawStage() {
  if (!stageBuffer) {
    stageBuffer = document.createElement('canvas'); stageBuffer.width = WORLD_W; stageBuffer.height = WORLD_H;
    paintStage(stageBuffer.getContext('2d'));
  }
  ctx.fillStyle = '#101223'; ctx.fillRect(-1500, -1000, 4280, 2720);
  ctx.fillStyle = '#131522'; ctx.fillRect(-1500, 535, 4280, 1500);
  ctx.drawImage(stageBuffer, 0, 0);
  for (let i=0;i<64;i++) {
    const h=3+(Math.sin(i*.7+state.time*4)+1)*5;
    ctx.fillStyle=i%8<4?'rgba(182,138,255,.23)':'rgba(239,179,103,.23)'; ctx.fillRect(i*20,711-h,8,h);
  }
}

// Give the tuck and extension a little more time than the fast middle of the roll.
const FLIP_ASSETS = { karate: 'karateFlip', snitchy: 'snitchyFlip' };
const FLIP_FRAME_ENDS = [.08, .16, .24, .31, .38, .45, .52, .59, .67, .76, .87, 1];
function flipFrameIndex(f) {
  if (!state.assets?.[FLIP_ASSETS[f.type]] || f.flipRemaining <= 0 || f.grounded || f.state !== 'jump') return -1;
  const progress = Math.max(0, Math.min(1, f.flipProgress || 0));
  const index = FLIP_FRAME_ENDS.findIndex(end => progress < end);
  return index < 0 ? FLIP_FRAME_ENDS.length - 1 : index;
}

function poseIndex(f) {
  const t = f.stateTime || 0, p = Number.isFinite(f.attackProgress) ? f.attackProgress : t / (f.state === 'kick' ? .5 : .36);
  if (f.state === 'run') return 4 + Math.floor(t * 11) % 4;
  if (f.state === 'punch') return 12 + Math.min(3, Math.floor(p * 4));
  if (f.state === 'kick') return 16 + Math.min(3, Math.floor(p * 4));
  if (f.state === 'hurt' || f.state === 'ko' || f.state === 'beltHeld') return 22;
  if (f.state === 'block') return 20;
  if (!f.grounded || f.y > 4) {
    if (FLIP_ASSETS[f.type]) return f.flipRemaining > 0 ? 10 : f.vy > 0 ? 9 : 11;
    return f.jumps > 1 ? 10 : f.vy > 0 ? 9 : 11;
  }
  return Math.floor(t * 5) % 4;
}
function getItSprite(f) {
  if (f.state === 'run' && f.grounded) {
    const step = Math.floor(f.stateTime * Math.max(4, Math.min(12, Math.abs(f.vx) / 21))) % 8;
    return { key: 'getItWalk', index: f.vx * f.facing < 0 ? 7 - step : step };
  }
  if (f.state === 'special') {
    const t = f.stateTime;
    const index = t < .16 ? 0 : t < .35 ? 1 : t < 1.16 ? 2 + Math.floor((t - .35) * 9) % 2 : t < 1.28 ? 4 : t < 1.41 ? 5 : t < 1.56 ? 6 : 7;
    return { key: 'getItSing', index };
  }
  return { key: 'getit', index: poseIndex(f) };
}
function loudBullSprite(f) {
  if (f.state === 'run' && f.grounded) {
    const step = Math.floor(f.stateTime * Math.max(4, Math.min(11, Math.abs(f.vx) / 24))) % 8;
    return { key: 'loudBullWalk', index: f.vx * f.facing < 0 ? 7 - step : step };
  }
  if (f.state === 'special') {
    const yell = state.game?.specials.find(s => s.kind === 'yell' && s.owner === f.id);
    const t = yell?.age ?? f.stateTime;
    const index = t < .19 ? 0 : t < .38 ? 1 : t < .48 ? 2 : t < 1.18 ? 3 + Math.floor((t - .48) * 12) % 3 : t < 1.355 ? 6 : 7;
    return { key: 'loudBullYell', index };
  }
  return { key: 'loudbull', index: poseIndex(f) };
}
function fatBoiSprite(f) {
  if (f.state === 'run' && f.grounded) {
    const step = Math.floor(f.stateTime * Math.max(3.5, Math.min(9, Math.abs(f.vx) / 29))) % 8;
    return { key: 'fatBoiWalk', index: f.vx * f.facing < 0 ? 7 - step : step };
  }
  if (f.state === 'special') {
    const wing = state.game?.specials.find(s => s.kind === 'wing' && s.owner === f.id);
    const t = wing?.age ?? f.stateTime;
    const index = t < .18 ? 0 : t < .34 ? 1 : t < .58 ? 2 : t < .76 ? 3 : t < .96 ? 4 : t < 1.10 ? 5 : t < 1.28 ? 6 : 7;
    return { key: 'fatBoiWing', index };
  }
  return { key: 'fatboi', index: poseIndex(f) };
}
function iceSpiceSprite(f) {
  if (f.state === 'run' && f.grounded) {
    const step = Math.floor(f.stateTime * Math.max(4, Math.min(12, Math.abs(f.vx) / 23))) % 8;
    return { key: 'iceSpiceWalk', index: f.vx * f.facing < 0 ? 7 - step : step };
  }
  if (f.state === 'special') {
    const munch = state.game?.specials.find(s => s.kind === 'munch' && s.owner === f.id);
    const t = munch?.age ?? f.stateTime;
    const index = munch?.spriteIndex ?? (t < .20 ? 0 : t < .46 ? 1 : t < .66 ? 2
      : t < .78 ? 3 : t < .92 ? 4 : t < 1.08 ? 5 : t < 1.22 ? 4
      : t < 1.38 ? 5 : t < 1.68 ? 4 : t < 1.90 ? 6 : 7);
    return { key: 'iceSpiceMunch', index };
  }
  return { key: 'icespice', index: poseIndex(f) };
}
function hehawSprite(f) {
  if (f.state === 'run' && f.grounded) {
    const step = Math.floor(f.stateTime * Math.max(4, Math.min(12, Math.abs(f.vx) / 23))) % 8;
    return { key: 'hehawWalk', index: f.vx * f.facing < 0 ? 7 - step : step };
  }
  if (f.state === 'special') {
    const special = state.game?.specials.find(s => s.kind === 'horse' && s.owner === f.id);
    return { key: 'hehawHorsePower', index: special?.spriteIndex ?? 7 };
  }
  return { key: 'hehaw', index: poseIndex(f) };
}
function noBunniesSprite(f) {
  if (f.state === 'run' && f.grounded) {
    const step = Math.floor(f.stateTime * Math.max(4, Math.min(12, Math.abs(f.vx) / 23))) % 8;
    return { key: 'noBunniesWalk', index: f.vx * f.facing < 0 ? 7 - step : step };
  }
  if (f.state === 'special') {
    const special = state.game?.specials.find(s => s.kind === 'belt' && s.owner === f.id);
    return { key: 'noBunniesBelt', index: special?.spriteIndex ?? 7 };
  }
  return { key: 'dr-no-bunnies', index: poseIndex(f) };
}

function cantRapSprite(f) {
  const crew = state.game?.specials.find(s => s.kind === 'crew' && s.owner === f.id);
  return cantRapPose(f, crew);
}

function drawFighterSpeech(s, text, viewScale, offsetX, offsetY) {
  const owner = state.game.fighters.find(f => f.id === s.owner);
  if (!text || !owner) return;
  // Screen-space minimum keeps the call readable when the camera widens on phones.
  const ratio = canvas.width / Math.max(1, canvas.getBoundingClientRect().width);
  const width = Math.max(152 * viewScale, 104 * ratio), height = Math.max(58 * viewScale, 42 * ratio);
  const margin = 8 * ratio, line = 2.5 * ratio;
  const center = offsetX + (owner.x + owner.facing * 65) * viewScale;
  const x = Math.max(margin, Math.min(canvas.width - width - margin, center - width / 2));
  const y = Math.max(margin, offsetY + (GROUND - owner.y - 242) * viewScale - height);
  const mouthX = offsetX + (owner.x + owner.facing * 22) * viewScale;
  const tailX = Math.max(x + 20 * ratio, Math.min(x + width - 20 * ratio, mouthX));
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.lineWidth = line; ctx.lineJoin = 'round'; ctx.strokeStyle = '#211422'; ctx.fillStyle = '#fffaf2';
  ctx.beginPath(); ctx.moveTo(tailX - 9 * ratio, y + height - line);
  ctx.lineTo(mouthX, y + height + 17 * ratio); ctx.lineTo(tailX + 9 * ratio, y + height - line);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.roundRect(x, y, width, height, 13 * ratio); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#28121c'; ctx.font = `900 ${Math.max(30 * viewScale, 23 * ratio)}px system-ui`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, x + width / 2, y + height / 2);
  ctx.restore();
}

function demonSprite(f) {
  return demonPose(f, state.game?.specials.find(s => s.kind === 'maskedCrew' && s.owner === f.id));
}

function cranesSprite(f) {
  return cranesPose(f, state.game?.specials.find(s => s.kind === 'elevator' && s.owner === f.id));
}

function moojaSprite(f) {
  return moojaPose(f, state.game?.specials.find(s => s.kind === 'milk' && s.owner === f.id));
}

function bigFistsSprite(f) {
  return babyBigFistsPose(f, state.game?.specials.find(s => s.kind === 'giantFists' && s.owner === f.id));
}

function princeSprite(f) {
  return smackPrincePose(f, state.game?.specials.find(s => s.kind === 'spotlight' && s.owner === f.id));
}

function drawSmackSpotlight(s) {
  const f = state.game.fighters.find(f => f.id === s.owner), m = SMACK_UPGRADE;
  if (!f || s.age < m.suitAt || s.age >= m.restoreAt) return;
  const fade = Math.min(1, (s.age - m.suitAt) / .12, (m.restoreAt - s.age) / .18);
  ctx.save(); ctx.globalAlpha = fade;
  ctx.fillStyle = 'rgba(8,5,20,.28)'; ctx.fillRect(-400, -600, 2100, 1600);
  const light = ctx.createLinearGradient(f.x, GROUND - 530, f.x, GROUND);
  light.addColorStop(0, 'rgba(255,255,232,.85)');
  light.addColorStop(.65, 'rgba(255,230,108,.35)');
  light.addColorStop(1, 'rgba(255,235,130,.12)');
  ctx.fillStyle = light; ctx.beginPath(); ctx.moveTo(f.x - 25, GROUND - 530);
  ctx.lineTo(f.x + 25, GROUND - 530); ctx.lineTo(f.x + 145, GROUND);
  ctx.lineTo(f.x - 145, GROUND); ctx.closePath(); ctx.fill();
  const pool = ctx.createRadialGradient(f.x, GROUND, 8, f.x, GROUND, 140);
  pool.addColorStop(0, '#fffec2'); pool.addColorStop(.5, 'rgba(255,226,87,.65)'); pool.addColorStop(1, 'rgba(255,211,65,0)');
  ctx.fillStyle = pool; ctx.beginPath(); ctx.ellipse(f.x, GROUND, 145, 20, 0, 0, Math.PI * 2); ctx.fill();
  for (let i = 0; i < 6; i++) {
    const x = f.x + Math.sin(i * 2.4) * 108, y = GROUND - 55 - i * 43;
    const radius = 4 + 3 * (1 + Math.sin(s.age * 11 + i));
    ctx.fillStyle = '#fff8b1'; ctx.beginPath(); ctx.moveTo(x, y - radius);
    ctx.lineTo(x + radius * .35, y); ctx.lineTo(x, y + radius);
    ctx.lineTo(x - radius * .35, y); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

function drawPrideBelt(s) {
  const owner = state.game.fighters.find(f => f.id === s.owner);
  if (!owner || s.age > 2.58) return;
  const pose = noBunniesSprite(owner), entry = state.assets[pose.key];
  const sprite = frame(pose.key, pose.index), spec = entry.frames[pose.index];
  const scale = 215 / entry.referenceHeight;
  const gripX = owner.x + s.facing * (spec.handX - sprite.anchorX) * scale;
  const gripY = GROUND - owner.y + (spec.handY - sprite.anchorY) * scale;
  const next = [.72, 1.43, 2.15].find(at => s.age < at + .18);
  const until = next === undefined ? -1 : next - s.age;
  const snap = Math.max(0, Math.min(1, 1 - Math.max(0, until) / .16));
  const extending = s.age >= .32 && until > -.18;
  const reach = Math.max(96, (s.contactX - gripX) * s.facing + 12);
  const dx = extending ? s.facing * (-76 + (reach + 76) * snap) : s.facing * 72;
  const dy = extending ? (GROUND - s.contactY - gripY) * snap - 55 * (1 - snap) : 88;
  const bow = extending ? -55 * (1 - snap) + 14 * Math.sin(s.age * 18) : 28;
  const width = 39;
  const point = (t, offset = 0) => {
    const tangentY = dy + bow * Math.PI * Math.cos(Math.PI * t);
    const length = Math.hypot(dx, tangentY) || 1;
    return { x: gripX + dx * t - tangentY / length * offset * s.facing,
      y: gripY + dy * t + bow * Math.sin(Math.PI * t) + dx / length * offset * s.facing };
  };
  ctx.save(); ctx.lineJoin = 'round';
  ctx.globalAlpha = Math.min(1, s.age / .12, (2.62 - s.age) / .16);
  for (let stripe = 0; stripe < 3; stripe++) {
    ctx.beginPath();
    for (let i = 0; i <= 32; i++) {
      const p = point(i / 32, -width / 2 + stripe * width / 3);
      if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
    }
    for (let i = 32; i >= 0; i--) {
      const p = point(i / 32, -width / 2 + (stripe + 1) * width / 3);
      ctx.lineTo(p.x, p.y);
    }
    ctx.closePath(); ctx.fillStyle = ['#e72b35', '#121217', '#11b85f'][stripe]; ctx.fill();
  }
  for (const edge of [-width / 2, width / 2]) {
    ctx.beginPath();
    for (let i = 0; i <= 32; i++) {
      const p = point(i / 32, edge);
      if (!i) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
    }
    ctx.strokeStyle = '#ffe596'; ctx.lineWidth = 2; ctx.stroke();
  }
  const buckle = point(.86), ahead = point(.89);
  ctx.translate(buckle.x, buckle.y);
  ctx.rotate(Math.atan2(ahead.y - buckle.y, ahead.x - buckle.x));
  ctx.fillStyle = '#101218'; ctx.strokeStyle = '#ffce52'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.roundRect(-24, -26, 48, 52, 6); ctx.fill(); ctx.stroke();
  // A gold continent silhouette inset into the buckle, kept upright on either side.
  ctx.rotate(-Math.atan2(ahead.y - buckle.y, ahead.x - buckle.x));
  ctx.beginPath();
  const africa = [[-13,-17],[-7,-21],[3,-18],[6,-13],[14,-12],[12,-6],[18,-5],[11,3],[9,12],[3,22],[-2,21],[-6,12],[-6,4],[-11,1],[-17,-1],[-20,-7],[-18,-13]];
  africa.forEach(([x,y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  ctx.closePath(); ctx.fillStyle = '#ffd85d'; ctx.fill();
  ctx.beginPath(); ctx.ellipse(14, 14, 2, 5, .4, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawFighter(f) {
  // The captured fighter is drawn once, held at the actual mouth, below.
  if (f.inCar || f.grabbedBy) return;
  let key = f.type, index = poseIndex(f);
  if (f.type === 'getit') ({ key, index } = getItSprite(f));
  if (f.type === 'loudbull') ({ key, index } = loudBullSprite(f));
  if (f.type === 'fatboi') ({ key, index } = fatBoiSprite(f));
  if (f.type === 'icespice') ({ key, index } = iceSpiceSprite(f));
  if (f.type === 'hehaw') ({ key, index } = hehawSprite(f));
  if (f.type === 'dr-no-bunnies') ({ key, index } = noBunniesSprite(f));
  if (f.type === 'cantrap') ({ key, index } = cantRapSprite(f));
  if (f.type === 'smackprince') ({ key, index } = princeSprite(f));
  if (f.type === 'babybigfists') ({ key, index } = bigFistsSprite(f));
  if (f.type === 'demon') ({ key, index } = demonSprite(f));
  if (f.type === 'cranes') ({ key, index } = cranesSprite(f));
  if (f.type === 'mooja') ({ key, index } = moojaSprite(f));
  const flipIndex = flipFrameIndex(f);
  const flipping = flipIndex >= 0;
  if (flipping) { key = FLIP_ASSETS[f.type]; index = flipIndex; }
  if (f.type === 'snitchy' && f.state === 'special') {
    key = 'snitchyCall';
    index = f.stateTime < .12 ? 0 : f.stateTime < .28 ? 1 : f.stateTime < .70 ? 2 : 3;
  }
  if (f.type === 'owl' && f.state === 'special') { key = 'owls'; index = 8 + Math.min(3, Math.floor((f.stateTime || 0) * 5)); }
  const barrage = f.type === 'karate' && f.state === 'special'
    ? state.game.specials.find(s => s.kind === 'barrage' && s.owner === f.id) : null;
  if (f.type === 'karate' && f.state === 'special') {
    key = 'karateGi';
    const age = barrage?.age ?? f.stateTime;
    const windup = barrage?.windup ?? .18, interval = barrage?.interval ?? .09, count = barrage?.punchesTotal ?? 12;
    index = age < windup / 2 ? 0 : age < windup ? 1
      : age < windup + interval * (count - 1) ? 2 + Math.floor((age - windup) / (interval / 2)) % 4
      : age < windup + interval * count ? 6 : 7;
  }
  const s = frame(key, index), base = frame(key, 0); if (!s || !base) return;
  // The flip frames share a body-center anchor and an upright reference height,
  // so compact tucks stay compact rather than being stretched to standing size.
  const scale = 215 / (flipping || key === 'snitchyCall' || ['getit', 'loudbull', 'fatboi', 'icespice', 'hehaw', 'dr-no-bunnies', 'cantrap', 'smackprince', 'babybigfists', 'mooja', 'cranes', 'demon'].includes(f.type) ? state.assets[key].referenceHeight : base.h);
  ctx.save();
  const shadowScale = Math.max(.45, 1 - f.y / 450);
  ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(f.x, GROUND + 4, 61 * shadowScale, 10 * shadowScale, 0, 0, Math.PI * 2); ctx.fill();
  if (f.meter >= 100) { ctx.strokeStyle = META[f.type].color; ctx.globalAlpha = .5 + Math.sin(state.time * 5) * .15; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(f.x, GROUND + 4, 66, 13, 0, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1; }
  ctx.translate(f.x, GROUND - f.y); ctx.scale(flipping ? (f.flipDirection || f.facing) : f.type === 'demon' && demonSprite(f).lookAway ? -f.facing : f.facing, 1);
  if (flipping) ctx.translate(0, -108);
  if (f.state === 'ko') { ctx.rotate(-Math.min(1.15, f.stateTime * 1.5)); ctx.globalAlpha = .8; }
  if (f.state === 'hurt' && f.stateTime < .08) ctx.filter = 'brightness(1.8)';
  const vocalImpact = state.game.effects.find(e => e.kind === 'vocalExplosion' && e.defender === f.id && !e.blocked && e.age < .22);
  if (vocalImpact) ctx.filter = 'brightness(3) saturate(.4)';
  if (f.meter >= 100) { ctx.shadowColor = META[f.type].color; ctx.shadowBlur = 7; }
  if (barrage && barrage.age >= barrage.windup && barrage.punchIndex < barrage.punchesTotal) {
    // The echoes are clipped to the punching arms so the face and costume stay crisp.
    ctx.save(); ctx.beginPath(); ctx.rect(12, -145, 190, 69); ctx.clip();
    for (let echo = 3; echo > 0; echo--) {
      const trail = frame('karateGi', 2 + (index + echo) % 4);
      if (!trail) continue;
      ctx.globalAlpha = .08 + (4 - echo) * .045;
      ctx.drawImage(trail.image, -trail.anchorX * scale + echo * 13, -trail.anchorY * scale - (echo % 2 ? 8 : -5), trail.w * scale, trail.h * scale);
    }
    ctx.restore();
  }
  ctx.drawImage(s.image, -s.anchorX * scale, -s.anchorY * scale, s.w * scale, s.h * scale);
  if (['getit', 'dr-no-bunnies', 'smackprince', 'mooja'].includes(f.type) && f.state === 'punch' && f.attackProgress > .24 && f.attackProgress < .68) {
    ctx.save(); ctx.strokeStyle = '#ffe1ed'; ctx.lineWidth = 3; ctx.globalAlpha = .55;
    ctx.beginPath(); ctx.moveTo(32, -148); ctx.quadraticCurveTo(135, -157, 128, -95); ctx.stroke(); ctx.restore();
  }
  ctx.restore();
  if (f.id === 'p1' && !state.game.over) {
    ctx.fillStyle = META[f.type].color; ctx.beginPath(); ctx.moveTo(f.x - 7, GROUND - f.y - 238); ctx.lineTo(f.x + 7, GROUND - f.y - 238); ctx.lineTo(f.x, GROUND - f.y - 229); ctx.fill();
  }
}
function drawBackupCar(s) {
  const car = s.car;
  if (!car?.visible) return;
  const index = car.doorsOpen ? 2 : car.phase === 'departing' && s.phaseAge < .12 ? 3 : Math.floor(s.age * 5) % 2;
  const sprite = frame('policeCar', index); if (!sprite) return;
  const scale = (car.width || 360) / state.assets.policeCar.referenceWidth;
  ctx.save(); ctx.translate(car.x, GROUND + 4); ctx.scale(car.facing || s.facing, 1);
  ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(0, 0, 170, 12, 0, 0, Math.PI * 2); ctx.fill();
  ctx.drawImage(sprite.image, -sprite.anchorX * scale, -sprite.anchorY * scale, sprite.w * scale, sprite.h * scale);
  ctx.restore();
}

function drawBackupOfficers(s) {
  for (const officer of s.officers || []) {
    if (!officer.visible) continue;
    let pose = 1;
    if (officer.phase === 'exit') pose = officer.phaseAge < .17 ? 0 : 1;
    else if (officer.phase === 'rush' || officer.phase === 'return') pose = [2, 3, 4, 3][Math.floor(officer.phaseAge * 12) % 4];
    else if (officer.phase === 'attack') pose = officer.punchProgress < .222 ? 5 : officer.punchProgress < .52 ? 6 : 7;
    const sprite = frame('policeOfficers', officer.index * 8 + pose);
    if (!sprite) continue;
    const height = [182, 170, 166][officer.index], scale = height / state.assets.policeOfficers.referenceHeights[officer.index];
    const depth = (officer.index - 1) * 5;
    ctx.save(); ctx.globalAlpha = officer.alpha ?? 1; ctx.translate(officer.x, GROUND + depth);
    ctx.fillStyle = 'rgba(0,0,0,.24)'; ctx.beginPath(); ctx.ellipse(0, 3, 38, 7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.translate(0, -officer.y); ctx.scale(officer.facing, 1);
    ctx.drawImage(sprite.image, -sprite.anchorX * scale, -sprite.anchorY * scale, sprite.w * scale, sprite.h * scale);
    ctx.restore();
  }
}

function drawTurbanCrew(s) {
  const atlas = state.assets?.cantrap;
  if (!atlas) return;
  for (const kid of s.crew || []) {
    if (!kid.visible) continue;
    const pose = frame('cantrap', kid.pose);
    if (!pose) continue;
    // The summoned crew are small, red-turban-wearing chibi fighters,
    // clearly distinct in scale from the full-sized adult.
    const height = 86 + kid.index % 3 * 5;
    const scale = height / atlas.referenceHeight;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,.25)';
    ctx.beginPath(); ctx.ellipse(kid.x, GROUND + 3, 27, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.translate(kid.x, GROUND - kid.y); ctx.scale(kid.facing, 1);
    ctx.drawImage(pose.image, -pose.anchorX * scale, -pose.anchorY * scale,
      pose.w * scale, pose.h * scale);
    ctx.restore();
  }
  if (s.phase === 'attack') {
    const victim = state.game.fighters.find(f => f.id !== s.owner);
    if (victim) {
      ctx.save(); ctx.translate(victim.x, GROUND - victim.y - 110);
      for (let i = 0; i < 3; i++) {
        const phase = (s.age * 10 + i / 3) % 1;
        ctx.globalAlpha = .42 * (1 - phase);
        ctx.strokeStyle = i % 2 ? '#ffd87b' : '#ff797e';
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(0, 0, 23 + phase * 42, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.restore();
    }
  }
}

function drawVocalWaves(s) {
  const singer = state.game.fighters.find(f => f.id === s.owner);
  if (singer?.state === 'special') {
    ctx.save(); ctx.translate(singer.x, GROUND - singer.y); ctx.scale(s.facing, 1);
    ctx.globalAlpha = .5; ctx.strokeStyle = '#ff65bd'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(0, 2, 65 + Math.sin(s.age * 16) * 5, 14, 0, 0, Math.PI * 2); ctx.stroke();
    if (s.age >= .35 && s.age < 1.41) {
      ctx.fillStyle = '#ffc0e9'; ctx.font = 'bold 27px system-ui';
      for (let i = 0; i < 3; i++) {
        const rise = (s.age * 1.5 + i / 3) % 1;
        ctx.globalAlpha = .7 * (1 - rise); ctx.fillText(i % 2 ? '♫' : '♪', 55 + i * 22, -170 - rise * 70);
      }
    }
    ctx.restore();
  }
  for (const wave of s.waves || []) {
    if (!wave.active) continue;
    const radius = wave.final ? 86 : 61;
    ctx.save(); ctx.translate(wave.x, GROUND - wave.y); ctx.scale(wave.facing, 1);
    ctx.shadowColor = wave.final ? '#ff54d6' : '#ff83c6'; ctx.shadowBlur = wave.final ? 20 : 12;
    for (let i = 2; i >= 0; i--) {
      ctx.globalAlpha = (1 - i * .22) * Math.min(1, wave.ttl * 5);
      ctx.strokeStyle = i === 0 ? '#fff1fd' : i === 1 ? '#ff86d3' : '#b74bff';
      ctx.lineWidth = wave.final ? 6 - i : 4 - i * .5;
      const x = -i * 18, r = radius * (1 - i * .12);
      ctx.beginPath(); ctx.moveTo(x - 14, -r); ctx.quadraticCurveTo(x + 41, 0, x - 14, r); ctx.stroke();
    }
    ctx.globalAlpha = .8; ctx.fillStyle = '#ffafe5'; ctx.font = `bold ${wave.final ? 34 : 26}px system-ui`;
    ctx.fillText(wave.index % 2 ? '♫' : '♪', -49, -8 + Math.sin(wave.age * 12) * 9);
    ctx.restore();
  }
}

function drawVocalExplosions() {
  for (const effect of state.game?.effects || []) {
    if (effect.kind !== 'vocalExplosion') continue;
    const index = Math.min(7, Math.floor(effect.age / effect.duration * 8));
    const sprite = frame('vocalExplosion', index); if (!sprite) continue;
    const scale = (effect.blocked ? 185 : 355) / state.assets.vocalExplosion.referenceWidth;
    ctx.save(); ctx.translate(effect.x, GROUND - effect.y); ctx.scale(effect.facing, 1);
    ctx.globalAlpha = effect.blocked ? .65 : 1;
    ctx.drawImage(sprite.image, -sprite.anchorX * scale, -sprite.anchorY * scale, sprite.w * scale, sprite.h * scale);
    ctx.restore();
  }
}

function drawGiantYell(s) {
  if (s.phase !== 'yelling') return;
  const owner = state.game.fighters.find(f => f.id === s.owner);
  if (!owner || owner.state !== 'special') return;
  const pose = loudBullSprite(owner), entry = state.assets[pose.key], spec = entry?.frames[pose.index];
  const scale = 215 / (entry?.referenceHeight || 215);
  const hasMouthAnchor = Number.isFinite(spec?.mouthX) && Number.isFinite(spec?.mouthY);
  const mouthX = hasMouthAnchor ? owner.x + s.facing * (spec.mouthX - spec.anchorX) * scale : s.x;
  const mouthY = hasMouthAnchor ? owner.y + (spec.anchorY - spec.mouthY) * scale : s.y;
  const range = s.range + (s.x - mouthX) * s.facing;
  const near = s.nearHalfHeight || 34, far = s.farHalfHeight || 138;
  const envelope = Math.min(1, s.phaseAge / .055, Math.max(0, (.8 - s.phaseAge) / .10));
  ctx.save(); ctx.translate(mouthX, GROUND - mouthY); ctx.scale(s.facing, 1);
  ctx.beginPath(); ctx.rect(0, -far - 15, range + 30, far * 2 + 30); ctx.clip();
  const glow = ctx.createLinearGradient(0, 0, range, 0);
  glow.addColorStop(0, 'rgba(237,244,255,.16)'); glow.addColorStop(.45, 'rgba(210,224,255,.09)'); glow.addColorStop(1, 'rgba(255,235,196,0)');
  ctx.globalAlpha = envelope; ctx.fillStyle = glow;
  ctx.beginPath(); ctx.moveTo(0, -near); ctx.quadraticCurveTo(range * .4, -far * .6, range, -far);
  ctx.lineTo(range, far); ctx.quadraticCurveTo(range * .4, far * .6, 0, near); ctx.closePath(); ctx.fill();
  ctx.shadowColor = '#e8efff'; ctx.shadowBlur = 10;
  for (let i = 0; i < 9; i++) {
    const travel = (s.phaseAge * 2.65 + i / 9) % 1;
    const x = travel * range, radius = near + (far - near) * travel;
    ctx.globalAlpha = envelope * (.35 + (1 - travel) * .55);
    ctx.strokeStyle = i % 3 === 0 ? '#ffecc8' : '#edf3ff'; ctx.lineWidth = 2.2 + (1 - travel) * 1.8;
    ctx.beginPath(); ctx.ellipse(x, 0, 6 + radius * .23, radius, 0, -.5 * Math.PI, 1.5 * Math.PI); ctx.stroke();
  }
  ctx.shadowBlur = 0; ctx.globalAlpha = envelope * .4; ctx.strokeStyle = '#f2f5ff'; ctx.lineWidth = 1.3;
  for (const side of [-1, 1]) {
    ctx.beginPath(); ctx.moveTo(8, near * side); ctx.quadraticCurveTo(range * .45, far * .65 * side, range, far * side); ctx.stroke();
  }
  ctx.restore();
}

function drawThrownWing(s) {
  const wing = s.projectile;
  if (!wing?.active) return;
  const index = Math.floor((wing.age || 0) * 14) % 4;
  const sprite = frame('wingProjectile', index); if (!sprite) return;
  const scale = (wing.width || 72) / state.assets.wingProjectile.referenceWidth;
  ctx.save(); ctx.translate(wing.x, GROUND - wing.y); ctx.scale(wing.facing || s.facing, 1);
  ctx.strokeStyle = '#f8c78a'; ctx.lineWidth = 2; ctx.globalAlpha = .6;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath(); ctx.moveTo(-43 - i * 9, -11 + i * 9); ctx.lineTo(-25 - i * 4, -8 + i * 8); ctx.stroke();
  }
  ctx.globalAlpha = 1; ctx.shadowColor = '#ffbb6b'; ctx.shadowBlur = 7;
  ctx.drawImage(sprite.image, -sprite.anchorX * scale, -sprite.anchorY * scale, sprite.w * scale, sprite.h * scale);
  ctx.restore();
}

function drawMunch(s) {
  const owner = state.game.fighters.find(f => f.id === s.owner);
  if (!owner) return;
  const pose = iceSpiceSprite(owner), entry = state.assets[pose.key];
  const spec = entry?.frames[pose.index], actor = frame(pose.key, pose.index);
  if (!spec || !actor) return;
  const actorScale = 215 / entry.referenceHeight;
  const mouthX = Number.isFinite(spec.mouthX) ? owner.x + s.facing * (spec.mouthX - actor.anchorX) * actorScale : s.mouthX;
  const mouthY = Number.isFinite(spec.mouthY) ? owner.y + (actor.anchorY - spec.mouthY) * actorScale : s.mouthY;
  const target = s.grabbed ? state.game.fighters.find(f => f.id === s.targetId && f.grabbedBy === s.owner) : null;
  if (target) {
    // Use the selected opponent's own sprite. No generic victim is baked into
    // the artwork, and the normal fighter pass omits the held character.
    const victim = frame(target.type, ['smackprince', 'babybigfists', 'mooja', 'cranes', 'demon'].includes(target.type) ? 14 : 22) || frame(target.type, 0);
    if (victim) {
      const progress = Math.max(0, Math.min(1, (s.age - .46) / .20));
      const lift = progress * progress * (3 - 2 * progress);
      const victimReference = state.assets[target.type].referenceHeight || frame(target.type, 0).h;
      const victimScale = 215 / victimReference * (1 - .30 * lift);
      const x = s.targetX + (mouthX - s.mouthX) * lift;
      const y = s.targetY + (mouthY - s.mouthY) * lift;
      const chomp = pose.index === 4;
      ctx.save(); ctx.translate(x, GROUND - y); ctx.scale(s.facing, 1);
      ctx.rotate(Math.PI / 2 * lift + (chomp ? Math.sin(s.phaseAge * 70) * .045 : 0));
      ctx.scale(-1, 1);
      ctx.drawImage(victim.image, -victim.anchorX * victimScale,
        -(victim.anchorY - victimReference * .49) * victimScale,
        victim.w * victimScale, victim.h * victimScale);
      ctx.restore();
      // Put her actual lip/teeth in front of the captured torso. On a closed
      // chomp the whole authored jaw pose provides the foreground mask.
      ctx.save();
      if (!chomp) {
        const mouthWidth = (spec.mouthW || 85) * actorScale;
        const mouthHeight = (spec.mouthH || 55) * actorScale;
        ctx.beginPath();
        ctx.rect(mouthX - mouthWidth * .58, GROUND - mouthY + mouthHeight * .17,
          mouthWidth * 1.16, mouthHeight * .80);
        ctx.clip();
      }
      ctx.translate(owner.x, GROUND - owner.y); ctx.scale(s.facing, 1);
      ctx.drawImage(actor.image, -actor.anchorX * actorScale, -actor.anchorY * actorScale,
        actor.w * actorScale, actor.h * actorScale);
      ctx.restore();
    }
  }
  if (s.age >= .20 && s.age < .46) {
    ctx.save(); ctx.translate(owner.x, GROUND - owner.y); ctx.scale(s.facing, 1);
    ctx.strokeStyle = '#ffd0a1'; ctx.lineWidth = 3; ctx.globalAlpha = .5;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath(); ctx.moveTo(45 + i * 6, -100 - i * 17);
      ctx.lineTo(100 + i * 8, -106 - i * 15); ctx.stroke();
    }
    ctx.restore();
  }
}

function drawHorsePower(s) {
  const horse = s.horse;
  if (!horse?.visible) return;
  const sprite = frame('hehawStallion', horse.frame ?? horse.spriteIndex ?? Math.floor(horse.age * 14) % 8);
  if (!sprite) return;
  const scale = horse.height / state.assets.hehawStallion.referenceHeight;
  const direction = horse.facing || s.facing;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,.32)'; ctx.beginPath();
  ctx.ellipse(horse.x, GROUND + 5, 122, 13, 0, 0, Math.PI * 2); ctx.fill();
  ctx.translate(horse.x, GROUND - (horse.y || 0)); ctx.scale(direction, 1);
  // Dust trails follow the gallop clock, so they freeze with the game on pause.
  for (let i = 0; i < 7; i++) {
    const p = ((horse.age || 0) * 2.8 + i / 7) % 1;
    ctx.globalAlpha = .24 * (1 - p); ctx.fillStyle = '#d4c2ad';
    ctx.beginPath(); ctx.ellipse(-85 - p * 145, -5 - p * 15, 8 + p * 20, 4 + p * 9, -.2, 0, Math.PI * 2); ctx.fill();
  }
  ctx.strokeStyle = '#dce0eb'; ctx.lineWidth = 2;
  for (let i = 0; i < 3; i++) {
    ctx.globalAlpha = .26 - i * .05;
    const offset = ((horse.age || 0) * 170 + i * 17) % 36;
    ctx.beginPath(); ctx.moveTo(-148 - offset, -85 - i * 24);
    ctx.lineTo(-203 - offset - i * 12, -85 - i * 24); ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.drawImage(sprite.image, -sprite.anchorX * scale, -sprite.anchorY * scale, sprite.w * scale, sprite.h * scale);
  ctx.restore();
}

function drawHorseImpacts() {
  for (const impact of state.game?.effects || []) {
    if (impact.kind !== 'horseImpact') continue;
    const p = Math.min(1, impact.age / impact.duration), radius = 28 + 46 * p;
    ctx.save(); ctx.translate(impact.x, GROUND - impact.y);
    ctx.scale(impact.facing || 1, 1); ctx.globalAlpha = 1 - p;
    ctx.rotate(-.18 + p * .25); ctx.beginPath();
    for (let i = 0; i < 24; i++) {
      const angle = i / 24 * Math.PI * 2, r = i % 2 ? radius * .40 : radius;
      const x = Math.cos(angle) * r, y = Math.sin(angle) * r * .82;
      if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
    }
    ctx.closePath(); ctx.fillStyle = '#ffd47a'; ctx.strokeStyle = '#fff6dc'; ctx.lineWidth = 3;
    ctx.fill(); ctx.stroke(); ctx.restore();
  }
}

function drawElevatorWarning(s) {
  if (!s.active || !s.locked || s.landed) return;
  const pulse = .65 + .25 * Math.sin(s.age * 23);
  ctx.save(); ctx.translate(s.x, GROUND + 2);
  ctx.fillStyle = `rgba(255,81,171,${pulse * .22})`;
  ctx.strokeStyle = `rgba(255,170,219,${pulse})`; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.ellipse(0, 0, ELEVATOR_DROP.width / 2, 17, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-20, 0); ctx.lineTo(20, 0); ctx.moveTo(0, -10); ctx.lineTo(0, 10); ctx.stroke();
  ctx.restore();
}

function drawElevatorDrop(s) {
  const e = ELEVATOR_DROP, owner = state.game.fighters.find(f => f.id === s.owner);
  if (owner && s.age >= e.shoutAt && s.age < e.exhaleAt) {
    ctx.save(); ctx.translate(owner.x + s.facing * 46, GROUND - owner.y - 173); ctx.scale(s.facing, 1);
    ctx.lineWidth = 4; ctx.strokeStyle = '#ffa6d5'; ctx.globalAlpha = .8;
    for (let i = 0; i < 3; i++) {
      const r = 18 + i * 16 + (s.age * 50) % 12;
      ctx.beginPath(); ctx.arc(0, 0, r, -.55, .55); ctx.stroke();
    }
    ctx.restore();
  }
  if (s.age < e.dropAt) return;
  const index = !s.landed ? 0 : s.age < e.landAt + .10 ? 1 : s.age < e.fadeAt ? 2 : 3;
  const sprite = frame('cranesElevator', index); if (!sprite) return;
  const scale = e.height / state.assets.cranesElevator.referenceHeight;
  const alpha = s.age > e.fadeAt ? Math.max(0, (e.duration - s.age) / (e.duration - e.fadeAt)) : 1;
  ctx.save(); ctx.translate(s.x, GROUND - s.bottom); ctx.globalAlpha = alpha;
  if (!s.landed) {
    ctx.strokeStyle = '#ffc5e6'; ctx.lineWidth = 3;
    for (const dx of [-e.width / 2 - 13, e.width / 2 + 13]) {
      ctx.beginPath(); ctx.moveTo(dx, -e.height * .65); ctx.lineTo(dx, -e.height * .65 - 75); ctx.stroke();
    }
  }
  ctx.drawImage(sprite.image, -sprite.anchorX * scale, -sprite.anchorY * scale, sprite.w * scale, sprite.h * scale);
  ctx.restore();
}

function drawElevatorImpacts() {
  for (const effect of state.game?.effects || []) {
    if (effect.kind !== 'elevatorImpact') continue;
    const p = effect.age / effect.duration;
    ctx.save(); ctx.translate(effect.x, GROUND + 1); ctx.globalAlpha = (1 - p) * .8;
    ctx.strokeStyle = '#ffacd8'; ctx.lineWidth = 5 * (1 - p);
    ctx.beginPath(); ctx.ellipse(0, 0, 70 + p * 160, 12 + p * 22, 0, 0, Math.PI * 2); ctx.stroke();
    for (let i = 0; i < 10; i++) {
      const side = i % 2 ? 1 : -1, n = Math.floor(i / 2);
      ctx.fillStyle = i % 3 ? '#ddd3e8' : '#ffdfef';
      ctx.beginPath(); ctx.ellipse(side * (65 + n * 14 + p * (110 + n * 13)),
        -8 - p * (18 + n * 12), (17 + n * 3) * (1 + p), (14 + n * 3) * (1 + p), 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }
}

function drawMilkMissiles(s) {
  const owner = state.game.fighters.find(f => f.id === s.owner);
  if (owner && owner.state === 'special') {
    // A brief transformation glow covers the switch between human and cow poses.
    for (const at of [COW_MODE.cowAt, COW_MODE.restoreAt]) {
      const strength = Math.max(0, 1 - Math.abs(s.age - at) / .16);
      if (!strength) continue;
      ctx.save(); ctx.translate(owner.x, GROUND - owner.y - 108);
      const glow = ctx.createRadialGradient(0, 0, 8, 0, 0, 145);
      glow.addColorStop(0, `rgba(255,255,255,${strength * .96})`);
      glow.addColorStop(.55, `rgba(255,139,221,${strength * .88})`); glow.addColorStop(1, 'rgba(255,70,197,0)');
      ctx.fillStyle = glow; ctx.beginPath(); ctx.ellipse(0, 0, 145, 150, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = `rgba(255,227,248,${strength})`; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.ellipse(0, 40, 100 + strength * 25, 25, -.12, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
    }
  }
  for (const p of s.missiles) {
    if (!p.active) continue;
    const sprite = frame('mooJaMilk', Math.floor(p.age * 20) % 8); if (!sprite) continue;
    const scale = COW_MODE.missileWidth / state.assets.mooJaMilk.referenceWidth;
    ctx.save(); ctx.translate(p.x, GROUND - p.y); ctx.scale(p.facing, 1);
    ctx.drawImage(sprite.image, -sprite.anchorX * scale, -sprite.anchorY * scale, sprite.w * scale, sprite.h * scale); ctx.restore();
  }
}

function drawMilkSplashes() {
  for (const effect of state.game?.effects || []) {
    if (effect.kind !== 'milkSplash') continue;
    const sprite = frame('mooJaMilk', 8 + Math.min(7, Math.floor(effect.age / effect.duration * 8)));
    if (!sprite) continue;
    const scale = (effect.final ? 225 : 165) / state.assets.mooJaMilk.referenceWidth;
    ctx.save(); ctx.translate(effect.x, GROUND - effect.y); ctx.scale(effect.facing, 1);
    ctx.globalAlpha = Math.min(1, effect.ttl * 8);
    ctx.drawImage(sprite.image, -sprite.anchorX * scale, -sprite.anchorY * scale, sprite.w * scale, sprite.h * scale); ctx.restore();
  }
}

function drawMaskedCrew(s) {
  const c = DEMON_CREW;
  if (s.age >= c.enterAt && s.age < c.retreatAt) {
    ctx.save(); ctx.strokeStyle = '#bb76ff'; ctx.globalAlpha = s.age < c.attackAt ? .65 : .25;
    ctx.lineWidth = 3; ctx.setLineDash([9, 7]); ctx.beginPath();
    ctx.ellipse(s.focusX, GROUND + 3, c.targetRadius, 15, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
  }
  for (const member of s.crew) {
    if (!member.visible) continue;
    const sprite = frame('demonCrew', member.pose); if (!sprite) continue;
    const scale = (member.entry === 'top' ? 166 : 158) / state.assets.demonCrew.referenceHeight;
    ctx.save(); ctx.fillStyle = 'rgba(0,0,0,.30)'; ctx.beginPath();
    ctx.ellipse(member.x, GROUND + 4, Math.max(12, 45 - member.y / 20), 7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.translate(member.x, GROUND - member.y + (member.index < 2 ? 8 : -4)); ctx.scale(member.facing, 1);
    ctx.drawImage(sprite.image, -sprite.anchorX * scale, -sprite.anchorY * scale, sprite.w * scale, sprite.h * scale);
    ctx.restore();
  }
}

function drawSpecial(s) {
  if (!s.active) return;
  if (s.kind === 'maskedCrew') return; // Crew is drawn behind the actual fighters.
  if (s.kind === 'elevator') { drawElevatorDrop(s); return; }
  if (s.kind === 'milk') { drawMilkMissiles(s); return; }
  if (s.kind === 'belt') { drawPrideBelt(s); return; }
  if (s.kind === 'munch') { drawMunch(s); return; }
  if (s.kind === 'horse') { drawHorsePower(s); return; }
  if (s.kind === 'crew') { drawTurbanCrew(s); return; }
  if (s.kind === 'car') {
    const hit = s.hitIds instanceof Set ? s.hitIds.size > 0 : s.hitIds?.length > 0;
    const index = hit ? 2 : s.age < .16 ? 1 : s.ttl < .2 ? 3 : 0;
    const f = frame('car', index); if (!f) return;
    const w = s.width || 390, scale = w / f.w;
    ctx.save(); ctx.translate(s.x, GROUND - (s.y || 0) + 6); ctx.scale(s.facing || 1, 1);
    ctx.shadowColor = 'rgba(0,0,0,.4)'; ctx.shadowBlur = 10;
    ctx.drawImage(f.image, -w / 2, -f.h * scale, w, f.h * scale); ctx.restore();
    if (Math.random() < .18) state.particles.push({ x: s.x - (s.facing || 1) * w * .4, y: GROUND, vx: -(s.facing || 1) * 65, vy: -20, life: .35, max: .35, color: '#a9a6b4', size: 10 });
  } else if (s.kind === 'owl') {
    const f = frame('owls', 'single:1') || frame('owls', 15); if (!f) return;
    const w = 84, h = f.h / f.w * w;
    ctx.save(); ctx.translate(s.x, GROUND - s.y); ctx.scale(s.facing || 1, 1); ctx.shadowColor = '#ffd25f'; ctx.shadowBlur = 13;
    ctx.drawImage(f.image, -w / 2, -h / 2, w, h); ctx.restore();
  } else if (s.kind === 'backup') {
    drawBackupOfficers(s);
  } else if (s.kind === 'vocal') {
    drawVocalWaves(s);
  } else if (s.kind === 'yell') {
    drawGiantYell(s);
  } else if (s.kind === 'wing') {
    drawThrownWing(s);
  } else if (s.kind === 'barrage') {
    const fighter = state.game.fighters.find(f => f.id === s.owner);
    if (!fighter) return;
    ctx.save(); ctx.translate(fighter.x, GROUND - fighter.y); ctx.scale(s.facing, 1);
    if (s.age < s.windup) {
      ctx.globalAlpha = 1 - s.age / s.windup;
      ctx.strokeStyle = '#b5dcff'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.ellipse(0, -106, 45 + s.age * 190, 115, 0, 0, Math.PI * 2); ctx.stroke();
    } else if (s.age < s.windup + s.interval * s.punchesTotal) {
      for (let i = 0; i < 6; i++) {
        const p = (s.age * 13 + i * .19) % 1, x = 28 + p * 92, y = -96 - (i % 3) * 15;
        ctx.globalAlpha = .7 * (1 - p); ctx.strokeStyle = i % 2 ? '#eef7ff' : '#75baff'; ctx.lineWidth = i % 2 ? 2 : 3;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 36, y); ctx.stroke();
      }
    }
    ctx.restore();
  }
}
function drawEffects(dt) {
  drawVocalExplosions();
  drawHorseImpacts();
  drawMilkSplashes();
  drawElevatorImpacts();
  for (const p of state.particles) {
    p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 180 * dt;
    ctx.save(); ctx.globalAlpha = Math.max(0, p.life / p.max); ctx.fillStyle = p.color; ctx.translate(p.x, p.y); ctx.rotate(p.life * 4); ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size); ctx.restore();
  }
  state.particles = state.particles.filter(p => p.life > 0);
  for (const label of state.labels) {
    label.life -= dt; label.y -= dt * (label.big ? 4 : 36);
    if (label.big) continue;
    ctx.save(); ctx.globalAlpha = Math.min(1, Math.max(0, label.life * (label.lash ? 5 : 2))); ctx.textAlign = 'center'; ctx.font = `900 ${label.lash ? 42 : 26}px system-ui`;
    ctx.strokeStyle = '#171326'; ctx.lineWidth = 5; ctx.strokeText(label.text, label.x, label.y); ctx.fillStyle = label.color; ctx.fillText(label.text, label.x, label.y); ctx.restore();
  }
  state.labels = state.labels.filter(l => l.life > 0);
}
function draw(dt) {
  resize(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#101223'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (state.game) {
    const [a, b] = state.game.fighters;
    const wideSpecialActive = state.game.specials.some(s => (s.kind === 'car' && s.active) || (s.kind === 'backup' && s.car?.visible) || (s.kind === 'horse' && s.active) || (s.kind === 'crew' && s.active) || (s.kind === 'maskedCrew' && s.active));
    const portrait = canvas.width / canvas.height < 1.05;
    const targetWidth = wideSpecialActive ? (portrait ? 1000 : 1280) : Math.min(1280, Math.max(portrait ? 480 : 820, Math.abs(a.x - b.x) + (portrait ? 340 : 590)));
    const targetX = Math.max(targetWidth / 2, Math.min(1280 - targetWidth / 2, (a.x + b.x) / 2));
    state.cameraWidth += (targetWidth - state.cameraWidth) * Math.min(1, dt * 3);
    state.cameraX += (targetX - state.cameraX) * Math.min(1, dt * 3);
  }
  const viewScale = Math.min(canvas.width / state.cameraWidth, canvas.height / 480);
  const visibleWidth = canvas.width / viewScale;
  const cameraX = visibleWidth >= 1280 ? 640 : Math.max(visibleWidth / 2, Math.min(1280 - visibleWidth / 2, state.cameraX));
  const offsetX = canvas.width / 2 - cameraX * viewScale;
  const offsetY = canvas.height * .79 - GROUND * viewScale;
  ctx.setTransform(viewScale, 0, 0, viewScale, offsetX, offsetY);
  ctx.save();
  if (state.shake > .2) ctx.translate((Math.random() - .5) * state.shake, (Math.random() - .5) * state.shake);
  drawStage();
  if (state.game) {
    for (const s of state.game.specials) if (s.kind === 'backup' && s.active) drawBackupCar(s);
    for (const s of state.game.specials) if (s.kind === 'spotlight') drawSmackSpotlight(s);
    for (const s of state.game.specials) if (s.kind === 'elevator') drawElevatorWarning(s);
    for (const s of state.game.specials) if (s.kind === 'maskedCrew' && s.active) drawMaskedCrew(s);
    const elevatorCasters = state.game.fighters.filter(f => f.type === 'cranes' && f.state === 'special');
    // The enlarged fist must stay visible in front of the opponent on contact.
    const giantCasters = state.game.fighters.filter(f => f.type === 'babybigfists' && f.state === 'special');
    for (const f of state.game.fighters) if (!giantCasters.includes(f) && !elevatorCasters.includes(f)) drawFighter(f);
    for (const f of giantCasters) drawFighter(f);
    for (const s of state.game.specials) drawSpecial(s);
    for (const f of elevatorCasters) drawFighter(f);
  }
  drawEffects(state.phase === 'paused' ? 0 : dt);
  ctx.restore();
  for (const s of state.game?.specials || []) {
    if (s.kind === 'crew') drawFighterSpeech(s, cantRapSpeech(s), viewScale, offsetX, offsetY);
    if (s.kind === 'giantFists') drawFighterSpeech(s, babyBigFistsSpeech(s), viewScale, offsetX, offsetY);
  }
  ctx.setTransform(canvas.width / WORLD_W, 0, 0, canvas.height / WORLD_H, 0, 0);
  for (const label of state.labels.filter(l => l.big)) {
    ctx.save(); ctx.globalAlpha = Math.min(1, Math.max(0, label.life * 2)); ctx.textAlign = 'center'; ctx.font = '900 42px system-ui';
    ctx.strokeStyle = '#171326'; ctx.lineWidth = 6; ctx.strokeText(label.text, 640, 105); ctx.fillStyle = label.color; ctx.fillText(label.text, 640, 105); ctx.restore();
  }
  if (state.flash > 0) { ctx.fillStyle = `rgba(245,221,255,${state.flash * .45})`; ctx.fillRect(0, 0, WORLD_W, WORLD_H); }
  if (state.phase === 'countdown') {
    const n = state.countdown > .65 ? Math.ceil(state.countdown - .65) : 'FIGHT';
    ctx.textAlign = 'center'; ctx.font = `900 ${n === 'FIGHT' ? 94 : 116}px system-ui`; ctx.strokeStyle = '#17152e'; ctx.lineWidth = 11; ctx.strokeText(n, 640, 330); ctx.fillStyle = '#ffe4ab'; ctx.fillText(n, 640, 330);
  }
}

function loop(now) {
  const dt = Math.min(.16, (now - (state.last || now)) / 1000); state.last = now; state.time += dt;
  if (state.toastTimer > 0) { state.toastTimer -= dt; if (state.toastTimer <= 0 && $('toast')) $('toast').hidden = true; }
  state.shake = Math.max(0, state.shake - dt * 25); state.flash = Math.max(0, state.flash - dt);
  if (state.phase === 'countdown') { state.countdown -= dt; if (state.countdown <= 0) { setPhase('playing'); $('phaseText').textContent = 'Round 1 · land hits to charge'; } }
  if (state.phase === 'playing') {
    state.accumulator = (state.accumulator || 0) + dt;
    let steps = 0;
    while (state.accumulator >= 1 / 60 && steps < 10) {
      const meterBefore = state.game.fighters[0].meter;
      state.game.update(1 / 60, { moveX: movementAxis(), block: controlHeld('block'), ...pressed, jumpPressed: jumpQueue > 0, specialPressed: pressed.specialPressed || state.specialBuffer > 0, punchPressed: pressed.punchPressed || controlHeld('punch'), kickPressed: pressed.kickPressed || controlHeld('kick') });
      jumpQueue = Math.max(0, jumpQueue - 1);
      state.specialBuffer = Math.max(0, (state.specialBuffer || 0) - 1 / 60);
      if (meterBefore >= 100 && state.game.fighters[0].meter < 100) state.specialBuffer = 0;
      Object.keys(pressed).forEach(k => pressed[k] = false);
      state.accumulator -= 1 / 60; steps++;
    }
    processEvents(); sound.tick(); updateHUD();
    if (state.game.over) { state.resultDelay += dt; if (state.resultDelay > .9) showResults(); }
  }
  draw(dt); requestAnimationFrame(loop);
}

selectFighter('owl'); setPhase('select'); requestAnimationFrame(loop);
loadAssets().catch(error => { console.error(error); $('startFight').textContent = 'Reload to retry'; showToast('The fighter art did not load. Please refresh to retry.', 30); });

// A small read-only snapshot helps verify the prototype without affecting combat.
window.micClashSnapshot = () => ({ phase: state.phase, selected: state.selected, fighters: state.game?.fighters.map(f => ({ id: f.id, type: f.type, x: Math.round(f.x), y: Math.round(f.y), hp: f.hp, meter: f.meter, state: f.state })), over: state.game?.over, winner: state.game?.winner });
