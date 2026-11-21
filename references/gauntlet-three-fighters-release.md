# Big Mumble, DJ Beigey, and No Buttons

Existing Celebrity Gauntlet production update, 2026-11- 21.
Public game: https://fufbla.github.io/mic-clash/
Base production commit: c164a90efd09edd319ae0423565861329e56fb9a.

The roster grows from 23 to 26 while preserving every existing fighter and local two-controller mode. Each new fighter has 32 authored transparent poses for idle, movement, jumping, attacks, blocking, damage, knockout and special presentation. Four props and 16 crew poses bring the new frame count to 116.

- Big Mumble: purple/yellow 34 uniform, misaligned eyes, headbutt and sweep kick. Face Shot places a hoop over the actual opponent and throws below it into the opponent's face, then shrugs. One 48-damage contact.
- DJ Beigey: pink leopard suit, beard and jewelry. Rolls Royce Runover calls a white car, boards, drives through the actual opponent, exits, and recovers. One 48-damage contact. Rider state is cleared on expiry, reset and forced finish.
- No Buttons: white shirt, black/red cap and tattoos. Says “Prize Picks!” in an original performed voice, then summons exactly four distinct helpers: Yellow Hoodie, Rugby, Polo and Black Hoodie. Eight 6-damage strikes; helpers leave afterward. Separate positions and leaping strikes keep the crew readable.

Each special requires 100 meter and gives no meter back. 320-health endurance and 90-second rounds remain. Specials use the real opponent's collision and can miss a dodge or high jump. Protected presentations finish before knockout/time-out results, and no later damage can change the result.

Validation:

- `npm test`: 145 Node test entries pass, including expanded all-roster protection/KO/cross-special coverage and 19 new fighter checks.
- New special tests cover both player sides, both directions, 30/60/120fps, close/mid/full-stage distances, human P2, CPU activation and mirror matches.
- 21 simulated-controller browser checks pass: joining, independent selection/movement, ready flow, double jump, attacks/meter, pause/options, disconnect/reconnect and rematch. Physical controller pairing was not tested here.
- Browser visual checks: Big Mumble aim/contact, DJ Beigey car impact and left-facing walk, No Buttons' four distinct helpers, phone landscape/portrait, full speech bubble and decoded/triggered voice audio.
- All 116 new atlas crops lie inside declared cells; transparent PNGs remain unchanged from image generation. Existing atlas entries are unchanged.

Art prompts and frame maps: `gauntlet-fighter-art-prompts.json`.
Voice provenance: `nobuttons-prize-picks-audio.json`.
Local-only browser harness generators: `tools/prepare-gauntlet-qa.mjs` and `tools/prepare-local-qa.mjs`; generated `dist/__qa*` files are excluded from publication.
