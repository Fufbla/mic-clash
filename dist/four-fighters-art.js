// Game-safe illustrated chibi frames for CZR, Shannon Dull, Red Rolls and Smoke Lord.
const TONES={
 czr:{skin:'#bd8058',hair:'#161217',outfit:'#14161e',accent:'#bda4f5',shoes:'#11151d'},
 shannondull:{skin:'#a36a45',hair:'#251c19',outfit:'#65754c',accent:'#dfaa45',shoes:'#d2a047'},
 redrolls:{skin:'#a86543',hair:'#181317',outfit:'#b12136',accent:'#f3e0c0',shoes:'#f9f7f7'},
 smokelord:{skin:'#b67d50',hair:'#181618',outfit:'#2b3036',accent:'#bec8ce',shoes:'#f2f2ef'},
 czrAlien:{skin:'#9951bc',hair:'#2a1848',outfit:'#50298a',accent:'#b4ff59',shoes:'#663eca'},
 shannondullGiant:{skin:'#98603d',hair:'#211611',outfit:'#475b35',accent:'#d1a144',shoes:'#ab6526'}
};
function oval(ctx,x,y,rx,ry,color){
 ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,Math.max(1,rx),Math.max(1,ry),0,0,Math.PI*2);ctx.fill();
}
function line(ctx,a,b,c,d,w,color){
 ctx.strokeStyle=color;ctx.lineWidth=w;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(a,b);ctx.lineTo(c,d);ctx.stroke();
}
function drawOne(ctx,id,n){
 const c=TONES[id],alien=id==='czrAlien',giant=id==='shannondullGiant',red=id==='redrolls';
 const smoke=id==='smokelord',shannon=id==='shannondull'||giant,czr=id==='czr';
 const run=n<8,attack=n>=8&&n<11,ko=n===11,phase=(n%8)*Math.PI/4;
 const bob=run?Math.sin(phase)*3:0,step=run?Math.sin(phase)*20:0;
 ctx.save();ctx.translate(120,220+bob);if(ko){ctx.rotate(-1.04);ctx.translate(20,-33);}
 oval(ctx,0,3,60,9,'rgba(0,0,0,.22)');
 line(ctx,-22,-74,-25-step,-17,25,alien?'#543593':'#302b2a');
 line(ctx,22,-74,27+step,-17,25,alien?'#543593':'#302b2a');
 oval(ctx,-25-step,-12,23,11,c.shoes);oval(ctx,28+step,-12,23,11,c.shoes);
 ctx.fillStyle=c.outfit;ctx.strokeStyle='#161419';ctx.lineWidth=4;
 ctx.beginPath();ctx.moveTo(-35,-148);ctx.quadraticCurveTo(0,-168,35,-148);
 ctx.lineTo(44,-79);ctx.quadraticCurveTo(0,-62,-44,-79);ctx.closePath();ctx.fill();ctx.stroke();
 if(giant){oval(ctx,-41,-129,28,34,c.skin);oval(ctx,41,-129,28,34,c.skin);}
 if(red){line(ctx,-8,-137,8,-100,8,'#f4cdb1');oval(ctx,5,-108,5,6,'#fff4ce');}
 if(smoke){ctx.fillStyle='#9ca0a5';ctx.fillRect(-12,-147,24,8);}
 if(shannon){line(ctx,-29,-95,29,-95,10,c.accent);}
 if(czr){oval(ctx,0,-97,10,8,c.accent);}
 const extension=attack&&n%2?52:0;
 const fistColor=smoke?'#c3c9d0':red?'#8d261f':c.skin;
 line(ctx,-32,-135,-53+(run?step/3:0),-105,20,c.skin);
 line(ctx,32,-137,60+extension,-111-(attack?17:0),23,c.skin);
 oval(ctx,-55+(run?step/3:0),-104,15,17,fistColor);
 oval(ctx,60+extension,-111-(attack?17:0),16,18,fistColor);
 if(smoke){oval(ctx,-55,-105,18,20,'#b5bec6');oval(ctx,60+extension,-112,18,21,'#b5bec6');}
 if(red){line(ctx,51+extension,-131,76+extension,-171,6,'#50b19e');oval(ctx,77+extension,-173,8,12,'#5a7c5b');}
 if(n===10){line(ctx,22,-75,93,-73,22,c.outfit);oval(ctx,94,-73,21,12,c.shoes);}
 if(czr||alien){for(let j=0;j<19;j++){const a=j/19*Math.PI*2;oval(ctx,Math.cos(a)*50,-179+Math.sin(a)*48,17,19,alien?'#2c174b':'#131216');}}
 if(red){for(let j=0;j<18;j++){const a=j/18*Math.PI*2;oval(ctx,Math.cos(a)*48,-186+Math.sin(a)*40,12,18,'#1c1617');}}
 if(smoke){for(let j=0;j<12;j++){const x=-48+j*9;line(ctx,x,-217,x+8,-118,9,'#1f1817');}}
 oval(ctx,0,-176,49,54,c.skin);
 if(shannon){oval(ctx,0,-216,47,17,c.hair);ctx.strokeStyle='#19191b';ctx.lineWidth=7;ctx.strokeRect(-41,-190,35,20);ctx.strokeRect(7,-190,35,20);line(ctx,-6,-181,7,-181,5,'#19191b');}
 if(alien){line(ctx,-25,-215,-45,-257,10,'#caa1f0');line(ctx,25,-215,45,-257,10,'#caa1f0');oval(ctx,-22,-182,22,24,'#bfff59');oval(ctx,23,-182,22,24,'#bfff59');oval(ctx,-22,-181,6,17,'#242332');oval(ctx,23,-181,6,17,'#242332');}
 else{oval(ctx,-20,-182,12,10,'#f7f4e5');oval(ctx,20,-182,12,10,'#f7f4e5');oval(ctx,-19,-182,5,8,'#292127');oval(ctx,19,-182,5,8,'#292127');}
 if(!shannon){ctx.strokeStyle=c.hair;ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(-25,-209);ctx.quadraticCurveTo(0,-233,28,-207);ctx.stroke();}
 ctx.strokeStyle=alien?'#30162c':'#602e31';ctx.lineWidth=4;ctx.beginPath();ctx.arc(1,-160,16,.2,Math.PI-.1);ctx.stroke();
 ctx.restore();
}
export function createFourAssets(){
 const out={};
 for(const id of Object.keys(TONES)){
  const canvas=document.createElement('canvas');canvas.width=960;canvas.height=960;
  const g=canvas.getContext('2d');const frames=[];
  for(let i=0;i<16;i++){
   g.save();g.translate(i%4*240,Math.floor(i/4)*240);drawOne(g,id,i);g.restore();
   frames.push({x:i%4*240,y:Math.floor(i/4)*240,w:240,h:240,anchorX:120,anchorY:220});
  }
  out[id]={image:canvas,frames,referenceHeight:223,width:960,height:960,cols:4,rows:4};
 }
 return out;
}
export function drawFourSpecial(ctx,s,game,frame,ground){
 const owner=game.fighters.find(f=>f.id===s.owner),target=game.fighters.find(f=>f.id!==s.owner);if(!owner)return;
 const t=s.age,clamp=v=>Math.max(0,Math.min(1,v));ctx.save();
 if(s.kind==='alienStrike'&&t>.42&&t<2.65){
  ctx.strokeStyle='rgba(180,255,83,.75)';ctx.lineWidth=5;ctx.shadowBlur=21;ctx.shadowColor='#a4ff4e';
  for(let j=0;j<5;j++){ctx.beginPath();ctx.arc(owner.x,ground-135,65+j*26,(t*3+j)*.8,(t*3+j)*.8+Math.PI*.85);ctx.stroke();}
  if(t>1.12&&target){ctx.globalAlpha=clamp((t-1.12)/.25)*clamp((2.6-t)/.5);ctx.beginPath();ctx.ellipse(target.x,ground-target.y-115,70,105,0,0,Math.PI*2);ctx.stroke();}
 }
 if(s.kind==='giantSmash'&&t>1.35&&t<2.8){
  const size=(t-1.35)*190;ctx.strokeStyle='rgba(255,195,50,.8)';ctx.lineWidth=10;ctx.shadowColor='#ffc342';ctx.shadowBlur=17;
  for(let j=0;j<3;j++){ctx.beginPath();ctx.ellipse(owner.x,ground,Math.max(1,size+j*70),16+j*8,0,0,Math.PI*2);ctx.stroke();}
  if(t>1.7){ctx.fillStyle='rgba(255,223,150,.35)';ctx.fillRect(0,ground-9,1280,18);}
 }
 if(s.kind==='lowriderCrew'){
  if(t>.45&&t<3.8){
   const carX=s.facing>0?owner.x+Math.min(200,(t-.4)*280):owner.x-Math.min(200,(t-.4)*280);
   ctx.save();ctx.translate(carX,ground-75-Math.sin(t*5)*18);ctx.scale(s.facing,1);
   ctx.fillStyle='#b0172b';ctx.strokeStyle='#e1a1a8';ctx.lineWidth=6;
   ctx.beginPath();ctx.roundRect(-175,-78,350,90,25);ctx.fill();ctx.stroke();
   ctx.fillStyle='#76101e';ctx.beginPath();ctx.moveTo(-65,-80);ctx.lineTo(-30,-125);ctx.lineTo(90,-125);ctx.lineTo(147,-80);ctx.closePath();ctx.fill();ctx.stroke();
   ctx.fillStyle='#99d0de';ctx.fillRect(-12,-118,94,29);
   for(const x of[-105,100]){ctx.fillStyle='#1a1b22';ctx.beginPath();ctx.arc(x,8,31,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#d5d8db';ctx.lineWidth=8;ctx.stroke();}
   ctx.restore();
  }
  for(const kid of s.crew){if(!kid.visible)continue;
   const f=frame('redrolls',kid.pose);if(!f)continue;const scale=127/223;
   ctx.save();ctx.translate(kid.x,ground-30);ctx.scale(kid.index%2?-1:1,1);
   ctx.drawImage(f.image,-f.anchorX*scale,-f.anchorY*scale,f.w*scale,f.h*scale);ctx.restore();
  }
 }
 if(s.kind==='coneSmash'&&t>.62&&t<2.75){
  const reach=clamp((t-.62)/1.08)*700,angle=t<1.8?-.4:Math.sin((t-1.8)*5)*.16;
  ctx.translate(owner.x+s.facing*70,ground-165);ctx.scale(s.facing,1);ctx.rotate(angle);
  ctx.fillStyle='#c2b08a';ctx.strokeStyle='#4f3d29';ctx.lineWidth=8;
  ctx.beginPath();ctx.moveTo(0,-18);ctx.lineTo(reach,-46);ctx.lineTo(reach,36);ctx.lineTo(0,18);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.fillStyle='#f78237';ctx.beginPath();ctx.ellipse(reach,0,14,39,0,0,Math.PI*2);ctx.fill();
  for(let j=0;j<7;j++){const x=reach+((t*90+j*36)%180),y=Math.sin(t*2+j)*40-j*10;
   ctx.fillStyle='rgba(230,224,208,'+(0.35-j*.04)+')';ctx.beginPath();ctx.arc(x,y,20+j*4,0,Math.PI*2);ctx.fill();}
 }
 ctx.restore();
}
