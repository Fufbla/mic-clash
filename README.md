# Mic Clash

A self-contained browser fighting game with twelve selectable chibi fighters, a selectable CPU opponent, and 90-second rounds. Built with vanilla JavaScript and canvas; no install or build step is required.

## Play

Choose **Owl Striker**, **Night Rider**, **Karate Fighter**, **Snitchy**, **Get It**, **Loud Bull**, **FatBoi**, **Ice Spice**, **HeHaw**, **Dr. No Bunnies**, **Can’t Rap**, or **Smack Prince**, pick an opponent, then select **Start fight**. On phones, drag the analog stick on the left to move. The four circular buttons on the right are Jump, Punch, Kick, and Special. Get It, Dr. No Bunnies, and Smack Prince use the Slap button for open-hand attacks (keyboard J). The arena and controls automatically adapt to portrait or landscape when the phone rotates; rotation does not restart the round. Sound starts muted and can be enabled in the header.

| Action | Keyboard |
| --- | --- |
| Move | A / D or left / right arrows |
| Jump / double jump | W, Space, or up arrow; tap again in the air |
| Punch | J |
| Kick | K |
| Special | L |
| Block | Hold B |
| Pause | P or Escape |

Hold punch or kick to repeat attacks when recovery ends. Move close enough to connect. Landed, unblocked punches add 20% special meter and kicks add 25%. Misses, blocked attacks, elapsed time, and special attacks add no meter. A special requires and consumes the full meter.

Every special ignores Block and deals its normal damage when it connects. Once activated, its full presentation cannot be interrupted: the fighter is protected from damage, hitstun, and knockback until the special and its effects finish. New punches, kicks, and specials wait until that protection ends. Movement and jumping can resume after the fighter's own action recovers, while a projectile or summoned crew finishes. Specials still have their normal range and can miss or be evaded.

If a knockout or timeout happens during a special, the existing presentation finishes before the result appears. The round clock and further combat damage stop once the result is settled. Restarting the round clears the presentation immediately.

- **Dr. No Bunnies / African Pride Belt Slap:** the approved curly black hair, dark beard, blue-and-white patterned suit, and gold necklace. His normal attack is an open-handed slap, with standard kicks, movement, double jump, and block. With a full meter and an opponent within 285 world pixels in front, the belt presentation lasts 2.7 seconds. Its red, black, and green belt has a gold Africa-shaped buckle. Hits at 0.72, 1.43, and 2.15 seconds each deal 16 damage (48 total) and display **LASHES!**; the last launches the opponent backward. Ordinary targets remain caught through the sequence, and block/recovery i-frames cannot prevent the hits. An opposing special retains its own protection. All three strike cues and the final launch finish even after an early knockout; further HP damage stops once the round result is latched. Failed out-of-range activation preserves the meter.

