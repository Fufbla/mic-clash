import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
test('both playable pages expose a single accessible touch guard with current CSS', () => {
  for (const path of ['index.html', 'dist/index.html']) {
    const html = read(path);
    assert.equal((html.match(/data-control="block"/g) || []).length, 1);
    assert.match(html, /class="control-button attack-button block-button"[^>]+data-control="block"[^>]+aria-label="Hold to block basic attacks/);
    assert.match(html, /gameplay\.css\?v=touch-block-20261125/);
  }
});
test('guard shares held-input handling and fits the two-row action pad', () => {
  const game = read('dist/game.js');
  assert.match(game, /block:pad\.block \|\| controlHeld\('block'\)/);
  assert.match(game, /pointers\.set\(event\.pointerId, button\.dataset\.control\)/);
  assert.match(game, /addEventListener\('pointercancel', release\)/);
  const css = read('dist/gameplay.css');
  assert.match(css, /grid-template-columns: repeat\(3, var\(--action-size\)\)/);
  assert.match(css, /\.control-deck \.block-button \{\s*grid-column: 1; grid-row: 2;/);
});
