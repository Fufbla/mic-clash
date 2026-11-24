// Private, casual 1v1 rooms. The host owns combat; guests send controls only.
// PeerJS is loaded only on demand, so offline and local modes never need it.
export const PROTOCOL = 1;
const PREFIX = 'celebrity-gauntlet-v1-';
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
export class OnlineRoom {
  constructor({onStatus, onMessage, onDisconnect, peerLoader = loadPeer}) {
    Object.assign(this, {onStatus, onMessage, onDisconnect, peerLoader});
    this.generation = 0; this.role = null; this.code = ''; this.connected = false;
    this.lastReceived = 0; this.lastPing = 0; this.rtt = null;
  }
  async open(role, code = '') {
    this.close();
    if (!['host','guest'].includes(role)) return;
    code = role === 'host' ? createCode() : String(code).trim().toUpperCase();
    if (!validCode(code)) { this.onStatus('Enter the eight-character room code.'); return; }
    const generation = this.generation;
    this.role = role; this.code = code;
    this.onStatus(role === 'host' ? 'Creating room…' : 'Joining room…');
    try {
      const Peer = await this.peerLoader();
      if (generation !== this.generation) return;
      const peer = this.peer = role === 'host' ? new Peer(PREFIX + code) : new Peer();
      this.timeout = setTimeout(() => { if (generation === this.generation && !this.connected) this.fail('Connection timed out. Check the code or try another network.'); }, 20000);
      peer.on('open', () => {
        if (generation !== this.generation) return;
        if (role === 'host') {
          clearTimeout(this.timeout);
          this.onStatus('Room open. Share your code or invite link.');
        } else this.attach(peer.connect(PREFIX + code, {reliable: true, serialization: 'json'}), generation);
      });
      peer.on('connection', conn => {
        if (generation !== this.generation || role !== 'host' || this.conn) { conn.close(); return; }
        this.attach(conn, generation);
      });
      peer.on('error', error => { if (generation === this.generation) this.fail(error.type === 'peer-unavailable' ? 'Room not found. Check the code and make sure the host is online.' : 'Online connection failed. Try creating a new room.'); });
      peer.on('disconnected', () => { if (generation === this.generation && !this.connected) this.fail('Online signaling disconnected. Try again.'); });
    } catch (error) { if (generation === this.generation) this.fail(error.message || 'Online connection unavailable.'); }
  }
  attach(conn, generation) {
    this.conn = conn;
    const current = () => this.generation === generation && this.conn === conn;
    clearTimeout(this.timeout);
    this.timeout = setTimeout(() => { if (current() && !this.connected) this.fail('Connection timed out. Try creating or joining a new room.'); }, 20000);
    conn.on('open', () => {
      if (!current()) return;
      clearTimeout(this.timeout);
      this.connected = true; this.lastReceived = performance.now(); this.lastPing = 0;
      this.onStatus('Connected. Choose a fighter and ready up.');
      this.send({type:'hello'});
    });
    conn.on('data', message => {
      if (!current() || !this.connected || !message || message.v !== PROTOCOL || typeof message.type !== 'string') return;
      this.lastReceived = performance.now();
      if (message.type === 'ping') { this.send({type:'pong', t:message.t}); return; }
      if (message.type === 'pong') {
        if (Number.isFinite(message.t)) this.rtt = Math.max(0, Math.round(performance.now() - message.t));
        return;
      }
      this.onMessage(message);
    });
    conn.on('close', () => { if (current()) this.fail('Your opponent disconnected. Create or join a new room.'); });
    conn.on('error', () => { if (current()) this.fail('The connection was lost. Create or join a new room.'); });
  }
  send(message, {snapshot = false} = {}) {
    if (!this.connected || !this.conn?.open) return false;
    if (snapshot && this.conn.bufferSize > 3) return false;
    try { this.conn.send({...message, v: PROTOCOL}); return true; }
    catch { this.fail('The connection was lost.'); return false; }
  }
  tick(now) {
    if (!this.connected) return;
    if (now - this.lastReceived > 12000) { this.fail('Connection timed out. No match result was recorded.'); return; }
    if (now - this.lastPing >= 2000) { this.lastPing = now; this.send({type:'ping',t:now}); }
  }
  fail(message) {
    this.close();
    this.onDisconnect(message);
    this.onStatus(message);
  }
  close() {
    this.generation++;
    clearTimeout(this.timeout);
    const conn = this.conn, peer = this.peer;
    this.conn = this.peer = null; this.connected = false; this.role = null; this.code = ''; this.rtt = null;
    try { conn?.close(); } catch {}
    try { peer?.destroy(); } catch {}
  }
}
