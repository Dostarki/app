import { Component, memo, Suspense, useEffect, useRef, useState } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import * as THREE from 'three';
import { Island } from './Island';
import { MarketStock } from './Actors';
import { DayCycle } from './DayCycle';
import { Ocean, HarborDetails } from './Environment';
import { Clouds } from './Scenery';
import { Blimp } from './Blimp';
import { Traffic } from './CityTraffic';
import { FloorAnchor, FloorGlow, FloorHits } from './FloorHits';
import { HackLinks } from './HackLinks';
import { useHackNetwork } from './hackNetwork';
import { HackerBubble } from '../components/HackerBubble';
import { useOps } from '../hooks/useOps';
import { RenderLoop } from './RenderLoop';
import { buildVillage } from './villageBuilder';

const CameraRig = ({ zoom, reset, labelRefs, active }) => {
  const { camera, gl, size }=useThree();
  const controls=useRef(), mobile=size.width<700;
  useEffect(()=>{
    const c=new OrbitControls(camera,gl.domElement);
    c.enableRotate=false;c.enableZoom=true;c.enablePan=true;c.screenSpacePanning=false;
    c.touches={ONE:THREE.TOUCH.PAN,TWO:THREE.TOUCH.DOLLY_PAN};c.zoomSpeed=.7;
    c.mouseButtons={LEFT:THREE.MOUSE.PAN,MIDDLE:THREE.MOUSE.DOLLY,RIGHT:THREE.MOUSE.PAN};
    c.enableDamping=true;c.dampingFactor=.09;controls.current=c;
    return()=>c.dispose();
  },[camera,gl]);
  useEffect(()=>{
    const target=mobile ? [0,-4,2] : active ? [0,2.5,0] : [-3,2.3,2.5];
    camera.position.set(target[0]+35,target[1]+27,target[2]+43);camera.lookAt(...target);
    if(controls.current)controls.current.target.set(...target);
    camera.zoom=(mobile ? size.width/32 : Math.min(size.width/53,size.height/26))*zoom;
    if(controls.current){const base=mobile?size.width/32:Math.min(size.width/53,size.height/26);controls.current.minZoom=base*.32;controls.current.maxZoom=base*2;}
    camera.updateProjectionMatrix();
  },[camera,size,zoom,reset,mobile,active]);
  useEffect(()=>{
    const handle=event=>{
      if(document.querySelector('[role="dialog"]')||['INPUT','TEXTAREA'].includes(event.target.tagName))return;
      const directions={ArrowLeft:[-1,0,0],a:[-1,0,0],ArrowRight:[1,0,0],d:[1,0,0],ArrowUp:[0,0,-1],w:[0,0,-1],ArrowDown:[0,0,1],s:[0,0,1]};
      const move=directions[event.key];if(!move)return;event.preventDefault();
      const delta=new THREE.Vector3(...move).multiplyScalar(.7);camera.position.add(delta);controls.current?.target.add(delta);
    };window.addEventListener('keydown',handle);return()=>window.removeEventListener('keydown',handle);
  },[camera]);
  const v=useRef(new THREE.Vector3()),before=useRef(new THREE.Vector3()),lastCamera=useRef('');
  const roofPoint=role=>{const b=buildVillage().buildings.find(item=>item.role===role);return b?[b.x,(b.roof||8)+3.2,b.z]:[4,12,8];};
  const mapLabels=useRef([['water',[-6.3,.3,5]],['security',roofPoint('cyber')],['bank',roofPoint('bank')]]);
  useFrame(()=>{
    const c=controls.current;
    if(c){c.update();before.current.copy(c.target);c.target.x=THREE.MathUtils.clamp(c.target.x,-42,42);c.target.z=THREE.MathUtils.clamp(c.target.z,-42,22);camera.position.x+=c.target.x-before.current.x;camera.position.z+=c.target.z-before.current.z;}
    const stamp=`${camera.position.x.toFixed(3)}:${camera.position.z.toFixed(3)}:${camera.zoom.toFixed(3)}:${size.width}:${size.height}`;
    if(stamp===lastCamera.current)return;lastCamera.current=stamp;
    mapLabels.current.forEach(([key,position])=>{
      const label=labelRefs.current[key];if(!label)return;v.current.set(...position).project(camera);
      const x=(v.current.x*.5+.5)*size.width,y=(-v.current.y*.5+.5)*size.height;
      label.style.left=`${THREE.MathUtils.clamp(x,75,size.width-75)}px`;label.style.top=`${y}px`;
      label.style.visibility=x<30||x>size.width-30||y<110||y>size.height-85?'hidden':'visible';
    });
  });return null;
};

