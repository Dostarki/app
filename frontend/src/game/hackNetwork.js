import { useEffect, useMemo, useRef, useState } from 'react';
import { buildVillage } from './villageBuilder';
import { TIER_BY_ID } from '../lib/gameData';

export const TRAVEL_MS = 1800;
const DEMO = [1, 2, 5, 3, 1, 4, 2, 5];
const COLORS = ['#8dff9a', '#3f8cff', '#ff3f6c', '#c9d6ea', '#ffb23f'];

const gateFor = (tier, count) => 1 + Math.round((Math.min(5, Math.max(1, tier)) - 1) / 4 * (count - 1));

// Maps owned hackers to lit right-side floors and satellite links into left-side towers.
export function useHackNetwork(roster, ready, demo) {
  const city = buildVillage();
  const [demoStep, setDemoStep] = useState(0);
  const [, rerender] = useState(0);
  const born = useRef(new Map());
  const primed = useRef(false);

  useEffect(() => {
    if (!demo) return undefined;
    setDemoStep(0);
    const id = setInterval(() => setDemoStep(n => (n + 1) % (DEMO.length + 3)), 2600);
    return () => clearInterval(id);
  }, [demo]);

  const links = useMemo(() => {
    const hackers = demo
      ? DEMO.slice(0, Math.min(demoStep, DEMO.length)).map((tier, i) => ({ uid: `demo-${i}`, tier }))
      : (roster ? roster.split(',') : []).map(s => { const [uid, type] = s.split(':'); return { uid, tier: TIER_BY_ID[type]?.tier || 1 }; }).sort((a, b) => Number(a.uid) - Number(b.uid));
    if (!city.hackFloors.length || !city.hostile.length) return [];
    return hackers.map((h, i) => {
      const floorId = city.hackFloors[i % city.hackFloors.length];
      const src = city.buildings[city.floors[floorId].buildingId];
      const gate = gateFor(h.tier, city.hostile.length);
      const dst = city.hostile[gate - 1];
      return { uid: h.uid, tier: h.tier, floorId, gate, srcId: src.id, from: src.dish, to: dst.antenna, color: COLORS[h.tier - 1] };
    });
  }, [city, roster, demo, demoStep]);

  useEffect(() => {
    if (!demo && !ready) return;
    const now = performance.now(), first = !demo && !primed.current;
    primed.current = true;
    const ids = new Set(links.map(l => l.uid));
    [...born.current.keys()].forEach(k => { if (!ids.has(k)) born.current.delete(k); });
    let fresh = false;
    links.forEach(l => { if (!born.current.has(l.uid)) { born.current.set(l.uid, first ? -Infinity : now); fresh = fresh || !first; } });
    if (fresh) setTimeout(() => rerender(n => n + 1), TRAVEL_MS + 60);
    else rerender(n => n + 1);
  }, [links, ready, demo]);

  const now = performance.now();
  const known = links.filter(l => born.current.has(l.uid));
  const arrived = known.filter(l => now - born.current.get(l.uid) >= TRAVEL_MS);
  const pending = known.filter(l => now - born.current.get(l.uid) < TRAVEL_MS).map(l => ({ ...l, born: born.current.get(l.uid) }));
  const beams = [...new Map(arrived.map(l => [`${l.srcId}:${l.gate}`, l])).values()];
  return {
    litFloors: new Set(known.map(l => l.floorId)),
    litGates: new Set(arrived.map(l => l.gate)),
    beams,
    pending,
    links: known,
  };
}
