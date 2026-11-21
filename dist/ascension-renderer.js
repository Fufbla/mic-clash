const clamp=v=>Math.max(0,Math.min(1,v));
export function createAscensionRenderer(ctx,frame,assets,ground) {
  function prop(index,x,y,width,alpha=1,facing=1) {
    const f=frame('eynakeastSupport',index);if(!f)return;
    const height=width*f.h/f.w;
    ctx.save();ctx.translate(x,ground-y);ctx.scale(facing,1);ctx.globalAlpha*=clamp(alpha);
    ctx.drawImage(f.image,-width/2,-height/2,width,height);ctx.restore();
  }
  function behind(s,game) {
    const owner=game.fighters.find(f=>f.id===s.owner);if(!owner)return;
    if(s.kind==='ghostAscension') {
      const strength=clamp(s.age/.35)*clamp((4.2-s.age)/.4);
      ctx.save();ctx.globalAlpha=.5*strength;ctx.strokeStyle='#c580ff';ctx.lineWidth=5;
      ctx.shadowBlur=20;ctx.shadowColor='#ae4eff';ctx.beginPath();ctx.ellipse(owner.x,ground,84,19,0,0,Math.PI*2);ctx.stroke();ctx.restore();
      if(s.age>=1.25&&s.age<3.8){
        const alpha=clamp((s.age-1.25)/.2)*clamp((3.8-s.age)/.4);
        for(const offset of[-130,0,130])prop(s.age>3.35?15:14,owner.x+offset,36,140,alpha);
      }
      if(s.age>=1.4&&s.age<1.8){prop(8,owner.x-85,135,70);prop(10,owner.x+100,175,115);}
    } else if(s.kind==='goatSign'&&s.age>.3&&s.age<2.4) {
      const power=clamp((s.age-.3)/.75)*clamp((2.4-s.age)/.4);
      ctx.save();const glow=ctx.createRadialGradient(owner.x,ground-190,8,owner.x,ground-190,220);
      glow.addColorStop(0,'rgba(255,250,205,.65)');glow.addColorStop(1,'rgba(255,204,50,0)');
      ctx.globalAlpha=power;ctx.fillStyle=glow;ctx.fillRect(owner.x-230,ground-420,460,440);ctx.restore();
    }
  }
  function special(s) {
    if(s.kind==='ghostAscension')for(const g of s.ghosts)if(g.visible)prop(g.pose,g.x,g.y,g.index===1?145:g.index===2?180:85,1,s.facing);
    if(s.kind==='travy'&&s.helper?.visible){
      const h=s.helper,f=frame('travySupport',h.pose);if(!f)return;
      const scale=205/assets().travySupport.referenceHeight;
      ctx.save();ctx.translate(h.x,ground-h.y);ctx.scale(h.facing,1);
      ctx.globalAlpha*=clamp((s.age-.65)/.1)*clamp((3.15-s.age)/.15);
      ctx.drawImage(f.image,-f.anchorX*scale,-f.anchorY*scale,f.w*scale,f.h*scale);ctx.restore();
    }
  }
  return {behind,special};
}
