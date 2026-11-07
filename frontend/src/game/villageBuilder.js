/* Deterministic voxel city. Roads, docks and the plaza stay put; houses are towers. */
export const seeded = n => { const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x); };
export const riverX = z => -6.5+Math.sin(z*.18)*.85;
export const shoreZ = x => 11.3+Math.sin(x*.24)*1.2;
const LAKES=[[-6.5,-36,9,6],[27,-21,6.5,4.5],[-30,-14,5,3.5]];
export const inLake=(x,z,pad=0)=>LAKES.some(([cx,cz,rx,rz])=>((x-cx)/(rx+pad))**2+((z-cz)/(rz+pad))**2<1);
const PLAZA=[23.5,5.5];
export const cityLand=(x,z)=>z<shoreZ(x)-.8&&x>-43+Math.sin(z*.25)*1.5&&x<42+Math.sin(z*.32)&&z>-43+Math.sin(x*.21)*1.3&&!(z>-36&&Math.abs(x-riverX(z))<2.5)&&!inLake(x,z,.8);

let cityCache, curFloor=null;
export function buildVillage() {
  if(cityCache)return cityCache;
  const blocks=[], lights=[], lamps=[], buildings=[], floors=[];
  let site=null, leftKind=0;
  const box=(x,y,z,w,h,d,color,r=0)=>blocks.push({x,y,z,w,h,d,color,r});
  const glow=(x,y,z,w,h,d,color,flicker=false)=>{
    const light={x,y,z,w,h,d,color};
    if(flicker){const n=seeded(x*19+y*7+z*13);light.flicker=true;light.phase=n;light.speed=.4+n*2.2;}
    if(site){light.fl=curFloor;site.lights.push(light);}else lights.push(light);
  };
  const shine=(x,y,z,s,light=false,extra={})=>lamps.push({x,y,z,s,light,...extra});
  const asphalt=['#3c4450','#343b46','#454d5a','#2e353f'];
  for(let x=-45;x<45;x++)for(let z=-45;z<14;z++){
    const center=riverX(z), coast=shoreZ(x), river=z>-36;
    if(z>coast||x<-44+Math.sin(z*.25)*1.5||x>43+Math.sin(z*.32)||z<-44+Math.sin(x*.21)*1.3||(river&&Math.abs(x-center)<1.65)||inLake(x,z))continue;
    const n=seeded(x*52+z), edge=(river&&Math.abs(x-center)<2.8)||z>coast-1.5||x>41.5||x<-42.5||z<-42.3||inLake(x,z,1.3);
    box(x,.26,z,1.04,1.38,1.04,edge?'#6d7580':'#232a33');
    box(x,.96,z,1.04,.15,1.04,edge?'#8d97a2':asphalt[Math.floor(n*4)]);
    if(edge&&n>.7)box(x,1.05,z,.7,.04,.12,'#d7dee6');
  }
  const ROADS=[
    [-2.2,5.65,43.6,1.55],
    [32.7,5.65,10.6,1.55],
    [6.5,-5.5,61,1.5],
    [-4,-18,40,1.5],
    [-4,-26,40,1.5],
    [7.1,-8.2,1.7,38.4],
    [-2.6,-10,1.5,36],
    [1.5,.4,1.55,12.6],
    [-12,-10,1.5,36],
    [-22,-10,1.5,36],
    [36,.2,1.55,14],
  ];
  function bridge(x,z,w,d){
    if(w<d||z<-34)return;
    const cx=riverX(z);
    if(cx<x-w/2-1||cx>x+w/2+1)return;
    [-1.4,0,1.4].forEach(o=>box(cx+o,.55,z,.18,1.2,d*.72,'#141a22'));
    if(Math.abs(z+5.5)<1.2)return;
    [-1,1].forEach(s=>{
      box(cx,1.38,z+s*(d/2+.24),5.4,.07,.07,'#9eb0c0');
      glow(cx,1.34,z+s*(d/2+.16),4.8,.035,.04,s<0?'#39e7ff':'#ff2bd6');
    });
  }
  function road(x,z,w,d){
    const across=w>=d;
    box(x,across?1.05:1.04,z,w,.055,d,'#10141b');
    if(across)box(x,1.078,z,w*.96,.018,Math.min(.22,d*.28),'#1a202a');
    else box(x,1.078,z,Math.min(.22,w*.28),.018,d*.96,'#1a202a');
    const min=across?x-w/2:z-d/2, max=across?x+w/2:z+d/2, gaps=[];
    for(const [cx,cz,cw,cd] of ROADS){
      if(cx===x&&cz===z&&cw===w&&cd===d)continue;
      if((cw>=cd)===across)continue;
      if(across){if(Math.abs(z-cz)<=cd/2+.25&&Math.abs(cx-x)<=w/2)gaps.push([cx-cw/2-.5,cx+cw/2+.5]);}
      else if(Math.abs(x-cx)<=cw/2+.25&&Math.abs(cz-z)<=d/2)gaps.push([cz-cd/2-.5,cz+cd/2+.5]);
    }
    gaps.sort((a,b)=>a[0]-b[0]);
    const spans=[]; let cursor=min;
    for(const [a,b] of gaps){
      const s=Math.max(min,a), e=Math.min(max,b);
      if(e<=cursor)continue;
      if(s-cursor>.4)spans.push([cursor,s]);
      cursor=Math.max(cursor,e);
    }
    if(max-cursor>.4)spans.push([cursor,max]);
    spans.forEach(([a,b])=>{
      const len=b-a, c=(a+b)/2;
      [-1,1].forEach(sign=>{
        const neon=sign<0?'#39e7ff':'#ff2bd6';
        if(across){
          const ez=z+sign*(d/2+.2);
          box(c,1.09,ez,len,.06,.32,'#242b36');
          box(c,1.1,z+sign*(d/2+.02),len,.08,.07,'#0b0e14');
          glow(c,1.112,z+sign*(d/2-.05),Math.max(.2,len-.08),.02,.045,neon);
          for(let t=a+.55;t<b;t+=1.65)box(t,1.125,ez,.035,.02,.24,'#3a4454');
          for(let t=a+1.1;t<b;t+=2.6)glow(t,1.12,z+sign*(d/2+.02),.08,.025,.08,neon);
        }else{
          const ex=x+sign*(w/2+.2);
          box(ex,1.09,c,.32,.06,len,'#242b36');
          box(x+sign*(w/2+.02),1.1,c,.07,.08,len,'#0b0e14');
          glow(x+sign*(w/2-.05),1.112,c,.045,.02,Math.max(.2,len-.08),neon);
          for(let t=a+.55;t<b;t+=1.65)box(ex,1.125,t,.24,.02,.035,'#3a4454');
          for(let t=a+1.1;t<b;t+=2.6)glow(x+sign*(w/2+.02),1.12,t,.08,.025,.08,neon);
        }
      });
      if(across){
        for(let t=a+.85;t<b-.35;t+=1.45){glow(t,1.108,z-.11,.48,.02,.05,'#7af6ff');glow(t,1.108,z+.11,.48,.02,.05,'#ff4f8b');}
        for(let t=a+2.2;t<b-1;t+=4.8){box(t,1.11,z-.18,.22,.018,.06,'#f4fbff');box(t+.16,1.11,z,.18,.018,.06,'#f4fbff');box(t,1.11,z+.18,.22,.018,.06,'#f4fbff');}
        if(len>6)glow(c,1.13,z,.04,.03,d*.62,'#ff2bd6');
      }else{
        for(let t=a+.85;t<b-.35;t+=1.45){glow(x-.11,1.108,t,.05,.02,.48,'#7af6ff');glow(x+.11,1.108,t,.05,.02,.48,'#ff4f8b');}
        for(let t=a+2.2;t<b-1;t+=4.8){box(x-.18,1.11,t,.06,.018,.22,'#f4fbff');box(x,1.11,t+.16,.06,.018,.18,'#f4fbff');box(x+.18,1.11,t,.06,.018,.22,'#f4fbff');}
        if(len>6)glow(x,1.13,c,w*.62,.03,.04,'#ff2bd6');
      }
    });
    if(across)bridge(x,z,w,d);
  }
  function junction(x,z){
    for(let i=-2;i<=2;i++){
      glow(x+i*.28,1.122,z,.07,.02,1.28,i%2?'#39e7ff':'#d7fbff');
      glow(x,1.124,z+i*.28,1.28,.02,.07,i%2?'#ff2bd6':'#ffd0ea');
    }
    [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx,sz])=>{
      box(x+sx*.95,1.4,z+sz*.95,.1,.62,.1,'#10141c');
      glow(x+sx*.95,1.76,z+sz*.95,.16,.16,.16,sx===sz?'#39e7ff':'#ff2bd6');
    });
  }
  ROADS.forEach(r=>road(...r));
  ROADS.filter(([, ,w,d])=>w>=d).forEach(([hx,hz,hw])=>{
    ROADS.filter(([, ,w,d])=>d>w).forEach(([vx,vz,,vd])=>{
      if(Math.abs(vx-hx)<hw/2-.3&&Math.abs(hz-vz)<vd/2-.3)junction(vx,hz);
    });
  });
  function lamp(x,z,light=false,color='#39e7ff'){
    box(x,2.2,z,.09,2.3,.09,'#12171e');box(x,3.38,z,.72,.08,.16,'#0e1319');
    glow(x,3.22,z,.55,.07,.1,color);shine(x,3.2,z,2.4,light,{color});
  }
  const hitsRoad=(x,z,hw,hd)=>ROADS.some(([cx,cz,w,d])=>Math.abs(x-cx)<w/2+hw+.55&&Math.abs(z-cz)<d/2+hd+.55);
  const STYLES=[
    {wall:'#6e5344',trim:'#3a2a22',win:'#ffd7a1',accent:'#ff8a3d',roof:'#2a2420'},
    {wall:'#1b2838',trim:'#0d1520',win:'#8ee7ff',accent:'#39e7ff',roof:'#101820'},
    {wall:'#4a5362',trim:'#232a33',win:'#e7f2ff',accent:'#f2c14e',roof:'#1a1f27'},
    {wall:'#322844',trim:'#1a1424',win:'#f0c6ff',accent:'#ff4f8b',roof:'#140e1c'},
  ];
  const onLand=cityLand;
  function parapet(x,y,z,w,d,color){
    box(x,y,z+d/2,w,.32,.12,color);box(x,y,z-d/2,w,.32,.12,color);
    box(x+w/2,y,z,.12,.32,d,color);box(x-w/2,y,z,.12,.32,d,color);
  }
  function mass(x,y0,z,w,d,count,p,door,level0=1){
    const fh=.7,h=count*fh,hw=w/2,hd=d/2;
    box(x,y0+h/2,z,w,h,d,p.wall);
    box(x,y0+.7,z,w+.06,1.4,d+.06,'#3a414c');
    [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx,sz])=>{
      box(x+sx*(hw-.07),y0+h/2,z+sz*(hd-.07),.18,h,.18,p.trim);
      glow(x+sx*(hw-.02),y0+h/2,z+sz*(hd-.02),.06,h*.86,.06,p.accent);
    });
    const cols=Math.max(2,Math.round(w/.58)), sides=Math.max(2,Math.round(d/.72));
    for(let f=0;f<count;f++){
      const y=y0+f*fh+fh*.48;
      curFloor=floors.length;
      floors.push({id:floors.length,x,y,z,w,h:fh*.9,d,level:level0+f,accent:p.accent,buildingId:site?site.id:null,side:site?site.side:'right',role:site?site.role:'city',gate:0});
      box(x,y+fh*.42,z,w+.1,.1,d+.1,p.trim);
      const doorFloor=f===0&&door;
      for(let c=0;c<cols;c++){
        const ox=-hw+(w/(cols+1))*(c+1);
        if(doorFloor&&Math.abs(ox)<.45)continue;
        const lit=(f+c)%4===0?p.accent:p.win;
        [-1,1].forEach(face=>{
          box(x+ox,y,z+face*(hd+.02),.34,.46,.05,p.trim);
          glow(x+ox,y,z+face*(hd+.055),.2,.3,.04,lit,seeded(ox*11+y*5+face*3+x)>.93);
        });
      }
      for(let c=0;c<sides;c++){
        const oz=-hd+(d/(sides+1))*(c+1);
        [-1,1].forEach(face=>glow(x+face*(hw+.045),y,z+oz,.045,.3,.22,p.win,seeded(oz*9+y*4+face+z)>.96));
      }
      if(p.wall==='#6e5344'&&f%2===1){
        box(x,y-.18,z+hd+.28,w*.7,.08,.36,'#5d6b5a');
        box(x,y+.04,z+hd+.44,w*.7,.22,.07,'#3c4a40');
        box(x-w*.28,y-.05,z+hd+.28,.08,.28,.08,'#6a7278');
      }
    }
    curFloor=null;
    if(door){
      glow(x,y0+.55,z+hd+.06,.62,.95,.06,'#d7fff4');
      box(x,y0+1.15,z+hd+.36,1.25,.12,.62,p.trim);
      box(x,y0+.55,z+hd+.08,.08,.95,.06,p.trim);box(x,y0+1.02,z+hd+.08,.7,.08,.06,p.trim);
      [-.42,.42].forEach(a=>box(x+a,y0+.1,z+hd+.55,.38,.1,.42,'#b7c0c8'));
    }
    return y0+h;
  }
  function crown(x,top,z,w,d,p,style){
    parapet(x,top+.22,z,w+.05,d+.05,p.trim);
    box(x,top+.08,z,w*.72,.08,d*.72,'#232a33');
    if(style===1){
      box(x,top+.16,z,w*.5,.05,d*.5,'#1c242e');
      glow(x,top+.2,z,.1,.04,.42,'#f2c14e');glow(x,top+.2,z,.38,.04,.1,'#f2c14e');
    }else if(style===0){
      box(x-w*.2,top+.42,z,.16,.7,.16,p.trim);box(x-w*.2,top+.86,z,.58,.42,.58,'#7f96a0');box(x-w*.2,top+1.1,z,.66,.08,.66,'#4d5c64');
      box(x+w*.22,top+.36,z-d*.1,.55,.48,.55,'#3e4854');glow(x+w*.22,top+.48,z-d*.1+.28,.16,.12,.04,'#7dffb3');
    }else if(style===3){
      box(x,top+.55,z,w*.42,.7,d*.42,p.trim);box(x,top+1.05,z,w*.26,.4,d*.26,p.wall);
      glow(x,top+.7,z+d*.22,.9,.22,.05,p.accent);
    }else{
      box(x,top+.45,z,.16,1.5,.16,'#d7e0ea');box(x+.28,top+.3,z,.08,.7,.08,'#9aa6b4');
      glow(x,top+1.25,z,.24,.24,.24,p.accent);glow(x+.28,top+.7,z,.12,.12,.12,'#ff4f6a');
    }
  }
  function building(x,z,count,style=0,role){
    const side=x<riverX(z)?'left':'right';
    if(side==='left'&&!role){
      const kind=leftKind++;
      count=6+(kind%8)*3;
      style=kind%4;
    }
    role=role||(side==='left'?'hostile':'city');
    count=Math.max(6,count|0);
    const p=STYLES[style%4], base=1.08;
    const w=style%4===1?2.2:2.7, d=style%4===1?1.95:2.35;
    site={id:buildings.length,x,z,w,d,side,role,floors:count,lights:[],gate:0};
    box(x,base+.06,z,w+.55,.18,d+.55,'#2c333c');
    let roof=base+.16+count*.7;
    if(style%4===2){
      const parts=[[Math.max(4,count-6),w,d],[Math.max(3,count-9),w*.72,d*.72],[Math.max(2,Math.floor(count*.35)),w*.48,d*.48]];
      let y=base+.16, level=1;
      parts.forEach(([n,ww,dd],i)=>{if(n>0){y=mass(x,y,z,ww,dd,n,p,i===0,level);level+=n;}});
      crown(x,y,z,w*.48,d*.48,p,2);
      roof=y;
    }else{
      const top=mass(x,base+.16,z,w,d,count,p,true);
      crown(x,top,z,w,d,p,style%4);
      roof=top;
      if(style%4!==1){
        const by=base+1.6+count*.22;
        box(x,by,z+d/2+.2,1.35,.72,.1,'#101418');
        glow(x,by,z+d/2+.26,1.15,.52,.04,p.accent,seeded(x*3+z)>.72);
      }
    }
    site.roof=roof;
    buildings.push(site);
    site=null;
  }
  function place(x,z,floors,style,role){
    const hw=1.55,hd=1.35;
    const candidates=[[x,z]];
    for(let r=1.8;r<=6;r+=1.8)for(let a=0;a<8;a++)candidates.push([x+Math.cos(a*.8)*r,z+Math.sin(a*.8)*r]);
    const fits=([nx,nz])=>[[nx-hw,nz-hd],[nx+hw,nz-hd],[nx-hw,nz+hd],[nx+hw,nz+hd]].every(([sx,sz])=>onLand(sx,sz));
    const bank=role?(x<riverX(z)?'left':'right'):null;
    for(const spot of candidates){
      const [nx,nz]=spot;
      if(bank&&(nx<riverX(nz)?'left':'right')!==bank)continue;
      if(!fits(spot)||hitsRoad(nx,nz,hw,hd))continue;
      if(Math.abs(nx-PLAZA[0])<5.6&&Math.abs(nz-PLAZA[1])<5)continue;
      if(Math.abs(nx-2.2)<3.6&&Math.abs(nz-2.4)<2.8)continue;
      if(nx>6&&nx<16&&nz>7)continue;
      building(nx,nz,floors,style,role);return [nx,nz];
    }
    return null;
  }
  function stall(x,z,neon='#39e7ff'){
    box(x,1.5,z,2.4,.9,1.05,'#1a212b');box(x,2.02,z,2.6,.1,1.25,'#121820');
    [-1.1,1.1].forEach(a=>box(x+a,2.15,z-.4,.1,2.2,.1,'#0e141b'));
    for(let i=0;i<7;i++){const c=i%2?neon:'#101820';box(x-1.05+i*.35,3.15,z,.34,.1,1.5,c);}
    glow(x,2.35,z+.55,2.1,.12,.04,neon);
  }
  function dock(x,z,w,d){
    for(let a=-d/2;a<=d/2;a+=.28)box(x,.84,z+a,w,.15,.25,Math.round(a*10)%3?'#3a4452':'#4a5564');
    [-1,1].forEach(side=>{for(let a=-d/2;a<=d/2;a+=1.6){box(x+side*(w/2-.08),.43,z+a,.16,1.55,.16,'#1c242e');glow(x+side*(w/2-.08),1.22,z+a,.12,.08,.12,'#7dffb3');}});
  }
  dock(-6.5,-5.5,5.6,1.7);dock(-5.15,-1.6,3.9,1.55);dock(8.8,13.5,1.6,7.3);dock(11.2,16.6,6.3,1.45);dock(12.6,13.8,1.3,5.1);
  for(let i=0;i<8;i++){box(-9.1+i*.75,1.5,-6.25,.08,.9,.08,'#9aa6b4');box(-9.1+i*.75,1.5,-4.73,.08,.9,.08,'#9aa6b4');}
  box(-6.5,1.95,-6.25,5.6,.08,.08,'#c5ced8');box(-6.5,1.55,-6.25,5.6,.08,.08,'#c5ced8');
  box(-6.5,1.95,-4.73,5.6,.08,.08,'#c5ced8');box(-6.5,1.55,-4.73,5.6,.08,.08,'#c5ced8');
  const homes=[[-.4,-9.5,12,0],[3.8,-10.7,10,2],[10.9,-10.1,14,1],[13.1,-2.1,9,3],[9.4,-1.7,8,0],[3.2,8.6,11,2],[12.5,7.9,13,1],[-12.4,-8.7,10,3],[-12.4,2.5,8,0]];
  const reserved=[];
  homes.forEach(([x,z,floors,style])=>{const at=place(x,z,floors,style);if(at)reserved.push(at);});
  [['base',15,-1,20,1],['bank',10,4,11,2],['cyber',4,8,14,3]].forEach(([role,x,z,floors,style])=>{const at=place(x,z,floors,style,role);if(at)reserved.push(at);});
  stall(-1.6,2.5,'#39e7ff');stall(4.5,2.5,'#ff4f8b');
  [[.5,-5.1],[5.9,5.7],[8.25,-5.4],[8.35,10.7],[-11,-5.4],[14.2,4.9],[-3,-.3]].forEach(([x,z],i)=>lamp(x,z,true,i%2?'#ff2bd6':'#39e7ff'));
  const landmark=place(-14.7,8.2,18,2);if(landmark)reserved.push(landmark);
  [[-26,-6,14,3],[-31,2,11,1],[-22,-24,12,0],[24,-8,16,2],[31,2,13,1],[34,-14,12,3],[20,-32,15,1],[-34,-30,10,0]].forEach(([x,z,floors,style])=>{const at=place(x,z,floors,style);if(at){reserved.push(at);lamp(at[0]+2.6,at[1]+2.4);}});
  function plaza(x,z){
    const w=7,d=5;
    box(x,1.24,z,w+.3,.44,d+.3,'#1a212c');box(x,1.5,z,w,.1,d,'#2c3544');
    for(let a=-w/2+.5;a<w/2;a+=1)for(let b=-d/2+.5;b<d/2;b+=1)box(x+a,1.565,z+b,.92,.03,.92,seeded(a*31+b*7)>.5?'#3a4658':'#323c4e');
    for(let i=0;i<3;i++){const top=1.46-i*.14;box(x,(1.02+top)/2,z+d/2+.3+i*.6,3.4,top-1.02,.6,i%2?'#2a3342':'#222a36');}
    const pz=z+d/2-.7;
    [-1.95,1.95].forEach(a=>{box(x+a,2.95,pz,.16,2.8,.16,'#9aa6b4');});
    box(x,4.32,pz,4.2,.16,.16,'#9aa6b4');glow(x,4.32,pz+ .12,3.4,.55,.04,'#39e7ff');
    [-1,1].forEach(a=>{const tx=x+a*(w/2-.45),tz=z-d/2+.5;box(tx,2.1,tz,.16,2,.16,'#121820');glow(tx,3.15,tz,.28,.28,.28,'#ff4f8b');shine(tx,3.15,tz,2,true,{ground:1.5,color:'#ff4f8b'});});
  }
  plaza(...PLAZA);
  const clearOf=(x,z)=>!reserved.some(([cx,cz])=>Math.abs(x-cx)<4.6&&Math.abs(z-cz)<4.6);
  for(let gx=-30;gx<=30;gx+=7.6)for(let gz=-30;gz<=5;gz+=7.6){
    if(!clearOf(gx,gz)||!onLand(gx,gz))continue;
    const floors=7+Math.floor(seeded(gx*9+gz)*7);
    const at=place(gx,gz,floors,Math.floor(seeded(gx+gz*3)*4));
    if(at)reserved.push(at);
  }
  [[-36,-24,11,1],[-36,-8,10,3],[-36,3,9,0],[34,-6,12,2],[34,3,10,1],[-16,-34,11,0],[6,-34,12,2],[22,-32,10,3],[30,-30,9,1],[-28,6,11,2],[18,7,9,0],[-8,-22,10,1],[16,-16,9,3]].forEach(([x,z,floors,style])=>{
    if(!onLand(x,z))return;
    const at=place(x,z,floors,style);
    if(at)reserved.push(at);
  });
  [[-18,5.7],[-18,-5.4],[2,-18],[12,-26],[30,-5.4],[34,5.7],[-22,-20]].forEach(([x,z],i)=>lamp(x+1.3,z+1.15,i%2===0,i%2?'#ff2bd6':'#39e7ff'));
  for(let i=0;i<28;i++){const z=-14+seeded(i*19)*26,x=riverX(z)+(i%2?2.15:-2.15);box(x,1.35,z,.16,.7,.16,'#121820');glow(x,1.74,z,.14,.1,.14,i%2?'#39e7ff':'#ffd15c');}
  const hostile=buildings.filter(b=>b.role==='hostile').sort((a,b)=>a.floors-b.floors||a.x-b.x||a.z-b.z);
  hostile.forEach((b,i)=>{b.gate=i+1;b.lights.forEach(l=>{l.gate=b.gate;});});
  const antennas=[];
  hostile.forEach(b=>{
    const y=(b.roof||2)+1.15;
    box(b.x,y,b.z,.08,1.7,.08,'#d5dee8');
    box(b.x,y+.95,b.z,.62,.06,.06,'#d5dee8');
    box(b.x,y+.95,b.z,.06,.06,.62,'#d5dee8');
    antennas.push({x:b.x,y:y+1.35,z:b.z,w:.16,h:.85,d:.16,color:'#39e7ff',gate:b.gate});
    antennas.push({x:b.x,y:y+1.85,z:b.z,w:.48,h:.48,d:.48,color:'#7af6ff',gate:b.gate});
  });
  const home=buildings.find(b=>b.role==='base');
  if(home){
    const y=(home.roof||2)+1.15;
    box(home.x,y,home.z,.08,1.7,.08,'#d5dee8');
    glow(home.x,y+1.22,home.z,.24,.24,.24,'#39e7ff');
  }
  buildings.filter(b=>b.side==='right'&&(b.role==='bank'||b.role==='cyber')).forEach(b=>lights.push(...b.lights));
  const anchor=buildings.find(b=>b.role==='bank')||{x:10,z:4};
  const dark=buildings.filter(b=>b.side==='right'&&b.role!=='bank'&&b.role!=='cyber').sort((a,b)=>Math.hypot(a.x-anchor.x,a.z-anchor.z)-Math.hypot(b.x-anchor.x,b.z-anchor.z));
  const hidden=b=>dark.some(o=>o!==b&&Math.hypot(o.x-b.x,o.z-b.z)<2.2&&o.x+o.z>b.x+b.z);
  dark.sort((a,b)=>hidden(a)-hidden(b));
  dark.forEach(b=>{
    const dx=b.x+.55,dz=b.z-.35,y=b.roof||2;
    box(dx,y+.55,dz,.08,.9,.08,'#d5dee8');box(dx,y+1.02,dz,.56,.07,.56,'#9aa6b4');box(dx,y+1.1,dz,.06,.2,.06,'#d5dee8');
    b.dish={x:dx,y:y+1.3,z:dz};
    b.floorIds=floors.filter(f=>f.buildingId===b.id).sort((a,c)=>a.y-c.y).map(f=>f.id);
  });
  hostile.forEach(b=>{b.antenna={x:b.x,y:(b.roof||2)+3,z:b.z};});
  const byId=new Map(buildings.map(b=>[b.id,b]));
  floors.forEach(f=>{const b=byId.get(f.buildingId);if(!b)return;f.role=b.role;f.side=b.side;f.gate=b.gate||0;});
  cityCache={blocks,lights,lamps,plaza:PLAZA,buildings,roads:ROADS,floors,gated:hostile.flatMap(b=>b.lights),antennas,dark,hostile,hackFloors:dark.flatMap(b=>b.floorIds)};
  return cityCache;
}
