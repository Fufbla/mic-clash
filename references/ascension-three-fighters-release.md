# Eynak East, GOAT and TayTay

Celebrity Gauntlet production update, 2026-11-21.
Existing game: https://fufbla.github.io/mic-clash/
Base production commit: bd679a072d4ba500da3c015bcd6622f9bf2d34f3.

The roster grows from 26 to 29. Every existing fighter, the city rooftop,
320-health rounds and same-device two-controller mode are preserved.

Each new playable fighter has 32 transparent full-body poses: idle/breathing,
eight movement strides, jump/double jump, punch, kick/retraction, block,
hurt, knockout, and eight special/recovery poses. Eynak's 16 support frames
and Travy's 8 helper frames bring the new atlas total to 120 frames.
The PNGs are unchanged image-generation outputs, using the user's three
chibi posters as appearance references. `tools/build-ascension-atlas.py`
computes crop and anchor metadata without editing image pixels.

- Eynak East retains his light curls, navy/gold coat and necklace.
  Ghost Ascension changes him into the pointed, faceless purple hooded form,
  raises his arms, shakes the stage, opens purple ground ruptures, then sends
  four ghost attacks toward the actual rival. Each contact deals 12 damage.
  The normal form returns afterward.
- GOAT retains his large afro, sunglasses and embroidered black/gold outfit.
  The Sign raises his hands into the overhead triangle, then smoothly covers
  the entire game with white, holds briefly and fades. One 48-damage impact;
  the whiteout is a single pulse, follows simulation time, and remains below
  the pause menu. Reset/finish clears it.
- TayTay retains her updo, chandelier earrings, yellow gown and model stride.
  She calls “Travy!!!” using an original stock female voice. Travy enters in
  his red 87 football uniform and helmet, winds up and dives through the
  rival for one 48-damage contact before leaving. He is a summoned helper,
  not an extra playable roster entry.

Each special requires 100 meter and awards no meter. Ghost and tackle
contacts are swept against the live rival's hurtbox, so fast motion works
at 30/60/120 fps and movement can evade their locked paths. GOAT's sign is an
arena-wide attack. All three respect invulnerability and protected specials;
knockout/time-out freeze further damage while the presentation completes.

Verification sources:

- `tests/ascension-fighters.test.mjs`: 20 new entries covering both players,
  directions, close/mid/full-stage ranges, meter, CPU and mirrors, reset,
  timeout, form changes, evade/contact and one complete whiteout.
- Existing all-roster combat, endurance, KO and cross-special tests expand
  to 29 fighters; all previous atlas entries are preserved.
- `tools/prepare-ascension-qa.mjs` creates local-only visual fixtures.
- `tools/prepare-local-qa.mjs` checks the actual two-controller input flow
  with simulated gamepads. Physical controller pairing is not tested here.

Art provenance: `ascension-fighter-art-prompts.json`.
Voice provenance: `taytay-travy-audio.json`.
Generated `dist/__qa*` pages are excluded from publication.

Completed validation:

- `npm test`: all 165 Node test entries pass.
- Browser: all 24 simulated-controller checks pass, including Player 2
  triggering and completing each new special for 48 damage through the
  production controller/input/render path.
- Visual checks: Eynak's hooded cast and ghost swarm; GOAT's overhead sign,
  full opaque whiteout, usable pause menu, resume and fade; TayTay's call,
  left-facing portrait appearance and Travy's actual tackle contact in
  phone landscape. Portrait camera follows the approaching helper.
- The Travy voice decodes and is triggered by the in-game special button.
- All 76 existing atlas entries are byte-equivalent as parsed JSON; 120 new
  frame crops fit their declared sampling cells. All 8 PNGs retain true alpha.
