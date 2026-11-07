import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TRAVEL_MS } from './hackNetwork';

const arc = (from, to) => {
  const a = new THREE.Vector3(from.x, from.y, from.z), b = new THREE.Vector3(to.x, to.y, to.z);
  const mid = a.clone().lerp(b, .5); mid.y = Math.max(a.y, b.y) + 1.5 + a.distanceTo(b) * .06;
  return new THREE.QuadraticBezierCurve3(a, mid, b);
};

const Beam = ({ link, index }) => {
  const curve = useMemo(() => arc(link.from, link.to), [link.from, link.to]);
  const line = useMemo(() => new THREE.Mesh(new THREE.TubeGeometry(curve, 48, .06, 5, false), new THREE.MeshBasicMaterial({ color: link.color, transparent: true, opacity: .55, toneMapped: false, depthWrite: false, blending: THREE.AdditiveBlending })), [curve, link.color]);
  useEffect(() => () => { line.geometry.dispose(); line.material.dispose(); }, [line]);
  const packets = useRef([]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    line.material.opacity = .45 + Math.sin(t * 3 + index) * .2;
    packets.current.forEach((m, i) => { if (m) m.position.copy(curve.getPoint((t * .35 + i / 3 + index * .13) % 1)); });
  });
  return <group>
    <primitive object={line} />
    {[0, 1, 2].map(i => <mesh key={i} ref={el => packets.current[i] = el}><boxGeometry args={[.3, .3, .3]} /><meshBasicMaterial color={i ? link.color : '#ffffff'} toneMapped={false} /></mesh>)}
    <mesh position={[link.from.x, link.from.y, link.from.z]}><boxGeometry args={[.26, .26, .26]} /><meshBasicMaterial color={link.color} toneMapped={false} /></mesh>
  </group>;
};

const Burst = ({ link }) => {
  const curve = useMemo(() => arc(link.from, link.to), [link.from, link.to]);
  const head = useRef(), trail = useRef();
  useFrame(() => {
    const k = Math.min(1, (performance.now() - link.born) / TRAVEL_MS);
    if (head.current) { head.current.position.copy(curve.getPoint(k)); head.current.scale.setScalar(1 + Math.sin(k * Math.PI) * .8); }
    if (trail.current) trail.current.position.copy(curve.getPoint(Math.max(0, k - .06)));
  });
  return <group>
    <mesh ref={head}><boxGeometry args={[.45, .45, .45]} /><meshBasicMaterial color="#ffffff" toneMapped={false} /></mesh>
    <mesh ref={trail}><boxGeometry args={[.32, .32, .32]} /><meshBasicMaterial color={link.color} transparent opacity={.8} toneMapped={false} /></mesh>
  </group>;
};

export const HackLinks = ({ beams, pending }) => <group>
  {beams.map((l, i) => <Beam key={`${l.srcId}:${l.gate}`} link={l} index={i} />)}
  {pending.map(l => <Burst key={l.uid} link={l} />)}
</group>;
