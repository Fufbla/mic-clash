import { FACE_SHOT } from './gauntlet-fighters.js';
const clamp = n => Math.max(0,Math.min(1,n));
export function createGauntletRenderer(ctx, frame, assets, ground) {
  function prop(index,x,y,width,alpha=1,facing=1,angle=0) {
    const f=frame('gauntletProps',index);if(!f)return;
    const height=width*f.h/f.w;
    ctx.save();ctx.translate(x,ground-y);ctx.scale(facing,1);ctx.rotate(angle);ctx.globalAlpha*=clamp(alpha);
    ctx.drawImage(f.image,-width/2,-height/2,width,height);ctx.restore();
  }
  function helper(s,h) {
    if(!h.visible)return;
    const f=frame('nobuttonsCrew',h.index*4+h.pose);if(!f)return;
    const atlas=assets().nobuttonsCrew;
    const reference=atlas.rowReferenceHeights?.[h.index]||atlas.referenceHeight;
    const scale=(h.index<2?184:172)/reference;
    ctx.save();ctx.translate(h.x,ground-h.y);ctx.scale(h.facing,1);
    ctx.globalAlpha*=clamp((s.age-.5)/.12)*clamp((4.02-s.age)/.16);
    ctx.drawImage(f.image,-f.anchorX*scale,-f.anchorY*scale,f.w*scale,f.h*scale);ctx.restore();
  }
  function behind(s) {
    if(s.kind==='faceShot' && s.age>.2) prop(2,s.focusX,FACE_SHOT.hoopHeight,160,Math.min((s.age-.2)/.2,(s.duration-s.age)/.35));
    if(s.kind==='prizeCrew')for(const h of s.crew)if(h.index<2)helper(s,h);
  }
  function special(s) {
    if(s.kind==='faceShot' && s.released) {
      if(!s.spent) prop(Math.floor(s.age*16)%2,s.x,s.y,42,1,1,s.age*8);
      else if(s.hitCount && s.age-s.spentAt<.65) {
        const t=s.age-s.spentAt;
        prop(Math.floor(t*16)%2,s.ballImpactX-s.facing*t*200,Math.max(23,s.ballImpactY+70*t-650*t*t),42,1-t/.7,1,t*12);
      }
    } else if(s.kind==='royce' && s.age>=.4 && s.age<3.56) {
      const f=frame('gauntletProps',3);if(!f)return;
      const height=400*f.h/f.w;
      prop(3,s.x,height/2-5,400,1,s.facing);
    } else if(s.kind==='prizeCrew')for(const h of s.crew)if(h.index>=2)helper(s,h);
  }
  return {behind,special};
}
