# Celebrity Gauntlet

A self-contained browser fighting game with twenty-three selectable chibi fighters, a selectable CPU opponent or local two-player versus, and 90-second rounds on an illustrated city rooftop. Built with vanilla JavaScript and canvas; no install or build step is required. Play the current release at https://fufbla.github.io/mic-clash/.

## City rooftop and name update — November 21, 2026

The title, roster wordmark, pause menu, and accessible arena label now use **Celebrity Gauntlet**. The existing play URL stays the same. A new original blue-hour rooftop painting replaces the procedural skyline, speakers, neon floor grid, and old floor wordmark. It features a layered city skyline, lit windows, brick parapet, water tank, stairwell, ventilation equipment, and an open concrete fighting surface. The stage fills the viewport above and below the fighters’ foot-contact line without changing fighter scale or combat physics. Artwork provenance is in `references/city-rooftop-art.json`.

## Local two-player controllers

Choose **LOCAL 2P** on the fighter screen. Connect two standard controllers to the same phone, tablet, or computer through Bluetooth or USB, then press **A / ×** on each to join. Join order assigns P1 and P2. Each player picks a fighter with left/right and presses A / × again to ready; both ready starts the match. The on-screen Start local fight button also starts once both have joined. Tapping a Player 1 / Player 2 card chooses which fighter the roster edits. Mirror matches are allowed.

| Controller control | Action |
| --- | --- |
| Left stick / D-pad | Move; choose a fighter in the lobby |
| Bottom face button: A / × | Jump; press again for double jump; join / ready / confirm in menus |
| Left face button: X / □ | Punch, slap, microphone hit, or headbutt |
| Right face button: B / ○ | Kick; cancel ready or return from a pause menu |
| Top face button: Y / △ | Special; switch modes from P1's fighter screen |
| Shoulder button or trigger | Block |
| Menu / Options | Pause / resume |

Either controller can navigate pause and result menus with the D-pad and confirm with A / ×. A single controller also works in VS CPU. Local play hides touch controls, labels fighters P1 and P2, and uses two separate human input streams; the AI is disabled throughout the match and rematches. Both players keep the same roster, specials, 320 health, and 90-second clock.

Disconnecting releases that player's inputs and shows a reconnect notice. It does not pause or replace the player with AI, and the other controller keeps its slot. Reconnect and press A / ×; release controls before continuing. Pause with Menu / Options or the on-screen Pause button when needed. Focus loss clears held input without pausing. Controller support uses the browser's standard Gamepad mapping; the game explains unavailable APIs or unrecognized layouts. Physical controller compatibility depends on the device/browser.

Implementation: `dist/controllers.js` samples controller edges once per display frame and keeps separate jump queues and special buffers for the fixed-step simulation. `CombatGame` accepts `{ localMultiplayer: true }` and a third `update` argument for P2. Normal CPU calls remain compatible. The local browser QA generator accepts simulated standard Gamepad snapshots; generated `__qa*` fixtures are excluded from releases. Mapping reference: https://www.w3.org/TR/gamepad/#remapping.

Validation on November 21, 2026: all 126 Node test entries passed, including the existing combat regression suite, independent controller inputs, disconnection/reconnection, mirror matches, and every fighter's special as human P2. The browser fixture passed 21 checks covering joining, independent selection, movement, double jump, attacks, pause/resume, controller navigation through Controls, reconnecting without switching slots, human winner labels, and rematches. The lobby and arena were inspected at 320×568 portrait and 844×326 landscape. Controllers were simulated; physical Bluetooth/USB pairing has not been verified.

## Play

Choose **Owl Striker**, **Night Rider**, **Karate Fighter**, **Snitchy**, **Get It**, **Loud Bull**, **FatBoi**, **Munchy**, **HeHaw**, **Dr. No Bunnies**, **Can’t Rap**, **Smack Prince**, **Baby Big Fists**, **MooJa**, **Cranes**, **Demon**, **Ocrrrrr!**, **The President**, **O’whinny**, **RoboKing**, **Quick Fast**, **Sassy T**, or **J Minors**, pick an opponent, then select **Start fight**. On phones, drag the analog stick on the left to move. The four circular buttons on the right are Jump, Punch, Kick, and Special. Get It, Dr. No Bunnies, Smack Prince, MooJa, Ocrrrrr!, and Sassy T use the Slap button for open-hand attacks (keyboard J). The arena and controls automatically adapt to portrait or landscape when the phone rotates; rotation does not restart the round. Sound starts muted and can be enabled in the Pause menu.

