import test from 'node:test';
import assert from 'node:assert/strict';
import { LocalControllers, readStandardPad } from '../dist/controllers.js';

const pad = (index, pressed = [], axes = [0, 0], id = 'same-model') => ({
  index, id, connected: true, mapping: 'standard', axes,
  buttons: Array.from({ length: 17 }, (_, i) => ({ pressed: pressed.includes(i), value: pressed.includes(i) ? 1 : 0 }))
});
function setup(indices = [1, 4]) {
  let pads = indices.map(i => pad(i, [0]));
  const hub = new LocalControllers(() => pads);
  hub.poll(1 / 60); pads = indices.map(i => pad(i)); hub.poll(1 / 60);
  return { hub, set(value) { pads = value; }, poll(options = {}) { return hub.poll(1 / 60, { playing: true, ...options }); } };
}

test('Two identical-model controllers join distinct slots, even with sparse browser indexes', () => {
  const { hub, set, poll } = setup();
  assert.ok(hub.bothConnected()); assert.deepEqual(hub.slots.map(s => s.index), [1, 4]);
  set([null, pad(1, [0]), null, null, pad(4, [0]), pad(7, [0])]); poll();
  assert.deepEqual(hub.slots.map(s => s.index), [1, 4]);
});
test('A join press is consumed; jump edges are independent and never repeat while held', () => {
  let pads = [pad(0, [0]), pad(1, [0])]; const hub = new LocalControllers(() => pads);
  const joined = hub.poll(1 / 60, { playing: true });
  assert.equal(joined.events.length, 2); assert.deepEqual(hub.consume(0, 1 / 60), {});
  pads = [pad(0), pad(1)]; hub.poll(1 / 60, { playing: true });
  pads = [pad(0, [0]), pad(1)]; hub.poll(1 / 120, { playing: true });
  assert.equal(hub.consume(0, 1 / 60).jumpPressed, true);
  assert.equal(hub.consume(1, 1 / 60).jumpPressed, false);
  hub.poll(1 / 120, { playing: true }); assert.equal(hub.consume(0, 1 / 60).jumpPressed, false);
});
test('Short presses between simulation steps survive and special buffering clears on activation', () => {
  const { hub, set, poll } = setup();
  set([pad(1, [0, 3]), pad(4)]); poll(); set([pad(1), pad(4)]); poll();
  const input = hub.consume(0, 1 / 60); assert.ok(input.jumpPressed); assert.ok(input.specialPressed);
  hub.clearSpecial(0); assert.equal(hub.consume(0, 1 / 60).specialPressed, false);
  set([pad(1, [3]), pad(4)]); poll(); hub.clearSpecial(0); poll();
  assert.equal(hub.consume(0, 1 / 60).specialPressed, false);
});
test('Both sticks, punch, kick and block remain separate on simultaneous input', () => {
  const { hub, set, poll } = setup();
  set([pad(1, [2], [1, 0]), pad(4, [1, 4], [-1, 0])]); poll();
  assert.deepEqual(hub.consume(0, 1 / 60), { moveX: 1, punchPressed: true, kickPressed: false, block: false, jumpPressed: false, specialPressed: false });
  assert.deepEqual(hub.consume(1, 1 / 60), { moveX: -1, punchPressed: false, kickPressed: true, block: true, jumpPressed: false, specialPressed: false });
});
test('Stick dead zone ignores drift and D-pad cancels opposite directions', () => {
  assert.equal(readStandardPad(pad(0, [], [.16, 0])).moveX, 0);
  assert.equal(readStandardPad(pad(0, [14], [.8, 0])).moveX, -1);
  assert.equal(readStandardPad(pad(0, [14, 15], [1, 0])).moveX, 0);
  assert.equal(readStandardPad(pad(0, [], [NaN, Infinity])).moveX, 0);
});
test('Disconnect releases only that player and never promotes Player 2 into Player 1', () => {
  const { hub, set, poll } = setup();
  set([pad(1, [2], [1, 0]), pad(4, [], [-1, 0])]); poll();
  set([null, null, null, null, pad(4, [], [-1, 0])]); const result = poll();
  assert.deepEqual(result.events, [{ type: 'disconnected', player: 0 }]);
  assert.deepEqual(hub.consume(0, 1 / 60), {}); assert.equal(hub.consume(1, 1 / 60).moveX, -1);
  set([pad(2, [0], [0, 0], 'replacement'), pad(4)]); poll();
  assert.deepEqual(hub.slots.map(s => s.index), [2, 4]); assert.deepEqual(hub.consume(0, 1 / 60), {});
});
test('Reconnection and focus restoration require release, with no carried jump or kick', () => {
  const { hub, set, poll } = setup(); set([pad(4)]); poll();
  set([pad(1, [0, 1]), pad(4)]); poll(); assert.deepEqual(hub.consume(0, 1 / 60), {});
  set([pad(1), pad(4)]); poll(); set([pad(1, [1]), pad(4)]); poll();
  assert.equal(hub.consume(0, 1 / 60).kickPressed, true);
  poll({ active: false }); poll(); assert.deepEqual(hub.consume(0, 1 / 60), {});
  set([pad(1), pad(4)]); poll(); assert.equal(hub.consume(0, 1 / 60).kickPressed, false);
});
test('Pausing/countdown clears queued attacks; menu confirm and pause are edges', () => {
  const { hub, set, poll } = setup(); set([pad(1, [0, 3, 9]), pad(4)]);
  const first = poll(); assert.ok(first.menus[0].pause); assert.ok(first.menus[0].confirm);
  const held = poll(); assert.equal(held.menus[0].pause, false); assert.equal(held.menus[0].confirm, false);
  hub.suspend(); poll({ playing: false }); assert.deepEqual(hub.consume(0, 1 / 60), {});
});
test('Unsupported layouts and blocked APIs leave CPU mode usable without assigning fake players', () => {
  const hub = new LocalControllers(() => [{ ...pad(0, [0]), mapping: '' }]);
  hub.poll(1 / 60); assert.equal(hub.unsupported, 1); assert.equal(hub.connected(0), false);
  hub.provider = () => { throw new Error('SecurityError'); }; hub.poll(1 / 60);
  assert.equal(hub.available, false); assert.equal(hub.bothConnected(), false);
});
test('One-controller capacity cannot claim Player 2 and reset does not reuse a held join press', () => {
  let pads = [pad(0, [0]), pad(1, [0])]; const hub = new LocalControllers(() => pads);
  hub.poll(1 / 60, { capacity: 1 }); assert.ok(hub.connected(0)); assert.equal(hub.connected(1), false);
  hub.reset(); hub.poll(1 / 60); assert.equal(hub.connected(0), false);
  pads = [pad(0), pad(1)]; hub.poll(1 / 60); pads = [pad(0, [0]), pad(1, [0])]; hub.poll(1 / 60);
  assert.ok(hub.bothConnected());
});
