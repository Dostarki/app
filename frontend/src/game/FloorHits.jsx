import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { buildVillage } from './villageBuilder';

export function FloorHits({ onPick, enabled = true }) {
  const mesh = useRef();
  const floors = useMemo(() => buildVillage().floors, []);
  const pick = useRef(onPick);
  const armed = useRef(enabled);
  pick.current = onPick;
  armed.current = enabled;
  const { camera, gl } = useThree();

  const placeFloors = () => {
    if (!mesh.current || !floors.length) return;
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    floors.forEach((floor, index) => {
      position.set(floor.x, floor.y, floor.z);
      scale.set(floor.w, floor.h, floor.d);
      matrix.compose(position, quaternion, scale);
      mesh.current.setMatrixAt(index, matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
    mesh.current.computeBoundingSphere();
  };
  useLayoutEffect(placeFloors, [floors]);

  useEffect(() => {
    const canvas = gl.domElement;
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let down = null;
    placeFloors();
    const hitFloor = event => {
      if (!mesh.current) return null;
      placeFloors();
      const rect = canvas.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      camera.updateMatrixWorld();
      mesh.current.updateMatrixWorld(true);
      raycaster.setFromCamera(mouse, camera);
      const hit = raycaster.intersectObject(mesh.current)[0];
      return hit ? floors[hit.instanceId] : null;
    };
    const onDown = event => { down = [event.clientX, event.clientY]; };
    const onMove = event => {
      if (!armed.current) { canvas.style.cursor = ''; return; }
      canvas.style.cursor = hitFloor(event) ? 'pointer' : '';
    };
    const onUp = event => {
      if (!armed.current) { down = null; return; }
      if (!down) return;
      const dragged = Math.hypot(event.clientX - down[0], event.clientY - down[1]) > 7;
      down = null;
      if (dragged) return;
      pick.current(hitFloor(event));
    };
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    return () => {
      canvas.style.cursor = '';
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
    };
  }, [camera, floors, gl]);

  if (!floors.length) return null;
  return <instancedMesh ref={mesh} args={[null, null, floors.length]} frustumCulled={false}>
    <boxGeometry />
    <meshBasicMaterial transparent opacity={0} depthWrite={false} />
  </instancedMesh>;
}

export function FloorAnchor({ floor, elRef }) {
  const current = useRef(floor);
  current.current = floor;
  const point = useRef(new THREE.Vector3());
  useFrame(({ camera, size }) => {
    const el = elRef.current;
    const target = current.current;
    if (!el || !target) return;
    point.current.set(target.x, target.y, target.z).project(camera);
    const x = (point.current.x * 0.5 + 0.5) * size.width;
    const y = (-point.current.y * 0.5 + 0.5) * size.height;
    const width = 248;
    let left = x + 18;
    let flip = false;
    if (left + width > size.width - 10) { left = x - width - 18; flip = true; }
    left = Math.max(8, Math.min(size.width - width - 8, left));
    const top = Math.max(150, Math.min(size.height - 150, y));
    el.style.left = `${left}px`;
    el.style.top = `${top}px`;
    el.dataset.flip = flip ? '1' : '0';
    el.style.visibility = point.current.z > 1 ? 'hidden' : 'visible';
  });
  return null;
}

export function FloorGlow({ floor }) {
  if (!floor) return null;
  return <mesh position={[floor.x, floor.y, floor.z]}>
    <boxGeometry args={[floor.w + 0.08, floor.h, floor.d + 0.08]} />
    <meshBasicMaterial color={floor.accent || '#39e7ff'} transparent opacity={0.34} depthWrite={false} toneMapped={false} />
  </mesh>;
}