- **Can’t Rap / Turban Crew Jump-In:** red turban, dark sunglasses, plaid vest, tattooed arms, gold chain, red sneakers, and a microphone in hand. The Punch button delivers a microphone strike (10 damage on an unblocked hit and 20% meter). His special summons eight small red-turban crew members who rush the opponent from both sides and deliver up to eight 6-damage cartoon hits (48 total). The crew ignores Block, cannot be interrupted, and does not refill the meter. The sprite atlas contains eight separate movement and combat poses, with the crew rendered as smaller chibi summons.
- **Smack Prince / The Smack Upgrade:** lime cap, sunglasses, headphones, lime/yellow striped shirt, patterned purple trousers, and chunky sneakers. His walk uses eight dancing poses; normal attacks are open-handed slaps and kicks that return to a planted stance. At full meter, with an opponent within 185 world pixels in front, he crouches, changes into a black tuxedo, poses under a bright spotlight, and delivers one 48-damage unblockable slap at 1.14 seconds. The hit launches the actual opponent backward and upward. He restores his street outfit at 1.85 seconds and finishes at 2.10 seconds. The windup can be evaded, an out-of-range activation preserves the meter, and the complete presentation is protected and finishes before KO results.
- **Owl Striker / Owl Strike:** three descending golden owls.
- **Night Rider / Black Coupe:** a black two-door car attack.
- **Karate Fighter / Rapid Punches:** a brief transformation from the blue street outfit into a white karate gi and black belt, followed by twelve fast punches. This is a close-range special; each punch must connect and the barrage does not recharge the meter. The second jump performs a forward somersault, while the first jump is a normal jump.
- **Snitchy / Call the Cops:** fearful palms-up guard, panicked basic attacks, and an authored double-jump flip. A phone call summons a black-and-white police sedan. Three officers hop out, rush the opponent, throw three punches each, return to the car, and depart. The car itself deals no damage. The nine punches can deal up to 36 damage, can be evaded, and do not charge special meter. Another crew cannot be called until the current one leaves.
- **Get It / Live Performance:** one hand at her sunglasses and the other on her hip, an eight-pose confident walk, open-palmed slaps, kicks, and a normal double jump. She draws a microphone and sings four notes that launch pink sound waves. The final note makes the opponent erupt in a cartoon explosion. The waves deal up to 36 damage, can be jumped over, and do not charge the meter. All four notes and their traveling waves finish without interruption. The audio uses original synthesized wordless vocal tones.
- **Loud Bull / Giant Yell:** a raised-fist street-boxing guard, an eight-pose bob-and-weave walk, punches, kicks, and a normal double jump. He plants his feet, draws breath, enlarges his mouth, and releases a directional cone of sound. Four pulses deal up to 36 damage, with stronger knockback on the final pulse; the yell can be evaded. The full shout plays without interruption. The special uses the same full-meter requirement as the rest of the roster and does not recharge itself. Sound uses an original synthesized arcade shout.
- **FatBoi / Bite & Toss:** a broad street-brawler guard, an eight-pose waddling walk with alternating steps and body-weight shifts, punches, kicks, and a normal double jump. He brings out a chicken wing, raises it to his mouth, takes a bite, winds up, and throws the bitten wing at the opponent. The spinning wing follows an arc and deals one 36-damage hit. The bite, throw, and projectile finish without interruption. The special requires and consumes the full hit-powered meter and does not recharge it.
- **Ice Spice / Munch:** a raised-hand fighting guard, an eight-pose guarded walk, punches, kicks, and a normal double jump. She reaches forward, enlarges her mouth, grabs the actual nearby opponent for three 16-damage cartoon chomps (48 total), then releases them. The target stays held through the bites; the full protected presentation lasts 2.2 seconds. The grab checks a grounded opponent within 185 world pixels in front of her after a 0.46-second windup. It can miss if the opponent is outside its reach or airborne, and it cannot grab another fighter during their protected special presentation. Munch requires and consumes the full hit-powered meter and does not recharge it.

- **HeHaw / Horse Power:** her newspaper-print cowboy hat, bodysuit, gloves, and boots follow the approved character concept. She has an eight-pose walk, punches, kicks, a normal double jump, and an eight-pose pointing and summoning animation. Horse Power calls a black stallion from offscreen behind her. The horse gallops across the arena, deals one 48-damage hit, and knocks the opponent backward and upward. Its charge ignores Block, can be jumped over, and never recharges the meter. HeHaw stays protected through the horse’s full entrance, charge, exit, recovery, and impact effects.

## Implementation

- `dist/combat.js`: fixed-step combat simulation, hit detection, meter rules, CPU behavior, and round results.
- `dist/game.js`: sprite animation, canvas stage, input, UI, and synthesized audio.
- `dist/assets/`: chibi sprite atlases and transparent special-effect assets.
- `dist/assets/cant-rap.webp`: transparent eight-frame chibi atlas (idle, walk, run, jump, microphone windup, microphone strike, kick, and damage), drawn from the approved Can’t Rap design.
- `dist/assets/karate-flip.png`: twelve individually drawn forward-somersault poses. The double jump advances through the tuck, inversion, opening, and recovery frames using a common body-center anchor and scale; it does not rotate a static fighter image.
- `dist/assets/snitchy-fighter.png` and `snitchy-actions.png`: 24 basic movement/attack poses, twelve authored flip poses, and four phone-call poses. `police-car.png` supplies four door/light states, and `police-officers.png` supplies eight movement/attack poses for each of the three officers.
- `dist/assets/get-it-fighter.png` and `get-it-actions.png`: 24 basic combat poses, an eight-frame heel-toe walk, and eight microphone-performance poses. `get-it-explosion.png` supplies the eight-frame pink burst and dissipating smoke. All character movement uses full-body sprites; the open hands in the slap are drawn into the frames.
- `dist/assets/loud-bull-fighter.png` and `loud-bull-actions.png`: basic combat poses, an eight-frame bob-and-weave walk, and eight giant-yell poses. Bent knees, torso shifts, and advancing footwork are drawn into the walk frames.
- `dist/assets/fatboi-fighter.png` and `fatboi-actions.png`: basic combat poses, eight waddling walk poses, and eight bite-and-throw poses. `fatboi-wing.png` supplies the detached bitten-wing projectile frames. The bite precedes the release; the throwing hand is empty once the projectile leaves it.
- `dist/assets/ice-spice-fighter.png` and `ice-spice-actions.png`: 24 basic combat poses, eight guarded walk poses, and eight giant-mouth Munch poses. The main character's outfit and orange curls follow the approved reference. The special sprites contain only her; the renderer uses the selected opponent during the grab and chomps.
- `dist/assets/hehaw-fighter.png`, `hehaw-actions.png`, and `hehaw-stallion.png`: 24 basic combat poses, eight walk poses, eight Horse Power poses, and eight separately drawn black-stallion gallop poses. The horse travels independently of HeHaw and the selected opponent reacts through the combat engine.
- `dist/index.html` and `dist/style.css`: responsive selection, combat HUD, controls, help, pause, and results screens.