| Action | Keyboard |
| --- | --- |
| Move | A / D or left / right arrows |
| Jump / double jump | W, Space, or up arrow; tap again in the air |
| Punch | J |
| Kick | K |
| Special | L |
| Block | Hold B |
| Pause | On-screen Pause or controller Menu / Options |

Hold punch or kick to repeat attacks when recovery ends. Move close enough to connect. Landed, unblocked punches add 20% special meter and kicks add 25%. Misses, blocked attacks, elapsed time, and special attacks add no meter. A special requires and consumes the full meter.

Every special ignores Block and deals its normal damage when it connects. Once activated, its full presentation cannot be interrupted: the fighter is protected from damage, hitstun, and knockback until the special and its effects finish. New punches, kicks, and specials wait until that protection ends. Movement and jumping can resume after the fighter's own action recovers, while a projectile or summoned crew finishes. Specials still have their normal range and can miss or be evaded.

If a knockout or timeout happens during a special, the existing presentation finishes before the result appears. The round clock and further combat damage stop once the result is settled. Restarting the round clears the presentation immediately.

- **Dr. No Bunnies / African Pride Belt Slap:** the approved curly black hair, dark beard, blue-and-white patterned suit, and gold necklace. His normal attack is an open-handed slap, with standard kicks, movement, double jump, and block. With a full meter and an opponent within 285 world pixels in front, the belt presentation lasts 2.7 seconds. Its red, black, and green belt has a gold Africa-shaped buckle. Hits at 0.72, 1.43, and 2.15 seconds each deal 16 damage (48 total) and display **LASHES!**; the last launches the opponent backward. Ordinary targets remain caught through the sequence, and block/recovery i-frames cannot prevent the hits. An opposing special retains its own protection. All three strike cues and the final launch finish even after an early knockout; further HP damage stops once the round result is latched. Failed out-of-range activation preserves the meter.

