import { useMemo } from 'react';
import '@react-three/fiber';
import { FlickerBatch, VoxelBatch } from './VoxelBatch';
import { buildVillage } from './villageBuilder';
import { Boat, Sign, Banner } from './Models';
import { Glows } from './Glows';

const EMPTY=new Set();
export const Island = ({lite=false, linkGate=0, litFloors=EMPTY, litGates=EMPTY}) => {
  const village=useMemo(buildVillage,[]);
  const steady=useMemo(()=>village.lights.filter(l=>!l.flicker),[village]);
  const blink=useMemo(()=>village.lights.filter(l=>l.flicker),[village]);
  const groups=useMemo(()=>{const m=new Map();village.dark.forEach(b=>b.lights.forEach(l=>{const k=l.fl??`b${b.id}`;if(!m.has(k))m.set(k,[]);m.get(k).push(l);}));return m;},[village]);
  const open=useMemo(()=>{
    const out=[],count=new Map();
    litFloors.forEach(id=>{const b=village.floors[id].buildingId;count.set(b,(count.get(b)||0)+1);});
    village.dark.forEach(b=>{if(count.get(b.id))out.push(...b.lights);});
    (village.gated||[]).forEach(l=>{if(litGates.has(l.gate))out.push(l);});
    return out;
  },[village,groups,litFloors,litGates]);
  const link=useMemo(()=>(village.antennas||[]).filter(a=>a.gate===linkGate),[village,linkGate]);
  const [px,pz]=village.plaza;
  return <group>
    <VoxelBatch blocks={village.blocks} lite={lite}/><VoxelBatch blocks={steady} emissive/><FlickerBatch blocks={blink}/>
    {open.length>0&&<VoxelBatch blocks={open} emissive/>}
    {link.length>0&&<VoxelBatch blocks={link} emissive/>}
    <Glows lamps={village.lamps} lights={!lite}/>
    <Sign position={[1.7,2.4,-.4]} text="ROBIN TOWER"/>
    <Sign position={[-2.5,1.02,-6.9]} text="ROBINHACKERS"/>
    <Banner position={[px,3.6,pz+1.8]} text="ROBINHACKERS"/>
    <Boat position={[11.1,.18,14.2]} rotation={[0,Math.PI/2,0]} scale={1.05}/>
    <Boat position={[14.3,.17,15.3]} rotation={[0,-.12,0]} scale={.8}/>
  </group>;
};
