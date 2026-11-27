export const UPPERCUT = Object.freeze({duration:.72,start:.24,end:.38,range:190,verticalRange:175,damage:24,meter:30,stun:.46,knock:170,lift:570,linkWindow:.72,queueWindow:2.2});
export function clearCombo(f) {f.comboStep=0;f.comboRemaining=0;f.attackQueue=[];}
export function resolveCombo(f,requested) {
  if(requested==='punch' && f.comboStep===2 && f.comboRemaining>0){f.comboStep=0;f.comboRemaining=0;return 'uppercut';}
  f.comboStep=requested==='kick'?Math.min(2,(f.comboRemaining>0?f.comboStep:0)+1):0;
  if(requested!=='kick')f.comboRemaining=0;
  return requested;
}
export function uppercutFrame(p){return p<.14?0:p<.29?1:p<.4?2:p<.56?3:p<.77?4:5;}
export function uppercutPose(f){return f.state==='uppercut'?{key:f.type+'Uppercut',index:uppercutFrame(f.attackProgress||0)}:null;}