- **Can’t Rap / Turban Crew Jump-In:** red turban, dark sunglasses, plaid vest, tattooed arms, gold chain, red sneakers, and a microphone in hand. The Punch button delivers a microphone strike (10 damage on an unblocked hit and 20% meter). His special summons eight small red-turban crew members who rush the opponent from both sides and deliver up to eight 6-damage cartoon hits (48 total). The crew ignores Block, cannot be interrupted, and does not refill the meter. The sprite atlas contains eight separate movement and combat poses, with the crew rendered as smaller chibi summons.
- **Baby Big Fists / Giant Fists:** purple cap, teal number-33 jersey with no team lettering, white undershirt, gold chains, and teal sneakers. He uses normal punches, kicks, a bouncy guard, a swagger walk, and double jump. His full-meter special grows his fists, delivers two 24-damage punches at 0.68 and 1.24 seconds, and shows a separate **mmm** speech bubble with each punch. The second hit launches the actual opponent backward and upward. His fists return to normal before the protected 2.05-second presentation ends. Activate within 205 world pixels in front; the windup can be evaded, and failed out-of-range activation preserves the meter. An original short synthesized hum accompanies each punch when sound is enabled.
- **Cranes / Elevator Drop:** thick dark waves, gold hoops, sculptural pink puffy wrap dress, and pink ankle-strap heels. Her eight-pose elegant walk leads into punches, kicks, block, and normal double jumps. A full-meter special gathers power, takes a breath, and releases an angry wordless shout at 0.42 seconds. A glowing landing marker locks onto the opponent's location at the shout; the elevator begins dropping at 0.96 seconds and reaches the floor at 1.52 seconds. The falling cab deals one unblockable 48-damage hit with knockback. Move out of its marked footprint to evade it; jumping in place can still be hit. Cranes recovers at 2.10 seconds, and her protection lasts until the cab finishes fading at 2.36 seconds. The shout, metal impact, dust, and landing shockwave complete before round results. Special damage does not refill her meter.
- **MooJa / Cow Mode: Milk Missiles:** black bob, yellow aviator glasses, cow ears with a yellow bow, cow-print blouse and trousers, and chunky sneakers. She struts, slaps, kicks, blocks, and double jumps. Her full-meter special transforms her into a spotted quadruped cow, keeping her recognizable face, hair, glasses, and bow. Three milk missiles leave her mouth at 0.82, 1.12, and 1.42 seconds, dealing 16 damage each through Block (48 total); the last launches the opponent. Missiles travel straight, can be jumped over, and expire after 900 world pixels. She changes back at 1.92 seconds, and movement recovers at 2.16 seconds. Protection and the attack lock last through any remaining missile flight and splash effects. Milk impacts and squirt sounds are original game effects; special hits never recharge the meter.
- **Smack Prince / The Smack Upgrade:** lime cap, sunglasses, headphones, lime/yellow striped shirt, patterned purple trousers, and chunky sneakers. His walk uses eight dancing poses; normal attacks are open-handed slaps and kicks that return to a planted stance. At full meter, with an opponent within 185 world pixels in front, he crouches, changes into a black tuxedo, poses under a bright spotlight, and delivers one 48-damage unblockable slap at 1.14 seconds. The hit launches the actual opponent backward and upward. He restores his street outfit at 1.85 seconds and finishes at 2.10 seconds. The windup can be evaded, an out-of-range activation preserves the meter, and the complete presentation is protected and finishes before KO results.
- **Owl Striker / Owl Strike:** three descending golden owls.
- **Night Rider / Black Coupe:** a black two-door car attack.
- **Karate Fighter / Rapid Punches:** a brief transformation from the blue street outfit into a white karate gi and black belt, followed by twelve fast punches. This is a close-range special; each punch must connect and the barrage does not recharge the meter. The second jump performs a forward somersault, while the first jump is a normal jump.
- **Snitchy / Call the Cops:** fearful palms-up guard, panicked basic attacks, and an authored double-jump flip. A phone call summons a black-and-white police sedan. Three officers hop out, rush the opponent, throw three punches each, return to the car, and depart. The car itself deals no damage. The nine punches can deal up to 36 damage, can be evaded, and do not charge special meter. Another crew cannot be called until the current one leaves.
- **Get It / Live Performance:** one hand at her sunglasses and the other on her hip, an eight-pose confident walk, open-palmed slaps, kicks, and a normal double jump. She draws a microphone and sings four notes that launch pink sound waves. The final note makes the opponent erupt in a cartoon explosion. The waves deal up to 36 damage, can be jumped over, and do not charge the meter. All four notes and their traveling waves finish without interruption. The audio uses original synthesized wordless vocal tones.
- **Loud Bull / Giant Yell:** a raised-fist street-boxing guard, an eight-pose bob-and-weave walk, punches, kicks, and a normal double jump. He plants his feet, draws breath, enlarges his mouth, and releases a directional cone of sound. Four pulses deal up to 36 damage, with stronger knockback on the final pulse; the yell can be evaded. The full shout plays without interruption. The special uses the same full-meter requirement as the rest of the roster and does not recharge itself. Sound uses an original synthesized arcade shout.
- **FatBoi / Bite & Toss:** a broad street-brawler guard, an eight-pose waddling walk with alternating steps and body-weight shifts, punches, kicks, and a normal double jump. He brings out a chicken wing, raises it to his mouth, takes a bite, winds up, and throws the bitten wing at the opponent. The spinning wing follows an arc and deals one 36-damage hit. The bite, throw, and projectile finish without interruption. The special requires and consumes the full hit-powered meter and does not recharge it.
- **Munchy / Munch:** a raised-hand fighting guard, an eight-pose guarded walk, punches, kicks, and a normal double jump. She reaches forward, enlarges her mouth, grabs the actual nearby opponent for three 16-damage cartoon chomps (48 total), then releases them. The target stays held through the bites; the full protected presentation lasts 2.2 seconds. The grab checks a grounded opponent within 185 world pixels in front of her after a 0.46-second windup. It can miss if the opponent is outside its reach or airborne, and it cannot grab another fighter during their protected special presentation. Munch requires and consumes the full hit-powered meter and does not recharge it.

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

