import { useMemo } from 'react';
import '@react-three/fiber';
import * as THREE from 'three';
import { actorMaterial, fisherGeometry, bucketGeometry, boatGeometry, rodGeometry, hammockGeometry, vesselGeometry } from './mergedModels';

const cube=new THREE.BoxGeometry(1,1,1),materials=new Map();
function material(color){if(!materials.has(color))materials.set(color,new THREE.MeshLambertMaterial({color}));return materials.get(color);}
export const Block=({at=[0,0,0],size=[1,1,1],color='#fff',rotation,...props})=><mesh position={at} scale={size} rotation={rotation} geometry={cube} material={material(color)} dispose={null} {...props}/>;
export const Fisher=({color='#d8844b',kind='rod',pose='fishing',...props})=><mesh geometry={fisherGeometry(color,kind,pose)} material={actorMaterial} dispose={null} {...props}/>;
export const Rod=({kind='rod',...props})=><mesh geometry={rodGeometry(kind)} material={actorMaterial} dispose={null} {...props}/>;
export const Hammock=props=><mesh geometry={hammockGeometry()} material={actorMaterial} dispose={null} {...props}/>;
export const Bucket=({filled=false,...props})=><mesh geometry={bucketGeometry(filled)} material={actorMaterial} dispose={null} {...props}/>;
export const Boat=props=><mesh geometry={boatGeometry()} material={actorMaterial} dispose={null} {...props}/>;
export const Vessel=({kind='boat',...props})=><mesh geometry={vesselGeometry(kind)} material={actorMaterial} dispose={null} {...props}/>;
export const Banner=({position,text})=>{
  const texture=useMemo(()=>{
    const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;
    const ctx=canvas.getContext('2d');ctx.fillStyle='#101820';ctx.fillRect(0,0,512,128);
    ctx.fillStyle='#182230';for(let i=0;i<512;i+=16)for(let j=0;j<128;j+=16)if((i+j)%32===0)ctx.fillRect(i,j,16,16);
    ctx.strokeStyle='#39e7ff';ctx.lineWidth=10;ctx.strokeRect(10,10,492,108);ctx.strokeStyle='#ff4f8b';ctx.lineWidth=3;ctx.strokeRect(22,22,468,84);
    const size=text.length>10?40:58;
    ctx.fillStyle='#062028';ctx.font=`bold ${size}px "Silkscreen","Press Start 2P",monospace`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,259,70);
    ctx.fillStyle='#d8fbff';ctx.fillText(text,255,66);
    const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;return t;
  },[text]);
  return <group position={position}>
    <mesh castShadow><boxGeometry args={[3.5,.95,.14]}/><meshLambertMaterial map={texture}/></mesh>
    <mesh position={[0,0,-.075]}><boxGeometry args={[3.5,.95,.02]}/><meshLambertMaterial color="#101820"/></mesh>
    {[-1.45,1.45].map(x=><mesh key={x} position={[x,.62,0]}><boxGeometry args={[.08,.3,.08]}/><meshLambertMaterial color="#5a4632"/></mesh>)}
  </group>;
};
export const Sign=({position,text})=>{
  const texture=useMemo(()=>{
    const canvas=document.createElement('canvas');canvas.width=256;canvas.height=64;
    const ctx=canvas.getContext('2d');ctx.fillStyle='#101820';ctx.fillRect(0,0,256,64);ctx.strokeStyle='#39e7ff';ctx.lineWidth=5;ctx.strokeRect(5,5,246,54);
    ctx.fillStyle='#e8fbff';ctx.font=`bold ${text.length>12?16:22}px monospace`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,128,33);
    const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;return t;
  },[text]);
  return <group position={position}><Block at={[0,.55,0]} size={[.1,1.1,.1]} color="#1a212b"/><mesh position={[0,1.1,.04]}><boxGeometry args={[1.3,.35,.1]}/><meshLambertMaterial map={texture}/></mesh></group>;
};
