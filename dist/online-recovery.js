// Private, casual 1v1 rooms. The host owns combat; guests send controls only.
// PeerJS is loaded only on demand, so offline and local modes never need it.
export const PROTOCOL = 2;
const PREFIX = 'celebrity-gauntlet-v2-';
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const validCode = code => typeof code === 'string' && /^[A-HJ-NP-Z2-9]{8}$/.test(code);
export function createCode() {
  return Array.from(crypto.getRandomValues(new Uint8Array(8)), n => ALPHABET[n & 31]).join('');
}
export function cleanInput(input = {}) {
  return {
    moveX: typeof input.moveX === 'number' && Number.isFinite(input.moveX) ? Math.max(-1, Math.min(1, input.moveX)) : 0,
    block: input.block === true,
    jumpPressed: input.jumpPressed === true,
    punchPressed: input.punchPressed === true,
    kickPressed: input.kickPressed === true,
    specialPressed: input.specialPressed === true
  };
}
export class RemoteInput {
  constructor() { this.reset(); }
  reset() { this.input = cleanInput(); this.jumps = 0; this.punch = false; this.kick = false; this.special = 0; this.age = Infinity; }
  receive(data) {
    if (!data || typeof data !== 'object') return;
    const input = cleanInput(data);
    this.age = 0;
    if (input.jumpPressed) this.jumps = Math.min(2, this.jumps + 1);
    this.punch ||= input.punchPressed;
    this.kick ||= input.kickPressed;
    if (input.specialPressed) this.special = .65;
    this.input = input;
  }
  consume(dt) {
    this.age += dt;
    if (this.age > .4) { this.reset(); return cleanInput(); }
    const input = {...this.input, jumpPressed: this.jumps > 0,
      punchPressed: this.punch || this.input.punchPressed,
      kickPressed: this.kick || this.input.kickPressed, specialPressed: this.special > 0};
    this.jumps = Math.max(0, this.jumps - 1);
    this.punch = this.kick = false;
    this.special = Math.max(0, this.special - dt);
    return input;
  }
  clearSpecial() { this.special = 0; }
}
export function makeSnapshot(game) {
  // The belt special contains a host-only callback controller. Rendering needs
  // its authored visual fields, not that controller or any simulation callbacks.
  return JSON.parse(JSON.stringify({
    fighters: game.fighters, specials: game.specials, effects: game.effects,
    timeRemaining: game.timeRemaining, elapsed: game.elapsed,
    roundEnding: game.roundEnding, over: game.over, winner: game.winner
  }, (key, value) => key === 'controller' ? undefined : value));
}
export function applySnapshot(game, snapshot, roster) {
  if (!snapshot || !Array.isArray(snapshot.fighters) || snapshot.fighters.length !== 2 ||
      !snapshot.fighters.every((f, i) => f && f.id === 'p' + (i + 1) &&
        roster.includes(f.type) && f.type === game.fighters[i].type &&
        ['x','y','hp','maxHp','meter','stateTime','flipRemaining','flipProgress'].every(k => Number.isFinite(f[k]))) ||
      !Array.isArray(snapshot.specials) || !Array.isArray(snapshot.effects) ||
      !Number.isFinite(snapshot.timeRemaining) || !Number.isFinite(snapshot.elapsed)) return false;
  for (const key of ['fighters','specials','effects','timeRemaining','elapsed','roundEnding','over','winner']) game[key] = snapshot[key];
  return true;
}
// Rendering only: reconcile toward the newest authoritative position at the
// display's refresh rate. Cap extrapolation so stalls cannot cause runaway
// movement, and snap cinematic grabs/teleports instead of smearing them.
export class FighterSmoothing {
  constructor() { this.reset(); }
  reset() { this.visual = []; this.receivedAt = 0; }
  receive(fighters, now) {
    this.receivedAt = now;
    this.visual = fighters.map((f, i) => {
      const previous = this.visual[i];
      const locked = !!(f.grabbedBy || f.beltHeldBy || f.inCar || f.state === 'special');
      const snap = !previous || previous.id !== f.id || previous.locked !== locked ||
        Math.abs(previous.x - f.x) > 180 || Math.abs(previous.y - f.y) > 140 || locked;
      return {id:f.id, x:snap ? f.x : previous.x, y:snap ? f.y : previous.y, locked};
    });
  }
  positions(fighters, now, dt) {
    if (this.visual.length !== fighters.length) this.receive(fighters, now);
    const lead = Math.min(.045, Math.max(0, (now-this.receivedAt)/1000));
    const alpha = 1-Math.exp(-Math.max(0,Math.min(.1,dt))/.034);
    return fighters.map((f,i) => {
      const v = this.visual[i];
      if (v.locked || f.state === 'ko') {v.x=f.x;v.y=f.y;}
      else {
        const tx=Math.max(0,Math.min(1280,f.x+(Number.isFinite(f.vx)?f.vx:0)*lead));
        const ty=Math.max(0,f.y+(Number.isFinite(f.vy)?f.vy:0)*lead);
        v.x += (tx-v.x)*alpha; v.y += (ty-v.y)*alpha;
      }
      return {x:v.x,y:v.y};
    });
  }
}
let peerLibrary;
function loadPeer() {
  if (globalThis.Peer) return Promise.resolve(globalThis.Peer);
  if (!peerLibrary) peerLibrary = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/peerjs@1.5.5/dist/peerjs.min.js';
    script.async = true;
    const fail = () => { clearTimeout(timer); script.remove(); peerLibrary = undefined; reject(new Error('Online service failed to load. Try again.')); };
    const timer = setTimeout(fail, 15000);
    script.onload = () => { clearTimeout(timer); globalThis.Peer ? resolve(globalThis.Peer) : fail(); };
    script.onerror = fail;
    document.head.append(script);
  });
  return peerLibrary;
}
export const ROOM_TTL_MS = 7200000;
export function readSavedRoom(storage,key,now=Date.now()) {
  try {
    const r=JSON.parse(storage?.getItem(key)||'null');
    if(r&&['host','guest'].includes(r.role)&&validCode(r.code)&&Number.isFinite(r.savedAt)&&r.savedAt<=now&&now-r.savedAt<ROOM_TTL_MS)return r;
    storage?.removeItem(key);
  } catch {}
  return null;
}
export function saveRoom(storage,key,room,fighter,now=Date.now()) {
  try {
    if(room&&['host','guest'].includes(room.role)&&validCode(room.code))storage?.setItem(key,JSON.stringify({role:room.role,code:room.code,fighter,savedAt:now}));
    else storage?.removeItem(key);
  } catch {}
}
export class OnlineRoom {
  constructor({onStatus,onMessage,onDisconnect,peerLoader=loadPeer,isVisible=()=>!globalThis.document?.hidden}) {
    Object.assign(this,{onStatus,onMessage,onDisconnect,peerLoader,isVisible});
    this.generation=0;this.role=null;this.code='';this.connected=false;this.lastReceived=0;this.lastPing=0;this.rtt=null;
    this.retryCount=0;this.retryTimer=null;this.connecting=false;this.listening=false;
  }
  async open(role,code='') {
    if(!['host','guest'].includes(role))return;
    code=role==='host'&&!code?createCode():String(code).trim().toUpperCase();
    if(!validCode(code)){this.onStatus('Enter the eight-character room code.');return;}
    this.close();this.role=role;this.code=code;
    this.onStatus(role==='host'?'Opening room…':'Joining room…');
    await this.connectAttempt();
  }
  async connectAttempt() {
    if(!this.role||this.connecting||this.connected||this.listening)return;
    clearTimeout(this.retryTimer);this.retryTimer=null;
    const generation=++this.generation,{role,code}=this;
    this.connecting=true;
    try {
      const Peer=await this.peerLoader();if(generation!==this.generation)return;
      const peer=this.peer=role==='host'?new Peer(PREFIX+code):new Peer();
      this.timeout=setTimeout(()=>{if(generation===this.generation&&!this.connected)this.retry('Waiting for connection. Retrying the same room…');},15000);
      peer.on('open',()=>{
        if(generation!==this.generation)return;
        if(role==='host'){clearTimeout(this.timeout);this.connecting=false;this.listening=true;this.retryCount=0;this.onStatus('Room open. Share the link and return here.');}
        else this.attach(peer.connect(PREFIX+code,{reliable:true,serialization:'json'}),generation);
      });
      peer.on('connection',conn=>{
        if(generation!==this.generation||role!=='host'||this.conn){conn.close();return;}
        this.attach(conn,generation);
      });
      peer.on('error',error=>{
        if(generation!==this.generation)return;
        if(this.connected&&error.type==='network')return;
        this.retry(role==='guest'&&error.type==='peer-unavailable'?'Waiting for host to return… Retrying automatically.':role==='host'&&error.type==='unavailable-id'?'Restoring your existing room…':'Reconnecting to the same room…');
      });
      peer.on('disconnected',()=>{if(generation===this.generation&&!this.connected)this.retry('Reconnecting to the same room…');});
    }catch{if(generation===this.generation)this.retry('Online service unavailable. Retrying…');}
  }
  attach(conn,generation) {
    this.conn=conn;this.connecting=true;
    const current=()=>this.generation===generation&&this.conn===conn;
    clearTimeout(this.timeout);
    this.timeout=setTimeout(()=>{if(current()&&!this.connected)this.retry('Waiting for opponent… Retrying automatically.');},15000);
    conn.on('open',()=>{
      if(!current())return;
      clearTimeout(this.timeout);this.connected=true;this.connecting=false;this.retryCount=0;this.lastReceived=performance.now();this.lastPing=0;
      this.onStatus('Connected. Choose a fighter and ready up.');this.send({type:'hello'});
    });
    conn.on('data',message=>{
      if(!current()||!this.connected||!message||message.v!==PROTOCOL||typeof message.type!=='string')return;
      this.lastReceived=performance.now();
      if(message.type==='ping'){this.send({type:'pong',t:message.t});return;}
      if(message.type==='pong'){if(Number.isFinite(message.t))this.rtt=Math.max(0,Math.round(performance.now()-message.t));return;}
      this.onMessage(message);
    });
    conn.on('close',()=>{if(current())this.retry('Opponent disconnected. Reconnecting to the same room…');});
    conn.on('error',()=>{if(current())this.retry('Connection lost. Reconnecting to the same room…');});
  }
  retry(message) {
    if(!this.role)return;
    const hadConnection=this.connected;this.shutdownTransport();
    if(hadConnection)this.onDisconnect(message);
    this.onStatus(message);
    const delay=Math.min(5000,1000+this.retryCount++*1000);
    this.retryTimer=setTimeout(()=>{this.retryTimer=null;if(this.isVisible())this.connectAttempt();},delay);
  }
  resume() {
    if(!this.role||!this.isVisible())return;
    if(this.connected){this.lastReceived=performance.now();this.lastPing=0;this.send({type:'ping',t:this.lastReceived});return;}
    if(this.listening&&this.peer?.disconnected){this.retry('Restoring your room…');return;}
    if(!this.connecting&&!this.listening&&!this.retryTimer)this.connectAttempt();
  }
  send(message,{snapshot=false}={}) {
    if(!this.connected||!this.conn?.open)return false;
    if(snapshot&&((this.conn.bufferSize||0)>0||(this.conn.dataChannel?.bufferedAmount||0)>12000))return false;
    try{this.conn.send({...message,v:PROTOCOL});return true;}
    catch{this.retry('Connection lost. Reconnecting to the same room…');return false;}
  }
  tick(now) {
    if(!this.connected||!this.isVisible())return;
    if(now-this.lastReceived>45000){this.retry('Opponent is away. Reconnecting to the same room…');return;}
    if(now-this.lastPing>=2000){this.lastPing=now;this.send({type:'ping',t:now});}
  }
  shutdownTransport() {
    this.generation++;clearTimeout(this.timeout);clearTimeout(this.retryTimer);this.retryTimer=null;
    const conn=this.conn,peer=this.peer;
    this.conn=this.peer=null;this.connected=false;this.connecting=false;this.listening=false;this.rtt=null;
    try{conn?.close();}catch{}try{peer?.destroy();}catch{}
  }
  close(){this.shutdownTransport();this.role=null;this.code='';this.retryCount=0;}
}