Character names are working names. The animation uses sprite keyframes; it is a prototype rather than a full character rig or cloth simulation. Gameplay is single player versus the CPU.

## Validation

Run combat checks with:

```sh
node --test tests/*.test.mjs
```

The combat checks cover every ordered fighter pairing, hit-powered meter, blocked and missed basic attacks, special activation and full damage through Block, double jump, collision bounds, proportional analog movement, recovery movement, KO, and timeout. Shared special checks cover protection through the complete presentation, simultaneous specials, prevention of attacks during protection, vulnerability after completion, presentation completion before round results, and immediate reset cleanup.

Karate checks cover the forward flip, twelve-punch timing across multiple frame rates, range and evasion, costume cleanup, and CPU behavior. Snitchy checks cover the staged arrival and exits, nine-punch timing at 30/60/120 fps in both directions, evasion, no special recharge, prevention of overlapping crews, protected presentation and cleanup, and CPU behavior. Get It checks cover slap charging, ordinary jumps, four-wave damage and timing in both directions at 30/60/120 fps, evasion, protected singing and traveling waves, special cleanup, explosion lifetime, and CPU behavior. Loud Bull checks cover ordinary double jumps, the four-pulse yell at 30/60/120 fps in both directions, cone range, timed jump evasion, protected presentation, cleanup, and CPU behavior. FatBoi checks cover bite-before-release timing, one-hit swept projectile collision at 30/60/120 fps in both directions, misses, jump evasion, protection before and after release, cleanup, ordinary double jumps, and CPU behavior. Ice Spice checks cover the opponent grab, three-chomp timing, hold and release, evasion, protection, and cleanup. HeHaw checks cover the offscreen entry, full arena traverse, nose-aligned swept contact, single unblockable hit at 30/60/120 fps in both directions, jump evasion, protection, KO and timeout completion, reset cleanup, and CPU use. Browser checks cover character selection, keyboard combat, on-screen held attacks, sprite animations, special meter consumption, and portrait/landscape layouts.

## Dr. No Bunnies release validation (2026-11-21)

- 74 existing combat behavior checks expanded to all ten fighters, including 90 ordered simultaneous-special pairings. Seven additional Dr. No Bunnies checks cover both player sides, both directions, 30/60/120 fps, hit timing, range/meter gates, early KOs on each strike, launch, CPU behavior, and controller catch-up.
- Browser preview: selection, sprite scale/anchors, palm contact, mirrored belt and Africa buckle, 390×844 portrait and 844×390 landscape layouts, analog input and release, held touch-button slaps, double jump, kick, and on-screen special activation/consumption/recovery. These are desktop browser checks of mobile layouts and pointer controls, not physical-device tests.
- Existing fighter asset bytes and atlas metadata are unchanged. One new roster entry brings the total to ten.
- Run `node tools/prepare-browser-qa.mjs` for repeatable local visual scenes at `/__qa-runner.html`. Run `node tools/prepare-browser-qa.mjs --clean` before packaging. The QA pages and full-meter fixtures are never production assets.

## Dr. No Bunnies asset provenance

The attached integration pack supplied `dr-no-bunnies.js` and the approved move chart (retained at `references/dr-no-bunnies-reference.jpeg`). Its extracted strips clipped hair and included poster edges and neighboring figures. The built-in image generator cleaned/re-authored the same approved character into `dist/assets/dr-no-bunnies-fighter.png` (24 basic poses) and `dist/assets/dr-no-bunnies-actions.png` (8 walking, 8 belt caster poses), preserving his face, hair, beard, suit, necklace, and shoes. `tools/build-no-bunnies-atlas.py` indexes transparent pixel bounds and hand/foot anchors without changing image pixels. The belt itself is animated canvas geometry attached to the authored grip positions, with red/black/green stripes and a gold Africa silhouette buckle. The supplied finite-state three-strike controller drives combat timing.

Generation briefs: identity-preserving transparent 4×6 atlas, right-facing full-body idle/walk/jump/open-palm slap/kick/block/hurt poses, same scale and feet baseline, no poster borders or neighboring fragments; plus matching transparent 4×4 atlas with eight walk poses and eight draw/wind-up/whip/follow-through/recovery grip poses, with the belt attached separately by the renderer.

