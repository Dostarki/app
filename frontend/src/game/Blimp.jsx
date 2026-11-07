import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const GLYPH = {
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  I: ['11111', '00100', '00100', '00100', '00100', '00100', '11111'],
  N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
  H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
};

function screenTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 960; canvas.height = 240;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#071018';
  ctx.fillRect(0, 0, 960, 240);
  const word = 'ROBINHOOD';
  const cell = 12, gap = 3, letterGap = 18;
  const letterW = 5 * (cell + gap) - gap;
  const total = word.length * letterW + (word.length - 1) * letterGap;
  const x0 = (960 - total) / 2;
  const y0 = 36;
  for (let i = 0; i < word.length; i++) {
    const rows = GLYPH[word[i]];
    const ox = x0 + i * (letterW + letterGap);
    rows.forEach((row, ry) => {
      [...row].forEach((bit, rx) => {
        const x = ox + rx * (cell + gap);
        const y = y0 + ry * (cell + gap);
        ctx.fillStyle = bit === '1' ? '#12343c' : '#0c1c24';
        ctx.fillRect(x, y, cell, cell);
        if (bit !== '1') return;
        ctx.fillStyle = '#39e7ff';
        ctx.shadowColor = '#39e7ff';
        ctx.shadowBlur = 16;
        ctx.fillRect(x, y, cell, cell);
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#f4feff';
        ctx.fillRect(x + 3, y + 3, cell - 6, cell - 6);
      });
    });
  }
  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#39e7ff';
  ctx.lineWidth = 6;
  ctx.strokeRect(14, 14, 932, 212);
  ctx.strokeStyle = '#ff2bd6';
  ctx.lineWidth = 3;
  ctx.strokeRect(26, 26, 908, 188);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

const PINK = '#ff2bd6';
const BLUE = '#39e7ff';
const Hull = ({ at, size, color }) => <mesh position={at} castShadow={false} receiveShadow={false}>
  <boxGeometry args={size} /><meshLambertMaterial color={color} />
</mesh>;
const Neon = ({ at, size, color }) => <mesh position={at}>
  <boxGeometry args={size} /><meshBasicMaterial color={color} toneMapped={false} />
</mesh>;

const Screen = ({ z, texture }) => <group position={[0.15, 0.12, z]} rotation={z < 0 ? [0, Math.PI, 0] : [0, 0, 0]}>
  <mesh position={[0, 0, -0.02]}><boxGeometry args={[7.15, 1.72, 0.06]} /><meshLambertMaterial color="#070b10" /></mesh>
  <mesh position={[0, 0, 0.02]}><planeGeometry args={[6.7, 1.42]} /><meshBasicMaterial map={texture} toneMapped={false} /></mesh>
</group>;