Karate checks cover the forward flip, twelve-punch timing across multiple frame rates, range and evasion, costume cleanup, and CPU behavior. Snitchy checks cover the staged arrival and exits, nine-punch timing at 30/60/120 fps in both directions, evasion, no special recharge, prevention of overlapping crews, protected presentation and cleanup, and CPU behavior. Get It checks cover slap charging, ordinary jumps, four-wave damage and timing in both directions at 30/60/120 fps, evasion, protected singing and traveling waves, special cleanup, explosion lifetime, and CPU behavior. Loud Bull checks cover ordinary double jumps, the four-pulse yell at 30/60/120 fps in both directions, cone range, timed jump evasion, protected presentation, cleanup, and CPU behavior. FatBoi checks cover bite-before-release timing, one-hit swept projectile collision at 30/60/120 fps in both directions, misses, jump evasion, protection before and after release, cleanup, ordinary double jumps, and CPU behavior. Munchy checks cover the opponent grab, three-chomp timing, hold and release, evasion, protection, and cleanup. HeHaw checks cover the offscreen entry, full arena traverse, nose-aligned swept contact, single unblockable hit at 30/60/120 fps in both directions, jump evasion, protection, KO and timeout completion, reset cleanup, and CPU use. Browser checks cover character selection, keyboard combat, on-screen held attacks, sprite animations, special meter consumption, and portrait/landscape layouts.

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


## Baby Big Fists release (2026-11-21)

The thirteenth fighter is selectable as the player or CPU. Two transparent 4×4 atlases provide 32 full-body poses: `dist/assets/baby-big-fists-fighter.png` contains guard, jump, double jump, punch, block, six complete kick phases, hurt, and KO; `dist/assets/baby-big-fists-actions.png` contains eight swagger-walk frames and eight power-up, growing-fist, windup, first punch, retraction, second punch, shrinking-fist, and normal-guard frames. The enlarged punching fist renders in front of the opponent at contact.

The built-in image generator used the supplied Baby Big Fists reference sheet. The generation briefs locked his medium-brown complexion, face and facial hair, sideways purple cap with green underside, earrings, gold chains, teal jersey with only the number 33, white long sleeves, matching pants, and chunky teal/white sneakers. The requested output was two clean transparent 4×4 atlases, every figure facing right at a consistent body/head scale with full-body margins, no labels, effects, opponent, or baked-in speech. Special frames enlarge only the fists to head size and restore their normal size after two distinct punch poses. `tools/build-baby-big-fists-atlas.py` indexes alpha bounds and anchors without altering generated pixels.

`dist/baby-big-fists.js` shares timing with the simulation and speech renderer. The bubbles each last 0.40 seconds, disappear between punches, and remain readable at phone viewport sizes. The special never charges its own meter. A knockout on either punch still completes both visual punches, speech cues, and final launch before the result; damage stops once the round is decided.

All 105 combat behavior checks pass, including all 156 ordered simultaneous-special pairings. New checks cover both sides and directions at 30/60/120 fps, two exact damage events, two speech cues, normal punch/kick meter, repeated kick recovery, jumps, activation gates, evasion, knockout completion, CPU behavior, and cleanup. Browser checks cover first and second punch contact, separate bubbles, mirrored knockback, fist-size recovery, on-screen punch/kick/special input, sound-enabled execution without errors, and 390×844 portrait / 844×390 landscape layouts. These viewport checks do not substitute for physical-device testing.

Run `node tools/prepare-baby-big-fists-qa.mjs` for local scenes at `/__qa-bigfists-runner.html`, and run it with `--clean` before release. The full-meter fixtures are excluded from production. All twelve previous fighter assets and atlas entries are preserved.

## MooJa release (2026-11-21)

