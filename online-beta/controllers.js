// Standard Gamepad mapping: https://www.w3.org/TR/gamepad/#remapping
// Separate browser sampling from fixed-step combat, so a short press survives
// 120 Hz rendering and a held button cannot become multiple jump/special edges.
export const DEAD_ZONE = .2;
const clamp = n => Math.max(-1, Math.min(1, Number.isFinite(n) ? n : 0));
const down = (pad, i) => Boolean(pad.buttons?.[i]?.pressed || pad.buttons?.[i]?.value > .5);
const keyOf = pad => `${pad.index}:${pad.id}`;
const neutral = () => ({ moveX: 0, block: false, punchPressed: false, kickPressed: false });

export function readStandardPad(pad) {
  const buttons = Array.from({ length: 17 }, (_, i) => down(pad, i));
  const raw = clamp(pad.axes?.[0]);
  const digital = buttons[14] || buttons[15];
  const moveX = digital ? Number(buttons[15]) - Number(buttons[14])
    : Math.sign(raw) * Math.max(0, (Math.abs(raw) - DEAD_ZONE) / (1 - DEAD_ZONE));
  const vertical = clamp(pad.axes?.[1]);
  return { buttons, moveX,
    navX: digital ? Math.sign(moveX) : Math.abs(raw) > .55 ? Math.sign(raw) : 0,
    navY: buttons[12] || buttons[13] ? Number(buttons[13]) - Number(buttons[12]) : Math.abs(vertical) > .55 ? Math.sign(vertical) : 0,
    neutral: !buttons.some(Boolean) && Math.abs(raw) <= DEAD_ZONE && Math.abs(vertical) <= DEAD_ZONE };
}

export class LocalControllers {
  constructor(provider = () => {
    if (typeof navigator?.getGamepads !== 'function') throw new Error('unavailable');
    return navigator.getGamepads();
  }) {
    this.provider = provider;
    this.slots = [null, null];
    this.previous = new Map();
    this.available = true;
    this.unsupported = 0;
  }

  reset() { this.slots = [null, null]; }
  clearPlayer(player) {
    const slot = this.slots[player];
    if (!slot) return;
    slot.jumpQueue = 0; slot.specialBuffer = 0; slot.input = neutral();
    slot.blocked = true; slot.navX = 0; slot.navY = 0; slot.repeatX = 0; slot.repeatY = 0;
  }
  suspend() { this.clearPlayer(0); this.clearPlayer(1); }
  clearSpecial(player) { if (this.slots[player]) this.slots[player].specialBuffer = 0; }
  connected(player) { return Boolean(this.slots[player]?.connected); }
  bothConnected() { return this.connected(0) && this.connected(1); }

  poll(dt, { playing = false, canJoin = true, active = true, capacity = 2 } = {}) {
    let pads;
    try { pads = Array.from(this.provider() || []).filter(p => p?.connected !== false && p); this.available = true; }
    catch { pads = []; this.available = false; }
    this.unsupported = pads.filter(p => p.mapping !== 'standard').length;
    const samples = new Map(pads.filter(p => p.mapping === 'standard').map(p => [keyOf(p), { pad: p, ...readStandardPad(p) }]));
    const events = [], menus = [{}, {}];
    for (let i = 0; i < this.slots.length; i++) {
      const slot = this.slots[i];
      if (!slot) continue;
      const connected = samples.has(slot.key);
      if (connected !== slot.connected) {
        slot.connected = connected; this.clearPlayer(i);
        events.push({ type: connected ? 'reconnected' : 'disconnected', player: i });
      }
    }
    if (active && canJoin) for (const [key, sample] of samples) {
      if (this.slots.some(s => s?.key === key) || !sample.buttons[0] || this.previous.get(key)?.[0]) continue;
      const player = this.slots.findIndex((s, i) => i < capacity && !s?.connected);
      if (player < 0) continue;
      this.slots[player] = { key, index: sample.pad.index, id: sample.pad.id, connected: true };
      this.clearPlayer(player);
      events.push({ type: 'joined', player });
    }
    for (let i = 0; i < capacity; i++) {
      const slot = this.slots[i], sample = slot && samples.get(slot.key);
      if (!slot || !sample) continue;
      if (!active) { this.clearPlayer(i); continue; }
      if (slot.blocked) {
        // Joining, reconnecting, or resuming never carries a held action over.
        if (sample.neutral) slot.blocked = false;
        else continue;
      }
      const before = this.previous.get(slot.key) || [];
      const edge = index => sample.buttons[index] && !before[index];
      const repeat = axis => {
        const value = sample['nav' + axis];
        slot['repeat' + axis] = Math.max(0, (slot['repeat' + axis] || 0) - dt);
        if (!value) { slot['nav' + axis] = 0; return 0; }
        if (value !== slot['nav' + axis]) { slot['nav' + axis] = value; slot['repeat' + axis] = .34; return value; }
        if (!slot['repeat' + axis]) { slot['repeat' + axis] = .15; return value; }
        return 0;
      };
      menus[i] = { x: repeat('X'), y: repeat('Y'), confirm: edge(0), cancel: edge(1), mode: edge(3), pause: edge(9) };
      if (playing) {
        slot.input = { moveX: sample.moveX, block: sample.buttons[4] || sample.buttons[5] || sample.buttons[6] || sample.buttons[7],
          punchPressed: sample.buttons[2], kickPressed: sample.buttons[1] };
        if (edge(0)) slot.jumpQueue = Math.min(2, slot.jumpQueue + 1);
        if (edge(3)) slot.specialBuffer = .65;
      } else { slot.input = neutral(); slot.jumpQueue = 0; slot.specialBuffer = 0; }
    }
    this.previous = new Map([...samples].map(([key, sample]) => [key, sample.buttons]));
    return { menus, events };
  }

  consume(player, dt) {
    const slot = this.slots[player];
    if (!slot?.connected || slot.blocked) return {};
    const input = { ...slot.input, jumpPressed: slot.jumpQueue > 0, specialPressed: slot.specialBuffer > 0 };
    slot.jumpQueue = Math.max(0, slot.jumpQueue - 1);
    slot.specialBuffer = Math.max(0, slot.specialBuffer - dt);
    return input;
  }
}