class WorldBoundary extends Component {
  state={failed:false};static getDerivedStateFromError(){return{failed:true};}
  render(){return this.state.failed?<div className="world-fallback" data-testid="webgl-error">The city needs WebGL. Please enable hardware acceleration and refresh.</div>:this.props.children;}
}

export const World = memo(({ gameRef, roster, rosterReady, active, zoom, reset, profile, blocked, earlyAccessStage, onMeasure, onReady }) => {
  const labels=useRef({});
  const bubble=useRef(null);
  const ops=useOps();
  const net=useHackNetwork(roster, rosterReady, !active);
  const [floor, setFloor]=useState(null);
  const choose=next=>{if(!active)return;setFloor(cur=>!next||cur?.id===next.id?null:next);};
  const openRole=role=>{if(!active)return;const next=buildVillage().floors.find(item=>item.role===role);if(next)setFloor(next);};
  useEffect(()=>{if(!active)setFloor(null);},[active]);
  return <div className={`world ${active?'world-active':''}`} data-testid="island-world">
    <WorldBoundary><Canvas orthographic frameloop="never" shadows={profile.shadows} dpr={profile.dpr} gl={{antialias:false,alpha:true,powerPreference:'high-performance',preserveDrawingBuffer:false}} camera={{position:[35,27,43],zoom:30,near:.1,far:300}} data-testid="island-canvas">
      <Suspense fallback={null}>
        <DayCycle profile={profile}/>
        <Ocean detail={profile.tier!=='battery'}/><Island lite={profile.tier==='battery'} linkGate={active&&ops.mining?ops.miningGate:0} litFloors={net.litFloors} litGates={net.litGates}/><Traffic lite={profile.tier==='battery'}/><HarborDetails/>
        <HackLinks beams={net.beams} pending={net.pending}/>
        <Clouds count={profile.tier==='battery'?5:10}/>
        <Blimp/>
        <MarketStock gameRef={gameRef} preview={!active} earlyAccessStage={earlyAccessStage}/>
        <FloorHits onPick={choose} enabled={active}/><FloorGlow floor={active?floor:null}/><FloorAnchor floor={active?floor:null} elRef={bubble}/>
        <CameraRig zoom={zoom} reset={reset} labelRefs={labels} active={active}/>
        <RenderLoop profile={profile} blocked={blocked} animateWhileBlocked={!!earlyAccessStage && !active} onMeasure={onMeasure} onReady={onReady} viewKey={`${zoom}:${reset}:${active}`}/>
      </Suspense>
    </Canvas></WorldBoundary>
    <div className="world-labels">
      <div ref={el=>labels.current.water=el} className="water-label" data-testid="river-label">C I T Y &nbsp; C A N A L</div>
      <button ref={el=>labels.current.security=el} type="button" className="map-label market-label poi-sign" data-testid="security-sign" style={{visibility:'hidden'}} onClick={()=>openRole('cyber')}><span className="label-dot"/> SECURITY</button>
      <button ref={el=>labels.current.bank=el} type="button" className="map-label market-label poi-sign bank-sign" data-testid="bank-sign" style={{visibility:'hidden'}} onClick={()=>openRole('bank')}><span className="label-dot"/> BANK</button>
      {active && floor && <HackerBubble floor={floor} onClose={()=>setFloor(null)} elRef={bubble} ops={ops} crew={net.links.filter(l=>l.srcId===floor.buildingId)}/>}
    </div>
  </div>;
});