MooJa is the fourteenth selectable player or CPU fighter. Three transparent 4×4 PNG atlases provide 48 frames: `dist/assets/mooja-fighter.png` has 16 guard, jump, double-jump, slap, block, complete kick-recovery, hurt, and KO poses; `mooja-actions.png` has eight strut poses and eight power-up, crouch, cow-ready, inhale, firing, recoil, recovery, and human-restoration poses; `mooja-milk.png` has eight milk-missile frames and eight splash frames. The projectiles travel independently and hit the actual selected opponent.

The built-in image generator used the supplied MooJa reference sheet. Generation briefs preserve the adult chibi face, warm medium-brown skin, black bob, yellow aviators, cow-ear headband and yellow bow, black-and-white knotted blouse, matching loose trousers, and sneakers. Cow-form briefs retain the same identity on a spotted quadruped with horns, hooves, a tail, and bell. Each body atlas uses clean transparent cells, right-facing complete poses, consistent scale and foot baselines, and no lettering, borders, opponent, or baked-in special effects. A separate brief supplies creamy-white right-facing liquid missiles and expanding milk splashes. `tools/build-mooja-atlas.py` indexes alpha bounds and body/foot anchors without altering generated pixels.

`dist/mooja.js` shares transformation, firing, and recovery timing between the simulation and renderer. Pink-white transformation flashes cover the changes of form. A knockout on any missile still completes all three releases and the final launch before results, while HP damage stops once the round is decided. Reset and forced finish clear the cow state, all missiles, and effects.

All 115 combat behavior checks pass, including all 182 ordered simultaneous-special pairings. MooJa checks cover both player sides and directions at 30/60/120 fps, slap meter rules, strut and full kick recovery, double jump, meter gates, transformation before firing, mouth-aligned releases, three exact damage events, ranged collision, jump evasion, misses and projectile expiration, protection through travel and splash, early KO completion, reset, and CPU use. Browser checks cover mouth alignment, white missile and splash visibility, human restoration, mirrored 844×390 landscape and 390×844 portrait layouts, on-screen slap/kick damage and charging, and sound-enabled special activation, consumption, and recovery without game errors. These are browser viewport and pointer checks, not physical-device tests.

Run `node tools/prepare-mooja-qa.mjs` for local scenes at `/__qa-mooja-runner.html`, then use `--clean` before release. Full-meter fixtures are excluded from production. All thirteen prior fighter assets and atlas entries are preserved.

## Cranes release (2026-11-21)

Cranes is the fifteenth selectable player or CPU fighter. Three transparent 1254×1254 PNG atlases provide 36 frames: `dist/assets/cranes-fighter.png` has a 4×4 grid of 16 guard, jump, double-jump, punch, block, six complete kick phases, hurt, and KO poses; `cranes-actions.png` has eight elegant walking poses and eight gather, inhale, shout, command, exhale, and recovery poses; `cranes-elevator.png` has four intact, landing, and dented cab states in a 2×2 grid. The actual opponent reacts to the falling cab; no victim is baked into the artwork.

The built-in image generator used the supplied Cranes concept sheet. Generation briefs lock her adult chibi face, warm medium-brown complexion, almond eyes, full lips, thick center-parted shoulder-length dark waves, gold hoops, oversized light-pink sculptural padded wrap dress, bare lower legs, and ankle-strap heels. Body sheets request isolated full-body right-facing figures at a consistent scale, transparent margins and foot baselines, no text, borders, effects, or opponent. Walk frames use alternating heel-to-toe steps and poised shoulders; special frames retain the same face/head scale while opening her mouth for the angry shout. The separate elevator brief requests a recognizable steel cab with closed sliding doors, a magenta indicator, compact rooftop mechanism, subtle landing compression and dents, and no background or people. `tools/build-cranes-atlas.py` only indexes alpha bounds and anchors; it does not change image pixels.

`dist/cranes.js` shares the authored animation timing with the simulation. The landing target freezes when she shouts, and swept collision tests the descending cab against both grounded and airborne opponents. Once the cab lands it cannot deal a second or late hit. Cranes renders in front of her own cab in close matchups so the special does not obscure her. The game renders the warning, shout marks, dust, and shockwave, and synthesizes an original higher-pitched wordless shout and metallic impact. Reset and forced finish clear the cab, targeting, impact effects, and caster state.