## GitHub copy and hosting

This repository was initially copied from the complete Mic Clash game at live release version 12 (source commit `b272aa027abf732e46df53956b0ff7dcb31b5e0a`), including all ten fighters and their art. The existing game remains at https://mic-clash-arena-prototype.fufbla.chatgpt.site.

The root `index.html` loads the same `dist/game.js` and `dist/style.css` for GitHub Pages. All gameplay code and artwork are unchanged from the production release. Enable Pages from the main branch, root folder. No build step, API keys, or backend are required.

Run `npm test` for combat checks. Run `npm start` and open http://localhost:8000 to play locally. Python 3 is needed only for the local server and atlas indexing; Node.js runs the tests.

## Can’t Rap GitHub Pages update (2026-11-21)

The GitHub Pages roster now has eleven fighters. Can’t Rap is selectable as either the player or CPU. His regular Punch button swings the microphone. Turban Crew Jump-In calls eight small red-turban helpers from the edges, who rush in and land up to eight timed, unblockable hits. The presentation completes before knockout or timeout results, and the existing fighters and phone controls are preserved. Run `npm test` for combat verification.

### Can’t Rap sprite and kick repair

`dist/assets/cant-rap-hd.png` replaces the compressed 112-pixel cells with 16 lossless, approximately 300-pixel-tall poses. `dist/cant-rap.js` selects windup, knee lift, extension, retraction, foot lowering, and grounded recovery across each 0.58-second kick. The extended frame matches the 0.18–0.30-second hit window; both feet return to the floor before a held kick repeats. Block and microphone-call poses are also authored frames.

His special displays **Kids!** in a speech bubble immediately, with a 0.60-second call before helpers enter. The bubble remains readable during the entrance, including on narrow phone screens, and clears before the attacks. The eight strikes still deal up to 48 damage. The added call time shifts the full presentation to 3.43 seconds.

The built-in image generator re-authored the approved `cant_rap_fighting_stance_full.png` appearance into a transparent 4×4 atlas: identical face, red turban, gold-rim sunglasses, tattoos, red/black plaid vest, tank top, necklace, cargo pants, sneakers, and microphone; row-major guard/walk/walk/jump, mic windup/contact/block/hurt, kick anticipation/chamber/extension/retraction, foot lowering/grounded recovery/call/call. No text, borders, effects, or background. `tools/build-cant-rap-atlas.py` indexes alpha bounds and body anchors without modifying pixels.

Run `node tools/prepare-cant-rap-qa.mjs` for local visual fixtures at `/__qa-cantrap-runner.html`, then the same command with `--clean` before release. Regression checks cover complete kick recovery and call-before-entrance timing on both player sides at 30/60/120 fps. Browser checks cover sharp artwork, kick contact and grounded recovery, mirrored speech bubbles, and 390×844 portrait / 844×390 landscape layouts.

## Smack Prince release (2026-11-21)

Smack Prince is the twelfth playable fighter and can also be selected as the CPU opponent. The built-in image generator used the supplied Smack Prince concept sheet to author two transparent 4×4, 1254×1254 PNG atlases. `smack-prince-fighter.png` contains guard, jump, double jump, open-palm slap, block, six complete kick phases, hurt, and KO poses. `smack-prince-actions.png` contains eight dancing walk poses and eight crouch, suit reveal, glasses adjustment, slap windup/contact/follow-through, recovery, and street-outfit restoration poses. His cap, sunglasses, headphones, complexion, face, patterned trousers, and striped shirt follow the reference; the special uses the reference's black suit, white shirt, bow tie, lime pocket square, and dress shoes.

`tools/build-smack-prince-atlas.py` indexes alpha bounds and body/foot anchors without altering image pixels. `dist/smack-prince.js` shares special timing between simulation and sprite selection. The spotlight, glints, hit label, and opponent launch are rendered by the game rather than baked into the sprites.

All 97 combat behavior checks pass, including all 132 ordered simultaneous-special fighter pairings. Smack Prince checks cover both player sides and directions at 30/60/120 fps, slap meter rules, dance poses, repeated kick recovery, double jump, activation gates, one-hit damage, airborne knockback, evasion, protected presentation, KO completion, reset cleanup, and CPU use. Browser preview checks cover suit changes, centered spotlight, mirrored slap contact, launch and street-outfit restoration, on-screen slap/kick input, and 390×844 portrait / 844×390 landscape layouts. These are browser viewport and pointer checks, not physical-device tests.

Run `node tools/prepare-smack-prince-qa.mjs` for repeatable local visual scenes at `/__qa-prince-runner.html`. Run the same command with `--clean` before release; full-meter fixtures are excluded from production. All eleven prior fighter assets and atlas entries are preserved.