/** Advertising blimp. The side panel is a lit dot-matrix board. */
export const Blimp = () => {
  const ref = useRef();
  const prop = useRef();
  const scan = useRef();
  const texture = useMemo(screenTexture, []);
  useFrame(({ clock }) => {
    const ship = ref.current;
    if (!ship) return;
    const t = clock.elapsedTime * 0.08;
    const dx = Math.cos(t) * 10;
    const dz = -Math.sin(t) * 6;
    ship.position.set(-12 + Math.sin(t) * 10, 9.6 + Math.sin(clock.elapsedTime * 0.5) * 0.2, 12 + Math.cos(t) * 6);
    ship.rotation.y = Math.atan2(-dz, dx);
    if (prop.current) prop.current.rotation.z = clock.elapsedTime * 16;
    if (scan.current) scan.current.position.x = -3.1 + ((clock.elapsedTime * 0.7) % 2.1) / 2.1 * 6.2;
  });
  return <group ref={ref} rotation={[0, 0, 0.16]}>
    <Hull at={[0, 0.15, 0]} size={[8.4, 2.25, 2.25]} color="#2a1d33" />
    <Hull at={[-3.7, 0.2, 0]} size={[2.3, 1.65, 1.75]} color="#23182c" />
    <Hull at={[3.6, 0.18, 0]} size={[2.5, 1.6, 1.7]} color="#23182c" />
    <Hull at={[5.05, 0.16, 0]} size={[1.15, 0.95, 1.05]} color="#1a1422" />
    <Hull at={[-5.05, 0.22, 0]} size={[1.2, 1.05, 1.15]} color="#1a1422" />
    <Hull at={[0, -0.82, 0]} size={[6.6, 0.72, 1.75]} color="#d7dbe4" />
    <Hull at={[-2.7, -0.68, 0]} size={[1.7, 0.55, 1.4]} color="#c5cad4" />
    <Hull at={[2.9, -0.62, 0]} size={[1.6, 0.5, 1.3]} color="#c5cad4" />
    <Hull at={[-5.2, 1.05, 0]} size={[0.28, 1.85, 0.22]} color="#1a1422" />
    <Hull at={[-5.2, 0.2, 1.05]} size={[0.28, 0.2, 1.55]} color="#1a1422" />
    <Hull at={[-5.2, 0.2, -1.05]} size={[0.28, 0.2, 1.55]} color="#1a1422" />
    <Neon at={[0, 1.38, 0]} size={[8.2, 0.07, 0.08]} color={BLUE} />
    <Neon at={[0, 0.95, 1.22]} size={[7.6, 0.07, 0.07]} color={PINK} />
    <Neon at={[0, 0.95, -1.22]} size={[7.6, 0.07, 0.07]} color={PINK} />
    <Neon at={[0, -0.42, 1.02]} size={[6.8, 0.07, 0.07]} color={BLUE} />
    <Neon at={[0, -0.42, -1.02]} size={[6.8, 0.07, 0.07]} color={BLUE} />
    {[-4.2, 4.35].map((x, i) => <group key={x}>
      <Neon at={[x, 1.28, 0]} size={[0.08, 0.1, 2.2]} color={i ? PINK : BLUE} />
      <Neon at={[x, 0.15, 1.22]} size={[0.08, 2.05, 0.08]} color={i ? PINK : BLUE} />
      <Neon at={[x, 0.15, -1.22]} size={[0.08, 2.05, 0.08]} color={i ? BLUE : PINK} />
    </group>)}
    <Neon at={[-5.2, 1.95, 0]} size={[0.1, 0.1, 0.28]} color={PINK} />
    <Neon at={[-5.2, 0.15, 0]} size={[0.1, 1.7, 0.08]} color={PINK} />
    <Neon at={[-5.2, 0.32, 1.75]} size={[0.1, 0.08, 0.16]} color={BLUE} />
    <Neon at={[-5.2, 0.32, -1.75]} size={[0.1, 0.08, 0.16]} color={BLUE} />
    <Neon at={[-5.2, 0.2, 0]} size={[0.1, 0.08, 2.9]} color={BLUE} />
    <Neon at={[5.55, 0.55, 0]} size={[0.1, 0.08, 0.7]} color={PINK} />
    <Neon at={[0.35, -1.28, 0]} size={[2.15, 0.06, 0.08]} color={PINK} />
    <Neon at={[0.35, -1.92, 0.38]} size={[1.9, 0.06, 0.06]} color={BLUE} />
    <Hull at={[0.35, -1.62, 0]} size={[2.05, 0.58, 0.72]} color="#141820" />
    <Hull at={[0.05, -1.62, 0.38]} size={[0.42, 0.28, 0.06]} color="#39e7ff" />
    <Hull at={[0.62, -1.62, 0.38]} size={[0.42, 0.28, 0.06]} color="#39e7ff" />
    <Neon at={[5.7, 0.16, 0]} size={[0.18, 0.18, 0.18]} color={BLUE} />
    <group position={[-0.85, -1.35, 0.85]}>
      <Hull at={[0, 0, 0]} size={[0.7, 0.38, 0.38]} color="#222836" />
      <group ref={prop} position={[0.42, 0, 0]}>
        <mesh><boxGeometry args={[0.06, 0.7, 0.08]} /><meshLambertMaterial color="#9aa6b4" /></mesh>
        <mesh><boxGeometry args={[0.06, 0.08, 0.7]} /><meshLambertMaterial color="#9aa6b4" /></mesh>
      </group>
    </group>
    <Screen z={1.28} texture={texture} />
    <Screen z={-1.28} texture={texture} />
    <mesh ref={scan} position={[0.15, 0.12, 1.34]}>
      <planeGeometry args={[0.08, 1.3]} />
      <meshBasicMaterial color="#d8fbff" transparent opacity={0.45} toneMapped={false} />
    </mesh>
  </group>;
};
