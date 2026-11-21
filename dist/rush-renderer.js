import { rushPose } from './rush-fighters.js';
const clamp = (n) => Math.max(0,Math.min(1,n));
export function createRushRenderer(ctx, frame, assets, ground) {
  function person(key,index,x,y,height,facing,alpha=1) {
    const f=frame(key,index);if(!f)return;
    const scale=height/assets()[key].referenceHeight;
    ctx.save();ctx.translate(x,ground-y);ctx.scale(facing,1);ctx.globalAlpha*=clamp(alpha);
    ctx.drawImage(f.image,-f.anchorX*scale,-f.anchorY*scale,f.w*scale,f.h*scale);ctx.restore();
  }
  function prop(index,x,y,width,height,alpha=1,facing=1) {
    const f=frame('sassytSupport',index);if(!f)return;
    ctx.save();ctx.translate(x,ground-y);ctx.scale(facing,1);ctx.globalAlpha*=clamp(alpha);
    ctx.drawImage(f.image,-width/2,-height/2,width,height);ctx.restore();
  }
  function behind(s,game) {
    if(s.kind!=='quickRush'||s.phase!=='rush')return;
    const owner=game.fighters.find(f=>f.id===s.owner),pose=rushPose(owner,s);
    // Reuse the actual running drawing for speed echoes, preserving the character.
    for(let i=3;i>=1;i--)person(pose.key,pose.index,owner.x-s.facing*i*45,0,215,s.facing,.19-i*.035);
  }
  function special(s,game) {
    if(s.kind==='slime') {
      if(s.released&&!s.spent)prop(Math.floor(s.age*12)%2,s.x,s.y,105,48,1,s.facing);
      if(s.hitCount) {
        const target=game.fighters.find(f=>f.id!==s.owner),age=s.age-s.hitAt;
        if(age<.28)prop(2,target.x,target.y+112,190,185,1-age/.4);
        else prop(3,target.x,target.y+103,150,215,Math.min(.88,(s.duration-s.age)/.6));
      }
    } else if(s.kind==='chase'&&s.age>=.4) {
      person('jminorsSupport',s.chaserPose,s.chaserX,0,215,s.facing,Math.min((s.age-.4)/.15,(s.duration-s.age)/.35));
    }
  }
  return {behind,special};
}
