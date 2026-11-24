import {QUEENBEE,queenbeePose,drawBeeSpecial} from './queenbee.js';
import {SNOW,snowPose,drawSnowSpecial,drawBlizzard} from './yung-snow.js?v=snow-recovery-20261124';
import {BOAT,boatPose,drawBoatSpecial} from './boat.js';
import {TRINI,triniPose,drawTriniSpecial,drawTriniWhip} from './trini-gold.js';
import {TREE,treePose,drawTreeSpecial} from './tree-a-yawl.js';
import {SABER,saberPose,drawSaberSlash} from './ooou-saber.js';
import { FUED, fuedPose, drawFuedBoard } from './fued-fam.js?v=snow-20261124';
import { CHARLES, charlesPose, drawCharlesSpray } from './charles.js';
import {NEON_FIGHTERS,NEON_KINDS,neonPose} from './neon-fighters.js';
import {createNeonRenderer} from './neon-renderer.js';
import { ASCENSION_FIGHTERS, ASCENSION_KINDS, ascensionPose } from './ascension-fighters.js';
import { createAscensionRenderer } from './ascension-renderer.js';
import { GAUNTLET_FIGHTERS, GAUNTLET_KINDS, gauntletPose } from './gauntlet-fighters.js';
import { createGauntletRenderer } from './gauntlet-renderer.js';
import { LocalControllers } from './controllers.js?v=snow-20261124';
import { RUSH_FIGHTERS, RUSH_KINDS, rushPose } from './rush-fighters.js';
import { createRushRenderer } from './rush-renderer.js';
import { EXECUTIVE_FIGHTERS, EXECUTIVE_KINDS, executivePose } from './executive-fighters.js';
import { createExecutiveRenderer } from './executive-renderer.js';
import { NAIL_PIERCE, ocrrrrrPose, nailSegments } from './ocrrrrr.js';
import { DEMON_CREW, demonPose } from './demon.js';
import { ELEVATOR_DROP, cranesPose } from './cranes.js';
import { COW_MODE, moojaPose } from './mooja.js';
import { GIANT_FISTS, babyBigFistsPose, babyBigFistsSpeech } from './baby-big-fists.js';
import { CombatGame } from './combat.js?v=queenbee-test';
import { smackPrincePose, SMACK_UPGRADE } from './smack-prince.js';
import { cantRapPose, cantRapSpeech } from './cant-rap.js';

import {OnlineRoom, RemoteInput, makeSnapshot, applySnapshot, validCode, FighterSmoothing, readSavedRoom, saveRoom} from './online-recovery.js?v=room-recovery-4';

