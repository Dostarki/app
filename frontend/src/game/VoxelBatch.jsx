import { useLayoutEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { voxelLiteMaterial } from './voxelLiteMaterial';

/** Thousands of colored blocks, a single draw call. Shared geometry keeps the village light. */
export const VoxelBatch = ({ blocks, emissive = false, lite=false, opacity=1, ...props }) => {
  const mesh = useRef();
  const { invalidate } = useThree();
  useLayoutEffect(() => {
    const matrix = new THREE.Matrix4(), quaternion = new THREE.Quaternion();
    const p = new THREE.Vector3(), s = new THREE.Vector3(), color = new THREE.Color();
    blocks.forEach((b, i) => {
      p.set(b.x,b.y,b.z); s.set(b.w,b.h,b.d);
      quaternion.setFromEuler(new THREE.Euler(0,b.r || 0,0));
      matrix.compose(p,quaternion,s); mesh.current.setMatrixAt(i,matrix);
      mesh.current.setColorAt(i,color.set(b.color));
    });
    mesh.current.instanceMatrix.needsUpdate=true;
    mesh.current.instanceColor.needsUpdate=true;
    mesh.current.computeBoundingSphere();
    invalidate();
  },[blocks,invalidate]);
  return <instancedMesh ref={mesh} args={[null,null,blocks.length]} castShadow={!emissive&&!lite} receiveShadow={!emissive&&!lite} {...props}>
    <boxGeometry/>
    {emissive ? <meshBasicMaterial toneMapped={false}/> : lite ? <primitive object={voxelLiteMaterial} attach="material" dispose={null}/> : <meshLambertMaterial color="white" transparent={opacity<1} opacity={opacity} depthWrite={opacity>=1}/>}
  </instancedMesh>;
};

/** A small set of window lights that drop out and come back. */
export const FlickerBatch = ({ blocks }) => {
  const mesh = useRef();
  const { invalidate } = useThree();
  const color = useRef(new THREE.Color());
  const off = useRef(new THREE.Color('#07090e'));
  useLayoutEffect(() => {
    if (!blocks.length || !mesh.current) return;
    const matrix = new THREE.Matrix4(), quaternion = new THREE.Quaternion();
    const p = new THREE.Vector3(), s = new THREE.Vector3();
    blocks.forEach((b, i) => {
      p.set(b.x,b.y,b.z); s.set(b.w,b.h,b.d);
      quaternion.setFromEuler(new THREE.Euler(0,b.r || 0,0));
      matrix.compose(p,quaternion,s); mesh.current.setMatrixAt(i,matrix);
      mesh.current.setColorAt(i,color.current.set(b.color));
    });
    mesh.current.instanceMatrix.needsUpdate=true;
    mesh.current.instanceColor.needsUpdate=true;
    mesh.current.computeBoundingSphere();
    invalidate();
  },[blocks,invalidate]);
  useFrame(({ clock }) => {
    if (!mesh.current) return;
    const t = clock.elapsedTime;
    blocks.forEach((b, i) => {
      const cycle = (t * b.speed + b.phase) % 1;
      mesh.current.setColorAt(i, cycle < .22 ? off.current : color.current.set(b.color));
    });
    mesh.current.instanceColor.needsUpdate = true;
  });
  if (!blocks.length) return null;
  return <instancedMesh ref={mesh} args={[null,null,blocks.length]} frustumCulled={false}>
    <boxGeometry/>
    <meshBasicMaterial toneMapped={false}/>
  </instancedMesh>;
};