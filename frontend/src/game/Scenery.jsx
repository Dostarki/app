import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { VoxelBatch } from './VoxelBatch';
import { seeded } from './villageBuilder';

const NEON = ['#39e7ff', '#ffd15c', '#ff4f8b', '#7dffb3'];
function peak(out, cx, cz, r, h, seed) {
  const w = Math.max(1.4, r * .42), d = w * .72, floors = Math.max(6, Math.round(h / 1.15));
  const glass = seed % 2 ? '#101826' : '#171426';
  out.push({ x: cx, y: .45 + h / 2, z: cz, w, h, d, color: glass });
  out.push({ x: cx, y: .45 + h + .15, z: cz, w: w + .15, h: .22, d: d + .12, color: '#1c2430' });
  for (let i = 1; i < floors; i += 2) {
    const y = .7 + i * (h / floors), neon = NEON[(seed + i) % NEON.length];
    out.push({ x: cx, y, z: cz + d / 2, w: w * .72, h: .12, d: .08, color: neon });
  }
  out.push({ x: cx, y: .5 + h + .7, z: cz, w: .14, h: 1.1, d: .14, color: '#e6eef8' });
}
/** Distant glass skyline past the shore, plus low towers in the open water. */
export const IceMountains = () => {
  const blocks = useMemo(() => {
    const out = [];
    for (let i = 0; i < 17; i++) peak(out, -74 + i * 9.2 + seeded(i * 3) * 4, -50 - seeded(i * 5) * 6, 6.5 + seeded(i * 7) * 4.5, 12 + seeded(i * 11) * 11, i);
    for (let i = 0; i < 11; i++) peak(out, -82 + i * 15 + seeded(i * 13) * 6, -63 - seeded(i * 17) * 8, 11 + seeded(i * 19) * 6, 20 + seeded(i * 23) * 12, 40 + i);
    for (let i = 0; i < 8; i++) peak(out, -53 - seeded(i * 29) * 6, -46 + i * 8 + seeded(i * 31) * 3, 6 + seeded(i * 37) * 4, 10 + seeded(i * 41) * 10, 80 + i);
    for (let i = 0; i < 6; i++) peak(out, 70 + seeded(i * 43) * 6, -54 + i * 9 + seeded(i * 47) * 3, 5 + seeded(i * 53) * 3, 6 + seeded(i * 59) * 3.5, 120 + i);
    // Icebergs: low, so they never hide the island; kept clear of boat lanes (x -12..42, z 13..27).
    for (let i = 0; i < 14; i++) { const west = i < 6; peak(out, west ? -48 + seeded(i * 61) * 28 : -40 + seeded(i * 61) * 84, west ? 15 + seeded(i * 67) * 24 : 29 + seeded(i * 67) * 16, 1.6 + seeded(i * 71) * 2.2, 2 + seeded(i * 73) * 3, 160 + i); }
    return out;
  }, []);
  return <VoxelBatch blocks={blocks} castShadow={false} receiveShadow={false} />;
};

const cloudBlocks = seed => {
  const out = [], n = 4 + Math.floor(seeded(seed) * 4);
  for (let i = 0; i < n; i++) {
    const w = 1.8 + seeded(seed * 3 + i) * 2.4, d = 1.6 + seeded(seed * 11 + i) * 1.4, x = (i - n / 2) * 1.6 + seeded(seed + i) * .7, z = (seeded(seed * 5 + i) - .5) * 1.6;
    out.push({ x, y: .45 + seeded(seed * 7 + i) * .5, z, w, h: .95 + seeded(seed * 9 + i) * .7, d, color: i % 3 ? '#fcfdff' : '#eef4fb' });
    out.push({ x, y: -.25, z, w: w * .8, h: .5, d: d * .8, color: '#cad9ea' });
  }
  return out;
};
const Cloud = ({ cloud, index, refs }) => <group ref={el => refs.current[index] = el} position={[cloud.x, cloud.y, cloud.z]} scale={cloud.scale}><VoxelBatch blocks={cloud.blocks} opacity={.78} castShadow={false} receiveShadow={false} /></group>;

/** Soft voxel clouds drifting east across the whole sky; they wrap around when they leave. */
export const Clouds = ({ count = 10 }) => {
  const refs = useRef([]);
  const clouds = useMemo(() => Array.from({ length: count }, (_, i) => ({
    blocks: cloudBlocks(i + 1), x: -75 + seeded(i * 13) * 150, z: -58 + seeded(i * 5) * 90, y: 12 + seeded(i * 17) * 7, speed: .3 + seeded(i * 19) * .45, scale: .8 + seeded(i * 23) * .9,
  })), [count]);
  useFrame((_, delta) => refs.current.forEach((g, i) => {
    if (!g) return; g.position.x += clouds[i].speed * delta; if (g.position.x > 80) g.position.x = -80;
  }));
  return <>{clouds.map((cloud, i) => <Cloud key={i} cloud={cloud} index={i} refs={refs} />)}</>;
};
