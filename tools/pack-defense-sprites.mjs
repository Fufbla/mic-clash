// Mechanical silhouette extraction, uniform scaling and atlas packing. No generated poses are rotated or redrawn here.
// Usage: node tools/pack-defense-sprites.mjs <recovered-index.json> <image-directory>
import fs from 'node:fs/promises';import path from 'node:path';import {createRequire} from 'node:module';import {createHash} from 'node:crypto';
const sharp=createRequire(import.meta.url)('sharp'),root=new URL('../',import.meta.url),dist=new URL('dist/',root);
const files=JSON.parse(await fs.readFile(process.argv[2])),imageDir=process.argv[3];
const sourceIds={damedash:1,guccimane:3,nickiminaj:4,miketyson:5,joosie:6,justginger:7,queenbee:8,breezy:9,yungsnow:10,boat:11,trinigold:12,fuedfam:13,ooousaber:14,redrolls:15,shannondull:16,charles:17,treeyawl:18,smokelord:19,czr:20,eynakeast:21,djbeigey:22,taytay:23,jminors:24,bigmumble:25,nobuttons:26,quickfast:27,sassyt:28,president:29,roboking:30,demon:31,ocrrrrr:32,cranes:33,'dr-no-bunnies':34,babybigfists:35,icespice:36,cantrap:37,hehaw:38,mooja:39,smackprince:40,loudbull:41,fatboi:42,getit:43,karate:44,snitchy:45,coupe:46,owl:47};
const newDefeats=new Set('owl coupe karate snitchy getit loudbull fatboi icespice hehaw dr-no-bunnies cantrap smackprince babybigfists mooja charles fuedfam ooousaber treeyawl trinigold boat yungsnow breezy miketyson'.split(' '));
const old=JSON.parse(await fs.readFile(new URL('assets/atlas.json',dist))),roster=JSON.parse(await fs.readFile(new URL('assets/uppercuts/roster.json',dist)));
const out=new URL('assets/defense/',dist);await fs.mkdir(out,{recursive:true});
const atlas={},provenance=[],cell=384,margin=8;
async function raw(input){return sharp(input).ensureAlpha().raw().toBuffer({resolveWithObject:true});}
async function bounds(input){const {data,info}=await raw(input),rows=new Uint32Array(info.height),cols=new Uint32Array(info.width);for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>128){rows[y]++;cols[x]++;}const xs=Array.from(cols).flatMap((n,i)=>n>=3?[i]:[]),ys=Array.from(rows).flatMap((n,i)=>n>=3?[i]:[]);if(!xs.length||!ys.length)throw Error('Empty sprite');return {x:xs[0],y:ys[0],w:xs.at(-1)-xs[0]+1,h:ys.at(-1)-ys[0]+1};}
async function silhouettes(input,count,cols){
 const {data,info}=await raw(input),w=info.width,h=info.height,seen=new Uint8Array(w*h),queue=new Uint32Array(w*h),parts=[];
 for(let start=0;start<w*h;start++){
  if(seen[start]||data[start*4+3]<=128)continue;
  let head=0,tail=1,left=w,top=h,right=0,bottom=0;queue[0]=start;seen[start]=1;
  const visit=p=>{if(!seen[p]&&data[p*4+3]>128){seen[p]=1;queue[tail++]=p;}};
  while(head<tail){const p=queue[head++],x=p%w,y=Math.floor(p/w);left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);if(x)visit(p-1);if(x+1<w)visit(p+1);if(y)visit(p-w);if(y+1<h)visit(p+w);}
  parts.push({left,top,right,bottom,area:tail});
 }
 parts.sort((a,b)=>b.area-a.area);const bodies=parts.slice(0,count);if(bodies.length!==count||bodies.at(-1).area<1000)throw Error('Missing silhouettes');
 bodies.sort((a,b)=>a.top+a.bottom-b.top-b.bottom);
 const ordered=[...bodies.slice(0,cols).sort((a,b)=>a.left+a.right-b.left-b.right),...bodies.slice(cols).sort((a,b)=>a.left+a.right-b.left-b.right)];
 for(const p of parts.slice(count).filter(p=>p.area>=8)){let target=null,gap=13;for(const b of ordered){const d=Math.hypot(Math.max(0,b.left-p.right,p.left-b.right),Math.max(0,b.top-p.bottom,p.top-b.bottom));if(d<gap){gap=d;target=b;}}if(target){target.left=Math.min(target.left,p.left);target.top=Math.min(target.top,p.top);target.right=Math.max(target.right,p.right);target.bottom=Math.max(target.bottom,p.bottom);}}
 return ordered.map((b,i)=>{let pivot=(b.left+b.right)/2;if(i<4){let l=w,r=0;for(let y=Math.max(b.top,b.bottom-18);y<=b.bottom;y++)for(let x=b.left;x<=b.right;x++)if(data[(y*w+x)*4+3]>128){l=Math.min(l,x);r=Math.max(r,x);}if(l<=r)pivot=(l+r)/2;}const left=Math.max(0,b.left-4),top=Math.max(0,b.top-4),right=Math.min(w-1,b.right+4),bottom=Math.min(h-1,b.bottom+4);return {left,top,width:right-left+1,height:bottom-top+1,pivot};});
}
const poseModules=[['nicki-minaj','nickiPose',['nickiminaj']],['gucci-mane','gucciPose',['guccimane']],['diddy','diddyPose',['diddy']],['dame-dash','damePose',['damedash']],['just-ginger','gingerPose',['justginger']],['joosie','joosiePose',['joosie']],['queenbee','queenbeePose',['queenbee']],['cranes','cranesPose',['cranes']],['demon','demonPose',['demon']],['ocrrrrr','ocrrrrrPose',['ocrrrrr']],['executive-fighters','executivePose',['president','owhinny','roboking']],['rush-fighters','rushPose',['quickfast','sassyt','jminors']],['gauntlet-fighters','gauntletPose',['bigmumble','djbeigey','nobuttons']],['ascension-fighters','ascensionPose',['eynakeast','goat','taytay']],['neon-fighters','neonPose',['czr','shannondull','smokelord','redrolls']]];
const existing={};for(const [mod,fn,ids] of poseModules){const m=await import(new URL(mod+'.js',dist));for(const id of ids)existing[id]=m[fn]({id:'p1',type:id,hp:0,state:'ko',stateTime:2,grounded:true,y:0,attackProgress:0});}
for(const f of roster){
 const id=f.id,source=files[sourceIds[id]-1],hasDefeat=newDefeats.has(id);f.guardSource=source?'new':'retained';f.defeatSource=hasDefeat?'new':'retained';f.existingDefeat=existing[id]||{key:id,index:22};
 if(!source)continue;
 const input=await fs.readFile(path.join(imageDir,source.name)),cols=hasDefeat?4:2,count=hasDefeat?8:4,crops=await silhouettes(input,count,cols),uniform=(cell-margin*2)/Math.max(...crops.flatMap(c=>[c.width,c.height])),composites=[],frames=[],heights=[];
 for(let i=0;i<count;i++){
  const col=i%cols,row=Math.floor(i/cols),{pivot,...crop}=crops[i],width=Math.round(crop.width*uniform),height=Math.round(crop.height*uniform),ox=Math.floor((cell-width)/2),oy=cell-margin-height;
  const png=await sharp(input).extract(crop).resize(width,height).extend({top:oy,bottom:margin,left:ox,right:cell-width-ox,background:'#00000000'}).png().toBuffer(),b=await bounds(png);if(i<2)heights.push(b.h);
  frames.push({x:col*cell,y:row*cell,w:cell,h:cell,anchorX:Math.round(ox+(pivot-crop.left)*uniform),anchorY:b.y+b.h,bounds:b,sourceCrop:crop});composites.push({input:png,left:col*cell,top:row*cell});
 }
 const e=old[id],s=e.frames[0],idle=await sharp(await fs.readFile(new URL((s.src||e.src).split('?')[0],dist))).extract({left:s.x,top:s.y,width:s.w,height:s.h}).png().toBuffer(),ib=await bounds(idle),referenceHeight=Math.round(Math.max(...heights)/(ib.h/(e.referenceHeight||s.h))*100)/100;
 const webp=await sharp({create:{width:cols*cell,height:cell*2,channels:4,background:'#00000000'}}).composite(composites).webp({quality:92,alphaQuality:100,effort:5}).toBuffer();await fs.writeFile(new URL(id+'.webp',out),webp);
 atlas[id+'Defense']={src:'assets/defense/'+id+'.webp',sourceFighter:id,referenceHeight,hasDefeat,frames};provenance.push({id,name:f.name,library_file_id:source.library_file_id,sourceSHA256:createHash('sha256').update(input).digest('hex'),frames:count});
}
await fs.writeFile(new URL('atlas.json',out),JSON.stringify(atlas,null,2)+'\n');await fs.writeFile(new URL('roster.json',out),JSON.stringify(roster,null,2)+'\n');
await fs.writeFile(new URL('references/defense-art.json',root),JSON.stringify({date:'2026-11-28',newGuards:46,newDefeats:23,newFrames:276,retainedGuards:['owhinny','goat','diddy'],retainedReason:'Image generation rejected new artwork for these three fighters. Existing drawn guards retained.',method:'Reference-guided drawn poses; complete silhouette extraction, uniform scaling, no body rotations.',sheets:provenance},null,2)+'\n');console.log('Packed '+provenance.length+' guard sheets and '+newDefeats.size+' defeat sequences.');