All 127 combat behavior checks pass, including all 210 ordered simultaneous-special pairings. New checks cover both player sides and directions at 30/60/120 fps, normal attacks and meter, all walk/kick phases, double jump, activation gates, shout-before-drop timing, frozen targeting, single-hit damage through Block, airborne swept collision, horizontal evasion, no late landing hits, opposing invulnerability, full presentation protection, KO/timeout completion, cleanup, and CPU use. Browser checks cover the shout, landing marker, falling cab and impact, recovery, walk scale, mirrored 844×390 landscape and 390×844 portrait layouts, on-screen punch/kick meter charging, and sound-enabled special activation and recovery without game errors. These are viewport/pointer checks, not physical-device tests.

Run `node tools/prepare-cranes-qa.mjs` for local animation scenes at `/__qa-cranes-runner.html`, then use `--clean` before release. Full-meter fixtures are excluded from production. All fourteen prior fighter assets and atlas entries are preserved.


## Demon and Munchy release (2026-11-21)

Demon is the sixteenth selectable player or CPU fighter. Three transparent 4×4 atlases provide 48 poses: `demon-fighter.png` contains guard, jumps, punch, block, six complete kick phases, hurt and KO; `demon-actions.png` supplies eight swagger steps plus point, chin-up, look-away and recovery poses; `demon-crew.png` supplies masked running, descending, landing, punching, kicking and exit poses. The character sheets are 1254×1254; the helper sheet is 1263×1245, indexed with its actual cell dimensions.

The supplied concept sheet guides the original generated artwork: medium-brown skin, blond-tipped black locs, white T-shirt, neck and arm tattoos, layered silver jewelry, black cargo trousers and white sneakers. All masked helpers wear black balaclavas, hoodies, gloves, loose trousers and sneakers with charcoal highlights. The briefs request isolated full-body figures, transparent cells and no text, opponent or baked-in background. `tools/build-demon-atlas.py` records alpha bounds and anchors without altering image pixels. The authored chin-up special poses are mirrored relative to the opponent-facing direction so Demon visibly turns away and upward.

**The Crew** consumes a full meter. Demon points, turns away at 0.64 seconds, then two helpers enter from each side and two descend from above. The marked target area locks before the attacks, allowing horizontal evasion. Each helper attacks twice, for twelve unblockable four-damage hits (48 total) and a final airborne knockback. Helpers then run or leap offscreen before Demon turns back. They are drawn behind the actual opponent so the fight stays readable. Demon remains protected for the complete 4.1-second presentation. Early knockouts and timeout complete the visuals without further HP damage; reset and forced finish remove all helpers and flags.

The fighter previously displayed as Ice Spice is now **Munchy** in selection, opponent choices, HUD, results, accessibility labels and help. The stable `icespice` identifier, original artwork and Munch mechanics are preserved.

All 139 behavior checks pass, including all 240 ordered simultaneous-special matchups. Demon checks cover both player sides and directions at 30/60/120 fps, meter rules, normal combat, complete walking/kick phases, double jumps, point-before-turn-before-entry timing, all three entrance directions, twelve individual hits, running/jump evasion, protection, KO/timeout completion, cleanup and CPU use. Browser verification covers pointing and upward look-away, side/top arrivals, combo and launch, kick recovery, swagger, mirrored 390×844 portrait and 844×390 landscape layouts, on-screen special activation with sound enabled, meter consumption and full recovery without game errors. These are browser viewport and pointer checks, not physical-device tests.

Run `node tools/prepare-demon-qa.mjs` for local scenes at `/__qa-demon-runner.html`; run it with `--clean` before release. Full-meter fixtures are excluded from production. All fifteen prior fighter assets and atlas entries are unchanged.

## Ocrrrrr! release (2026-11-21)