const $ = id => document.getElementById(id);
const META = {
  queenbee:QUEENBEE,
  yungsnow:SNOW,
  boat:BOAT,
  trinigold:TRINI,
  treeyawl:TREE,
  ooousaber:SABER,
  fuedfam: FUED,
  charles: CHARLES,
 ...Object.fromEntries(Object.entries(NEON_FIGHTERS).map(([k,f])=>[k,{...f,color:k==='redrolls'?'#ff5353':'#c487ff',glow:'rgba(180,70,255,.4)'}])),
  eynakeast: {name:'Eynak East', special:'Ghost Ascension', color:'#ce94ff', glow:'rgba(170,70,255,.4)'},
  goat: {name:'GOAT', special:'The Sign', color:'#ffdf72', glow:'rgba(255,209,70,.4)'},
  taytay: {name:'TayTay', special:'Travy!!!', color:'#ffe455', glow:'rgba(255,222,75,.4)'},
  bigmumble: { name: 'Big Mumble', special: 'Face Shot!', color: '#e8b8ff', glow: 'rgba(190,95,255,.4)' },
  djbeigey: { name: 'DJ Beigey', special: 'Rolls Royce Runover', color: '#ff80d5', glow: 'rgba(255,70,190,.4)' },
  nobuttons: { name: 'No Buttons', special: 'Prize Picks!', color: '#ffe963', glow: 'rgba(255,213,60,.4)' },
  quickfast: { name: 'Quick Fast', special: 'Quick Fast Rush', color: '#ffe544', glow: 'rgba(255,70,80,.4)' },
  sassyt: { name: 'Sassy T', special: 'SLIIIIME!', color: '#ff70ce', glow: 'rgba(255,70,190,.4)' },
  jminors: { name: 'J Minors', special: 'The Chase', color: '#efbe85', glow: 'rgba(231,171,85,.4)' },
  president: { name: 'The President', special: 'Executive Airstrike', color: '#91baff', glow: 'rgba(82,135,255,.4)' },
  owhinny: { name: 'O’whinny', special: 'Money Rain', color: '#ffdc78', glow: 'rgba(255,196,70,.4)' },
  roboking: { name: 'RoboKing', special: 'Cybertruck Protocol', color: '#76e9ff', glow: 'rgba(66,206,255,.4)' },
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
  ocrrrrr: { name: 'Ocrrrrr!', special: 'Nail Pierce', color: '#ff72ba', glow: 'rgba(255,53,155,.4)' },
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
Object.assign(state, { mode: 'cpu', selectingPlayer: 0, playersReady: [false, false] });
const controllers = new LocalControllers();
const net = {status:'Create a room or enter a friend’s code.', localReady:false, remoteReady:false,
  remoteFighter:null, match:0, remote:new RemoteInput(), lastSnapshot:0, lastInput:0, lastHeld:'', lastHud:0, smooth:new FighterSmoothing()};
const onlineGuest = () => state.mode === 'online' && room.role === 'guest';
const humanVersus = () => state.mode !== 'cpu';
const ownIndex = () => onlineGuest() ? 1 : 0;
const room = new OnlineRoom({
  onStatus(message) { net.status = message; rememberOnlineRoom(); updateLobby(); },
  onMessage: receiveOnline,
  onDisconnect(message) {
    resetOnline();
    if (state.mode === 'online') { showSelection(true); showToast(message, 5); }
  }
});
const ROOM_STORAGE_KEY='celebrity-gauntlet:room:v2:'+location.pathname.replace(/index\.html$/,'').replace(/\/$/,'');
function getRoomStorage(kind){try{return window[kind];}catch{return null;}}
function rememberOnlineRoom(){
  if(!room.role||!validCode(room.code))return;
  saveRoom(getRoomStorage('sessionStorage'),ROOM_STORAGE_KEY,room,state.selected);
  if(room.role==='host')saveRoom(getRoomStorage('localStorage'),ROOM_STORAGE_KEY,room,state.selected);
}
function clearOnlineRoom(){
  const local=getRoomStorage('localStorage'),saved=readSavedRoom(local,ROOM_STORAGE_KEY);
  saveRoom(getRoomStorage('sessionStorage'),ROOM_STORAGE_KEY,null);
  if(room.role==='host'&&saved?.code===room.code)saveRoom(local,ROOM_STORAGE_KEY,null);
  const url=new URL(location.href);
  if(url.searchParams.has('room')){url.searchParams.delete('room');try{history.replaceState(null,'',url.href);}catch{}}
}
function resumeOnlineRoom(){
  if(state.mode==='online'&&room.role){rememberOnlineRoom();room.resume();}
}
function resetOnline() {
  net.localReady = net.remoteReady = false;
  net.remoteFighter = null; net.match = 0; net.remote.reset(); resetNetworkFrames();
}
function resetNetworkFrames() {
  net.lastSnapshot = net.lastInput = net.lastHud = 0;
  net.lastHeld = ''; net.smooth.reset();
}
function roomSelection() {
  rememberOnlineRoom();
  room.send({type:'selection',fighter:state.selected,ready:net.localReady && state.ready});
}
function renderOnlineLobby() {
  const enabled = state.mode === 'online';
  $('onlineLobby').hidden = !enabled;
  $('onlineMode').setAttribute('aria-pressed', String(enabled));
  if (!enabled) return;
  $('onlineStatus').textContent = net.status;
  $('onlineCode').textContent = room.code ? 'ROOM: ' + room.code : '';
  $('onlineInvite').hidden = room.role !== 'host';
  $('onlineInvite').disabled = !room.code;
  $('onlineInvite').textContent = navigator.share ? 'Share link' : 'Copy link';
  $('onlineLeave').hidden = !room.role;
  $('onlineSetup').hidden = !!room.role;
  $('onlineConnected').hidden = !room.role;
  $('onlineCreate').disabled = !!room.role;
  $('onlineJoin').disabled = !!room.role;
  $('onlineCodeInput').disabled = !!room.role;
  $('onlinePlayers').hidden = !room.role;
  $('onlineYou').textContent = META[state.selected].name;
  $('onlineOpponent').textContent = net.remoteFighter ? META[net.remoteFighter].name : 'Waiting';
  $('onlineYouReady').textContent = net.localReady ? 'READY' : 'Not ready';
  $('onlineOpponentReady').textContent = net.remoteReady ? 'READY' : 'Not ready';
  $('onlinePlayers').dataset.youReady = String(net.localReady);
  $('onlinePlayers').dataset.opponentReady = String(net.remoteReady);
  $('startFight').disabled = !state.ready || !room.connected;
  $('startFight').textContent = !state.ready ? 'Loading fighters…' : !room.connected ? 'Connect to a room' : net.localReady ? 'Cancel ready' : 'Ready to fight';
  $('selectionInstructions').textContent = 'Online 1v1 · Choose your fighter and ready up.';
  $('rematchButton').disabled = false;
  $('restartButton').disabled = false;
}
function maybeStartOnline() {
  if (state.mode !== 'online' || room.role !== 'host' || !room.connected || state.phase !== 'select' ||
      !state.ready || !net.localReady || !net.remoteReady || !Object.hasOwn(META, net.remoteFighter)) return;
  net.match += 1; net.remote.reset(); resetNetworkFrames();
  if (!room.send({type:'start',match:net.match,p1:state.selected,p2:net.remoteFighter})) return;
  net.localReady = net.remoteReady = false;
  beginFight(state.selected, net.remoteFighter);
}
function receiveOnline(message) {
  if (state.mode !== 'online') return;
  if (message.type === 'hello') { roomSelection(); return; }
  if (message.type === 'selection' && state.phase === 'select' && Object.hasOwn(META, message.fighter)) {
    net.remoteFighter = message.fighter; net.remoteReady = message.ready === true;
    updateLobby(); maybeStartOnline(); return;
  }
  if (message.type === 'start' && onlineGuest() && state.phase === 'select' && state.ready &&
      Number.isSafeInteger(message.match) && message.match > net.match &&
      Object.hasOwn(META, message.p1) && Object.hasOwn(META, message.p2)) {
    net.match = message.match; net.remoteFighter = message.p1; state.selected = message.p2;
    net.localReady = net.remoteReady = false;
    beginFight(message.p1, message.p2); return;
  }
  if (message.match !== net.match || !net.match) return;
  if (message.type === 'input' && room.role === 'host' && state.phase === 'playing') {
    net.remote.receive(message.input); return;
  }
  if (message.type === 'snapshot' && onlineGuest() && state.game &&
      ['countdown','playing','result'].includes(message.phase) &&
      applySnapshot(state.game, message.game, ROSTER)) {
    const receivedAt = performance.now();
    net.smooth.receive(state.game.fighters, receivedAt);
    if (Number.isFinite(message.countdown)) state.countdown = Math.max(0, message.countdown);
    if (message.phase !== state.phase) {
      if (message.phase === 'result') showResults();
      else { setPhase(message.phase); $('phaseText').textContent = message.phase === 'playing' ? 'Round 1 · land hits to charge' : 'Get ready'; }
    }
    if (receivedAt - net.lastHud >= 40 || state.phase !== 'playing') { updateHUD(); net.lastHud = receivedAt; }
    return;
  }
  if (message.type === 'events' && onlineGuest() && state.game && Array.isArray(message.events) && message.events.length <= 128) {
    state.game.events.push(...message.events.filter(event => event && typeof event.type === 'string'));
    processEvents(); return;
  }
  if (message.type === 'lobby' && state.phase === 'result') {
    showSelection(true);
    if (room.role === 'host') room.send({type:'lobby',match:net.match});
    roomSelection();
  }
}
function onlineSnapshot(now) {
  if (state.mode !== 'online' || room.role !== 'host' || !room.connected || !state.game ||
      now - net.lastSnapshot < 1000 / 25) return;
  net.lastSnapshot = now;
  room.send({type:'snapshot',match:net.match,phase:state.phase,countdown:state.countdown,
    game:makeSnapshot(state.game)}, {snapshot:true});
}
function localInput(pad, guest = false) {
  return {moveX:pad.moveX || movementAxis(), block:pad.block || controlHeld('block'),
    jumpPressed:pad.jumpPressed || jumpQueue > 0,
    specialPressed:pad.specialPressed || pressed.specialPressed || (!guest && state.specialBuffer > 0),
    punchPressed:pad.punchPressed || pressed.punchPressed || controlHeld('punch'),
    kickPressed:pad.kickPressed || pressed.kickPressed || controlHeld('kick')};
}
function leaveOnline() {
  clearOnlineRoom(); room.close(); resetOnline();
  net.status = 'Create a room or enter a friend’s code.';
  showSelection(true);
}
$('onlineMode').addEventListener('click', () => setMode('online'));
$('onlineCreate').addEventListener('click', () => { resetOnline(); room.open('host'); });
function joinRoomFromCode() {
  const field = $('onlineCodeInput');
  const code = field.value.trim().toUpperCase();
  field.value = code; field.blur(); syncViewport();
  resetOnline(); room.open('guest', code);
}
$('onlineJoin').addEventListener('click', joinRoomFromCode);
$('onlineCodeInput').addEventListener('keydown', event => {
  if (event.key === 'Enter' && !$('onlineJoin').disabled) {
    event.preventDefault(); joinRoomFromCode();
  }
});
$('onlineLeave').addEventListener('click', leaveOnline);
$('onlineInvite').addEventListener('click', async () => {
  if(!room.code||room.role!=='host')return;
  rememberOnlineRoom();
  const code=room.code,url=new URL(location.href);url.searchParams.set('room',code);
  if(navigator.share){
    try{await navigator.share({title:'Celebrity Gauntlet',text:'Fight me! Room code: '+code,url:url.href});
      if(room.code===code){net.status='Invite shared. Return here to play.';updateLobby();}return;
    }catch(error){if(error?.name==='AbortError')return;}
  }
  try{await navigator.clipboard.writeText(url.href);if(room.code===code)net.status='Invite copied. Send it to your opponent.';}
  catch{if(room.code===code)net.status='Share this room code: '+code;}
  updateLobby();
});
// Preserve room identity on backgrounding or browser eviction; only explicit
// Leave or switching modes forgets a room.
window.addEventListener('pagehide',rememberOnlineRoom);
window.addEventListener('pageshow',resumeOnlineRoom);
window.addEventListener('focus',resumeOnlineRoom);
document.addEventListener('visibilitychange',()=>{if(document.hidden)rememberOnlineRoom();else resumeOnlineRoom();});
const CARD_ORDER = [...document.querySelectorAll('[data-fighter]')].map(el => el.dataset.fighter);
const neonRenderer=createNeonRenderer(ctx,frame,()=>state.assets,GROUND);
const ascensionRenderer = createAscensionRenderer(ctx, frame, () => state.assets, GROUND);
const gauntletRenderer = createGauntletRenderer(ctx, frame, () => state.assets, GROUND);
const rushRenderer = createRushRenderer(ctx, frame, () => state.assets, GROUND);
const executiveRenderer = createExecutiveRenderer(ctx, frame, () => state.assets, GROUND);
const held = new Set();
const pointers = new Map();
const pressed = { jumpPressed: false, punchPressed: false, kickPressed: false, specialPressed: false };
let jumpQueue = 0;
const frameCache = new Map();
const analogStick = $('analogStick'), analogKnob = $('analogKnob');
const analog = { pointerId: null, pointerType: '', touchId: null, axis: 0 };

function resetAnalog() {
  const pointerId = analog.pointerId;
  analog.pointerId = null; analog.pointerType = ''; analog.touchId = null; analog.axis = 0;
  if (!analogStick) return;
  analogStick.style.setProperty('--stick-x', '0px');
  analogStick.style.setProperty('--stick-y', '0px');
  analogStick.classList.remove('is-active');
  analogStick.dataset.axis = '0';
  analogStick.setAttribute('aria-valuenow', '0');
  analogStick.setAttribute('aria-valuetext', 'Centered');
  try { if (pointerId !== null && analogStick.hasPointerCapture(pointerId)) analogStick.releasePointerCapture(pointerId); } catch { /* The browser may have already ended this pointer. */ }
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
  if (state.phase !== 'playing' || state.game?.roundEnding || state.game?.over || state.game?.fighters[ownIndex()].grabbedBy || state.game?.fighters[ownIndex()].beltHeldBy) return;
  const presenting = state.game.isPresenting(state.game.fighters[ownIndex()]);
  if (presenting && (action === 'punch' || action === 'kick')) return;
  if (action === 'jump') jumpQueue = Math.min(2, jumpQueue + 1);
  if (action === 'punch') pressed.punchPressed = true;
  if (action === 'kick') pressed.kickPressed = true;
  if (action === 'special') {
    if (presenting) showToast(`${META[state.game.fighters[ownIndex()].type].special} is still playing.`, 1.5);
    else if (state.game.fighters[ownIndex()].meter < 100) showToast(state.game.fighters[ownIndex()].type==='trinigold' ? 'Land chain whips and kicks to fill your special meter.' : ['treeyawl', 'getit', 'dr-no-bunnies', 'smackprince', 'mooja', 'ocrrrrr', 'sassyt', 'czr'].includes(state.game.fighters[ownIndex()].type) ? 'Land slaps and kicks to fill your special meter.' : ['quickfast','bigmumble'].includes(state.game.fighters[ownIndex()].type) ? 'Land headbutts and kicks to fill your special meter.' : 'Land punches and kicks to fill your special meter.', 1.5);
    else if (state.game.fighters[ownIndex()].type === 'dr-no-bunnies' && (Math.abs(state.game.fighters[ownIndex()].x - state.game.fighters[1-ownIndex()].x) > 285 || Math.abs(state.game.fighters[ownIndex()].y - state.game.fighters[1-ownIndex()].y) > 112)) showToast('Move closer for the belt slap. Your full meter is saved.', 1.8);
    else if (state.game.fighters[ownIndex()].type === 'smackprince' && (Math.abs(state.game.fighters[ownIndex()].x - state.game.fighters[1-ownIndex()].x) > SMACK_UPGRADE.range || Math.abs(state.game.fighters[ownIndex()].y - state.game.fighters[1-ownIndex()].y) > 112)) showToast('Move closer for The Smack Upgrade. Your full meter is saved.', 1.8);
    else if (state.game.fighters[ownIndex()].type === 'babybigfists' && (Math.abs(state.game.fighters[ownIndex()].x - state.game.fighters[1-ownIndex()].x) > GIANT_FISTS.range || Math.abs(state.game.fighters[ownIndex()].y - state.game.fighters[1-ownIndex()].y) > 112)) showToast('Move closer for Giant Fists. Your full meter is saved.', 1.8);
    else { pressed.specialPressed = true; state.specialBuffer = .65; }
  }
}

class Sound {
  constructor() {
    this.context = null; this.nextBeat = 0; this.beat = 0; this.shouts = new Map();
    this.travyBytes = fetch(new URL('./assets/taytay-travy.mp3', import.meta.url))
      .then(r => { if (!r.ok) throw new Error('Voice unavailable'); return r.arrayBuffer(); }).catch(() => null);
    this.prizeBytes = fetch(new URL('./assets/nobuttons-prize-picks.mp3', import.meta.url))
      .then(r => { if (!r.ok) throw new Error('Voice unavailable'); return r.arrayBuffer(); }).catch(() => null);
    this.slimeBytes = fetch(new URL('./assets/sassyt-slime.mp3', import.meta.url))
      .then(r => { if (!r.ok) throw new Error('Voice unavailable'); return r.arrayBuffer(); }).catch(() => null);
  }
  enable(on) {
    if (on) {
      this.context ||= new (window.AudioContext || window.webkitAudioContext)();
      this.context.resume().catch(() => {});
      this.nextBeat = this.context.currentTime + .1;
      this.travyDecode ||= this.travyBytes.then(bytes => bytes && this.context.decodeAudioData(bytes))
        .then(buffer => { this.travyBuffer = buffer; canvas.dataset.travyAudio = buffer ? 'ready' : 'unavailable'; }).catch(() => { canvas.dataset.travyAudio = 'unavailable'; });
      this.prizeDecode ||= this.prizeBytes.then(bytes => bytes && this.context.decodeAudioData(bytes))
        .then(buffer => { this.prizeBuffer = buffer; canvas.dataset.prizeAudio = buffer ? 'ready' : 'unavailable'; }).catch(() => { canvas.dataset.prizeAudio = 'unavailable'; });
      this.slimeDecode ||= this.slimeBytes.then(bytes => bytes && this.context.decodeAudioData(bytes))
        .then(buffer => { this.slimeBuffer = buffer; canvas.dataset.slimeAudio = buffer ? 'ready' : 'unavailable'; }).catch(() => { canvas.dataset.slimeAudio = 'unavailable'; });
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
  slime(fighter) {
    if (!state.audio || !this.context || !this.slimeBuffer) return;
    this.stopYell(fighter);
    const voice = this.context.createBufferSource(), volume = this.context.createGain();
    voice.buffer = this.slimeBuffer; volume.gain.value = .75;
    voice.connect(volume).connect(this.context.destination); voice.start();
    this.shouts.set(fighter, {volume, nodes:[voice]});
    canvas.dataset.lastVoice = 'SLIIIIME!';
    voice.onended = () => { if (this.shouts.get(fighter)?.nodes[0] === voice) this.shouts.delete(fighter); };
  }
  prizePicks(fighter) {
    if (!state.audio || !this.context || !this.prizeBuffer) return;
    this.stopYell(fighter);
    const voice = this.context.createBufferSource(), volume = this.context.createGain();
    voice.buffer = this.prizeBuffer; volume.gain.value = .75;
    voice.connect(volume).connect(this.context.destination); voice.start();
    this.shouts.set(fighter, {volume, nodes:[voice]});
    canvas.dataset.lastVoice = 'Prize Picks!';
    voice.onended = () => { if (this.shouts.get(fighter)?.nodes[0] === voice) this.shouts.delete(fighter); };
  }
  travy(fighter) {
    if (!state.audio || !this.context || !this.travyBuffer) return;
    this.stopYell(fighter);
    const voice = this.context.createBufferSource(), volume = this.context.createGain();
    voice.buffer = this.travyBuffer; volume.gain.value = .75;
    voice.connect(volume).connect(this.context.destination); voice.start();
    this.shouts.set(fighter, {volume, nodes:[voice]});
    canvas.dataset.lastVoice = 'Travy!!!';
    voice.onended = () => { if (this.shouts.get(fighter)?.nodes[0] === voice) this.shouts.delete(fighter); };
  }
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
  const response = await fetch(new URL('./assets/atlas.json?v=queenbee-test', import.meta.url));
  if (!response.ok) throw new Error('The sprite map could not be loaded.');
  const atlas = await response.json();
  await Promise.all(Object.values(atlas).filter(v => v && v.src).map(async entry => {
    const img = new Image(); img.decoding = 'async';
    await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; img.src = new URL(entry.src, import.meta.url).href; });
    entry.image = img;
  }));
  state.assets = atlas;
  state.ready = true;
  updateLobby();
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

function selectFighter(type, player = state.selectingPlayer) {
  if (!META[type]) return;
  if (state.mode !== 'local') player = 0;
  state[player ? 'opponent' : 'selected'] = type;
  state.playersReady[player] = false;
  document.querySelectorAll('[data-fighter]').forEach(el => {
    const p1 = el.dataset.fighter === state.selected;
    const p2 = state.mode === 'local' && el.dataset.fighter === state.opponent;
    const selected = p1 || p2;
    el.classList.toggle('selected', selected); el.classList.toggle('is-selected', selected); el.setAttribute('aria-pressed', String(selected));
    el.classList.toggle('selected-p1', p1); el.classList.toggle('selected-p2', p2);
    el.querySelector('.selected-mark').textContent = state.mode === 'local' ? [p1 && 'P1', p2 && 'P2'].filter(Boolean).join(' + ') : '✓';
  });
  const p = $('selectedName'); if (p) p.textContent = META[state.selected].name;
  if (!META[state.opponent] || (state.mode === 'cpu' && state.opponent === state.selected)) state.opponent = ROSTER.find(other => other !== state.selected);
  const opponentSelect = $('opponentSelect');
  if (opponentSelect) {
    for (const option of opponentSelect.options) {
      option.hidden = state.mode === 'cpu' && option.value === state.selected;
      option.disabled = option.hidden;
    }
    opponentSelect.value = state.opponent;
  }
  if (state.mode === 'online') { net.localReady = false; roomSelection(); }
  updateLobby();
}
let lobbySignature = '';
function updateLobby() {
  const local = state.mode === 'local';
  const signature = JSON.stringify([state.mode, state.phase, state.ready, state.selected, state.opponent,
    state.selectingPlayer, state.playersReady, controllers.available, controllers.unsupported,
    controllers.slots.map(s => s && [s.index, s.connected]), net.status, net.localReady, net.remoteReady, net.remoteFighter, room.role, room.code, room.connected]);
  if (signature === lobbySignature) return;
  lobbySignature = signature;
  document.body.dataset.mode = state.mode;
  $('selectionScreen').classList.toggle('local-mode', local);
  $('localLobby').hidden = !local;
  $('cpuMode').setAttribute('aria-pressed', String(state.mode === 'cpu'));
  $('localMode').setAttribute('aria-pressed', String(local));
  const needsPads = local && !controllers.bothConnected();
  $('startFight').disabled = !state.ready || needsPads;
  $('startFight').textContent = !state.ready ? 'Loading fighters…' : needsPads ? 'Join two controllers' : local ? 'Start local fight' : 'Start fight';
  $('rematchButton').disabled = needsPads;
  $('restartButton').disabled = needsPads;
  for (let i = 0; i < 2; i++) {
    const slot = controllers.slots[i];
    $(`localName${i + 1}`).textContent = META[i ? state.opponent : state.selected].name;
    $(`localStatus${i + 1}`).textContent = slot?.connected ? state.playersReady[i] ? 'READY' : 'Joined · A / × to ready' : slot ? 'Disconnected · press A / ×' : 'Press A / × to join';
    $(`playerSlot${i + 1}`).setAttribute('aria-pressed', String(state.selectingPlayer === i));
    $(`playerSlot${i + 1}`).classList.toggle('is-ready', state.playersReady[i]);
  }
  $('controllerHelp').textContent = !controllers.available ? 'This browser cannot read controllers. Open the game in a browser with controller support.'
    : controllers.unsupported ? 'A controller has an unrecognized layout. Use a standard Xbox or PlayStation-compatible controller.'
    : 'A / × joins and readies. ← / → picks a fighter. B / ○ cancels ready.';
  $('selectionInstructions').textContent = local ? 'Two controllers. Same device. Player vs player.'
    : controllers.connected(0) ? 'Controller: ← / → fighter · A / × start · Y / △ local 2P' : 'Touch, keyboard, or press A / × on a controller.';
  const missing = [0, 1].filter(i => !controllers.connected(i)).map(i => `P${i + 1}`).join(' & ');
  $('controllerNotice').hidden = !local || !missing || !['playing', 'countdown', 'paused', 'result'].includes(state.phase);
  $('controllerNotice').textContent = `${missing}: reconnect and press A / ×. Use Pause to stop the fight.`;
  renderOnlineLobby();
}
function setMode(mode) {
  if (state.phase !== 'select' || !['cpu', 'local', 'online'].includes(mode) || state.mode === mode) return;
  if (state.mode === 'online') { clearOnlineRoom(); room.close(); resetOnline(); net.status = 'Create a room or enter a friend’s code.'; }
  state.mode = mode; resize(); state.selectingPlayer = 0; state.playersReady = [false, false];
  controllers.reset(); clearInput();
  selectFighter(state.selected, 0);
}
function controllerMenus(menus) {
  if (menus.some(m => m.pause)) {
    if (state.phase === 'paused') {
      if (!$('helpScreen').hidden) $('closeHelpButton').click(); else resumeFight();
    } else if (['playing', 'countdown'].includes(state.phase)) pause();
    return;
  }
  if (state.phase === 'select') {
    if (menus[0].mode) { setMode(state.mode === 'cpu' ? 'local' : state.mode === 'local' ? 'online' : 'cpu'); return; }
    for (let i = 0; i < (state.mode === 'local' ? 2 : 1); i++) {
      const menu = menus[i];
      if (menu.cancel) state.playersReady[i] = false;
      const step = menu.x || menu.y;
      if (step) {
        const current = state[i ? 'opponent' : 'selected'];
        const next = CARD_ORDER[(CARD_ORDER.indexOf(current) + step + CARD_ORDER.length) % CARD_ORDER.length];
        selectFighter(next, i);
        document.querySelector(`[data-fighter="${next}"]`).scrollIntoView({ block: 'nearest' });
      }
      if (menu.confirm && state.ready) {
        if (state.mode === 'local') state.playersReady[i] = !state.playersReady[i];
        else { startFight(); return; }
      }
    }
    updateLobby();
    if (state.mode === 'local' && state.playersReady.every(Boolean) && controllers.bothConnected()) startFight();
    return;
  }
  if (!['paused', 'result'].includes(state.phase)) return;
  const menu = menus.find(m => m.confirm || m.cancel || m.x || m.y);
  if (!menu) return;
  if (menu.cancel && state.phase === 'paused') {
    if (!$('helpScreen').hidden) $('closeHelpButton').click(); else resumeFight();
    return;
  }
  const screen = !$('helpScreen').hidden ? $('helpScreen') : state.phase === 'paused' ? $('pauseScreen') : $('resultScreen');
  const buttons = [...screen.querySelectorAll('button')].filter(b => !b.disabled && b.getClientRects().length);
  if (!buttons.length) return;
  let index = buttons.indexOf(document.activeElement);
  if (menu.x || menu.y) index = (Math.max(0, index) + (menu.y || menu.x) + buttons.length) % buttons.length;
  else if (index < 0) index = 0;
  document.querySelectorAll('.pad-focus').forEach(el => el.classList.remove('pad-focus'));
  buttons[index].classList.add('pad-focus'); buttons[index].focus({ preventScroll: true });
  buttons[index].scrollIntoView({ block: 'nearest' });
  if (menu.confirm) buttons[index].click();
}
function pollControllers(dt) {
  const { menus, events } = controllers.poll(dt, { playing: state.phase === 'playing',
    active: !document.hidden && document.hasFocus(), capacity: state.mode === 'local' ? 2 : 1 });
  for (const event of events) if (event.type === 'disconnected') state.playersReady[event.player] = false;
  updateLobby();
  controllerMenus(menus);
}

function setPhase(phase) {
  if (phase !== 'select' && document.activeElement?.matches('input, textarea, [contenteditable="true"]')) {
    document.activeElement.blur();
    syncViewport();
  }
  if (['select', 'paused', 'result'].includes(phase)) sound.stopYells();
  state.phase = phase; state.accumulator = 0; state.specialBuffer = 0; canvas.dataset.phase = phase;
  document.body.dataset.phase = phase;
  $('selectionScreen').hidden = phase !== 'select';
  $('resultScreen').hidden = phase !== 'result';
  if ($('pauseScreen')) $('pauseScreen').hidden = phase !== 'paused';
  if ($('helpScreen')) $('helpScreen').hidden = true;
  if ($('pauseButton')) {
    $('pauseButton').disabled = !['playing', 'countdown', 'paused'].includes(phase);
    $('pauseButton').setAttribute('aria-label', state.mode === 'online' ? 'Leave online match' : 'Pause game and open options');
    $('pauseButton').title = state.mode === 'online' ? 'Leave online match' : 'Pause and options';
  }
  analogStick?.setAttribute('aria-disabled', String(phase !== 'playing'));
  clearInput();
  if (phase !== 'playing') controllers.suspend();
  document.querySelectorAll('.pad-focus').forEach(el => el.classList.remove('pad-focus'));
  updateLobby();
}
function startFight() {
  if (state.mode === 'online') {
    if (state.phase === 'result') { showSelection(); return; }
    if (state.phase !== 'select' || !state.ready || !room.connected) return;
    net.localReady = !net.localReady; roomSelection(); updateLobby(); maybeStartOnline(); return;
  }
  beginFight();
}
function beginFight(p1 = state.selected, p2 = state.opponent) {
  if (!state.ready || (state.mode === 'local' && !controllers.bothConnected())) return;
  state.game = new CombatGame(p1, p2, { localMultiplayer: humanVersus() });
  if (state.mode === 'online') resetNetworkFrames();
  state.playersReady = [false, false];
  const opponent = state.game.fighters[1].type;
  state.cameraX = 640; state.cameraWidth = 1280;
  document.documentElement.style.setProperty('--p1-accent', META[p1].color);
  document.documentElement.style.setProperty('--p2-accent', META[opponent].color);
  state.particles = []; state.labels = []; state.resultDelay = 0; state.countdown = 2.8; state.shake = 0;
  $('p1Name').textContent = (humanVersus() ? 'P1 · ' : '') + (META[p1].hudName || META[p1].name);
  $('p2Name').textContent = (humanVersus() ? 'P2 · ' : '') + (META[opponent].hudName || META[opponent].name);
  document.querySelector('#p1Card .player-role').textContent = state.mode === 'online' ? (onlineGuest() ? 'OPPONENT' : 'YOU') : state.mode === 'local' ? 'P1' : 'YOU';
  document.querySelector('#p2Card .player-role').textContent = state.mode === 'online' ? (onlineGuest() ? 'YOU' : 'OPPONENT') : state.mode === 'local' ? 'P2' : 'CPU';
  $('p1Health').setAttribute('aria-label', humanVersus() ? 'Player 1 health' : 'Your health');
  $('p2Health').setAttribute('aria-label', humanVersus() ? 'Player 2 health' : 'Opponent health');
  canvas.setAttribute('aria-label', state.mode === 'local'
    ? 'Celebrity Gauntlet local two-player arena. Each controller moves its own fighter. Menu or Options pauses the round.'
    : 'Celebrity Gauntlet fighting arena. Use the left analog stick and four action buttons, keyboard, or a controller.');
  const slaps = ['treeyawl', 'getit', 'dr-no-bunnies', 'smackprince', 'mooja', 'ocrrrrr', 'sassyt', 'czr'].includes(state.selected);
  const mic = state.selected === 'cantrap';
  document.querySelector('[data-control="punch"]')?.setAttribute('aria-label', state.selected==='trinigold' ? 'Chain whip. Keyboard J.' : ['charles','ooousaber'].includes(state.selected) ? 'Downward swipe. Keyboard J.' : ['quickfast','bigmumble'].includes(state.selected) ? 'Headbutt. Keyboard J.' : state.selected==='redrolls' ? 'Bottle strike. Keyboard J.' : mic ? 'Microphone strike. Keyboard J.' : slaps ? 'Open-hand slap. Keyboard J.' : 'Punch. Keyboard J.');
  document.querySelector('[data-control="punch"] .control-label').textContent = state.selected==='trinigold' ? 'CHAIN' : ['charles','ooousaber'].includes(state.selected) ? 'SWIPE' : ['quickfast','bigmumble'].includes(state.selected) ? 'HEADBUTT' : state.selected==='redrolls' ? 'BOTTLE' : mic ? 'MIC HIT' : slaps ? 'SLAP' : 'PUNCH';
  setPhase('countdown');
  $('phaseText').textContent = 'Get ready';
  updateHUD();
  if (state.audio) sound.enable(true);
}
function showSelection(fromRemote = false) {
  if (state.mode === 'online') {
    if (!fromRemote && room.connected && state.phase === 'result') room.send({type:'lobby',match:net.match});
    else if (!fromRemote && room.connected && state.phase !== 'select') { leaveOnline(); return; }
    net.localReady = net.remoteReady = false; net.remote.reset(); resetNetworkFrames();
  }
  state.game = null; state.particles = []; state.labels = [];
  state.playersReady = [false, false];
  setPhase('select'); $('phaseText').textContent = 'Choose your fighter';
  if ($('toast')) $('toast').hidden = true;
  if (state.mode === 'online') roomSelection();
}
function pause() {
  if (!['playing', 'countdown'].includes(state.phase)) return;
  if (state.mode === 'online') {
    if (window.confirm('Leave this online match? No result will be recorded.')) leaveOnline();
    return;
  }
  state.pausedFrom = state.phase; setPhase('paused'); $('phaseText').textContent = 'Paused';
  $('resumeButton').focus({ preventScroll: true });
}
function resumeFight() {
  if (state.phase !== 'paused') return;
  setPhase(state.pausedFrom); $('phaseText').textContent = 'Round 1';
  $('resumeButton').blur();
}
function showResults() {
  const winner = state.game.winner;
  $('resultTitle').textContent = winner === 'draw' ? 'Draw!' : state.mode === 'online' ? (winner === 'p' + (ownIndex() + 1) ? 'You win!' : 'Round lost') : state.mode === 'local' ? `Player ${winner === 'p1' ? 1 : 2} wins!` : winner === 'p1' ? 'You win!' : 'Round lost';
  const won = state.game.fighters.find(f => f.id === winner);
  $('resultMessage').textContent = won ? `${META[won.type].name} takes the round. Ready for a rematch?` : 'Both fighters held their ground. Run it back.';
  setPhase('result'); $('phaseText').textContent = 'Round complete';
}

document.querySelectorAll('[data-fighter]').forEach(el => el.addEventListener('click', () => selectFighter(el.dataset.fighter)));
$('cpuMode').addEventListener('click', () => setMode('cpu'));
$('localMode').addEventListener('click', () => setMode('local'));
for (let i = 0; i < 2; i++) $(`playerSlot${i + 1}`).addEventListener('click', () => {
  state.selectingPlayer = i; updateLobby();
});
$('opponentSelect')?.addEventListener('change', event => {
  const type = event.target.value;
  if (META[type] && type !== state.selected) state.opponent = type;
});
$('startFight').disabled = true; $('startFight').textContent = 'Loading fighters…';
$('startFight').addEventListener('click', startFight);
$('rematchButton').addEventListener('click', startFight);
$('changeFighterButton').addEventListener('click', () => showSelection());
$('backButton')?.addEventListener('click', () => showSelection());
$('pauseButton')?.addEventListener('click', pause);
$('resumeButton')?.addEventListener('click', resumeFight);
$('restartButton')?.addEventListener('click', startFight);
$('selectButton')?.addEventListener('click', () => showSelection());
$('soundButton')?.addEventListener('click', () => {
  try { state.audio = !state.audio; sound.enable(state.audio); }
  catch { state.audio = false; showToast('Sound is unavailable in this browser.'); }
  $('soundButton').setAttribute('aria-pressed', String(state.audio));
  $('soundButton').textContent = state.audio ? 'Sound on' : 'Sound off';
});
$('helpButton')?.addEventListener('click', () => {
  if (state.phase !== 'paused') return;
  $('helpScreen').hidden = false;
  $('closeHelpButton').focus({ preventScroll: true });
});
$('closeHelpButton')?.addEventListener('click', () => {
  $('helpScreen').hidden = true; $('helpButton').focus({ preventScroll: true });
});

// Full-viewport play works everywhere; offer browser fullscreen when supported.
const fullscreenButton = $('fullscreenButton');
const fullscreenRoot = document.documentElement;
fullscreenButton.hidden = !(document.fullscreenEnabled || document.webkitFullscreenEnabled)
  || !(fullscreenRoot.requestFullscreen || fullscreenRoot.webkitRequestFullscreen);
fullscreenButton.addEventListener('click', async () => {
  try {
    if (document.fullscreenElement || document.webkitFullscreenElement) {
      await (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    } else {
      await (fullscreenRoot.requestFullscreen || fullscreenRoot.webkitRequestFullscreen).call(fullscreenRoot);
    }
  } catch { showToast('Full screen is unavailable in this browser.'); }
});
for (const type of ['fullscreenchange', 'webkitfullscreenchange']) document.addEventListener(type, () => {
  fullscreenButton.textContent = document.fullscreenElement || document.webkitFullscreenElement ? 'EXIT FULL SCREEN' : 'FULL SCREEN';
  syncViewport();
});

const KEYMAP = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', ArrowUp: 'jump', KeyW: 'jump', Space: 'jump', KeyJ: 'punch', KeyK: 'kick', KeyL: 'special', KeyB: 'block' };
window.addEventListener('keydown', event => {
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName)) return;
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
  if (state.phase !== 'playing' || analog.pointerId !== null || state.game?.fighters[ownIndex()].grabbedBy) return;
  if (event.pointerType === 'mouse' && event.button !== 0) return;
  analog.pointerId = event.pointerId;
  analog.pointerType = event.pointerType;
  analog.touchId = null;
  try { analogStick.setPointerCapture(event.pointerId); } catch { /* Window listeners still track the pointer. */ }
  analogStick.classList.add('is-active');
  moveAnalog(event);
});
// Capture at window level so releasing outside the control still centers it.
window.addEventListener('pointermove', event => {
  if (event.pointerId !== analog.pointerId) return;
  if (analog.pointerType === 'mouse' && !(event.buttons & 1)) { resetAnalog(); return; }
  if (event.cancelable) event.preventDefault();
  moveAnalog(event);
}, { capture: true, passive: false });
const endAnalogPointer = event => { if (event.pointerId === analog.pointerId) resetAnalog(); };
for (const type of ['pointerup', 'pointercancel']) window.addEventListener(type, endAnalogPointer, true);
analogStick?.addEventListener('lostpointercapture', endAnalogPointer);
// iOS can omit a pointer release during multi-touch or browser gestures.
// Track the joystick finger, not the attack-button finger. Touch identifiers
// and PointerEvent pointerIds are different values.
const isStickTouch = touch => !!analogStick && analogStick.contains(touch.target);
window.addEventListener('touchstart', event => {
  if (analog.pointerType !== 'touch' || analog.touchId !== null) return;
  const touch = Array.from(event.changedTouches).find(isStickTouch);
  if (touch) analog.touchId = touch.identifier;
}, { capture: true, passive: true });
const recoverAnalogTouch = event => {
  if (analog.pointerType !== 'touch' || analog.pointerId === null) return;
  const touches = Array.from(event.touches);
  const stillHeld = analog.touchId !== null
    ? touches.some(touch => touch.identifier === analog.touchId)
    : touches.some(isStickTouch);
  if (!stillHeld) resetAnalog();
};
for (const type of ['touchend', 'touchcancel', 'touchmove']) {
  window.addEventListener(type, recoverAnalogTouch, { capture: true, passive: true });
}
window.addEventListener('pagehide', resetAnalog);
window.addEventListener('orientationchange', resetAnalog);
analogStick?.addEventListener('contextmenu', event => event.preventDefault());
// Losing focus releases held controls, but only the Pause button pauses a round.
window.addEventListener('blur', () => { clearInput(); controllers.suspend(); });
document.addEventListener('visibilitychange', () => {
  clearInput(); controllers.suspend(); state.last = 0; state.accumulator = 0;
});

const fightIsActive = () => ['playing', 'countdown'].includes(state.phase);
const onFightSurface = event => fightIsActive()
  && event.target.closest?.('.arena-frame, .control-deck, .match-hud');
// Safari can interpret rapid taps, two-thumb input and holds on labels or
// disabled buttons as page gestures. Guard the entire play surface, while
// leaving roster and pause-menu scrolling and normal button clicks available.
for (const type of ['touchstart', 'touchmove', 'touchend', 'dblclick', 'contextmenu', 'selectstart']) {
  $('gameApp').addEventListener(type, event => {
    if (onFightSurface(event) && event.cancelable) event.preventDefault();
  }, { passive: false });
}
for (const type of ['gesturestart', 'gesturechange', 'gestureend']) {
  document.addEventListener(type, event => {
    if (event.cancelable) event.preventDefault();
  }, { passive: false });
}

function resize() {
  const rect = canvas.getBoundingClientRect(); const ratio = Math.min(window.devicePixelRatio || 1, state.mode === 'online' ? 1.5 : 2);
  const w = Math.round(Math.max(1, rect.width) * ratio), h = Math.round(Math.max(1, rect.height) * ratio);
  if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
}
new ResizeObserver(resize).observe(canvas);
// Use the actual visible browser viewport, never multiply by its zoom scale.
// Focusing a room field must not scroll the selected fighter into view or
// change the arena orientation just because the on-screen keyboard opened.
let viewportQueued = false, editingOrientation = null;
const isTextEditing = () => document.activeElement?.matches('input, textarea, [contenteditable="true"]');
function resetPageOffset() {
  if (isTextEditing()) return;
  const scroller = document.scrollingElement;
  if (scroller && (scroller.scrollLeft || scroller.scrollTop)) {
    scroller.scrollLeft = 0; scroller.scrollTop = 0;
  }
  if (window.scrollX || window.scrollY) window.scrollTo(0, 0);
}
function syncViewport() {
  if (viewportQueued) return;
  viewportQueued = true;
  requestAnimationFrame(() => {
    viewportQueued = false;
    const viewport = window.visualViewport;
    const root = document.documentElement;
    const width = Math.max(1, Math.floor(root.clientWidth || window.innerWidth));
    // At 1x the visual height reflects the visible area, including iOS keyboard
    // and browser bars. Ignore accidental zoom-derived dimensions.
    const height = Math.max(1, Math.floor(viewport && Math.abs(viewport.scale - 1) < .02
      ? viewport.height : window.innerHeight));
    const orientation = isTextEditing() && editingOrientation ? editingOrientation : width > height ? 'landscape' : 'portrait';
    if (root.dataset.orientation && root.dataset.orientation !== orientation) clearInput();
    root.dataset.orientation = orientation;
    root.style.setProperty('--viewport-height', `${height}px`);
    resetPageOffset();
    resize();
  });
}
document.addEventListener('focusin', event => {
  if (event.target.matches?.('input, textarea, [contenteditable="true"]')) {
    editingOrientation = document.documentElement.dataset.orientation ||
      (window.innerWidth > window.innerHeight ? 'landscape' : 'portrait');
    syncViewport();
  }
});
document.addEventListener('focusout', event => {
  if (!event.target.matches?.('input, textarea, [contenteditable="true"]')) return;
  editingOrientation = null;
  // iOS animates keyboard dismissal; resync after the animation as well.
  syncViewport(); setTimeout(syncViewport, 100); setTimeout(syncViewport, 350);
});
window.addEventListener('resize', syncViewport);
window.visualViewport?.addEventListener('resize', syncViewport);
window.visualViewport?.addEventListener('scroll', syncViewport);
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
    $(`p${i}HpText`).textContent = String(Math.ceil(hp));
    const active = state.game.isPresenting(f);
    $(`p${i}MeterText`).textContent = active ? 'ACTIVE' : f.meter >= 100 ? 'READY' : `${Math.floor(f.meter)}%`;
    $(`p${i}Meter`).classList.toggle('ready', f.meter >= 100 && !active);
  }
  $('roundClock').textContent = Math.max(0, Math.ceil(state.game.timeRemaining)).toString().padStart(2, '0');
  const controlled = state.game.fighters[ownIndex()];
  const specialActive = state.game.isPresenting(controlled);
  const ending = !!state.game.roundEnding || state.game.over;
  const grabbed = Boolean(controlled.grabbedBy || controlled.beltHeldBy);
  document.querySelectorAll('[data-control]').forEach(button => {
    button.disabled = ending || grabbed || state.phase !== 'playing'
      || (specialActive && ['punch', 'kick', 'special'].includes(button.dataset.control));
  });
  analogStick?.setAttribute('aria-disabled', String(ending || grabbed || state.phase !== 'playing'));
  $('specialButton').disabled = controlled.meter < 100 || specialActive || ending || grabbed || state.phase !== 'playing';
  $('specialButton').classList.toggle('ready', controlled.meter >= 100 && !specialActive);
  $('specialButton').setAttribute('aria-label', specialActive ? `${META[controlled.type].special} is active. Cannot be interrupted.` : controlled.meter >= 100 ? `Use ${META[controlled.type].special}` : `Special charging: ${Math.floor(controlled.meter)} percent. Land hits to charge.`);
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
  const nails = state.game.specials.find(s => s.kind === 'nailPierce');
  canvas.dataset.nailPhase = nails?.phase || 'none';
  canvas.dataset.nailExtension = String(nails?.extension || 0);
  canvas.dataset.nailHits = String(nails?.hitCount || 0);
  canvas.dataset.nailCount = String(nails ? nailSegments(nails, state.game.fighters.find(f => f.id === nails.owner)).length : 0);
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
  const customPose = p1.type === 'queenbee' ? beeSprite(p1) : p1.type === 'yungsnow' ? snowSprite(p1) : p1.type === 'boat' ? boatSprite(p1) : p1.type === 'trinigold' ? triniSprite(p1) : p1.type === 'treeyawl' ? treeSprite(p1) : p1.type === 'ooousaber' ? saberSprite(p1) : p1.type === 'fuedfam' ? fuedSprite(p1) : p1.type === 'charles' ? charlesSprite(p1) : NEON_FIGHTERS[p1.type] ? neonSprite(p1) : ASCENSION_FIGHTERS[p1.type] ? ascensionSprite(p1) : GAUNTLET_FIGHTERS[p1.type] ? gauntletSprite(p1) : RUSH_FIGHTERS[p1.type] ? rushSprite(p1) : EXECUTIVE_FIGHTERS[p1.type] ? executiveSprite(p1) : p1.type === 'ocrrrrr' ? ocrrrrrSprite(p1) : p1.type === 'demon' ? demonSprite(p1) : p1.type === 'cranes' ? cranesSprite(p1) : p1.type === 'mooja' ? moojaSprite(p1) : p1.type === 'babybigfists' ? bigFistsSprite(p1) : p1.type === 'smackprince' ? princeSprite(p1) : p1.type === 'dr-no-bunnies' ? noBunniesSprite(p1) : p1.type === 'getit' ? getItSprite(p1) : p1.type === 'loudbull' ? loudBullSprite(p1) : p1.type === 'fatboi' ? fatBoiSprite(p1) : p1.type === 'icespice' ? iceSpiceSprite(p1) : p1.type === 'hehaw' ? hehawSprite(p1) : p1.type === 'cantrap' ? cantRapSprite(p1) : null;
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
  const events = state.game.drainEvents();
  if (events.length && state.mode === 'online' && room.role === 'host') room.send({type:'events',match:net.match,events});
  if (!state.game) return;
  for (const event of events) {
    if (event.type === 'hit') {
      const target = state.game.fighters.find(f => f.id === event.defender);
      const x = Number.isFinite(event.x) ? event.x : target?.x ?? 640;
      const y = GROUND - (target?.y || 0) - 110;
      state.shake = Math.max(state.shake, event.blocked ? 2 : event.heavy ? 8 : 4);
      particleBurst(x, y, event.blocked ? '#9de9ff' : event.kind === 'yell' ? '#e2ebff' : event.kind === 'vocal' ? '#ff7ec9' : event.kind === 'barrage' ? '#96c9ff' : '#ffd78e', event.blocked ? 5 : event.kind === 'barrage' ? 7 : 13, event.heavy ? 240 : 170);
      state.labels.push({ x, y: y - 35, text: event.blocked ? 'BLOCK' : `${event.damage}`, color: event.blocked ? '#a8edff' : event.kind === 'yell' ? '#f2f5ff' : event.kind === 'vocal' ? '#ffd4f4' : event.kind === 'barrage' ? '#b8ddff' : '#fff2d7', life: event.kind === 'barrage' ? .38 : .75 });
      if (event.style === 'slap') sound.slap(event.blocked); else sound.hit(event.heavy, event.blocked);
    }
    if (event.type === 'securityBlock') {
      particleBurst(event.x, GROUND - event.y, '#a7eaff', 10, 160); sound.hit(false, true);
      state.labels.push({ x: event.x, y: GROUND - event.y - 55, text: 'SECURITY', color: '#b4eeff', life: .65 });
    }
    if (event.type === 'travyCall') sound.travy(event.fighter);
    if (event.type === 'ghostQuake') { state.shake = Math.max(state.shake, 18); sound.tone(75, 28, .7, .08, 'sawtooth'); }
    if (event.type === 'goatWhiteout') sound.tone(880, 1760, .45, .065, 'triangle');
    if (event.type === 'prizePicks') sound.prizePicks(event.fighter);
    if (event.type === 'basketballShot') sound.tone(510,180,.16,.025,'triangle');
    if (event.type === 'royceImpact' && event.hit) sound.tone(70,190,.3,.045,'sawtooth');
    if (event.type === 'slimeThrow') { sound.slime(event.fighter); sound.noise(.08,.018); }
    if (event.type === 'executiveImpact') {
      if (event.kind === 'airstrike') { sound.noise(.38, .08); sound.tone(95, 28, .45, .08, 'triangle'); state.shake = Math.max(state.shake, 12); }
      else if (event.kind === 'moneyRain') { sound.noise(.09, .035); sound.tone(850, 380, .12, .025, 'triangle'); }
      else { sound.hit(true, false); if (event.truck) sound.tone(75, 180, .3, .045, 'sawtooth'); }
    }
    if (event.type === 'meterReady' && (event.fighter === 'p' + (ownIndex() + 1) || state.mode === 'local')) {
      const i = event.fighter === 'p1' ? 0 : 1;
      showToast(`${state.mode === 'local' ? `P${i + 1}: ` : ''}${META[state.game.fighters[i].type].special} ready!`, 2.2);
      sound.tone(440, 880, .25, .04, 'triangle');
    }
    if (event.type === 'special') {
      const fighter = state.game.fighters.find(f => f.id === event.fighter);
      const meta = META[fighter?.type || 'owl'];
      state.flash = .18; state.shake = 6;
      // Can’t Rap announces the move in his own speech bubble, including on
      // short landscape screens where a second banner would cover the call.
      if (!['crew','slime','prizeCrew','travy'].includes(event.kind)) state.labels.push({ x: 640, y: 175, text: meta.special.toUpperCase(), color: meta.color, life: 1.2, big: true });
      if (!['vocal', 'yell', 'wing', 'munch', 'horse', 'elevator', 'prizeCrew', 'travy'].includes(event.kind)) sound.tone(event.kind === 'car' ? 75 : event.kind === 'barrage' ? 300 : 440, event.kind === 'car' ? 210 : event.kind === 'barrage' ? 650 : 100, .65, .07, 'sawtooth');
      if (event.kind === 'backup') sound.siren();
    }
    if (event.type === 'nailsExtend') { sound.tone(320, 1250, .34, .035, 'triangle'); sound.noise(.12, .025); }
    if (event.type === 'nailsRetract') sound.tone(820, 250, .25, .02, 'sine');
    if (event.type === 'nailPierceHit') {
      particleBurst(event.x, GROUND - event.y, '#ffe8fa', 22, 260);
      sound.noise(.12, .06); sound.tone(950, 180, .16, .05, 'triangle'); state.shake = Math.max(state.shake, 11);
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
      controllers.clearPlayer(event.targetId === 'p1' ? 0 : 1);
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

function drawStage() {
  const rooftop = state.assets?.cityRooftop?.image;
  // Loading keeps the existing dark canvas behind the roster. Starting a
  // round waits for this background and every fighter asset to be ready.
  if (rooftop) ctx.drawImage(rooftop, 0, 0, WORLD_W, WORLD_H);
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
  const fontSize = Math.max(30 * viewScale, 23 * ratio);
  ctx.save(); ctx.font = `900 ${fontSize}px system-ui`;
  const textWidth = ctx.measureText(text).width; ctx.restore();
  const width = Math.min(canvas.width - 16 * ratio, Math.max(152 * viewScale, 104 * ratio, textWidth + 24 * ratio));
  const height = Math.max(58 * viewScale, 42 * ratio);
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
  ctx.fillStyle = '#28121c'; ctx.font = `900 ${fontSize}px system-ui`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, x + width / 2, y + height / 2);
  ctx.restore();
}

function beeSprite(f){return queenbeePose(f,state.game?.specials.find(s=>s.kind===QUEENBEE.kind&&s.owner===f.id));}
function snowSprite(f){return snowPose(f,state.game?.specials.find(s=>s.kind===SNOW.kind&&s.owner===f.id));}
function boatSprite(f){return boatPose(f,state.game?.specials.find(s=>s.kind===BOAT.kind&&s.owner===f.id));}
function triniSprite(f){return triniPose(f,state.game?.specials.find(s=>s.kind===TRINI.kind&&s.owner===f.id));}
function treeSprite(f){return treePose(f,state.game?.specials.find(s=>s.kind===TREE.kind&&s.owner===f.id));}
function saberSprite(f){return saberPose(f,state.game?.specials.find(s=>s.kind===SABER.kind&&s.owner===f.id));}
function fuedSprite(f) { return fuedPose(f,state.game?.specials.find(s=>s.kind===FUED.kind && s.owner===f.id)); }
function charlesSprite(f) { return charlesPose(f, state.game?.specials.find(s => s.kind === CHARLES.kind && s.owner === f.id)); }
function neonSprite(f){return neonPose(f,state.game?.specials.find(s=>NEON_KINDS.includes(s.kind)&&s.owner===f.id));}
function ascensionSprite(f) {
  return ascensionPose(f, state.game?.specials.find(s => ASCENSION_KINDS.includes(s.kind) && s.owner === f.id));
}
function gauntletSprite(f) {
  return gauntletPose(f, state.game?.specials.find(s => GAUNTLET_KINDS.includes(s.kind) && s.owner === f.id));
}
function rushSprite(f) {
  return rushPose(f, state.game?.specials.find(s => RUSH_KINDS.includes(s.kind) && s.owner === f.id));
}
function executiveSprite(f) {
  return executivePose(f, state.game?.specials.find(s => EXECUTIVE_KINDS.includes(s.kind) && s.owner === f.id));
}

function ocrrrrrSprite(f) {
  return ocrrrrrPose(f, state.game?.specials.find(s => s.kind === 'nailPierce' && s.owner === f.id));
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
  if(f.type==='boat' && state.game.specials.some(s=>s.kind===BOAT.kind&&s.owner===f.id&&s.visible))return;
  // The captured fighter is drawn once, held at the actual mouth, below.
  if (f.inCar || f.grabbedBy) return;
  let key = f.type, index = poseIndex(f);
  if(f.type==='queenbee')({key,index}=beeSprite(f));
  else if(f.type==='yungsnow')({key,index}=snowSprite(f));
  else if(f.type==='boat')({key,index}=boatSprite(f));
  else if(f.type==='trinigold')({key,index}=triniSprite(f));
  else if(f.type==='treeyawl')({key,index}=treeSprite(f));
  else if(f.type==='ooousaber')({key,index}=saberSprite(f));
  if (f.type === 'fuedfam') ({key,index}=fuedSprite(f));
  if (f.type === 'charles') ({ key, index } = charlesSprite(f));
  if (f.type === 'getit') ({ key, index } = getItSprite(f));
  if (f.type === 'loudbull') ({ key, index } = loudBullSprite(f));
  if (f.type === 'fatboi') ({ key, index } = fatBoiSprite(f));
  if (f.type === 'icespice') ({ key, index } = iceSpiceSprite(f));
  if (f.type === 'hehaw') ({ key, index } = hehawSprite(f));
  if (f.type === 'dr-no-bunnies') ({ key, index } = noBunniesSprite(f));
  if (f.type === 'cantrap') ({ key, index } = cantRapSprite(f));
  if (f.type === 'smackprince') ({ key, index } = princeSprite(f));
  if (f.type === 'babybigfists') ({ key, index } = bigFistsSprite(f));
  if (EXECUTIVE_FIGHTERS[f.type]) ({ key, index } = executiveSprite(f));
  if (RUSH_FIGHTERS[f.type]) ({ key, index } = rushSprite(f));
  if (NEON_FIGHTERS[f.type]) ({key,index}=neonSprite(f));
  if (ASCENSION_FIGHTERS[f.type]) ({ key, index } = ascensionSprite(f));
  else if (GAUNTLET_FIGHTERS[f.type]) ({ key, index } = gauntletSprite(f));
  if (f.type === 'ocrrrrr') ({ key, index } = ocrrrrrSprite(f));
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
  const scale = 215 * (state.game.specials.find(s=>s.kind==='giantSmash'&&s.owner===f.id)?.scale||1) / (f.type === 'queenbee' || f.type === 'yungsnow' || f.type === 'boat' || f.type === 'trinigold' || f.type === 'treeyawl' || f.type === 'ooousaber' || f.type === 'fuedfam' || f.type === 'charles' || NEON_FIGHTERS[f.type] || ASCENSION_FIGHTERS[f.type] || GAUNTLET_FIGHTERS[f.type] || RUSH_FIGHTERS[f.type] || EXECUTIVE_FIGHTERS[f.type] || flipping || key === 'snitchyCall' || ['getit', 'loudbull', 'fatboi', 'icespice', 'hehaw', 'dr-no-bunnies', 'cantrap', 'smackprince', 'babybigfists', 'mooja', 'cranes', 'demon', 'ocrrrrr'].includes(f.type) ? state.assets[key].referenceHeight : base.h);
  ctx.save();
  const shadowScale = Math.max(.45, 1 - f.y / 450);
  ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(f.x, GROUND + 4, 61 * shadowScale, 10 * shadowScale, 0, 0, Math.PI * 2); ctx.fill();
  if (f.meter >= 100) { ctx.strokeStyle = META[f.type].color; ctx.globalAlpha = .5 + Math.sin(state.time * 5) * .15; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(f.x, GROUND + 4, 66, 13, 0, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1; }
  ctx.translate(f.x, GROUND - f.y); ctx.scale(flipping ? (f.flipDirection || f.facing) : f.type === 'demon' && demonSprite(f).lookAway ? -f.facing : f.facing, 1);
  if (flipping) ctx.translate(0, -108);
  if (f.state === 'ko') { if (f.type !== 'queenbee' && !NEON_FIGHTERS[f.type] && !ASCENSION_FIGHTERS[f.type] && !GAUNTLET_FIGHTERS[f.type] && !RUSH_FIGHTERS[f.type] && !EXECUTIVE_FIGHTERS[f.type]) ctx.rotate(-Math.min(1.15, f.stateTime * 1.5)); ctx.globalAlpha = .8; }
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
  if(f.type==='boat' && f.state==='run')ctx.translate(0,-Math.abs(Math.sin(f.stateTime*10))*13);
  if(f.type==='queenbee'){ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';}
  ctx.drawImage(s.image, -s.anchorX * scale, -s.anchorY * scale, s.w * scale, s.h * scale);
  if (['treeyawl', 'getit', 'dr-no-bunnies', 'smackprince', 'mooja', 'ocrrrrr', 'sassyt', 'czr'].includes(f.type) && f.state === 'punch' && f.attackProgress > .24 && f.attackProgress < .68) {
    ctx.save(); ctx.strokeStyle = '#ffe1ed'; ctx.lineWidth = 3; ctx.globalAlpha = .55;
    ctx.beginPath(); ctx.moveTo(32, -148); ctx.quadraticCurveTo(135, -157, 128, -95); ctx.stroke(); ctx.restore();
  }
  ctx.restore();
  drawTriniWhip(ctx,f,GROUND);
  if ((f.id === 'p' + (ownIndex() + 1) || state.mode === 'local') && !state.game.over) {
    ctx.fillStyle = state.mode === 'local' ? f.id === 'p1' ? '#ff82bf' : '#87b9ff' : META[f.type].color;
    ctx.beginPath(); ctx.moveTo(f.x - 7, GROUND - f.y - 238); ctx.lineTo(f.x + 7, GROUND - f.y - 238); ctx.lineTo(f.x, GROUND - f.y - 229); ctx.fill();
    if (state.mode === 'local') {
      ctx.save(); ctx.font = '900 15px system-ui'; ctx.textAlign = 'center'; ctx.strokeStyle = '#151121'; ctx.lineWidth = 4;
      ctx.strokeText(f.id.toUpperCase(), f.x, GROUND - f.y - 245); ctx.fillText(f.id.toUpperCase(), f.x, GROUND - f.y - 245); ctx.restore();
    }
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
    const victim = frame(target.type, NEON_FIGHTERS[target.type] || ASCENSION_FIGHTERS[target.type] || GAUNTLET_FIGHTERS[target.type] || RUSH_FIGHTERS[target.type] || EXECUTIVE_FIGHTERS[target.type] ? 14 : ['smackprince', 'babybigfists', 'mooja', 'cranes', 'demon', 'ocrrrrr'].includes(target.type) ? 14 : 22) || frame(target.type, 0);
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

function drawNailPierce(s) {
  const owner = state.game.fighters.find(f => f.id === s.owner); if (!owner) return;
  const index = s.phase === 'retract' ? 3 : s.contact && s.age - s.contact.age < .14 ? 2 : Math.floor(s.age * 16) % 2;
  const sprite = frame('ocrrrrrNails', index); if (!sprite) return;
  for (const nail of nailSegments(s, owner)) {
    ctx.save(); ctx.translate(nail.rootX, GROUND - nail.rootY); ctx.scale(s.facing, 1); ctx.rotate(nail.angle);
    ctx.drawImage(sprite.image, 0, -nail.width / 2, nail.length, nail.width); ctx.restore();
  }
}

function drawNailImpacts() {
  for (const effect of state.game?.effects || []) {
    if (effect.kind !== 'nailImpact') continue;
    const progress = effect.age / effect.duration, radius = 24 + progress * 80;
    ctx.save(); ctx.translate(effect.x, GROUND - effect.y); ctx.globalAlpha = 1 - progress;
    ctx.fillStyle = '#fff5fc'; ctx.strokeStyle = '#ff65b7'; ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i < 20; i++) {
      const angle = i * Math.PI / 10, r = i % 2 ? radius * .28 : radius;
      const x = Math.cos(angle) * r, y = Math.sin(angle) * r;
      if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
    }
    ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
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
  if(s.kind===QUEENBEE.kind){drawBeeSpecial(ctx,s,state.game,GROUND);return;}
  if(s.kind===SNOW.kind||s.kind==='lowSnowball'){drawSnowSpecial(ctx,s,frame,GROUND);return;}
  if(s.kind===BOAT.kind){drawBoatSpecial(ctx,s,frame,GROUND);return;}
  if(s.kind===TRINI.kind){drawTriniSpecial(ctx,s,GROUND);return;}
  if(s.kind===TREE.kind){drawTreeSpecial(ctx,s,state.game,frame,GROUND);return;}
  if(s.kind===SABER.kind){drawSaberSlash(ctx,s,state.game,GROUND);return;}
  if (s.kind === FUED.kind) { drawFuedBoard(ctx,s,frame,GROUND); return; }
  if (s.kind === CHARLES.kind) { drawCharlesSpray(ctx, s, GROUND); return; }
  if (NEON_KINDS.includes(s.kind)) {neonRenderer.special(s);return;}
  if (ASCENSION_KINDS.includes(s.kind)) { ascensionRenderer.special(s,state.game); return; }
  if (GAUNTLET_KINDS.includes(s.kind)) { gauntletRenderer.special(s,state.game); return; }
  if (RUSH_KINDS.includes(s.kind)) { rushRenderer.special(s,state.game); return; }
  if (EXECUTIVE_KINDS.includes(s.kind)) { executiveRenderer.special(s); return; }
  if (s.kind === 'nailPierce') { drawNailPierce(s); return; }
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
  drawNailImpacts();
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
  if (state.mode !== 'online') resize(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#101223'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (state.game) {
    const [a, b] = state.game.fighters;
    const wideSpecialActive = state.game.specials.some(s => s.kind === SNOW.kind || s.kind === BOAT.kind || s.kind === TRINI.kind || s.kind === TREE.kind || s.kind === CHARLES.kind || NEON_KINDS.includes(s.kind) || (s.kind === 'car' && s.active) || (s.kind === 'backup' && s.car?.visible) || (s.kind === 'horse' && s.active) || (s.kind === 'crew' && s.active) || (s.kind === 'maskedCrew' && s.active) || (s.kind === 'royce' && s.active) || (s.kind === 'prizeCrew' && s.active));
    const framing = [a.x,b.x];
    for (const s of state.game.specials) {
      if (s.kind === 'faceShot') framing.push(s.focusX);
      if (s.kind === 'travy' && s.helper?.visible && s.helper.x > 0 && s.helper.x < 1280) framing.push(s.helper.x);
      if (s.kind === 'chase' && s.age >= .4) framing.push(s.chaserX);
      if (s.kind === 'quickRush' && s.phase === 'rush') framing.push(s.x-s.facing*135);
    }
    const left = Math.min(...framing), right = Math.max(...framing);
    const portrait = canvas.width / canvas.height < 1.05;
    const targetWidth = wideSpecialActive ? (portrait ? 1000 : 1280) : Math.min(1280, Math.max(portrait ? 480 : 820, right - left + (portrait ? 340 : 590)));
    const targetX = Math.max(targetWidth / 2, Math.min(1280 - targetWidth / 2, (left + right) / 2));
    state.cameraWidth += (targetWidth - state.cameraWidth) * Math.min(1, dt * 3);
    state.cameraX += (targetX - state.cameraX) * Math.min(1, dt * 3);
  }
  const viewScale = Math.min(canvas.width / state.cameraWidth, canvas.height / 480);
  const visibleWidth = canvas.width / viewScale;
  const cameraX = visibleWidth >= 1280 ? 640 : Math.max(visibleWidth / 2, Math.min(1280 - visibleWidth / 2, state.cameraX));
  const offsetX = canvas.width / 2 - cameraX * viewScale;
  const portrait = canvas.width < canvas.height;
  const floorY = canvas.height * (portrait ? .69 : .82);
  const offsetY = floorY - GROUND * viewScale;
  // Cover the viewport above AND below the shared foot-contact line. Tall
  // phones keep textured rooftop under the controls, with no empty floor band.
  // The background camera scales independently of the fighter sprites.
  const stageScale = Math.max(canvas.width / WORLD_W, floorY / GROUND,
    (canvas.height - floorY) / (WORLD_H - GROUND));
  const stageCameraX = Math.max(canvas.width / stageScale / 2,
    Math.min(WORLD_W - canvas.width / stageScale / 2, cameraX));
  ctx.setTransform(stageScale, 0, 0, stageScale,
    canvas.width / 2 - stageCameraX * stageScale, floorY - GROUND * stageScale);
  drawStage();
  ctx.setTransform(viewScale, 0, 0, viewScale, offsetX, offsetY);
  ctx.save();
  if (state.shake > .2) ctx.translate((Math.random() - .5) * state.shake, (Math.random() - .5) * state.shake);
  if (state.game) {
    for (const s of state.game.specials) if (s.kind === 'backup' && s.active) drawBackupCar(s);
    for (const s of state.game.specials) if (s.kind === 'spotlight') drawSmackSpotlight(s);
    for (const s of state.game.specials) if (s.kind === 'elevator') drawElevatorWarning(s);
    for (const s of state.game.specials) if (s.kind === 'maskedCrew' && s.active) drawMaskedCrew(s);
    for (const s of state.game.specials) if (EXECUTIVE_KINDS.includes(s.kind)) executiveRenderer.warning(s);
    for (const f of state.game.fighters) executiveRenderer.security(f, state.game);
    for (const s of state.game.specials) rushRenderer.behind(s,state.game);
    for (const s of state.game.specials) gauntletRenderer.behind(s,state.game);
    for (const s of state.game.specials) neonRenderer.behind(s,state.game);
    for (const s of state.game.specials) ascensionRenderer.behind(s,state.game);
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
    if(s.kind===SABER.kind&&s.age>=1.05&&s.age<1.9)drawFighterSpeech(s,'OOOUUU!',viewScale,offsetX,offsetY);
    if (s.kind === 'travy' && s.age < 1.05) drawFighterSpeech(s, 'TRAVY!!!', viewScale, offsetX, offsetY);
    if (s.kind === 'slime' && s.age >= .85 && s.age < 2.5) drawFighterSpeech(s, 'SLIIIIME!', viewScale, offsetX, offsetY);
    if (s.kind === 'prizeCrew' && s.age < 1.55) drawFighterSpeech(s, 'PRIZE PICKS!', viewScale, offsetX, offsetY);
    if (s.kind === 'crew') drawFighterSpeech(s, cantRapSpeech(s), viewScale, offsetX, offsetY);
    if (s.kind === 'giantFists') drawFighterSpeech(s, babyBigFistsSpeech(s), viewScale, offsetX, offsetY);
  }
  // Keep special announcements below the compact HUD and undistorted in portrait.
  const pixelRatio = Math.min(window.devicePixelRatio || 1, state.mode === 'online' ? 1.5 : 2);
  const titleSize = Math.max(17, Math.min(30, canvas.width / pixelRatio * .026));
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  // Blizzard uses viewport coordinates after the pixel ratio and transform are ready.
  for(const s of state.game?.specials||[])if(s.kind===SNOW.kind&&s.active)drawBlizzard(ctx,s,canvas.width/pixelRatio,canvas.height/pixelRatio);
  for (const label of state.labels.filter(l => l.big)) {
    ctx.save(); ctx.globalAlpha = Math.min(1, Math.max(0, label.life * 2)); ctx.textAlign = 'center'; ctx.font = `900 ${titleSize}px system-ui`;
    ctx.strokeStyle = '#171326'; ctx.lineWidth = 4;
    ctx.strokeText(label.text, canvas.width / pixelRatio / 2, 76);
    ctx.fillStyle = label.color; ctx.fillText(label.text, canvas.width / pixelRatio / 2, 76); ctx.restore();
  }
  ctx.setTransform(canvas.width / WORLD_W, 0, 0, canvas.height / WORLD_H, 0, 0);
  if (state.flash > 0) { ctx.fillStyle = `rgba(245,221,255,${state.flash * .45})`; ctx.fillRect(0, 0, WORLD_W, WORLD_H); }
  const whiteout = Math.max(0, ...(state.game?.specials || []).map(s => s.whiteout || 0));
  $('goatWhiteout').style.opacity = String(whiteout);
  canvas.dataset.whiteout = whiteout.toFixed(3);
  if (state.phase === 'countdown') {
    const n = state.countdown > .65 ? Math.ceil(state.countdown - .65) : 'FIGHT';
    ctx.textAlign = 'center'; ctx.font = `900 ${n === 'FIGHT' ? 94 : 116}px system-ui`; ctx.strokeStyle = '#17152e'; ctx.lineWidth = 11; ctx.strokeText(n, 640, 330); ctx.fillStyle = '#ffe4ab'; ctx.fillText(n, 640, 330);
  }
}

function loop(now) {
  // Keep the next frame queued even if a canvas draw fails on this frame.
  requestAnimationFrame(loop);
  const dt = Math.min(.16, (now - (state.last || now)) / 1000); state.last = now; state.time += dt;
  pollControllers(dt);
  if (state.mode === 'online') room.tick(now);
  if (state.toastTimer > 0) { state.toastTimer -= dt; if (state.toastTimer <= 0 && $('toast')) $('toast').hidden = true; }
  state.shake = Math.max(0, state.shake - dt * 25); state.flash = Math.max(0, state.flash - dt);
  if (onlineGuest() && state.phase === 'playing') {
    const input = localInput(controllers.consume(0, dt), true);
    const heldState = [Math.round(input.moveX*20), input.block, input.punchPressed, input.kickPressed].join(':');
    const edge = input.jumpPressed || input.specialPressed || heldState !== net.lastHeld;
    if (edge || now - net.lastInput >= 1000/30) {
      if (room.send({type:'input',match:net.match,input})) {
        net.lastInput = now; net.lastHeld = heldState;
        jumpQueue = Math.max(0, jumpQueue - 1);
        Object.keys(pressed).forEach(k => pressed[k] = false);
      }
    }
    sound.tick();
  }
  if (!onlineGuest() && state.phase === 'countdown') { state.countdown -= dt; if (state.countdown <= 0) { setPhase('playing'); $('phaseText').textContent = 'Round 1 · land hits to charge'; } }
  if (!onlineGuest() && state.phase === 'playing') {
    state.accumulator = (state.accumulator || 0) + dt;
    let steps = 0;
    while (state.accumulator >= 1 / 60 && steps < 10) {
      const meterBefore = state.game.fighters.map(f => f.meter);
      const pad1 = controllers.consume(0, 1 / 60), pad2 = controllers.consume(1, 1 / 60);
      const input = state.mode === 'local' ? pad1 : localInput(pad1);
      state.game.update(1 / 60, input, state.mode === 'online' ? net.remote.consume(1/60) : pad2);
      jumpQueue = Math.max(0, jumpQueue - 1);
      state.specialBuffer = Math.max(0, (state.specialBuffer || 0) - 1 / 60);
      for (let i = 0; i < 2; i++) if (meterBefore[i] >= 100 && state.game.fighters[i].meter < 100) {
        controllers.clearSpecial(i);
        if (i === 1 && state.mode === 'online') net.remote.clearSpecial();
        if (i === 0) state.specialBuffer = 0;
      }
      Object.keys(pressed).forEach(k => pressed[k] = false);
      state.accumulator -= 1 / 60; steps++;
    }
    processEvents(); sound.tick();
    if (state.mode !== 'online' || now-net.lastHud >= 40 || state.game?.over) { updateHUD(); net.lastHud=now; }
    if (state.game?.over) { state.resultDelay += dt; if (state.resultDelay > .9) showResults(); }
  }
  onlineSnapshot(now);
  // Guest display uses smoothed positions; gameplay/HUD retain host authority.
  if (onlineGuest() && state.game && state.phase === 'playing') {
    const fighters=state.game.fighters, authoritative=fighters.map(f=>({x:f.x,y:f.y}));
    const visual=net.smooth.positions(fighters, now, dt);
    fighters.forEach((f,i)=>Object.assign(f,visual[i]));
    try { draw(dt); } finally { fighters.forEach((f,i)=>Object.assign(f,authoritative[i])); }
  } else draw(dt);
}

selectFighter('owl'); setPhase('select');
const invitedRoom = new URL(location.href).searchParams.get('room')?.toUpperCase();
const savedSession=readSavedRoom(getRoomStorage('sessionStorage'),ROOM_STORAGE_KEY);
const savedHost=readSavedRoom(getRoomStorage('localStorage'),ROOM_STORAGE_KEY);
const recovered=validCode(invitedRoom)
  ? (savedSession?.role==='guest'&&savedSession.code===invitedRoom?savedSession:null)
  : (savedSession||(savedHost?.role==='host'?savedHost:null));
if(recovered){
  setMode('online');
  if(Object.hasOwn(META,recovered.fighter))selectFighter(recovered.fighter);
  net.status='Restoring room '+recovered.code+'…';updateLobby();
  room.open(recovered.role,recovered.code);
}else if(validCode(invitedRoom)){
  setMode('online');$('onlineCodeInput').value=invitedRoom;
  net.status='Invite received. Press Join room.';updateLobby();
}
requestAnimationFrame(loop);
loadAssets().catch(error => { console.error(error); $('startFight').textContent = 'Reload to retry'; showToast('The game art did not load. Please refresh to retry.', 30); });

// A small read-only snapshot helps verify the prototype without affecting combat.
window.micClashSnapshot = () => ({ phase: state.phase, selected: state.selected, fighters: state.game?.fighters.map(f => ({ id: f.id, type: f.type, x: Math.round(f.x), y: Math.round(f.y), hp: f.hp, meter: f.meter, state: f.state })), over: state.game?.over, winner: state.game?.winner });
