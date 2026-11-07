import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { buildVillage } from './villageBuilder';
import { createTraffic, stepTraffic } from './traffic';

const put = (mesh, index, lx, ly, lz, sx, sy, sz, x, z, yaw, dummy, visible) => {
  const c = Math.cos(yaw), s = Math.sin(yaw);
  dummy.position.set(x + (lx * c + lz * s), ly, z + (-lx * s + lz * c));
  dummy.rotation.set(0, yaw, 0);
  dummy.scale.set(visible ? sx : 0, visible ? sy : 0, visible ? sz : 0);
  dummy.updateMatrix();
  mesh.setMatrixAt(index, dummy.matrix);
};

export function Traffic({ lite = false }) {
  const count = lite ? 7 : 14;
  const sim = useMemo(() => createTraffic(buildVillage(), count), [count]);
  const body = useRef(), glass = useRef(), wheel = useRef(), head = useRef(), tail = useRef();
  const torso = useRef(), skull = useRef(), leg = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const paint = useMemo(() => new THREE.Color(), []);

  useLayoutEffect(() => {
    sim.cars.forEach((car, i) => {
      body.current.setColorAt(i, paint.set(car.color));
      glass.current.setColorAt(i, paint.set('#9fd8ff'));
      head.current.setColorAt(i, paint.set('#ffd36a'));
      tail.current.setColorAt(i, paint.set('#ff5a6a'));
      torso.current.setColorAt(i, paint.set(car.outfit));
      skull.current.setColorAt(i, paint.set('#f3d2b5'));
      wheel.current.setColorAt(i * 2, paint.set('#141414'));
      wheel.current.setColorAt(i * 2 + 1, paint.set('#141414'));
      leg.current.setColorAt(i * 2, paint.set('#171b22'));
      leg.current.setColorAt(i * 2 + 1, paint.set('#171b22'));
    });
    [body, glass, wheel, head, tail, torso, skull, leg].forEach(ref => {
      ref.current.instanceColor.needsUpdate = true;
    });
  }, [sim, paint]);

  useFrame((_, dt) => {
    if (!body.current) return;
    stepTraffic(sim, dt);
    sim.cars.forEach((car, i) => {
      const bob = car.person ? Math.abs(Math.sin(car.stride)) * 0.05 : 0;
      const swing = car.person ? Math.sin(car.stride) * 0.09 : 0;
      put(body.current, i, 0, 1.22, 0, 1.55, 0.28, 0.7, car.x, car.z, car.yaw, dummy, true);
      put(glass.current, i, -0.05, 1.44, 0, 0.78, 0.2, 0.58, car.x, car.z, car.yaw, dummy, true);
      put(wheel.current, i * 2, -0.62, 1.14, 0, 0.16, 0.16, 0.72, car.x, car.z, car.yaw, dummy, true);
      put(wheel.current, i * 2 + 1, 0.62, 1.14, 0, 0.16, 0.16, 0.72, car.x, car.z, car.yaw, dummy, true);
      put(head.current, i, 0.72, 1.24, 0, 0.06, 0.08, 0.5, car.x, car.z, car.yaw, dummy, true);
      put(tail.current, i, -0.72, 1.24, 0, 0.06, 0.08, 0.5, car.x, car.z, car.yaw, dummy, true);
      put(torso.current, i, 0, 1.72 + bob, 0, 0.38, 0.56, 0.28, car.px, car.pz, car.pyaw, dummy, car.person);
      put(skull.current, i, 0, 2.14 + bob, 0, 0.28, 0.28, 0.28, car.px, car.pz, car.pyaw, dummy, car.person);
      put(leg.current, i * 2, swing, 1.34 + bob, 0.09, 0.14, 0.38, 0.14, car.px, car.pz, car.pyaw, dummy, car.person);
      put(leg.current, i * 2 + 1, -swing, 1.34 + bob, -0.09, 0.14, 0.38, 0.14, car.px, car.pz, car.pyaw, dummy, car.person);
    });
    body.current.instanceMatrix.needsUpdate = true;
    glass.current.instanceMatrix.needsUpdate = true;
    wheel.current.instanceMatrix.needsUpdate = true;
    head.current.instanceMatrix.needsUpdate = true;
    tail.current.instanceMatrix.needsUpdate = true;
    torso.current.instanceMatrix.needsUpdate = true;
    skull.current.instanceMatrix.needsUpdate = true;
    leg.current.instanceMatrix.needsUpdate = true;
  });

  if (!count) return null;
  return <group>
    <instancedMesh ref={body} args={[null, null, count]} frustumCulled={false}><boxGeometry /><meshLambertMaterial color="white" /></instancedMesh>
    <instancedMesh ref={glass} args={[null, null, count]} frustumCulled={false}><boxGeometry /><meshBasicMaterial color="white" toneMapped={false} /></instancedMesh>
    <instancedMesh ref={wheel} args={[null, null, count * 2]} frustumCulled={false}><boxGeometry /><meshLambertMaterial color="white" /></instancedMesh>
    <instancedMesh ref={head} args={[null, null, count]} frustumCulled={false}><boxGeometry /><meshBasicMaterial color="white" toneMapped={false} /></instancedMesh>
    <instancedMesh ref={tail} args={[null, null, count]} frustumCulled={false}><boxGeometry /><meshBasicMaterial color="white" toneMapped={false} /></instancedMesh>
    <instancedMesh ref={torso} args={[null, null, count]} frustumCulled={false}><boxGeometry /><meshBasicMaterial color="white" toneMapped={false} /></instancedMesh>
    <instancedMesh ref={skull} args={[null, null, count]} frustumCulled={false}><boxGeometry /><meshLambertMaterial color="white" /></instancedMesh>
    <instancedMesh ref={leg} args={[null, null, count * 2]} frustumCulled={false}><boxGeometry /><meshLambertMaterial color="white" /></instancedMesh>
  </group>;
}
