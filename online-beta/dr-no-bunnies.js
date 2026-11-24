/**
 * Dr. No Bunnies — Mic Clash integration module
 * Original fighter artwork from the user's Dr. No Bunnies move chart.
 * This is framework-neutral code. Wire its callbacks into the existing Mic Clash
 * combat engine rather than replacing the game's protected-special system.
 */
export const DR_NO_BUNNIES = Object.freeze({
  id: 'dr-no-bunnies',
  name: 'Dr. No Bunnies',
  displayName: 'DR. NO BUNNIES',
  stance: 'open-handed slap',
  characterArt: 'assets/dr-no-bunnies-fighter.png',
  animationAtlas: 'assets/atlas.json',
  moves: {
    punch: { id: 'open-hand-slap', label: 'OPEN-HAND SLAP', animation: 'slap', damage: 10, range: 132, activeMs: 90, cooldownMs: 400, meterOnHit: 20, hitType: 'slap' },
    kick: { id: 'kick', label: 'KICK', animation: 'kick', damage: 15, range: 178, activeMs: 120, cooldownMs: 580, meterOnHit: 25, hitType: 'kick' },
  },
  special: {
    id: 'african-pride-belt-slap',
    label: 'THE AFRICAN PRIDE BELT SLAP',
    callout: 'LASHES!',
    beltColors: ['#d41f22', '#111111', '#0d9e51'],
    buckle: 'gold silhouette of the continent of Africa',
    meterCost: 100,
    range: 285,
    durationMs: 2700,
    invulnerableAttacker: true,
    unblockable: true,
    uninterruptible: true,
    continueToEndOnKO: true,
    hits: [
      {atMs: 720, damage: 16, knockback: 0, callout: 'LASHES!'},
      {atMs: 1430, damage: 16, knockback: 0, callout: 'LASHES!'},
      {atMs: 2150, damage: 16, knockback: 190, callout: 'LASHES!'},
    ],
  },
});

/**
 * A finite-state protected three-hit special. The host's hit callback is
 * responsible for actual HP changes and must bypass block, parry, counter,
 * i-frames, hit-stun and knockback interrupts. End-of-round results wait until
 * completion, even if a hit would otherwise KO the defender early.
 *
 * Calls from host game:
 *  - start({attacker,defender, now, meter, distance}) -> {ok, reason?}
 *  - tick(now)
 *  - isProtected(attacker) -> bool (skip ALL incoming damage/stun/knockback)
 *  - tryInterrupt() -> false while active
 *
 * Required callbacks: onHit(strikeInfo), onComplete({attacker,defender}),
 * onCue({type,...}) for visual belt, callouts and sounds; optional onStart.
 */
export class AfricanPrideBeltSlap {
  constructor({onHit=()=>{},onComplete=()=>{},onCue=()=>{},onStart=()=>{}}={}) {
    this.onHit=onHit;this.onComplete=onComplete;this.onCue=onCue;this.onStart=onStart;
    this.active=false;this.attacker=null;this.defender=null;
    this.startedAt=0;this.nextHit=0;
  }
  start({attacker,defender,now,meter,distance}) {
    const spec=DR_NO_BUNNIES.special;
    if (this.active) return {ok:false,reason:'Special already playing'};
    if (!attacker || !defender || !Number.isFinite(now)) return {ok:false,reason:'Missing combatants/time'};
    if ((meter??0)<spec.meterCost) return {ok:false,reason:'Fill the special meter first'};
    if (!Number.isFinite(distance) || distance>spec.range) return {ok:false,reason:'Get closer'};
    this.active=true;this.attacker=attacker;this.defender=defender;
    this.startedAt=now;this.nextHit=0;
    this.onStart({attacker,defender,durationMs:spec.durationMs,meterCost:spec.meterCost,protected:true});
    this.onCue({type:'belt-appear',beltColors:spec.beltColors,buckle:spec.buckle});
    return {ok:true,meterCost:spec.meterCost};
  }
  isProtected(fighter){return this.active && fighter===this.attacker;}
  tryInterrupt(){return !this.active;}
  tick(now){
    if (!this.active) return false;
    const spec=DR_NO_BUNNIES.special,elapsed=Math.max(0,now-this.startedAt);
    while(this.nextHit<spec.hits.length && elapsed>=spec.hits[this.nextHit].atMs){
      const index=this.nextHit++,s=spec.hits[index];
      const detail={attacker:this.attacker,defender:this.defender,number:index+1,total:3,
        damage:s.damage,knockback:s.knockback,callout:s.callout,
        forceHit:true,unblockable:true,bypassBlock:true,bypassParry:true,
        cinematic:true,deferRoundEnd:true,interruptAttacker:false};
      this.onCue({type:'belt-slap',...detail});
      this.onHit(detail);
      this.onCue({type:'callout',text:s.callout,number:index+1});
    }
    if(elapsed>=spec.durationMs){
      const ended={attacker:this.attacker,defender:this.defender};
      this.active=false;this.attacker=null;this.defender=null;
      this.onCue({type:'belt-disappear'});this.onComplete(ended);
    }
    return true;
  }
}