Ocrrrrr! is the seventeenth selectable player or CPU fighter. Three transparent PNG atlases supply 36 authored frames: `dist/assets/ocrrrrr-fighter.png` (1246×1263, 4×4) contains guard, jumps, open-hand claw slaps, block, six complete kick phases, hurt and KO; `dist/assets/ocrrrrr-actions.png` (1246×1263, 4×4) contains eight confident strut poses and eight gather, reach, held two-handed thrust and recovery poses; `dist/assets/ocrrrrr-nails.png` (1254×1254, 2×2) supplies four glossy pink stiletto nail variants. Kick recovery visibly lowers the foot and plants both feet before a held attack repeats.

The built-in image generator used the supplied Ocrrrrr! concept sheet. Generation briefs preserve her adult chibi face and proportions, warm medium-brown complexion, magenta makeup, long straight red hair, red paisley bandana, red-and-white paisley crop top and shorts, open puff-sleeved cropped jacket, layered jewelry with a plain jewel pendant, and red-and-white high-top sneakers. The two body sheets request isolated right-facing full-body poses, consistent scale, transparent cell margins, no text, borders, opponent or baked-in special effects. The special holds both hands forward with ordinary manicure length so the renderer can grow the nails from the fingertips. The separate effects brief requests four isolated horizontal pink acrylic nails with rounded roots on the left, sharp tips on the right and pink/white shine. `tools/build-ocrrrrr-atlas.py` indexes actual cell dimensions, alpha bounds and body anchors without changing generated pixels.

**Nail Pierce** consumes a full meter and lasts 2.06 seconds. She gathers power, reaches both hands toward the opponent and grows ten nails between 0.64 and 1.00 seconds. The nails remain attached to individual fingertips, hold their reach, then shrink between 1.26 and 1.62 seconds before her smug recovery and return to guard. `dist/ocrrrrr.js` supplies shared animation timing and fingertip geometry. Visible nail segments also drive swept collision during the 0.78–1.12-second strike window. A successful strike deals one unblockable 48-damage hit, creates a pink-white starburst at contact and launches the actual opponent backward and upward. The attack can miss a distant or behind-the-caster opponent and can be evaded with a timed double jump. Retraction cannot deal late damage, and special hits do not refill the meter. The CPU uses the move within its forward reach. Protection lasts through the presentation; KO and timeout finish the visuals without extra damage, while reset and forced finish immediately clear nails, impacts and caster flags.

All 151 combat behavior checks pass, including all 272 ordered simultaneous-special pairings. New checks cover both player sides and directions at 30/60/120 fps, meter gates, normal attacks and double jumps, all walking and kick phases, hands-before-nails timing, ten attached and mirrored nail segments, one exact damage event, visual reach and collision agreement, misses, jump evasion, opposing special protection, full recovery, KO/timeout completion, cleanup and CPU use. Browser checks cover growth, contact, knockback, retraction, walking, planted kick recovery, mirrored 844×390 landscape and 390×844 portrait layouts, and on-screen special activation with sound enabled, meter consumption and full recovery without game errors. These are browser viewport and pointer checks, not physical-device tests.

Run `node tools/prepare-ocrrrrr-qa.mjs` for local visual scenes at `/__qa-ocrrrrr-runner.html`, then run it with `--clean` before release. Full-meter fixtures are excluded from production. All sixteen previous fighter asset bytes and atlas entries are unchanged.

## Full-screen play and longer rounds (2026-11-21)

The arena fills the available browser viewport in portrait and landscape. Compact health and special meters sit over the top edge; the single Pause button opens Resume, Sound, Controls, Restart, Fighters, and browser fullscreen where supported. Safari’s browser chrome remains under Safari’s control. The existing stage artwork fills tall viewports without stretching fighter sprites.

Only the on-screen Pause button or a controller’s dedicated Menu / Options button enters the paused state. P, Escape, focus loss, and visibility changes do not pause; focus/visibility changes still release held input and discard timing backlog. Touch gestures, double taps, text selection, and callouts are prevented on the live play surface, including disabled controls. Roster and menu scrolling remain available.

Every fighter now starts with 320 HP, up from 160, on both sides and after each restart. Attack damage, special timing, and meter gains are preserved. An unblocked KO takes 32 normal punches or 22 kicks. Rounds retain the 90-second timer.

