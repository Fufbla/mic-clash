# Three-fighter release — November 21, 2026

Adds The President, O’whinny, and RoboKing to the existing Mic Clash game, preserving the other 17 fighters and the fullscreen, compact HUD, touch controls, pause-button-only behavior, and 320-health rounds.

- 96 authored fighter poses: 16 basic and 16 movement/special poses per fighter.
- 20 companion/effect frames: bodyguard, jet, bomb, explosion, money bundles/piles, robot, and truck.
- Each special deals up to 48 damage. Airstrike and Money Rain mark a fixed target area; Cybertruck Protocol combines a swept truck collision and a separate robot punch.
- Personal Security blocks every tenth eligible incoming basic contact for The President and RoboKing. It consumes the attack without chip damage or attacker meter gain. Misses, invulnerable contacts, and specials do not count.
- Existing special protection, result timing, reset, AI, and meter rules also apply to the new fighters.

Validation:

- `npm test`: 95 Node test entries pass, including the existing 74-check combat harness (168 behavior checks in total).
- All 20 specials checked at 30, 60, and 120 fps in both directions; all 380 ordered distinct-fighter special pairings checked.
- New fighters tested on player and CPU sides, with passive blocks, misses, evasion, KO, timeout, forced finish, and reset.
- 25 browser input/layout checks across desktop, phone portrait, phone landscape, short landscape, and small phone layouts.
- Browser visual inspection of new roster cards, airstrike/explosion, money rain, truck/robot strike, and mirrored portrait presentation. Jet positioning and special-title scaling corrected during review.
- Physical iPhone Safari was not available; touch event prevention and responsive layouts were checked in the browser fixtures.

Local browser fixtures are ignored and removed before release. Generated PNGs are preserved unchanged; the atlas script only measures alpha bounds and anchor positions.
