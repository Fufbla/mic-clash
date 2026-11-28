// Presentation only. Combat damage, hitboxes and input timing remain unchanged.
export function blockFrame(age, impactAge=Infinity) {
  if(impactAge>=0&&impactAge<.12)return 2;
  if(impactAge>=0&&impactAge<.23)return 3;
  return age<.10?0:1;
}
export function defeatFrame(age){return 4+(age<.16?0:age<.34?1:age<.52?2:3);}
export function isDefeated(f,g){
  if(f.inCar||f.grabbedBy||f.beltHeldBy)return false;
  return f.state==='ko'||f.hp===0||Boolean(g.over&&g.winner&&g.winner!=='draw'&&g.winner!==f.id);
}
export class DefensePresentation {
  games=new WeakMap();
  record(game,f){
    let round=this.games.get(game);const elapsed=game.elapsed||0;
    if(!round||elapsed<round.elapsed)this.games.set(game,round={elapsed,records:new Map()});
    round.elapsed=elapsed;let rec=round.records.get(f.id);
    // Online snapshots replace fighter objects; keep clocks keyed by stable IDs.
    if(!rec||rec.type!==f.type)round.records.set(f.id,rec={type:f.type,blockAt:-Infinity,defeatedAt:null,landedAt:null});
    return rec;
  }
  noteBlock(game,f,now){if(f)this.record(game,f).blockAt=now;}
  sample(f,game,now,assets){
    const rec=this.record(game,f),defeated=isDefeated(f,game);
    if(!defeated){rec.defeatedAt=null;rec.landedAt=null;}
    else if(rec.defeatedAt===null)rec.defeatedAt=now;
    const age=defeated?Math.max(0,now-rec.defeatedAt):-1;
    const y=defeated&&game.over?Math.max(0,f.y||0)*Math.max(0,1-age/.28):f.y||0;
    if(defeated&&(f.grounded||y<=2)&&rec.landedAt===null)rec.landedAt=now;
    const fallAge=rec.landedAt===null?0:Math.max(0,now-rec.landedAt),key=f.type+'Defense',entry=assets?.[key];
    let pose=null;
    if(defeated&&entry?.hasDefeat)pose={key,index:defeatFrame(fallAge)};
    else if(!defeated&&f.state==='block'&&entry)pose={key,index:blockFrame(f.stateTime||0,now-rec.blockAt)};
    return {pose,defeated,age,y};
  }
}
