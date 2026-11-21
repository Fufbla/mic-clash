# Quick Fast, Sassy T, and J Minors — November 21, 2026

Adds three playable and CPU fighters to the existing live game. All 20 previous fighters remain, for 23 total. The existing fullscreen arena, compact HUD, Pause-only pause behavior, touch gesture suppression, and 320-health rounds remain in place.

- Quick Fast uses a headbutt, a complete backflip kick, and a 48-damage swept-body rush with speed echoes and skid recovery.
- Sassy T has an eight-pose runway strut, open-hand slap, back kick, and purse-to-projectile slime special. The actual opponent receives the slime overlay. A generated original male voice shouts “Sliiiime!” when sound is enabled; it uses the existing mute/pause/round cleanup.
- J Minors runs past the opponent in panic. A separately animated blonde pursuer follows and swings her handbag at the position marked during startup. The opponent can evade it. The pursuer leaves after the presentation.
- Eight unchanged transparent PNG sheets provide 96 fighter poses and 12 companion/effect frames. Alpha bounds and anchors are indexed by `tools/build-rush-atlas.py`. Poses are shared with simulation timing through `dist/rush-fighters.js`; `dist/rush-renderer.js` draws the effects and companion.

Validation:

- `npm test`: 111 Node entries pass, including the 74-check combat harness, for 184 behavior checks.
- All 23 specials and all 506 ordered distinct-fighter simultaneous-special pairings pass. New moves are checked on player and CPU sides in both directions at 30/60/120 fps, at close and full-stage ranges, including protection, evasion, meter, KO, timeout, restart, and forced finish.
- All 23 cards and opponent choices exist in both root and dist entry points, with valid atlas crops and shipped assets.
- Browser fixtures: 25 input/layout checks pass at 1280×760, 390×844, 844×390, 844×326, and 320×568. The checks include Pause-only behavior, gesture/default prevention, menu scrolling, viewport fill, compact HUD, and health.
- Visual inspection covers headbutt contact, inverted backflip, speed echoes, purse throw, slime coating, handbag strike, mirrored sprites, and portrait framing. A duplicated purse was corrected; the slime caption is no longer doubled by a banner. Voice decoding and playback initiation were confirmed in the browser with sound enabled.
- No game-origin browser errors observed. Physical iPhone Safari was not available; mobile evidence is from browser viewport and input checks.

Local full-meter and frozen-frame fixtures are ignored and removed before publication. Recreate them with `node tools/prepare-rush-qa.mjs`, then remove with `--clean`.