Validation: 153 combat checks passed, including all 17 fighters and new endurance/reset checks at 30/60/120 fps. Browser checks covered 1280×760, 844×390, 844×326, 390×844, and 320×568 layouts, menu/help/resume, simulated touch/gesture defaults, blur and keyboard pause regressions, rapid jump taps, held attacks, and stick release. These are desktop browser checks of mobile layouts and input handling; physical iPhone Safari behavior was not directly tested.


### The President, O’whinny, and RoboKing

Three fighters added from the supplied character designs, with 96 transparent character frames and 20 companion/effect frames. The President calls Executive Airstrike, O’whinny summons four waves of Money Rain, and RoboKing calls a truck followed by a robot punch. Specials deal up to 48 damage, require full hit-powered meter, and preserve the existing 320-health rounds.

The President and RoboKing have Personal Security: a follower blocks every tenth eligible incoming punch/kick contact (including a manually blocked contact), consumes that attack once, and grants no damage or meter. Misses, invulnerable contacts, and specials do not count. The counter resets each round; all specials bypass the passive. The robot joins the truck during Cybertruck Protocol, then returns as a follower.

Implementation: `dist/executive-fighters.js` contains shared pose mappings and simulation timelines; `dist/executive-renderer.js` draws the supplied-design sprites. `tools/build-executive-atlas.py` indexes alpha bounds without altering generated artwork. Artwork prompts and source paths are recorded in `references/three-fighter-art-prompts.json`.


### Quick Fast, Sassy T, and J Minors

The roster now has 23 fighters. The new transparent sprite sheets add 96 full-body poses and 12 effect/companion frames, based on the supplied designs.

- **Quick Fast:** headbutt on J, a six-phase backflip kick on K, and Quick Fast Rush. The full-meter rush physically crosses the stage, deals one 48-damage hit, then skids and recovers.
- **Sassy T:** runway strut, open-hand slap, back kick, and SLIIIIME! He opens his pink purse, throws a green slime projectile, and coats the actual opponent on contact. An original male voice shouts “Sliiiime!” with Sound enabled. Muting, pausing, and leaving a round stop the cue.
- **J Minors:** cool strut, jab, front kick, and The Chase. He panics and runs past his rival while a blonde handbag-wielding pursuer follows and strikes the marked position. Moving out of that position avoids the strike.

Each special deals 48 damage, consumes a full meter, has complete presentation protection and recovery, and uses the same player/CPU logic. The existing 320-health rounds, fullscreen arena, compact HUD, consolidated Pause options, and touch gesture handling are retained. See `references/rush-fighters-release.md` for validation and `references/rush-fighter-art-prompts.json` for asset provenance.

## Cockeyed Charles

The roster now includes Cockeyed Charles with 16 transparent poses matching the supplied green hoodie, blue cap, gold chains, thin body, oversized head and visibly crossed eyes. His basic attack swipes downward. Bear Spray Call-Out shows a phone call, draws the can, and sprays a broad yellow cone across most of the arena. Four pulses deal 12 damage each (48 total), require the full meter, and do not recharge it. He is selectable by either local player and as a CPU opponent.

## Feud Fam

Feud Fam joins the roster with his bald head, black mustache, charcoal-purple suit and purple polka-dot tie. His 15 character poses include movement, punches, a kick, blocking, hurt, victory and pointing. The Board Drop points upward, reveals a separate illuminated scoreboard above the opponent, locks its location, then drops it for one 48-damage impact. The move requires the full meter and can be dodged after the board appears. Available in CPU and local two-player modes.

## Ooou Saber

Ooou Saber has 16 transparent poses matching the red cap, dreadlocks, white shirt, gray sweats, front pouch and silver chains. Basic attacks swipe downward. Jelly Saber Strike reaches into the pouch, draws a glowing magenta fantasy sword, then slashes with an “OOOUUU!” speech bubble. One hit deals 48 damage within 340 world pixels, requires the full meter, and can miss. Selectable for CPU and local two-player matches.

Tree-a Yawl joins the 37-fighter roster with hand-rubbing movement, open-hand slaps, and Orb Dragon Rush: seven orange orbs summon a sweeping green dragon. Available in solo and local two-player modes.
